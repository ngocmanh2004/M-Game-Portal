import { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref, onValue, push, set, get, update, remove } from 'firebase/database';
import { CaNguLobby } from '../types';

interface UseCaCaNguLobbyResult {
  lobbies: CaNguLobby[];
  loading: boolean;
  createRoom: (params: { betAmount: number; hostName: string; hostAvatar?: string }) => Promise<string>;
  joinRoom: (lobbyId: string, uid: string, name: string, avatar?: string) => Promise<void>;
  leaveRoom: (lobbyId: string, uid: string) => Promise<void>;
}

const db = getDatabase();

export function useCaCaNguLobby(myUid: string): UseCaCaNguLobbyResult {
  const [lobbies, setLobbies] = useState<CaNguLobby[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lobbiesRef = ref(db, 'cacangu/lobbies');
    const unsubscribe = onValue(lobbiesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const rooms = Object.entries(data)
        .map(([id, lobby]: any) => ({ ...lobby, id }))
        .filter((room) => room.status === 'waiting' || room.status === 'starting')
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setLobbies(rooms as CaNguLobby[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createRoom = useCallback(
    async ({
      betAmount,
      hostName,
      hostAvatar,
    }: {
      betAmount: number;
      hostName: string;
      hostAvatar?: string;
    }): Promise<string> => {
      const lobbiesRef = ref(db, 'cacangu/lobbies');
      const newLobbyRef = push(lobbiesRef);
      const id = newLobbyRef.key!;
      const lobbyData: Omit<CaNguLobby, 'id'> = {
        hostUid: myUid,
        hostName,
        betAmount,
        maxPlayers: 4,
        status: 'waiting',
        createdAt: Date.now(),
        players: {
          [myUid]: { name: hostName, avatar: hostAvatar || '', ready: true },
        },
      };
      await set(newLobbyRef, lobbyData);
      return id;
    },
    [myUid]
  );

  const joinRoom = useCallback(
    async (lobbyId: string, uid: string, name: string, avatar?: string): Promise<void> => {
      const lobbyRef = ref(db, `cacangu/lobbies/${lobbyId}`);
      const snap = await get(lobbyRef);
      if (!snap.exists()) return;
      const lobbyVal = snap.val();
      const currentCount = Object.keys(lobbyVal.players || {}).length;
      const newCount = currentCount + 1;
      const updates: Record<string, any> = {
        [`players/${uid}`]: { name, avatar: avatar || '', ready: false },
      };
      void newCount;
      await update(lobbyRef, updates);
    },
    []
  );

  const leaveRoom = useCallback(async (lobbyId: string, uid: string): Promise<void> => {
    const lobbyRef = ref(db, `cacangu/lobbies/${lobbyId}`);
    const snap = await get(lobbyRef);
    if (!snap.exists()) return;
    const lobbyVal = snap.val();
    const players = { ...(lobbyVal.players || {}) };
    delete players[uid];
    const remainingUids = Object.keys(players);
    if (remainingUids.length === 0) {
      await remove(lobbyRef);
      return;
    }
    const updates: Record<string, any> = { [`players/${uid}`]: null };
    if (lobbyVal.hostUid === uid) {
      const nextUid = remainingUids[0];
      updates.hostUid = nextUid;
      updates.hostName = players[nextUid].name;
    }
    await update(lobbyRef, updates);
  }, []);

  return { lobbies, loading, createRoom, joinRoom, leaveRoom };
}
