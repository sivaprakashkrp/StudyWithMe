import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Tldraw, useEditor } from 'tldraw';
import 'tldraw/tldraw.css';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

function TldrawSync({ roomId }) {
  const editor = useEditor();
  const saveTimeoutRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  const lastSavedRef = useRef(null);
  const versionRef = useRef(0);
  const pendingSaveRef = useRef(null);

  const saveToFirestore = useCallback((snapshot) => {
    if (!roomId) return;
    
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSavedRef.current) return;
    
    lastSavedRef.current = serialized;
    const currentVersion = versionRef.current;
    pendingSaveRef.current = { serialized, version: currentVersion };
    
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const pending = pendingSaveRef.current;
      if (!pending) return;
      
      console.log('[Tldraw] Saving to Firestore, size:', pending.serialized.length, 'version:', pending.version);
      
      try {
        const docRef = doc(firestore, 'rooms', roomId, 'whiteboard', 'tldraw');
        const docSnap = await getDoc(docRef);
        const serverVersion = docSnap.exists() ? (docSnap.data()?.version || 0) : 0;
        
        if (serverVersion > pending.version) {
          console.log('[Tldraw] Conflict detected - server has newer version', serverVersion, '>', pending.version);
          return;
        }
        
        const newVersion = pending.version + 1;
        await setDoc(docRef, {
          data: pending.serialized,
          version: newVersion,
          updatedAt: Date.now()
        }, { merge: true });
        versionRef.current = newVersion;
      } catch (err) {
        console.warn('Save failed:', err);
      }
    }, 500);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    console.log('[Tldraw] Loading from Firestore for room:', roomId);

    getDoc(doc(firestore, 'rooms', roomId, 'whiteboard', 'tldraw'))
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()?.data;
          const version = docSnap.data()?.version || 0;
          versionRef.current = version;
          console.log('[Tldraw] Loaded version:', version);
          if (data) {
            try {
              const snapshot = JSON.parse(data);
              console.log('[Tldraw] Loading existing document');
              editor.loadSnapshot(snapshot);
              lastSavedRef.current = data;
            } catch (err) {
              console.warn('Failed to parse tldraw data:', err);
            }
          }
        }
      })
      .catch(err => console.warn('Load failed:', err));
  }, [roomId, editor]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onSnapshot(
      doc(firestore, 'rooms', roomId, 'whiteboard', 'tldraw'),
      (docSnap) => {
        if (!docSnap.exists()) return;
        
        const data = docSnap.data()?.data;
        const remoteVersion = docSnap.data()?.version || 0;
        
        if (data && data !== lastSavedRef.current) {
          if (remoteVersion <= versionRef.current) {
            console.log('[Tldraw] Ignoring stale remote update, remote:', remoteVersion, 'local:', versionRef.current);
            return;
          }
          
          console.log('[Tldraw] Remote update received, version:', remoteVersion);
          isRemoteUpdateRef.current = true;
          versionRef.current = remoteVersion;
          
          try {
            const snapshot = JSON.parse(data);
            editor.loadSnapshot(snapshot);
            lastSavedRef.current = data;
          } catch (err) {
            console.warn('Failed to parse remote tldraw data:', err);
          }
          setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
        }
      }
    );

    return () => unsubscribe();
  }, [roomId, editor]);

  useEffect(() => {
    if (!roomId) return;

    const changeHandler = () => {
      if (isRemoteUpdateRef.current) return;
      
      const snapshot = editor.getSnapshot();
      saveToFirestore(snapshot);
    };

    editor.on('change', changeHandler);

    return () => {
      editor.off('change', changeHandler);
    };
  }, [editor, saveToFirestore]);

  return null;
}

export default function TldrawWhiteboard({ roomId }) {
  return (
    <div className="w-full h-full">
      <Tldraw persistenceKey={null}>
        <TldrawSync roomId={roomId} />
      </Tldraw>
    </div>
  );
}