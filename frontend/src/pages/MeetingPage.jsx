import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ChatPanel from '../components/ChatPanel.jsx';
import ControlBar from '../components/ControlBar.jsx';
import TransientOverlay from '../components/TransientOverlay.jsx';
import VideoTile from '../components/VideoTile.jsx';
import { FieldValue, firestore } from '../lib/firebase.js';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

const randomParticipantId = () => Math.random().toString(36).slice(2, 10);
const randomGuestName = () => `Guest-${Math.random().toString(36).slice(2, 6)}`;
const getRoomRef = (roomId) => firestore.collection('rooms').doc(roomId);

const normalizeName = (name) => {
  const cleaned = (name || '').trim().replace(/\s+/g, ' ');
  return cleaned.slice(0, 24);
};

const avatarLetter = (name) => {
  const safe = normalizeName(name);
  return safe ? safe[0].toUpperCase() : '?';
};

export default function MeetingPage() {
  const { meetingId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const usernameFromUrl = useMemo(() => {
    const search = new URLSearchParams(location.search);
    return normalizeName(search.get('username') || '');
  }, [location.search]);

  const [username, setUsername] = useState(usernameFromUrl || randomGuestName());
  const [status, setStatus] = useState('Start webcam and join your room.');
  const [statusError, setStatusError] = useState(false);
  const [joined, setJoined] = useState(false);

  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);

  const [remotePeers, setRemotePeers] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [messageToasts, setMessageToasts] = useState([]);
  const [reactions, setReactions] = useState([]);

  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedSinkId, setSelectedSinkId] = useState('');
  const [sinkSupported] = useState(
    typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype
  );

  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);

  const localStreamRef = useRef(null);
  const currentRoomIdRef = useRef('');
  const localParticipantIdRef = useRef('');
  const participantUnsubscribeRef = useRef(null);
  const signalUnsubscribeRef = useRef(null);

  const peerConnectionsRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const dataChannelsRef = useRef(new Map());
  const participantMetaRef = useRef(new Map());

  const firestoreReadyRef = useRef(false);
  const firestoreSetupShownRef = useRef(false);

  const setStatusMessage = useCallback((message, isError = false) => {
    setStatus(message);
    setStatusError(isError);
  }, []);

  const upsertRemotePeer = useCallback((peerId, patch) => {
    setRemotePeers((prev) => {
      const index = prev.findIndex((peer) => peer.id === peerId);
      if (index === -1) {
        return [
          ...prev,
          {
            id: peerId,
            stream: null,
            username: `Peer ${peerId.slice(0, 6)}`,
            audioEnabled: true,
            videoEnabled: true,
            ...patch,
          },
        ];
      }

      const clone = [...prev];
      clone[index] = { ...clone[index], ...patch };
      return clone;
    });
  }, []);

  const removeRemotePeer = useCallback((peerId) => {
    setRemotePeers((prev) => prev.filter((peer) => peer.id !== peerId));
  }, []);

  const addMessageToast = useCallback((sender, message) => {
    const toast = { id: `${Date.now()}-${Math.random()}`, sender, message };
    setMessageToasts((prev) => [...prev, toast]);

    window.setTimeout(() => {
      setMessageToasts((prev) => prev.filter((item) => item.id !== toast.id));
    }, 5000);
  }, []);

  const addReaction = useCallback((emoji, reactionUser) => {
    const reaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      username: normalizeName(reactionUser) || 'Peer',
      left: `${Math.round(16 + Math.random() * 66)}%`,
    };

    setReactions((prev) => [...prev, reaction]);
    window.setTimeout(() => {
      setReactions((prev) => prev.filter((item) => item.id !== reaction.id));
    }, 2000);
  }, []);

  const getLocalStatePayload = useCallback(
    () => ({
      username: normalizeName(username) || randomGuestName(),
      audioEnabled: localAudioEnabled,
      videoEnabled: localVideoEnabled,
    }),
    [username, localAudioEnabled, localVideoEnabled]
  );

  const refreshAudioOutputs = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((item) => item.kind === 'audiooutput');
      setAudioOutputs(outputs);
    } catch (error) {
      console.warn('Could not enumerate devices:', error);
    }
  }, []);

  const ensureFirestoreReady = useCallback(async () => {
    if (firestoreReadyRef.current) return true;

    try {
      await firestore.collection('_healthcheck').limit(1).get();
      firestoreReadyRef.current = true;
      return true;
    } catch (error) {
      console.error('Firestore check failed:', error);
      if (!firestoreSetupShownRef.current) {
        firestoreSetupShownRef.current = true;
        setStatusMessage(
          'Firestore is not available for this Firebase project. Create Firestore and reload.',
          true
        );
      }
      return false;
    }
  }, [setStatusMessage]);

  const sendSignal = useCallback(async (roomId, to, payload) => {
    await getRoomRef(roomId).collection('signals').add({
      from: localParticipantIdRef.current,
      to,
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
    });
  }, []);

  const sendDataToAllPeers = useCallback((payload) => {
    const message = JSON.stringify(payload);
    dataChannelsRef.current.forEach((channel) => {
      if (channel.readyState === 'open') {
        channel.send(message);
      }
    });
  }, []);

  const broadcastLocalState = useCallback(() => {
    sendDataToAllPeers({ type: 'state', ...getLocalStatePayload(), ts: Date.now() });
  }, [getLocalStatePayload, sendDataToAllPeers]);

  const pushLocalStateToFirestore = useCallback(async () => {
    if (!currentRoomIdRef.current || !localParticipantIdRef.current) return;

    try {
      await getRoomRef(currentRoomIdRef.current)
        .collection('participants')
        .doc(localParticipantIdRef.current)
        .set({ ...getLocalStatePayload(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    } catch (error) {
      console.warn('State sync failed:', error);
    }
  }, [getLocalStatePayload]);

  const applyParticipantMeta = useCallback((peerId) => {
    const meta = participantMetaRef.current.get(peerId) || {};
    upsertRemotePeer(peerId, {
      username: normalizeName(meta.username) || `Peer ${peerId.slice(0, 6)}`,
      audioEnabled: meta.audioEnabled !== false,
      videoEnabled: meta.videoEnabled !== false,
    });
  }, [upsertRemotePeer]);

  const closePeerConnection = useCallback((peerId) => {
    const channel = dataChannelsRef.current.get(peerId);
    if (channel) {
      channel.onmessage = null;
      channel.onopen = null;
      channel.onclose = null;
      channel.close();
    }

    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.ondatachannel = null;
      pc.close();
    }

    peerConnectionsRef.current.delete(peerId);
    remoteStreamsRef.current.delete(peerId);
    dataChannelsRef.current.delete(peerId);
    participantMetaRef.current.delete(peerId);
    removeRemotePeer(peerId);
  }, [removeRemotePeer]);

  const handleDataMessage = useCallback((peerId, dataText) => {
    let payload;
    try {
      payload = JSON.parse(dataText);
    } catch {
      return;
    }

    const senderName =
      normalizeName(payload.username) ||
      normalizeName(participantMetaRef.current.get(peerId)?.username) ||
      'Peer';

    if (payload.type === 'chat' && payload.message) {
      setChatMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random()}`, sender: senderName, message: payload.message, local: false },
      ]);
      addMessageToast(senderName, payload.message);
      return;
    }

    if (payload.type === 'emoji' && payload.emoji) {
      addReaction(payload.emoji, senderName);
      return;
    }

    if (payload.type === 'state') {
      participantMetaRef.current.set(peerId, {
        ...participantMetaRef.current.get(peerId),
        username: normalizeName(payload.username) || participantMetaRef.current.get(peerId)?.username,
        audioEnabled: payload.audioEnabled !== false,
        videoEnabled: payload.videoEnabled !== false,
      });
      applyParticipantMeta(peerId);
    }
  }, [addMessageToast, addReaction, applyParticipantMeta]);

  const wireDataChannel = useCallback((peerId, channel) => {
    dataChannelsRef.current.set(peerId, channel);

    channel.onopen = () => {
      broadcastLocalState();
    };

    channel.onclose = () => {
      dataChannelsRef.current.delete(peerId);
    };

    channel.onmessage = (event) => {
      handleDataMessage(peerId, event.data);
    };
  }, [broadcastLocalState, handleDataMessage]);

  const getOrCreatePeerConnection = useCallback((peerId) => {
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(servers);
    const stream = new MediaStream();
    remoteStreamsRef.current.set(peerId, stream);
    upsertRemotePeer(peerId, { stream });
    applyParticipantMeta(peerId);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ondatachannel = (event) => {
      wireDataChannel(peerId, event.channel);
    };

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        if (!stream.getTracks().some((existingTrack) => existingTrack.id === track.id)) {
          stream.addTrack(track);
        }
      });
      upsertRemotePeer(peerId, { stream });
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || !currentRoomIdRef.current) return;
      sendSignal(currentRoomIdRef.current, peerId, {
        type: 'candidate',
        candidate: event.candidate.toJSON(),
      }).catch((error) => {
        console.error('Candidate send failed:', error);
      });
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        closePeerConnection(peerId);
      }
    };

    peerConnectionsRef.current.set(peerId, pc);
    return pc;
  }, [applyParticipantMeta, closePeerConnection, sendSignal, upsertRemotePeer, wireDataChannel]);

  const createOfferForPeer = useCallback(async (peerId) => {
    const pc = getOrCreatePeerConnection(peerId);

    if (!dataChannelsRef.current.has(peerId)) {
      const channel = pc.createDataChannel('meeting-channel');
      wireDataChannel(peerId, channel);
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await sendSignal(currentRoomIdRef.current, peerId, {
      type: 'offer',
      sdp: offer.sdp,
    });
  }, [getOrCreatePeerConnection, sendSignal, wireDataChannel]);

  const handleSignal = useCallback(async (change) => {
    const signal = change.doc.data();
    const from = signal.from;
    if (!from || from === localParticipantIdRef.current) return;

    const pc = getOrCreatePeerConnection(from);

    if (signal.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal(currentRoomIdRef.current, from, {
        type: 'answer',
        sdp: answer.sdp,
      });
      return;
    }

    if (signal.type === 'answer') {
      if (!pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
      }
      return;
    }

    if (signal.type === 'candidate' && signal.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      } catch (error) {
        console.warn('Ignoring ICE candidate error:', error);
      }
    }
  }, [getOrCreatePeerConnection, sendSignal]);

  const subscribeToRoom = useCallback((roomId) => {
    const roomRef = getRoomRef(roomId);

    participantUnsubscribeRef.current = roomRef.collection('participants').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const peerId = change.doc.id;
        if (peerId === localParticipantIdRef.current) return;

        const data = change.doc.data() || {};
        participantMetaRef.current.set(peerId, {
          ...participantMetaRef.current.get(peerId),
          username: normalizeName(data.username) || `Peer ${peerId.slice(0, 6)}`,
          audioEnabled: data.audioEnabled !== false,
          videoEnabled: data.videoEnabled !== false,
        });

        applyParticipantMeta(peerId);

        if (change.type === 'added' && localParticipantIdRef.current < peerId) {
          createOfferForPeer(peerId).catch((error) => {
            console.error(`Offer creation failed for ${peerId}:`, error);
          });
        }

        if (change.type === 'removed') {
          closePeerConnection(peerId);
        }
      });
    });

    signalUnsubscribeRef.current = roomRef
      .collection('signals')
      .where('to', '==', localParticipantIdRef.current)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            handleSignal(change).catch((error) => {
              console.error('Signal handling failed:', error);
            });
          }
        });
      });
  }, [applyParticipantMeta, closePeerConnection, createOfferForPeer, handleSignal]);

  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalAudioEnabled(true);
      setLocalVideoEnabled(true);
      await refreshAudioOutputs();
      setStatusMessage('Webcam ready. Join room to connect.');
    } catch (error) {
      console.error('Webcam access failed:', error);
      setStatusMessage('Could not access webcam/microphone.', true);
    }
  }, [refreshAudioOutputs, setStatusMessage]);

  const joinRoom = useCallback(async () => {
    const roomId = decodeURIComponent(meetingId).trim();
    if (!roomId) {
      setStatusMessage('Invalid meeting ID.', true);
      return;
    }

    const ready = await ensureFirestoreReady();
    if (!ready) return;

    if (!localStreamRef.current) {
      setStatusMessage('Start webcam before joining.', true);
      return;
    }

    const normalizedUsername = normalizeName(username) || randomGuestName();
    setUsername(normalizedUsername);

    try {
      currentRoomIdRef.current = roomId;
      localParticipantIdRef.current = randomParticipantId();

      const roomRef = getRoomRef(roomId);
      await roomRef.set({ updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      await roomRef.collection('participants').doc(localParticipantIdRef.current).set({
        username: normalizedUsername,
        audioEnabled: localAudioEnabled,
        videoEnabled: localVideoEnabled,
        joinedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      subscribeToRoom(roomId);
      setJoined(true);
      setStatusMessage(`Connected to room ${roomId}.`);
    } catch (error) {
      console.error('Join room failed:', error);
      setStatusMessage('Failed to join room. Check Firestore permissions.', true);
    }
  }, [ensureFirestoreReady, localAudioEnabled, localVideoEnabled, meetingId, setStatusMessage, subscribeToRoom, username]);

  const leaveRoom = useCallback(async (stopMedia = false) => {
    if (participantUnsubscribeRef.current) participantUnsubscribeRef.current();
    if (signalUnsubscribeRef.current) signalUnsubscribeRef.current();
    participantUnsubscribeRef.current = null;
    signalUnsubscribeRef.current = null;

    const roomId = currentRoomIdRef.current;
    const participantId = localParticipantIdRef.current;

    Array.from(peerConnectionsRef.current.keys()).forEach(closePeerConnection);
    setRemotePeers([]);
    participantMetaRef.current.clear();

    if (roomId && participantId) {
      try {
        await getRoomRef(roomId).collection('participants').doc(participantId).delete();
      } catch (error) {
        console.warn('Participant cleanup failed:', error);
      }
    }

    currentRoomIdRef.current = '';
    localParticipantIdRef.current = '';
    setJoined(false);

    if (stopMedia && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setStatusMessage('Call ended. Return to home to start another session.');
    } else {
      setStatusMessage('Left room.');
    }
  }, [closePeerConnection, setStatusMessage]);

  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) return;
    const next = !localAudioEnabled;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setLocalAudioEnabled(next);
  }, [localAudioEnabled]);

  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;
    const next = !localVideoEnabled;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setLocalVideoEnabled(next);
  }, [localVideoEnabled]);

  useEffect(() => {
    if (!joined) return;
    pushLocalStateToFirestore();
    broadcastLocalState();
  }, [joined, localAudioEnabled, localVideoEnabled, username, pushLocalStateToFirestore, broadcastLocalState]);

  const handleSendChat = useCallback((event) => {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text || !joined) return;

    const sender = normalizeName(username) || 'You';
    setChatMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, sender, message: text, local: true },
    ]);
    addMessageToast(sender, text);

    sendDataToAllPeers({ type: 'chat', username: sender, message: text, ts: Date.now() });
    setChatInput('');
  }, [addMessageToast, chatInput, joined, sendDataToAllPeers, username]);

  const handleEmoji = useCallback((emoji) => {
    if (!joined) return;
    const sender = normalizeName(username) || 'You';
    addReaction(emoji, sender);
    sendDataToAllPeers({ type: 'emoji', username: sender, emoji, ts: Date.now() });
  }, [addReaction, joined, sendDataToAllPeers, username]);

  useEffect(() => {
    const handleDeviceChange = () => {
      refreshAudioOutputs().catch((error) => {
        console.warn('Device refresh failed:', error);
      });
    };

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [refreshAudioOutputs]);

  useEffect(() => {
    return () => {
      if (participantUnsubscribeRef.current) participantUnsubscribeRef.current();
      if (signalUnsubscribeRef.current) signalUnsubscribeRef.current();

      if (currentRoomIdRef.current && localParticipantIdRef.current) {
        getRoomRef(currentRoomIdRef.current)
          .collection('participants')
          .doc(localParticipantIdRef.current)
          .delete()
          .catch(() => {});
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const localAvatar = avatarLetter(username);

  return (
    <main className="mx-auto w-[min(1280px,calc(100vw-1rem))] pb-24">
      <header className="mt-4 rounded-2xl border border-slate-300/70 bg-white/80 p-4 backdrop-blur md:flex md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 md:text-3xl">Meeting Room</h1>
          <p className="mt-1 text-sm text-slate-600">Endpoint: /meet/{decodeURIComponent(meetingId)}</p>
        </div>

        <div className="mt-3 grid gap-2 md:mt-0 md:grid-cols-[1fr_auto_auto]">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={joined}
            maxLength={24}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring disabled:bg-slate-100"
            placeholder="Username"
          />

          <button
            type="button"
            onClick={startMedia}
            className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Start Webcam
          </button>

          <button
            type="button"
            disabled={joined}
            onClick={joinRoom}
            className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Join Room
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Output device</label>
          <select
            value={selectedSinkId}
            onChange={(event) => setSelectedSinkId(event.target.value)}
            disabled={!sinkSupported || audioOutputs.length === 0}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
          >
            <option value="">System default</option>
            {audioOutputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Speaker ${device.deviceId.slice(0, 4)}`}
              </option>
            ))}
          </select>

          {!sinkSupported && (
            <span className="text-xs text-slate-500">setSinkId not supported in this browser.</span>
          )}
        </div>

        <p className={`mt-2 text-sm ${statusError ? 'text-red-700' : 'text-cyan-700'}`}>{status}</p>
      </header>

      <section className="mt-4 grid max-h-[67vh] gap-3 overflow-y-auto">
        <VideoTile
          title={`${normalizeName(username) || 'You'} (You)`}
          stream={localStreamRef.current}
          videoEnabled={localVideoEnabled}
          avatarLetter={localAvatar}
          muted
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {remotePeers.map((peer) => (
            <VideoTile
              key={peer.id}
              title={peer.username}
              stream={peer.stream}
              videoEnabled={peer.videoEnabled}
              avatarLetter={avatarLetter(peer.username)}
              sinkId={selectedSinkId}
            />
          ))}
        </div>
      </section>

      <TransientOverlay messageToasts={messageToasts} reactions={reactions} />

      <ChatPanel
        open={chatOpen}
        messages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        onSend={handleSendChat}
        onClose={() => setChatOpen(false)}
      />

      <ControlBar
        joined={joined}
        audioEnabled={localAudioEnabled}
        videoEnabled={localVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleChat={() => setChatOpen((prev) => !prev)}
        onLeave={async () => {
          await leaveRoom(true);
          navigate('/');
        }}
        emojiMenuOpen={emojiMenuOpen}
        setEmojiMenuOpen={setEmojiMenuOpen}
        onEmoji={handleEmoji}
      />
    </main>
  );
}
