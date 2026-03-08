import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, push, set, get, update } from 'firebase/database';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore'; 
import { generateRoomCode } from '../utils/tienlen/roomCodeGenerator';

const db = getDatabase();
const firestore = getFirestore();

export function useTienLenLobby() {
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getRealMoney = async (uid: string) => {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data().money || 0;
        }
      } catch (e) { console.error("Lỗi lấy tiền:", e); }
      return 0;
  };

  // --- ĐỒNG BỘ TIỀN REALTIME (MỚI) ---
  // Hàm này sẽ được gọi ở TienLen.tsx hoặc WaitingRoom để giữ tiền luôn đúng
  const syncMoneyToLobby = (lobbyId: string, userUid: string) => {
      // Lắng nghe tiền thật thay đổi ở Firestore
      const userRef = doc(firestore, 'users', userUid);
      return onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
              const realMoney = docSnap.data().money;
              
              // Tìm xem mình đang ở vị trí nào trong phòng để update
              const lobbyRef = ref(db, `tienlen/lobbies/${lobbyId}`);
              const snapshot = await get(lobbyRef);
              if (snapshot.exists()) {
                  const players = snapshot.val().players || {};
                  const myPos = Object.keys(players).find(key => players[key]?.uid === userUid);
                  
                  if (myPos) {
                      // Cập nhật tiền mới lên phòng chờ
                      update(ref(db, `tienlen/lobbies/${lobbyId}/players/${myPos}`), { 
                          money: realMoney,
                          balance: realMoney 
                      });
                  }
              }
              
              // Nếu game đang diễn ra, cập nhật cả trong node game
              const gameRef = ref(db, `tienlen/games/${lobbyId}`); // gameId thường trùng lobbyId
              const gameSnap = await get(gameRef);
              if (gameSnap.exists()) {
                  const players = gameSnap.val().players || {};
                  const myPos = Object.keys(players).find(key => players[key]?.uid === userUid);
                  if (myPos) {
                      update(ref(db, `tienlen/games/${lobbyId}/players/${myPos}`), { 
                          money: realMoney 
                      });
                  }
              }
          }
      });
  };

  const createLobby = async (user: any, roomType: string, betAmount: number, maxPlayers: number, toiTrangRule: string) => {
    const realMoney = await getRealMoney(user.uid);
    if (realMoney < betAmount) throw new Error(`Cần tối thiểu ${betAmount.toLocaleString()}đ!`);

    let roomCode = '';
    let unique = false;
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
      roomCode, hostUid: user.uid, roomType, betAmount, maxPlayers, toiTrangRule, status: 'waiting', createdAt: now,
      players: {
        0: {
          uid: user.uid, displayName: user.username, email: user.email, photoURL: user.avatar || '',
          money: realMoney, 
          balance: realMoney,
          ready: false, position: 0, joinedAt: now,
        }
      }
    };
    await set(newLobbyRef, lobbyData);
    await set(ref(db, `tienlen/roomCodes/${roomCode}`), { lobbyId });
    window.localStorage.setItem('tienlen_position', '0');
    window.localStorage.setItem('uid', user.uid);
    return lobbyId;
  };

  const joinLobbyByCode = async (user: any, code: string) => {
    const codeSnap = await get(ref(db, `tienlen/roomCodes/${code}`));
    if (!codeSnap.exists()) throw new Error('Mã phòng không tồn tại!');
    const lobbyId = codeSnap.val().lobbyId;
    const lobbyRef = ref(db, `tienlen/lobbies/${lobbyId}`);
    const lobbySnap = await get(lobbyRef);
    if (!lobbySnap.exists()) throw new Error('Phòng không tồn tại!');
    const lobby = lobbySnap.val();

    const realMoney = await getRealMoney(user.uid);
    if (realMoney < lobby.betAmount) throw new Error(`Cần tối thiểu ${lobby.betAmount.toLocaleString()}đ!`);

    const players = lobby.players || {};
    const existed = Object.values(players).filter(Boolean).find((p: any) => p.uid === user.uid);
    if (existed) throw new Error('Bạn đã ở trong phòng này!');

    let pos = -1;
    for (let i = 0; i < lobby.maxPlayers; i++) { if (!players[i]) { pos = i; break; } }
    if (pos === -1) throw new Error('Phòng đã đầy!');

    await update(lobbyRef, {
      [`players/${pos}`]: {
        uid: user.uid, displayName: user.username, email: user.email, photoURL: user.avatar || '',
        money: realMoney,
        balance: realMoney,
        ready: false, position: pos, joinedAt: Date.now(),
      }
    });
    window.localStorage.setItem('tienlen_position', pos.toString());
    window.localStorage.setItem('uid', user.uid);
    return lobbyId;
  };

  return { lobbies, loading, createLobby, joinLobbyByCode, syncMoneyToLobby };
}