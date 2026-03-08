/**
 * useVoiceChat — Voice chat cho game bài dùng WebRTC + Firebase RTDB signaling.
 * Auto-join support, speaking indicators, and mute state synchronization.
 *
 * Cách dùng:
 *   const { isMicOn, toggleMic, speakingUids, peerMicStates } = useVoiceChat(gamePath, gameId, myUid, peerUids);
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { getDatabase, ref, onValue, update, get, onDisconnect } from 'firebase/database';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const pairKey = (a: string, b: string) => [a, b].sort().join('__');

export function useVoiceChat(
  gamePath: string,
  gameId: string,
  myUid: string,
  peerUids: string[],
) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [speakingUids, setSpeakingUids] = useState<string[]>([]);
  const [peerMicStates, setPeerMicStates] = useState<Record<string, boolean>>({});

  const streamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const unsubsRef = useRef<Array<() => void>>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const speakingAnimRef = useRef<number>();

  const db = getDatabase();

  // ─── Full cleanup ───────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    pcsRef.current.forEach(pc => pc.close());
    pcsRef.current.clear();
    audiosRef.current.forEach(a => { a.pause(); a.srcObject = null; a.remove(); });
    audiosRef.current.clear();
    unsubsRef.current.forEach(u => u());
    unsubsRef.current = [];
    if (speakingAnimRef.current) cancelAnimationFrame(speakingAnimRef.current);
    audioContextRef.current?.close();
    analysersRef.current.clear();

    // Clear local mute state on leave
    if (gameId && myUid) {
      update(ref(db, `${gamePath}/games/${gameId}/voiceState`), { [myUid]: null }).catch(() => { });
    }
  }, [gamePath, gameId, myUid, db]);

  useEffect(() => () => cleanup(), [cleanup]);

  // ─── Speaking Indicator Loop ────────────────────────────────────────────────
  useEffect(() => {
    const checkSpeaking = () => {
      if (analysersRef.current.size === 0) {
        speakingAnimRef.current = requestAnimationFrame(checkSpeaking);
        return;
      }
      const newSpeaking: string[] = [];
      const dataArray = new Uint8Array(128);

      analysersRef.current.forEach((analyser, uid) => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        if (avg > 12) { // Threshold for speaking
          newSpeaking.push(uid);
        }
      });

      setSpeakingUids(prev => {
        if (prev.length === newSpeaking.length && prev.every(v => newSpeaking.includes(v))) return prev;
        return newSpeaking;
      });
      speakingAnimRef.current = requestAnimationFrame(checkSpeaking);
    };
    checkSpeaking();
    return () => { if (speakingAnimRef.current) cancelAnimationFrame(speakingAnimRef.current); };
  }, []);

  // ─── Sync Peer Mute States ──────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;
    const stateRef = ref(db, `${gamePath}/games/${gameId}/voiceState`);
    const unsub = onValue(stateRef, snap => {
      setPeerMicStates(snap.val() || {});
    });
    return () => unsub();
  }, [gamePath, gameId, db]);

  // ─── Sync Local Mute State ──────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId || !myUid) return;
    const myStateRef = ref(db, `${gamePath}/games/${gameId}/voiceState/${myUid}`);
    update(ref(db), { [`${gamePath}/games/${gameId}/voiceState/${myUid}`]: isMicOn }).catch(() => { });

    const disconnectOp = onDisconnect(myStateRef);
    disconnectOp.remove().catch(() => { });
    return () => { disconnectOp.cancel(); };
  }, [isMicOn, gamePath, gameId, myUid, db]);

  // ─── Setup PC & Negotiate ───────────────────────────────────────────────────
  const setupPC = useCallback((peerUid: string) => {
    if (pcsRef.current.has(peerUid)) return pcsRef.current.get(peerUid)!;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcsRef.current.set(peerUid, pc);

    // Add transceiver natively for sendrecv without a track, so we can replaceTrack later!
    pc.addTransceiver('audio', { direction: 'sendrecv' });

    // Ensure we send our active track if we already have one
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        pc.getTransceivers()[0].sender.replaceTrack(track).catch(() => { });
      }
    }

    pc.ontrack = ev => {
      const audio = document.createElement('audio');
      const stream = ev.streams && ev.streams[0] ? ev.streams[0] : new MediaStream([ev.track]);
      audio.srcObject = stream;
      audio.autoplay = true;
      audio.setAttribute('playsinline', 'true');
      audio.volume = 1.0;
      audio.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none;';
      document.body.appendChild(audio);
      audio.play().catch(e => console.warn('[VoiceChat] autoplay blocked:', e));
      audiosRef.current.set(peerUid, audio);

      // Connect to audio context for speaking indicator
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      try {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analysersRef.current.set(peerUid, analyser);
      } catch (e) {
        console.warn("Could not create audio context for peer", peerUid, e);
      }
    };

    const key = pairKey(myUid, peerUid);
    const basePath = `${gamePath}/games/${gameId}/voiceSignal/${key}`;

    pc.onicecandidate = ev => {
      if (!ev.candidate) return;
      get(ref(db, `${basePath}/ice_${myUid}`)).then(snap => {
        update(ref(db), {
          [`${basePath}/ice_${myUid}`]: [...(snap.val() ?? []), ev.candidate!.toJSON()]
        }).catch(() => { });
      }).catch(() => { });
    };

    let iceBuf: RTCIceCandidateInit[] = [];
    let iceApplied = 0;
    let remoteReady = false;

    (pc as any).markRemoteReady = () => {
      remoteReady = true;
      drainIce();
    };

    const drainIce = async () => {
      if (!remoteReady || pc.signalingState === 'closed') return;
      while (iceApplied < iceBuf.length) {
        await pc.addIceCandidate(iceBuf[iceApplied]).catch(() => { });
        iceApplied++;
      }
    };

    const unsubIce = onValue(ref(db, `${basePath}/ice_${peerUid}`), snap => {
      const cands = snap.val() as RTCIceCandidateInit[] | null;
      if (!cands || pc.signalingState === 'closed') return;
      iceBuf = cands;
      drainIce();
    });
    unsubsRef.current.push(unsubIce);

    return pc;
  }, [gamePath, gameId, myUid, db]);

  const negotiate = useCallback(async (pc: RTCPeerConnection, peerUid: string) => {
    const key = pairKey(myUid, peerUid);
    const basePath = `${gamePath}/games/${gameId}/voiceSignal/${key}`;

    if (myUid < peerUid) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await update(ref(db, basePath), { offer: JSON.stringify(offer) });

      const unsubAns = onValue(ref(db, `${basePath}/answer`), async snap => {
        const str = snap.val() as string | null;
        if (!str || pc.remoteDescription || pc.signalingState !== 'have-local-offer') return;
        try {
          await pc.setRemoteDescription(JSON.parse(str));
          (pc as any).markRemoteReady();
        } catch (e) { console.warn('setRemoteDescription(answer) error:', e); }
      });
      unsubsRef.current.push(unsubAns);
    } else {
      const unsubOffer = onValue(ref(db, `${basePath}/offer`), async snap => {
        const str = snap.val() as string | null;
        if (!str || pc.signalingState !== 'stable') return;
        try {
          await pc.setRemoteDescription(JSON.parse(str));
          (pc as any).markRemoteReady();
          const ans = await pc.createAnswer();
          await pc.setLocalDescription(ans);
          await update(ref(db, basePath), { answer: JSON.stringify(ans) });
        } catch (e) { console.warn('callee error:', e); }
      });
      unsubsRef.current.push(unsubOffer);
    }
  }, [gamePath, gameId, myUid, db]);

  // ─── Auto-connect on enter ──────────────────────────────────────────────────
  useEffect(() => {
    peerUids.forEach(peerUid => {
      if (peerUid && peerUid !== myUid && !pcsRef.current.has(peerUid)) {
        const pc = setupPC(peerUid);
        negotiate(pc, peerUid).catch(() => { });
      }
    });

    // Clean up disconnected peers
    const currentPeers = new Set(peerUids);
    Array.from(pcsRef.current.keys()).forEach(peerUid => {
      if (!currentPeers.has(peerUid)) {
        pcsRef.current.get(peerUid)?.close();
        pcsRef.current.delete(peerUid);
        audiosRef.current.get(peerUid)?.remove();
        audiosRef.current.delete(peerUid);
        analysersRef.current.delete(peerUid);
      }
    });
  }, [peerUids, setupPC, negotiate, myUid]);

  // ─── Toggle Mic ─────────────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.enabled = false);
      }
      setIsMicOn(false);
      return;
    }

    const existingTrack = streamRef.current?.getAudioTracks()?.[0];
    if (existingTrack && existingTrack.readyState === 'live') {
      existingTrack.enabled = true;
      setIsMicOn(true);
      return;
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = newStream;
      const track = newStream.getAudioTracks()[0];

      pcsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'audio') || pc.getTransceivers()[0]?.sender;
        if (sender) {
          sender.replaceTrack(track).catch(e => console.warn('[VoiceChat] replaceTrack error:', e));
        }
      });

      track.enabled = true;
      setIsMicOn(true);

      // Local talking indicator setup
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      try {
        const source = audioContextRef.current.createMediaStreamSource(newStream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analysersRef.current.set(myUid, analyser);
      } catch (e) {
        console.warn("Could not create local audio context", e);
      }

    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        alert('Bạn cần cấp quyền microphone để dùng voice chat.');
      } else {
        console.error('[VoiceChat] start error:', err);
      }
      setIsMicOn(false);
    }
  }, [isMicOn, myUid]);

  return { isMicOn, toggleMic, speakingUids, peerMicStates };
}
