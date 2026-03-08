import { useEffect, useState, useRef } from 'react';
import { getDatabase, ref, onValue, update, remove, get, set, onDisconnect } from 'firebase/database';
import { createXiDachGame } from '../utils/xidach/gameCreator';

const db = getDatabase();

export function useXiDachWaitingRoom(lobbyId: string, user?: any) {
  const [lobby, setLobby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const disconnectCancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!lobbyId) return;
    const lobbyRef = ref(db, `xidach/lobbies/${lobbyId}`);
    const unsub = onValue(lobbyRef, (snap) => {
      setLobby(snap.val());
      setLoading(false);
    });
    return () => unsub();
  }, [lobbyId]);

  // Setup onDisconnect when user connects to waiting room (only once per user/lobby)
  useEffect(() => {
    if (!lobbyId || !user || !lobby) return;
    const uid = user.uid;
    const isHost = lobby.hostUid === uid;

    if (isHost) {
      // Mark host as present and register cleanup on disconnect
      const presenceRef = ref(db, `xidach/lobbies/${lobbyId}/hostPresent`);
      set(presenceRef, true);
      const disconnectOp = onDisconnect(presenceRef);
      disconnectOp.set(false);
      disconnectCancelRef.current = () => disconnectOp.cancel();
    } else {
      // Player: register auto-remove on disconnect
      const players = lobby.players || {};
      const myPos = Object.keys(players).find((k) => players[k]?.uid === uid);
      if (myPos !== undefined) {
        const playerRef = ref(db, `xidach/lobbies/${lobbyId}/players/${myPos}`);
        const disconnectOp = onDisconnect(playerRef);
        disconnectOp.remove();
        disconnectCancelRef.current = () => disconnectOp.cancel();
      }
    }

    return () => {
      // Cancel onDisconnect on unmount (manual navigation away)
      if (disconnectCancelRef.current) {
        disconnectCancelRef.current();
        disconnectCancelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyId, user?.uid, lobby?.hostUid]);

  // Watch for host disconnect → auto-transfer or delete room
  useEffect(() => {
    if (!lobby || !user || lobby.hostPresent !== false) return;
    const uid = user.uid;
    if (lobby.hostUid === uid) return; // I am the host, skip

    const players = Object.entries(lobby.players || {})
      .filter(([, v]: any) => v)
      .sort(([, a]: any, [, b]: any) => (a.joinedAt || 0) - (b.joinedAt || 0));

    if (players.length === 0) {
      // No players remain, delete the ghost room
      (async () => {
        const lobbyRef = ref(db, `xidach/lobbies/${lobbyId}`);
        const snap = await get(lobbyRef);
        if (!snap.exists()) return;
        const val = snap.val();
        await remove(lobbyRef);
        if (val.roomCode) await remove(ref(db, `xidach/roomCodes/${val.roomCode}`));
      })();
      return;
    }

    // First joined player claims host role
    const [firstPos, firstPlayer]: any = players[0];
    if ((firstPlayer as any).uid === uid) {
      (async () => {
        const lobbyRef = ref(db, `xidach/lobbies/${lobbyId}`);
        const snap = await get(lobbyRef);
        if (!snap.exists()) return;
        const val = snap.val();
        if (val.hostPresent !== false) return; // Race condition guard
        await update(lobbyRef, {
          hostUid: (firstPlayer as any).uid,
          hostName: (firstPlayer as any).displayName,
          hostPhoto: (firstPlayer as any).photoURL || '',
          hostPresent: true,
          [`players/${firstPos}`]: null,
        });
        // Re-register disconnect handler as new host
        const presenceRef = ref(db, `xidach/lobbies/${lobbyId}/hostPresent`);
        const disconnectOp = onDisconnect(presenceRef);
        disconnectOp.set(false);
        disconnectCancelRef.current = () => disconnectOp.cancel();
      })();
    }
  }, [lobby?.hostPresent, lobbyId, user?.uid]);

  const setReady = async (uid: string, position: number, ready: boolean) => {
    await update(ref(db, `xidach/lobbies/${lobbyId}/players/${position}`), { ready });
  };

  // leaveRoom: handles both host and regular player leaving
  const leaveRoom = async (uid: string, position: number) => {
    // Cancel onDisconnect first (manual leave, not a disconnect)
    if (disconnectCancelRef.current) {
      disconnectCancelRef.current();
      disconnectCancelRef.current = null;
    }

    const lobbyRef = ref(db, `xidach/lobbies/${lobbyId}`);
    const snap = await get(lobbyRef);
    if (!snap.exists()) return;
    const lobbyVal = snap.val();
    const isHost = lobbyVal.hostUid === uid;

    if (isHost) {
      const players = Object.entries(lobbyVal.players || {})
        .filter(([, v]: any) => v)
        .sort(([, a]: any, [, b]: any) => (a.joinedAt || 0) - (b.joinedAt || 0));

      if (players.length === 0) {
        // No players, simply delete the room
        await remove(lobbyRef);
        if (lobbyVal.roomCode) await remove(ref(db, `xidach/roomCodes/${lobbyVal.roomCode}`));
      } else {
        // Transfer host to the first joined player
        const [firstPos, firstPlayer]: any = players[0];
        await update(lobbyRef, {
          hostUid: (firstPlayer as any).uid,
          hostName: (firstPlayer as any).displayName,
          hostPhoto: (firstPlayer as any).photoURL || '',
          hostPresent: true,
          [`players/${firstPos}`]: null,
        });
      }
    } else {
      // Regular player leave
      await update(lobbyRef, { [`players/${position}`]: null });
      const players = { ...(lobbyVal.players || {}) };
      delete players[position];
      const remaining = Object.entries(players).filter(([, v]: any) => v);
      // If no players and no host, delete room
      if (remaining.length === 0 && lobbyVal.hostPresent === false) {
        await remove(lobbyRef);
        if (lobbyVal.roomCode) await remove(ref(db, `xidach/roomCodes/${lobbyVal.roomCode}`));
      }
    }
  };

  // transferHost: host manually gives their role to a specific player
  const transferHost = async (currentHostUid: string, targetPosition: number) => {
    if (disconnectCancelRef.current) {
      disconnectCancelRef.current();
      disconnectCancelRef.current = null;
    }

    const lobbyRef = ref(db, `xidach/lobbies/${lobbyId}`);
    const snap = await get(lobbyRef);
    if (!snap.exists()) return;
    const lobbyVal = snap.val();

    if (lobbyVal.hostUid !== currentHostUid) return;
    const targetPlayer = lobbyVal.players?.[targetPosition];
    if (!targetPlayer) return;

    await update(lobbyRef, {
      hostUid: targetPlayer.uid,
      hostName: targetPlayer.displayName,
      hostPhoto: targetPlayer.photoURL || '',
      hostPresent: true,
      [`players/${targetPosition}`]: null,
    });
  };

  const startGame = async () => {
    await update(ref(db, `xidach/lobbies/${lobbyId}`), { status: 'starting', startingIn: 5 });
  };

  // Countdown host → create game
  useEffect(() => {
    if (!lobby || lobby.status !== 'starting' || !user) return;
    const isHost = lobby.hostUid === user.uid;
    if (!isHost) return;

    let count = lobby.startingIn || 5;
    const timer = setInterval(async () => {
      count -= 1;
      if (count > 0) {
        await update(ref(db, `xidach/lobbies/${lobbyId}`), { startingIn: count });
      } else {
        clearInterval(timer);
        await createXiDachGame(lobby, lobbyId);
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobby?.status, lobbyId]);

  return { lobby, loading, setReady, leaveRoom, startGame, transferHost };
}
