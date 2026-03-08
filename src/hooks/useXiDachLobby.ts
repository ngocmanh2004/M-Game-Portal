import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, push, set, get, update } from 'firebase/database';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';

const db = getDatabase();
const firestore = getFirestore();

function generateRoomCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export function useXiDachLobby() {
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lobbiesRef = ref(db, 'xidach/lobbies');
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

  const getRealMoney = async (uid: string): Promise<number> => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) return userDoc.data().money || 0;
    } catch (e) { console.error('Lỗi lấy tiền:', e); }
    return 0;
  };

  const syncMoneyToLobby = (lobbyId: string, userUid: string) => {
    const userRef = doc(firestore, 'users', userUid);
    return onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const realMoney = docSnap.data().money;
        const lobbyRef = ref(db, `xidach/lobbies/${lobbyId}`);
        const snapshot = await get(lobbyRef);
        if (snapshot.exists()) {
          const players = snapshot.val().players || {};
          const myPos = Object.keys(players).find(key => players[key]?.uid === userUid);
          if (myPos) {
            update(ref(db, `xidach/lobbies/${lobbyId}/players/${myPos}`), {
              money: realMoney,
              balance: realMoney,
            });
          }
        }
      }
    });
  };

  const createLobby = async (user: any, roomType: string, betAmount: number, maxPlayers: number) => {
    const realMoney = await getRealMoney(user.uid);
    if (realMoney < betAmount) throw new Error(`Cần tối thiểu ${betAmount.toLocaleString()}đ!`);

    let roomCode = '';
    let unique = false;
    while (!unique) {
      roomCode = generateRoomCode();
      const codeSnap = await get(ref(db, `xidach/roomCodes/${roomCode}`));
      if (!codeSnap.exists()) unique = true;
    }

    const lobbiesRef = ref(db, 'xidach/lobbies');
    const newLobbyRef = push(lobbiesRef);
    const lobbyId = newLobbyRef.key!;
    const now = Date.now();

    // Host là dealer, không ở trong players array
    const lobbyData = {
      roomCode,
      hostUid: user.uid,
      hostName: user.username,
      hostPhoto: user.avatar || '',
      roomType,
      betAmount,
      maxPlayers, // số lượng player slots (không tính dealer/host)
      status: 'waiting',
      createdAt: now,
      players: {} as any,
    };

    await set(newLobbyRef, lobbyData);
    await set(ref(db, `xidach/roomCodes/${roomCode}`), { lobbyId });

    // Lưu localStorage
    window.localStorage.setItem('xidach_lobby_id', lobbyId);
    window.localStorage.setItem('uid', user.uid);

    return lobbyId;
  };

  const joinLobbyByCode = async (user: any, code: string) => {
    const codeSnap = await get(ref(db, `xidach/roomCodes/${code}`));
    if (!codeSnap.exists()) throw new Error('Mã phòng không tồn tại!');
    const lobbyId = codeSnap.val().lobbyId;
    const lobbyRef = ref(db, `xidach/lobbies/${lobbyId}`);
    const lobbySnap = await get(lobbyRef);
    if (!lobbySnap.exists()) throw new Error('Phòng không tồn tại!');
    const lobby = lobbySnap.val();

    if (lobby.status !== 'waiting') throw new Error('Phòng đã bắt đầu chơi!');

    // Host không join vào players
    if (lobby.hostUid === user.uid) throw new Error('Bạn là chủ phòng (nhà cái)!');

    const realMoney = await getRealMoney(user.uid);
    if (realMoney < lobby.betAmount) throw new Error(`Cần tối thiểu ${lobby.betAmount.toLocaleString()}đ!`);

    const players = lobby.players || {};
    const existed = Object.values(players).filter(Boolean).find((p: any) => p.uid === user.uid);
    if (existed) throw new Error('Bạn đã ở trong phòng này!');

    let pos = -1;
    for (let i = 0; i < lobby.maxPlayers; i++) {
      if (!players[i]) { pos = i; break; }
    }
    if (pos === -1) throw new Error('Phòng đã đầy!');

    await update(lobbyRef, {
      [`players/${pos}`]: {
        uid: user.uid,
        displayName: user.username,
        email: user.email,
        photoURL: user.avatar || '',
        money: realMoney,
        balance: realMoney,
        ready: false,
        position: pos,
        joinedAt: Date.now(),
      }
    });

    window.localStorage.setItem('xidach_position', pos.toString());
    window.localStorage.setItem('uid', user.uid);
    return lobbyId;
  };

  return { lobbies, loading, createLobby, joinLobbyByCode, syncMoneyToLobby };
}
