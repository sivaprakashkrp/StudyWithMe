# StudyWithMe - Meeting & Whiteboard Implementation Log

## Overview
This document logs all the planned and implemented changes for the StudyWithMe meeting application, including WebRTC video/audio meetings, collaborative whiteboard using Excalidraw, and Firebase Firestore integration.

---

## 1. Whiteboard Integration with Meeting (Initial Implementation)

### Date: [Current Session]
### Status: Implemented

### Requirements
- When a meeting is created, a whiteboard should also be created with it by default
- Changes made to the whiteboard should be rendered to all participants
- Meeting is held with WebRTC protocol

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MeetingPage                               │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │   Video Tiles Grid    │  │       Excalidraw Whiteboard  │ │
│  │  (local + remote)     │  │       (shared canvas)        │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │           Firebase Firestore                             ││
│  │  - signals, participants                                 ││
│  │  - whiteboard (persisted until meeting ends)             ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Files Modified

| File | Changes |
|------|---------|
| `frontend/src/pages/MeetingPage.jsx` | Added Excalidraw import, whiteboard state, split-view layout |
| `frontend/src/components/ControlBar.jsx` | Added whiteboard toggle button |
| `frontend/src/index.css` | Added custom scrollbar styles |

### Implementation Details

1. **Whiteboard State Management**
   - Added `showWhiteboard` state (default `true`)
   - Added `excalidrawAPI` ref for imperative API access
   - Added `whiteboardElements` state for scene elements

2. **Whiteboard Sync via Firebase Firestore**
   - Initial load from Firestore `rooms/{roomId}/whiteboard/scene`
   - Real-time sync via Firestore `onSnapshot`
   - Saves every 500ms (debounced) to reduce writes

3. **Whiteboard Sync Flow**
   ```
   User Draws → onChange(elements)
       ↓
   saveWhiteboardToFirestore(elements)
       ↓
   Firestore saves elementsJson (JSON string)
       ↓
   onSnapshot fires → All clients notified
       ↓
   excalidrawAPI.updateScene({ elements })
       ↓
   Whiteboard updated for all participants
   ```

4. **Data Sanitization**
   - `sanitizeElements()` removes `undefined`, `functions`, and circular references
   - Prevents Firestore errors with nested arrays and undefined values

5. **Cleanup**
   - `whiteboardUnsubscribeRef` cleans up Firestore listener on leave
   - `saveWhiteboardDebouncedRef` clears pending saves on leave/unmount

---

## 2. Separate Audio/Video Streams

### Date: [Current Session]
### Status: Implemented

### Requirements
- Meeting should not require camera to join
- User can join with microphone alone
- Camera can be started/stopped independently
- Webcam and microphone are separate input streams

### User Flow

```
1. User enters username
2. User clicks "Start Mic" → microphone permission requested
3. User clicks "Join Room" → enters meeting with audio only
4. (Optional) User clicks "Start Video" in control bar → camera starts
5. (Optional) User clicks "Stop Video" → camera disabled, stream preserved
```

### Files Modified

| File | Changes |
|------|---------|
| `frontend/src/pages/MeetingPage.jsx` | Split `startMedia` into `startAudio` and `startVideo` |

### Implementation Details

1. **Separate Stream Acquisition**
   ```javascript
   // Start audio (required to join)
   const startAudio = useCallback(async () => {
     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
     localStreamRef.current = stream;
     setLocalAudioEnabled(true);
   }, []);

   // Start video (optional, can be toggled)
   const startVideo = useCallback(async () => {
     const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
     videoStream.getVideoTracks().forEach(track => {
       localStreamRef.current.addTrack(track);
     });
     setVideoStreamStarted(true);
     setLocalVideoEnabled(true);
   }, []);
   ```

2. **Video Toggle Logic**
   ```javascript
   const toggleVideo = useCallback(async () => {
     if (!videoStreamStarted) {
       await startVideo();  // Start camera if not started
       return;
     }
     // Toggle existing camera track
     const next = !localVideoEnabled;
     localStreamRef.current.getVideoTracks().forEach(track => {
       track.enabled = next;
     });
     setLocalVideoEnabled(next);
   }, [videoStreamStarted, startVideo, localVideoEnabled]);
   ```

