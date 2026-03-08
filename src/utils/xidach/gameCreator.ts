import { getDatabase, ref, set, update } from 'firebase/database';
import { calculateScore, isXiBang, isXiDach } from './gameLogic';

// Shuffle bộ bài 52 lá (Fisher-Yates)
export function shuffleDeck(): string[] {
  const suits = ['S', 'C', 'D', 'H'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: string[] = [];
  for (const v of values) for (const s of suits) deck.push(v + s);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Lấy 1 lá bài từ đầu deck (pop), trả về [card, newDeck]
export function drawCard(deck: string[]): [string, string[]] {
  if (deck.length === 0) throw new Error('Deck is empty!');
  const card = deck[0];
  return [card, deck.slice(1)];
}

// Tạo game mới khi host bắt đầu
export async function createXiDachGame(lobby: any, lobbyId: string) {
  const db = getDatabase();

  // Chỉ lấy players (không phải host/dealer)
  const allPlayers: Record<string, any> = {};
  const playerOrder: string[] = [];

  Object.entries(lobby.players || {}).forEach(([pos, p]: any) => {
    allPlayers[pos] = {
      uid: p.uid,
      displayName: p.displayName,
      photoURL: p.photoURL || '',
      email: p.email || '',
      money: p.money || 0,
      position: Number(pos),
      isBot: p.isBot || false,
      difficulty: p.difficulty || null,
      cards: [],
      score: 0,
      bet: 0,
      status: 'betting', // waiting | betting | playing | stand | busted | quac | xidach | xibang | fiveCards
      result: null,
      deltaM: 0,
      revealedByDealer: false,
    };
    playerOrder.push(String(pos));
  });

  const gameData: any = {
    lobbyId,
    roomCode: lobby.roomCode || '',
    betAmount: lobby.betAmount || 10000,
    hostUid: lobby.hostUid,
    hostName: lobby.hostName || 'Nhà Cái',
    hostPhoto: lobby.hostPhoto || '',
    status: 'betting',
    deck: [], // sẽ được fill khi dealing
    betDeadline: Date.now() + 30000, // 30 giây đặt cược
    dealer: {
      cards: [],
      score: 0,
      status: 'waiting', // waiting | playing | stand | busted | quac | xidach | xibang
    },
    players: allPlayers,
    playerOrder,
    currentTurn: null,
    roundNumber: 1,
    dealerIsBot: lobby.dealerIsBot || false,
    dealerDifficulty: lobby.dealerDifficulty || null,
    createdAt: Date.now(),
  };

  await set(ref(db, `xidach/games/${lobbyId}`), gameData);
  await update(ref(db, `xidach/lobbies/${lobbyId}`), {
    status: 'playing',
    gameId: lobbyId,
    startingIn: null,
  });
}

// Host chia bài sau khi tất cả đã đặt cược
export async function dealInitialCards(gameId: string, gameData: any) {
  const db = getDatabase();
  let deck = shuffleDeck();
  const updates: any = {};
  const playerPositions = gameData.playerOrder || Object.keys(gameData.players || {});

  // Chia mỗi player 2 lá
  const playerCards: Record<string, string[]> = {};
  for (const pos of playerPositions) {
    playerCards[pos] = [];
    for (let i = 0; i < 2; i++) {
      const [card, newDeck] = drawCard(deck);
      deck = newDeck;
      playerCards[pos].push(card);
    }
  }

  // Dealer 2 lá: index 0 = úp, index 1 = ngửa
  const dealerCards: string[] = [];
  for (let i = 0; i < 2; i++) {
    const [card, newDeck] = drawCard(deck);
    deck = newDeck;
    dealerCards.push(card);
  }

  // Tính điểm và xác định status từng player
  const firstPlayerPos = playerPositions[0];
  let firstPlayingPos = firstPlayerPos;
  let allDone = true;

  for (const pos of playerPositions) {
    const cards = playerCards[pos];
    const score = calculateScore(cards);
    let status = 'playing';

    if (isXiDach(cards)) status = 'xidach';
    else if (isXiBang(cards)) status = 'xibang';

    if (status === 'playing') allDone = false;

    updates[`xidach/games/${gameId}/players/${pos}/cards`] = cards;
    updates[`xidach/games/${gameId}/players/${pos}/score`] = score;
    updates[`xidach/games/${gameId}/players/${pos}/status`] = status;
    // Xì Dách / Xì Bàng: tự lật bài luôn, không cần nhà cái lật
    if (status === 'xidach' || status === 'xibang') {
      updates[`xidach/games/${gameId}/players/${pos}/revealedByDealer`] = true;
    }
  }

  // Dealer score (chỉ tính lá ngửa - index 1)
  const dealerVisibleScore = calculateScore([dealerCards[1]]);

  updates[`xidach/games/${gameId}/dealer/cards`] = dealerCards;
  updates[`xidach/games/${gameId}/dealer/score`] = dealerVisibleScore;
  updates[`xidach/games/${gameId}/dealer/status`] = 'playing';
  updates[`xidach/games/${gameId}/deck`] = deck;
  updates[`xidach/games/${gameId}/status`] = allDone ? 'dealerTurn' : 'playing';

  // Tìm player đầu tiên còn 'playing'
  if (!allDone) {
    for (const pos of playerPositions) {
      const cards = playerCards[pos];
      if (!isXiDach(cards) && !isXiBang(cards)) {
        firstPlayingPos = pos;
        break;
      }
    }
    updates[`xidach/games/${gameId}/currentTurn`] = gameData.players[firstPlayingPos]?.uid || null;
  } else {
    updates[`xidach/games/${gameId}/currentTurn`] = 'dealer';
  }

  await update(ref(db), updates);
}

// Dealer rút bài tự động (theo logic: rút đến >= 16)
export async function dealerDrawCard(gameId: string, deck: string[], dealerCards: string[]) {
  const db = getDatabase();
  const [card, newDeck] = drawCard(deck);
  const newCards = [...dealerCards, card];
  const newScore = calculateScore(newCards);

  const updates: any = {
    [`xidach/games/${gameId}/dealer/cards`]: newCards,
    [`xidach/games/${gameId}/dealer/score`]: newScore,
    [`xidach/games/${gameId}/deck`]: newDeck,
  };

  await update(ref(db), updates);
  return { newCards, newScore, newDeck };
}
