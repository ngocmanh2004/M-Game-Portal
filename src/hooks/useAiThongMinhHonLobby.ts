import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, push, set, get, update } from 'firebase/database';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';

const db = getDatabase();
const firestore = getFirestore();

function generateRoomCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export function useAiThongMinhHonLobby() {
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roomsRef = ref(db, 'quizRooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const rooms = Object.entries(data)
        .map(([lobbyId, lobby]: any) => ({ ...lobby, lobbyId }))
        .filter((room) => room.status === 'lobby');
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
        const lobbyRef = ref(db, `quizRooms/${lobbyId}`);
        const snapshot = await get(lobbyRef);
        if (snapshot.exists()) {
          const players = snapshot.val().players || {};
          if (players[userUid]) {
            update(ref(db, `quizRooms/${lobbyId}/players/${userUid}`), {
              balance: realMoney,
            });
          }
        }
      }
    });
  };

  const createLobby = async (user: any, betAmount: number): Promise<string> => {
    const realMoney = await getRealMoney(user.uid);
    if (realMoney < betAmount) throw new Error(`Cần tối thiểu ${betAmount.toLocaleString()}đ!`);

    let roomCode = '';
    let unique = false;
    while (!unique) {
      roomCode = generateRoomCode();
      const codeSnap = await get(ref(db, `quizRoomCodes/${roomCode}`));
      if (!codeSnap.exists()) unique = true;
    }

    const roomsRef = ref(db, 'quizRooms');
    const newRoomRef = push(roomsRef);
    const lobbyId = newRoomRef.key!;

    const lobbyData = {
      hostUid: user.uid,
      hostName: user.username,
      betAmount,
      totalPot: 0,
      roomCode,
      status: 'lobby',
      startingIn: 5,
      practiceMode: false,
      phase: 'question',
      currentRound: 1,
      currentQuestionIndex: 0,
      questionStartTime: 0,
      timeLimit: 10,
      players: {
        [user.uid]: {
          name: user.username,
          avatar: user.avatar || '',
          balance: realMoney,
          score: 0,
          isEliminated: false,
          eliminatedInRound: null,
          isSpectator: false,
          isReady: false,
        },
      },
      answers: {},
      maxPlayers: 15,
      createdAt: Date.now(),
    };

    await set(newRoomRef, lobbyData);
    await set(ref(db, `quizRoomCodes/${roomCode}`), { lobbyId });

    window.localStorage.setItem('quiz_lobby_id', lobbyId);
    window.localStorage.setItem('uid', user.uid);

    return lobbyId;
  };

  const joinLobbyByCode = async (user: any, code: string): Promise<string> => {
    const codeSnap = await get(ref(db, `quizRoomCodes/${code}`));
    if (!codeSnap.exists()) throw new Error('Mã phòng không tồn tại!');
    const lobbyId = codeSnap.val().lobbyId;

    const lobbyRef = ref(db, `quizRooms/${lobbyId}`);
    const lobbySnap = await get(lobbyRef);
    if (!lobbySnap.exists()) throw new Error('Phòng không tồn tại!');
    const lobby = lobbySnap.val();

    if (lobby.status !== 'lobby') throw new Error('Phòng đã bắt đầu chơi!');

    const players = lobby.players || {};
    if (players[user.uid]) throw new Error('Bạn đã ở trong phòng này!');

    const realMoney = await getRealMoney(user.uid);
    if (realMoney < lobby.betAmount) throw new Error(`Cần tối thiểu ${lobby.betAmount.toLocaleString()}đ!`);

    const playerCount = Object.keys(players).length;
    if (playerCount >= (lobby.maxPlayers || 15)) throw new Error('Phòng đã đầy!');

    await update(ref(db, `quizRooms/${lobbyId}/players/${user.uid}`), {
      name: user.username,
      avatar: user.avatar || '',
      balance: realMoney,
      score: 0,
      isEliminated: false,
      eliminatedInRound: null,
      isSpectator: false,
      isReady: false,
    });

    window.localStorage.setItem('quiz_lobby_id', lobbyId);
    window.localStorage.setItem('uid', user.uid);

    return lobbyId;
  };

  return { lobbies, loading, createLobby, joinLobbyByCode, syncMoneyToLobby };
}
