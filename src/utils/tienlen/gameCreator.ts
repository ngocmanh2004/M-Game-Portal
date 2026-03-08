import { getDatabase, ref, set, update } from 'firebase/database';

// Trộn bộ bài 52 lá
export function shuffleDeck(): string[] {
  const suits = ['S', 'C', 'D', 'H'];
  const values = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
  const deck: string[] = [];
  for (const v of values) for (const s of suits) deck.push(v + s);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Tạo game mới khi countdown kết thúc
export async function createTienLenGame(lobby: any, lobbyId: string) {
  const db = getDatabase();
  const deck = shuffleDeck();
  const playerCount = Object.keys(lobby.players).length;
  const hands: Record<number, string[]> = {};
  for (let i = 0; i < playerCount; i++) {
    hands[i] = deck.slice(i * 13, (i + 1) * 13).sort();
  }
  // Tìm người có 3♠ để đi trước
  let firstPlayer = 0;
  for (let i = 0; i < playerCount; i++) {
    if (hands[i].includes('3S')) firstPlayer = i;
  }
  const gameData: any = {
    lobbyId,
    hostUid: lobby.hostUid || null,
    roomCode: lobby.roomCode,
    roomType: lobby.roomType,
    betAmount: lobby.betAmount,
    toiTrangRule: lobby.toiTrangRule,
    gameState: 'dealing',
    currentPlayerIndex: firstPlayer,
    roundStarter: firstPlayer,
    firstRound: true,
    consecutivePasses: 0,
    createdAt: Date.now(),
    players: {},
    lastPlay: null,
    playHistory: [],
    instantWin: { detected: false, winnerIndex: null, handType: null, winningHand: null },
    congPlayers: [],
    denBaiPlayers: {},
    thoiPenalties: {},
    chatHeoBonus: [],
    payouts: {},
    winner: null,
  };
  Object.entries(lobby.players).forEach(([idx, p]: any) => {
    gameData.players[idx] = {
      uid: p.uid,
      displayName: p.displayName,
      email: p.email,
      photoURL: p.photoURL,
      position: Number(idx),
      isBot: p.isBot || false,
      difficulty: p.difficulty || null,
      hand: hands[idx],
      handCount: hands[idx].length,
      finishPosition: null,
      finishTime: null,
      passed: false,
      isPlaying: true,
      isConnected: true,
    };
  });
  // Tạo node game
  await set(ref(db, `tienlen/games/${lobbyId}`), gameData);
  // Update lobby
  await update(ref(db, `tienlen/lobbies/${lobbyId}`), { status: 'playing', gameId: lobbyId, startingIn: null });
}