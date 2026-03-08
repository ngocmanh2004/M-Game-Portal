import React, { useState } from 'react';
import { getDatabase, ref, push, set } from 'firebase/database';
import { useXiDachLobby } from '../../../hooks/useXiDachLobby';
import { createXiDachGame } from '../../../utils/xidach/gameCreator';

interface CreateRoomModalProps {
  user: any;
  onClose: () => void;
  onCreated: (lobbyId: string) => void;
}

const betAmountMap: Record<string, number> = {
  tap_su: 10000,
  thuong: 50000,
  pho_thong: 200000,
  dai_gia: 500000,
  ty_phu: 1000000,
};

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ user, onClose, onCreated }) => {
  const [roomType, setRoomType] = useState('tap_su');
  const [maxPlayers, setMaxPlayers] = useState(3);
  const [mode, setMode] = useState<'multiplayer' | 'solo'>('multiplayer');
  const [myRole, setMyRole] = useState<'host' | 'player'>('host');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [loading, setLoading] = useState(false);
  const { createLobby } = useXiDachLobby();

  const handleCreate = async () => {
    setLoading(true);
    try {
      if (mode === 'solo') {
        // Tạo game solo vs bot
        const db = getDatabase();
        const lobbyRef = push(ref(db, 'xidach/lobbies'));
        const lobbyId = lobbyRef.key!;
        const betAmount = betAmountMap[roomType];
        const roomCode = Math.floor(10000 + Math.random() * 90000).toString();

        const BOT_NAMES = ['Máy 1', 'Máy 2', 'Máy 3', 'Máy 4', 'Máy 5'];
        const players: any = {};

        if (myRole === 'player') {
          // Human is nhà con (player slot 0), bots fill remaining slots
          players[0] = {
            uid: user.uid,
            displayName: user.username,
            email: user.email || '',
            photoURL: user.avatar || '',
            isBot: false,
            ready: true,
            position: 0,
            money: user.balance || 0,
            joinedAt: Date.now(),
          };
          for (let i = 1; i < maxPlayers; i++) {
            players[i] = {
              uid: `bot_${i}`,
              displayName: BOT_NAMES[i - 1],
              email: `bot${i}@xidach.ai`,
              photoURL: '/assets/image/icons/bot.png',
              isBot: true,
              difficulty: botDifficulty,
              ready: true,
              position: i,
              money: 99999999,
              joinedAt: Date.now(),
            };
          }
        } else {
          // Human is nhà cái (host/dealer), all players are bots
          for (let i = 0; i < maxPlayers; i++) {
            players[i] = {
              uid: `bot_${i + 1}`,
              displayName: BOT_NAMES[i],
              email: `bot${i + 1}@xidach.ai`,
              photoURL: '/assets/image/icons/bot.png',
              isBot: true,
              difficulty: botDifficulty,
              ready: true,
              position: i,
              money: 99999999,
              joinedAt: Date.now(),
            };
          }
        }

        const lobbyData: any = {
          roomCode,
          hostUid: user.uid,
          hostName: myRole === 'player' ? 'Nhà Cái Bot' : user.username,
          hostPhoto: myRole === 'player' ? '/assets/image/icons/bot.png' : (user.avatar || ''),
          roomType,
          betAmount,
          maxPlayers,
          players,
          status: 'playing',
          soloMode: true,
          dealerIsBot: myRole === 'player',
          dealerDifficulty: myRole === 'player' ? botDifficulty : null,
          createdAt: Date.now(),
        };

        await set(lobbyRef, lobbyData);
        await createXiDachGame(lobbyData, lobbyId);

        if (myRole === 'player') {
          window.localStorage.setItem('xidach_position', '0');
        }

        setLoading(false);
        onClose();
        onCreated(lobbyId);
        return;
      }

      // Multiplayer
      const lobbyId = await createLobby(user, roomType, betAmountMap[roomType], maxPlayers);
      setLoading(false);
      onClose();
      onCreated(lobbyId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Tạo phòng thất bại!');
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#3E2723] border-2 border-[#8D6E63] rounded-xl p-5 w-full max-w-sm shadow-2xl relative text-white">
        <button className="absolute top-2 right-2 text-[#FFD54F] text-lg font-bold" onClick={onClose}>✕</button>
        <h2 className="text-base font-bold text-[#FFD54F] mb-4 uppercase tracking-wide text-center">Tạo Bàn Xì Dách</h2>

        {/* Room type */}
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1 text-[#D7CCC8]">Mức cược</label>
          <select
            className="w-full p-2 rounded bg-[#2C1810] border border-[#5D4037] text-[#FFD54F] text-xs"
            value={roomType}
            onChange={e => setRoomType(e.target.value)}
          >
            <option value="tap_su">Tập Sự (10,000đ)</option>
            <option value="thuong">Thường (50,000đ)</option>
            <option value="pho_thong">Phổ Thông (200,000đ)</option>
            <option value="dai_gia">Đại Gia (500,000đ)</option>
            <option value="ty_phu">Tỷ Phú (1,000,000đ)</option>
          </select>
        </div>

        {/* Max players */}
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1 text-[#D7CCC8]">Số người chơi (không kể nhà cái)</label>
          <select
            className="w-full p-2 rounded bg-[#2C1810] border border-[#5D4037] text-[#FFD54F] text-xs"
            value={maxPlayers}
            onChange={e => setMaxPlayers(Number(e.target.value))}
          >
            <option value={1}>1 người</option>
            <option value={2}>2 người</option>
            <option value={3}>3 người</option>
            <option value={4}>4 người</option>
            <option value={5}>5 người</option>
          </select>
        </div>

        {/* Mode */}
        <div className="flex gap-2 mb-3">
          <button
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${mode === 'multiplayer' ? 'bg-green-600 border-green-400 text-white' : 'bg-[#2C1810] border-[#5D4037] text-[#A1887F]'}`}
            onClick={() => setMode('multiplayer')}
          >
            👥 Nhiều người
          </button>
          <button
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${mode === 'solo' ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-[#2C1810] border-[#5D4037] text-[#A1887F]'}`}
            onClick={() => setMode('solo')}
          >
            🤖 Chơi với máy
          </button>
        </div>

        {/* Bot difficulty */}
        {mode === 'solo' && (
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1 text-[#D7CCC8]">Độ khó</label>
            <select
              className="w-full p-2 rounded bg-[#2C1810] border border-[#5D4037] text-[#FFD54F] text-xs"
              value={botDifficulty}
              onChange={e => setBotDifficulty(e.target.value as any)}
            >
              <option value="easy">🟢 Dễ</option>
              <option value="medium">🟡 Trung Bình</option>
              <option value="hard">🔴 Khó</option>
            </select>
          </div>
        )}

        {/* Role selector — only in solo mode */}
        {mode === 'solo' && (
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1 text-[#D7CCC8]">Vai trò của bạn</label>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${myRole === 'host' ? 'bg-red-700 border-red-500 text-white' : 'bg-[#2C1810] border-[#5D4037] text-[#A1887F]'}`}
                onClick={() => setMyRole('host')}
              >
                🎩 Nhà Cái
              </button>
              <button
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${myRole === 'player' ? 'bg-blue-700 border-blue-500 text-white' : 'bg-[#2C1810] border-[#5D4037] text-[#A1887F]'}`}
                onClick={() => setMyRole('player')}
              >
                🃏 Nhà Con
              </button>
            </div>
            {myRole === 'player' && (
              <div className="mt-1 text-[9px] text-[#A1887F] text-center">
                Nhà cái sẽ do máy điều khiển
              </div>
            )}
          </div>
        )}

        <button
          className="w-full py-2 rounded-lg bg-gradient-to-r from-red-700 to-red-500 text-white font-bold text-sm border-b-4 border-red-900 active:scale-95 transition-all mt-1 disabled:opacity-50"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Đang tạo...' : 'Tạo Bàn'}
        </button>
      </div>
    </div>
  );
};