3. **Join Room Requirements**
   - Audio stream required (`localStreamRef.current` must exist)
   - Video stream optional

---

## 3. Stacked Profile Layout

### Date: [Current Session]
### Status: Implemented

### Requirements
- Profiles displayed as stacked (not scaled)
- 20% width of screen
- Snappy scrollbar for overflow
- Show 2-3 profiles, then scroll

### Layout

```
┌──────┬────────────────────────────────────────────┐
│ ┌────┐│                                            │
│ │You ││                                            │
│ └────┘│                                            │
│ ┌────┐│           Whiteboard (80%)                  │
│ │Peer││                                            │
│ └────┘│                                            │
│ ┌────┐│                                            │
│ │Peer││                                            │
│ └────┘│                                            │
└──────┴────────────────────────────────────────────┘
  20%                     80%
  snap scroll
```

### Files Modified

| File | Changes |
|------|---------|
| `frontend/src/pages/MeetingPage.jsx` | Updated layout to `w-[20%]` with snap scrolling |
| `frontend/src/components/VideoTile.jsx` | Fixed size, snap-start styling, truncated titles |
| `frontend/src/index.css` | Custom scrollbar CSS |

### Implementation Details

1. **Video Container (MeetingPage.jsx)**
   ```jsx
   <div className="flex flex-col gap-3 overflow-y-auto snap-y snap-mandatory h-full custom-scrollbar w-[20%]">
     <VideoTile ... />
     {remotePeers.map(peer => (
       <VideoTile key={peer.id} ... />
     ))}
   </div>
   ```

2. **VideoTile Styling (VideoTile.jsx)**
   ```jsx
   <article className="snap-start flex-shrink-0 rounded-xl border h-[140px]">
     <h3 className="truncate">{title}</h3>
     <div className="relative h-[100px]">
       <video className="rounded-lg" />
     </div>
   </article>
   ```

3. **Custom Scrollbar (index.css)**
   ```css
   .custom-scrollbar::-webkit-scrollbar {
     width: 6px;
   }
   .custom-scrollbar::-webkit-scrollbar-thumb {
     background: #64748b;
     border-radius: 3px;
   }
   ```

---

## 4. Control Bar Updates

### Date: [Current Session]
### Status: Implemented

### Changes

| Change | Description |
|--------|-------------|
| Video toggle always enabled | No `disabled` prop |
| Dynamic button text | "Start Video" / "Stop Video" based on state |
| New prop `videoStreamStarted` | Tracks if camera was ever started |

### Files Modified

| File | Changes |
|------|---------|
| `frontend/src/components/ControlBar.jsx` | Added `videoStreamStarted` prop, enabled video button |

---

## 5. Whiteboard Sync Fixes

### Date: [Current Session]
### Status: Implemented

### Issues Fixed

| Issue | Root Cause | Solution |
|-------|------------|----------|
| "Unsupported field value: undefined" | Excalidraw elements contain `undefined` values | `sanitizeElements()` removes undefined/function values |
| "Nested arrays not supported" | Excalidraw elements contain nested arrays | Store as JSON string (`elementsJson`) |
| Slow sync | Too many Firestore writes | 500ms debounce |

### Data Format in Firestore

```
rooms/{roomId}/whiteboard/scene
  elementsJson: "[{\"id\":\"1\",\"groupIds\":[\"a\",\"b\"]}]"  // JSON string
  updatedAt: Timestamp
```

### Helper Functions

