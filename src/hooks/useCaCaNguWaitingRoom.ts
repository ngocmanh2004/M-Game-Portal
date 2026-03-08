import { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref, onValue, update, remove, get } from 'firebase/database';
import { CaNguLobby, CaNguColor } from '../types';
import { createCaNguGame } from '../utils/cacangu/gameCreator';

interface UseCaCaNguWaitingRoomResult {
  lobby: CaNguLobby | null;
  loading: boolean;
  setReady: (ready: boolean) => Promise<void>;
  startGame: () => Promise<string | null>;
  leaveRoom: () => Promise<void>;
}

const db = getDatabase();

export function useCaCaNguWaitingRoom(lobbyId: string, myUid: string): UseCaCaNguWaitingRoomResult {
  const [lobby, setLobby] = useState<CaNguLobby | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lobbyId) return;
    const lobbyRef = ref(db, `cacangu/lobbies/${lobbyId}`);
    const unsubscribe = onValue(lobbyRef, (snap) => {
      if (snap.exists()) {
        setLobby({ ...snap.val(), id: lobbyId } as CaNguLobby);
      } else {
        setLobby(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [lobbyId]);

  const setReady = useCallback(
    async (ready: boolean): Promise<void> => {
      await update(ref(db, `cacangu/lobbies/${lobbyId}/players/${myUid}`), { ready });
    },
    [lobbyId, myUid]
  );

  const startGame = useCallback(async (): Promise<string | null> => {
    const snap = await get(ref(db, `cacangu/lobbies/${lobbyId}`));
    if (!snap.exists()) return null;
    const lobbyVal: CaNguLobby = { ...snap.val(), id: lobbyId };
    if (lobbyVal.hostUid !== myUid) return null;
    const playerUids = Object.keys(lobbyVal.players || {});
    if (playerUids.length < 2) return null;
    try {
      const lobbyRef = ref(db, `cacangu/lobbies/${lobbyId}`);
      // Write startingTs once — each client computes countdown locally
      await update(lobbyRef, { status: 'starting' as any, startingTs: Date.now() });
      // Wait full 3 seconds then create game
      await new Promise(r => setTimeout(r, 3100));
      const gameId = await createCaNguGame(lobbyVal);
      await update(lobbyRef, { status: 'started', gameId, startingTs: null });
      return gameId;
    } catch (e) {
      console.error('[CaCaNgu] startGame error:', e);
      await update(ref(db, `cacangu/lobbies/${lobbyId}`), {
        status: 'waiting',
        startingTs: null,
      }).catch(() => {});
      return null;
    }
  }, [lobbyId, myUid]);

  const leaveRoom = useCallback(async (): Promise<void> => {
    const lobbyRef = ref(db, `cacangu/lobbies/${lobbyId}`);
    const snap = await get(lobbyRef);
    if (!snap.exists()) return;
    const lobbyVal = snap.val();
    const players = { ...(lobbyVal.players || {}) };
    delete players[myUid];
    const remainingUids = Object.keys(players);
    if (remainingUids.length === 0) {
      await remove(lobbyRef);
      return;
    }
    const updates: Record<string, any> = { [`players/${myUid}`]: null };
    if (lobbyVal.hostUid === myUid) {
      const nextUid = remainingUids[0];
      updates.hostUid = nextUid;
      updates.hostName = players[nextUid].name;
    }
    await update(lobbyRef, updates);
  }, [lobbyId, myUid]);

  return { lobby, loading, setReady, startGame, leaveRoom };
}
