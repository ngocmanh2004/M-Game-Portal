import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, push, set, get, child, update } from 'firebase/database';
import { generateRoomCode } from '../utils/tienlen/roomCodeGenerator';

const db = getDatabase();

export function useTienLenLobby() {
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lắng nghe danh sách phòng realtime
  useEffect(() => {
    const lobbiesRef = ref(db, 'tienlen/lobbies');
    const unsubscribe = onValue(lobbiesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const rooms = Object.entries(data)
        .map(([lobbyId, lobby]: any) => ({ ...lobby, lobbyId }))
        .filter((room) => room.status === 'waiting');
      setLobbies(rooms);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Tạo phòng mới
  const createLobby = async (user: any, roomType: string, betAmount: number, maxPlayers: number, toiTrangRule: string) => {
    let roomCode = '';
    let unique = false;
    // Tìm mã phòng 5 số duy nhất
    while (!unique) {
      roomCode = generateRoomCode();
      const codeSnap = await get(ref(db, `tienlen/roomCodes/${roomCode}`));
      if (!codeSnap.exists()) unique = true;
    }
    const lobbiesRef = ref(db, 'tienlen/lobbies');
    const newLobbyRef = push(lobbiesRef);
    const lobbyId = newLobbyRef.key!;
    const now = Date.now();
    const lobbyData = {
      roomCode,
      hostUid: user.uid,
      roomType,
      betAmount,
      maxPlayers,
      toiTrangRule,
      status: 'waiting',
      createdAt: now,
      players: {
        0: {
          uid: user.uid,
          displayName: user.username,
          email: user.email,
          photoURL: user.avatar || '',
          balance: user.balance,
          ready: false,
          position: 0,
          joinedAt: now,
        }
      }
    };
    await set(newLobbyRef, lobbyData);
    await set(ref(db, `tienlen/roomCodes/${roomCode}`), { lobbyId });
    return lobbyId;
  };

  // Vào phòng bằng mã
  const joinLobbyByCode = async (user: any, code: string) => {
    const codeSnap = await get(ref(db, `tienlen/roomCodes/${code}`));
    if (!codeSnap.exists()) throw new Error('Mã phòng không tồn tại!');
    const lobbyId = codeSnap.val().lobbyId;
    const lobbyRef = ref(db, `tienlen/lobbies/${lobbyId}`);
    const lobbySnap = await get(lobbyRef);
    if (!lobbySnap.exists()) throw new Error('Phòng không tồn tại!');
    const lobby = lobbySnap.val();

    // Đảm bảo players luôn là object
    const players = lobby.players || {};

    // Kiểm tra user đã có trong phòng chưa (chỉ kiểm tra player còn tồn tại)
    const existed = Object.values(players).filter(Boolean).find((p: any) => p.uid === user.uid);
    if (existed) throw new Error('Bạn đã ở trong phòng này!');

    // Tìm vị trí trống
    let pos = -1;
    for (let i = 0; i < lobby.maxPlayers; i++) {
      if (!players[i]) {
        pos = i;
        break;
      }
    }
    if (pos === -1) throw new Error('Phòng đã đầy!');

    // Thêm user vào phòng
    await update(lobbyRef, {
      [`players/${pos}`]: {
        uid: user.uid,
        displayName: user.username,
        email: user.email,
        photoURL: user.avatar || '',
        balance: user.balance,
        ready: false,
        position: pos,
        joinedAt: Date.now(),
      }
    });
    window.localStorage.setItem('tienlen_position', pos.toString());
    window.localStorage.setItem('uid', user.uid);
    return lobbyId;
  };

  return {
    lobbies,
    loading,
    createLobby,
    joinLobbyByCode,
  };
}