```javascript
// Sanitize elements before saving
const sanitizeElements = (elements) => {
  if (!elements || !Array.isArray(elements)) return [];
  
  return elements
    .filter(el => el != null)
    .map(el => {
      if (typeof el !== 'object') return el;
      
      const cleaned = {};
      Object.keys(el).forEach(key => {
        const value = el[key];
        if (value === undefined || typeof value === 'function') return;
        if (typeof value === 'object' && value !== null) {
          const sanitized = sanitizeElements(Array.isArray(value) ? value : [value]);
          if (sanitized.length > 0) {
            cleaned[key] = Array.isArray(value) ? sanitized : sanitized[0];
          }
        } else {
          cleaned[key] = value;
        }
      });
      return cleaned;
    });
};

// Debounced save
const saveWhiteboardToFirestore = useCallback(async (elements) => {
  if (saveWhiteboardDebouncedRef.current) {
    clearTimeout(saveWhiteboardDebouncedRef.current);
  }

  saveWhiteboardDebouncedRef.current = setTimeout(async () => {
    const sanitized = sanitizeElements(elements);
    const serialized = JSON.stringify(sanitized);
    await getRoomRef(currentRoomIdRef.current)
      .collection('whiteboard')
      .doc('scene')
      .set({ elementsJson: serialized, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }, 500);
}, []);
```

---

## Summary of All Files Modified

| File | Lines Modified | Purpose |
|------|---------------|---------|
| `frontend/src/pages/MeetingPage.jsx` | ~100 | Main meeting logic, whiteboard integration, media streams |
| `frontend/src/components/ControlBar.jsx` | ~15 | Whiteboard toggle, video toggle always enabled |
| `frontend/src/components/VideoTile.jsx` | ~15 | Fixed size, snap scrolling, truncated titles |
| `frontend/src/index.css` | ~15 | Custom scrollbar styles |

---

## Firebase Firestore Structure

```
firestore/
├── _healthcheck/           # Health check collection
└── rooms/
    └── {roomId}/
        ├── updatedAt: Timestamp
        ├── signals/
        │   └── {signalId}/
        │       ├── from: string
        │       ├── to: string
        │       ├── type: 'offer' | 'answer' | 'candidate'
        │       ├── sdp?: string
        │       ├── candidate?: object
        │       └── createdAt: Timestamp
        ├── participants/
        │   └── {participantId}/
        │       ├── username: string
        │       ├── audioEnabled: boolean
        │       ├── videoEnabled: boolean
        │       ├── joinedAt: Timestamp
        │       └── updatedAt: Timestamp
        └── whiteboard/
            └── scene/
                ├── elementsJson: string (JSON)
                └── updatedAt: Timestamp
```

---

## Future Improvements (Not Implemented)

1. **Collaboration Cursors**: Show other users' cursor positions on whiteboard
2. **Whiteboard Undo/Redo**: Sync undo/redo operations
3. **Selective Element Sync**: Only sync specific elements instead of entire scene
4. **TURN Server**: Add TURN server for NAT traversal
5. **Screen Sharing**: Add screen sharing capability
6. **Recording**: Record meeting audio/video
7. **Meeting Chat Persistence**: Persist chat messages beyond meeting end
8. **User Authentication**: Integrate Firebase Auth for meeting access

---

## Testing Checklist

- [ ] Start meeting with microphone only
- [ ] Join meeting, verify audio works
- [ ] Toggle camera on/off
- [ ] Draw on whiteboard in one tab
- [ ] Verify drawing appears in second tab
- [ ] Test scrollbar on participant overflow
- [ ] Test whiteboard hide/show toggle
- [ ] Verify cleanup on meeting leave

---

## Known Limitations

1. **No cursor presence**: Cannot see other users' cursors on whiteboard
2. **Last-write-wins**: No conflict resolution for simultaneous edits
3. **No TURN server**: May fail in strict NAT environments
4. **Mesh topology**: Limited scalability for large meetings
5. **Whiteboard persists until Firestore cleanup**: No automatic cleanup rule

---

## Browser Compatibility

- Chrome 74+ (recommended)
- Firefox 78+
- Safari 14.1+
- Edge 79+

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@excalidraw/excalidraw` | ^0.18.0 | Whiteboard component |
| `firebase` | 8.2.10 | Firestore, real-time sync |
| `react` | ^19.2.4 | UI framework |
| `react-router-dom` | ^7.13.0 | Routing |
| `tailwindcss` | ^4.1.18 | Styling |
