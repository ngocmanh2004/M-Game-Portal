import { getDatabase, ref, push, set } from 'firebase/database';
import { CaNguLobby, CaNguGameState, CaNguColor } from '../../types';
import { COLORS } from './boardConfig';

export async function createCaNguGame(lobby: CaNguLobby): Promise<string> {
  const db = getDatabase();

  const playerUids = Object.keys(lobby.players || {});
  const playerOrder: string[] = playerUids;

  const players: CaNguGameState['players'] = {};
  const pieces: CaNguGameState['pieces'] = {};
  const balances: CaNguGameState['balances'] = {};

  playerUids.forEach((uid, index) => {
    const player = lobby.players[uid];
    const color: CaNguColor = COLORS[index];

    players[uid] = {
      uid,
      name: player.name,
      avatar: player.avatar || '',
      color,
      balance: (player as any).balance ?? 0,
    };

    pieces[uid] = [
      { id: 0, pos: { type: 'home' } },
      { id: 1, pos: { type: 'home' } },
      { id: 2, pos: { type: 'home' } },
      { id: 3, pos: { type: 'home' } },
    ];

    balances[uid] = 0;
  });

  const gameState: CaNguGameState = {
    status: 'rolling',
    playerOrder,
    players,
    balances,
    pieces,
    currentTurnUid: playerOrder[0],
    dice: null,
    extraTurn: false,
    winner: null,
    betAmount: lobby.betAmount,
    transactions: [],
    pendingMoves: null,
    highlightPieceId: null,
    lastAction: null,
  };

  const gamesRef = ref(db, 'cacangu/games');
  const newGameRef = push(gamesRef);
  const gameId = newGameRef.key!;
  await set(newGameRef, gameState);
  return gameId;
}
