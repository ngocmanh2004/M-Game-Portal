import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update, remove, get } from 'firebase/database';
import { createTienLenGame } from '../utils/tienlen/gameCreator';

const db = getDatabase();

export function useTienLenWaitingRoom(lobbyId: string) {
  const [lobby, setLobby] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lắng nghe realtime lobby
  useEffect(() => {
    if (!lobbyId) return;
    const lobbyRef = ref(db, `tienlen/lobbies/${lobbyId}`);
    onValue(lobbyRef, (snap) => {
      setLobby(snap.val());
      setLoading(false);
    });
  }, [lobbyId]);

  // Ready/unready
  const setReady = async (uid: string, position: number, ready: boolean) => {
    await update(ref(db, `tienlen/lobbies/${lobbyId}/players/${position}`), { ready });
  };

  // Rời phòng: xóa player, nhường chủ, xóa phòng nếu còn 1 người
  const leaveRoom = async (position: number) => {
    const lobbyRef = ref(db, `tienlen/lobbies/${lobbyId}`);
    const lobbySnap = await get(lobbyRef);
    if (!lobbySnap.exists()) return;
    const lobby = lobbySnap.val();

    // Xóa player khỏi players
    await update(lobbyRef, { [`players/${position}`]: null });

    // Lấy lại danh sách players sau khi xóa
    const players = { ...(lobby.players || {}) };
    delete players[position];
    const playerEntries = Object.entries(players).filter(([_, v]: any) => v);

    // Nếu không còn ai, xóa luôn phòng và roomCode
    if (playerEntries.length === 0) {
      await remove(lobbyRef);
      if (lobby.roomCode) {
        await remove(ref(db, `tienlen/roomCodes/${lobby.roomCode}`));
      }
      return;
    }

    // Nếu là chủ phòng và còn người khác, nhường chủ cho player nhỏ nhất còn lại
    if (lobby.hostUid === lobby.players[position]?.uid || position === 0) {
      const nextHostEntry = playerEntries[0];
      if (nextHostEntry) {
        const nextHostUid = (nextHostEntry[1] as any).uid;
        await update(lobbyRef, { hostUid: nextHostUid });
      }
    }
  };

  // Host bắt đầu game
  const startGame = async () => {
    await update(ref(db, `tienlen/lobbies/${lobbyId}`), { status: 'starting', startingIn: 5 });
  };

  // Host tự countdown và chuyển sang playing
  useEffect(() => {
    if (!lobby || lobby.status !== 'starting') return;
    const isHost = lobby.hostUid === window.localStorage.getItem('uid') || false;
    if (!isHost) return;
    let timer: any;
    let count = lobby.startingIn || 5;
    timer = setInterval(async () => {
      count -= 1;
      if (count > 0) {
        await update(ref(db, `tienlen/lobbies/${lobbyId}`), { startingIn: count });
      } else {
        clearInterval(timer);
        await createTienLenGame(lobby, lobbyId);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lobby, lobbyId]);

  return { lobby, loading, setReady, leaveRoom, startGame };
}