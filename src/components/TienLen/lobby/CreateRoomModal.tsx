import React, { useState } from 'react';
import { getDatabase, ref, push, set } from 'firebase/database';
import { useTienLenLobby } from '../../../hooks/useTienLenLobby';
import { createTienLenGame } from '../../../utils/tienlen/gameCreator';

interface CreateRoomModalProps {
  user: any;
  onClose: () => void;
  onCreated: (lobbyId: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ user, onClose, onCreated }) => {
  const [roomType, setRoomType] = useState('tap_su');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [toiTrangRule, setToiTrangRule] = useState('count_heo');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'multiplayer' | 'solo'>('multiplayer');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const { createLobby } = useTienLenLobby();

  const betAmountMap: Record<string, number> = {
    tap_su: 10000,
    thuong: 50000,
    pho_thong: 200000,
    dai_gia: 500000,
    ty_phu: 1000000,
  };
  const botBetMap: Record<'easy' | 'medium' | 'hard', number> = {
    easy: 50000,
    medium: 200000,
    hard: 1000000,
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      if (mode === 'solo') {
        const db = getDatabase();
        let lobbyRef, lobbyId;
        try {
          lobbyRef = push(ref(db, 'tienlen/lobbies'));
          lobbyId = lobbyRef.key!;
        } catch (e) {
          console.error('Lỗi khi push lobby:', e);
          alert('Không thể tạo lobby!');
          setLoading(false);
          return;
        }

        const BOT_NAMES = ['Máy 1', 'Máy 2', 'Máy 3'];
        const players: any = {
          0: {
            uid: user.uid,
            displayName: user.username,
            photoURL: user.avatar || '',
            email: user.email || '', // BẮT BUỘC PHẢI CÓ
            money: user.balance,
            ready: true,
            isBot: false,
            position: 0,
            joinedAt: Date.now(),
          }
        };
        for (let i = 1; i < 4; i++) {
          players[i] = {
            uid: `bot_${i}`,
            displayName: BOT_NAMES[i - 1],
            email: `bot${i}@tienlen.ai`,
            photoURL: '/assets/image/icons/bot.png',
            isBot: true,
            difficulty: botDifficulty,
            ready: true,
            position: i,
            money: 99999999,
            joinedAt: Date.now(),
          };
        }
        const betAmount = botBetMap[botDifficulty];
        const roomCode = Math.floor(10000 + Math.random() * 90000).toString();
        const lobbyData = {
          roomCode,
          roomType: 'solo',
          betAmount,
          maxPlayers: 4,
          toiTrangRule,
          players,
          hostUid: user.uid,
          status: 'playing',
          createdAt: Date.now(),
        };

        try {
          await set(lobbyRef, lobbyData);
        } catch (e) {
          console.error('Lỗi khi set lobby:', e, lobbyData);
          alert('Không thể lưu lobby!');
          setLoading(false);
          return;
        }

        // Log để debug
        console.log('lobbyData', lobbyData, 'lobbyId', lobbyId);

        // Tạo game luôn
        try {
          await createTienLenGame(lobbyData, lobbyId);
        } catch (e) {
          console.error('Lỗi khi tạo game:', e, lobbyData, lobbyId);
          alert('Tạo game thất bại: ' + (e as Error).message);
          setLoading(false);
          return;
        }

        setLoading(false);
        onClose();
        onCreated(lobbyId);
        return;
      }
      // Multiplayer: dùng logic cũ
      let lobbyId;
      try {
        lobbyId = await createLobby(
          user,
          roomType,
          betAmountMap[roomType],
          maxPlayers,
          toiTrangRule
        );
      } catch (e) {
        console.error('Lỗi khi tạo lobby multiplayer:', e);
        alert('Tạo phòng thất bại!');
        setLoading(false);
        onClose();
        return;
      }
      setLoading(false);
      onClose();
      onCreated(lobbyId);
    } catch (err) {
      console.error('Lỗi không xác định khi tạo phòng:', err);
      setLoading(false);
      alert('Tạo phòng thất bại!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg relative">
        <button className="absolute top-2 right-2 text-red-500 text-xl" onClick={onClose}>✖</button>
        <h2 className="text-xl font-bold mb-4">Tạo Phòng Mới</h2>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Loại phòng</label>
          <select className="w-full p-2 rounded" value={roomType} onChange={e => setRoomType(e.target.value)}>
            <option value="tap_su">Tập Sự (10,000đ)</option>
            <option value="thuong">Thường (50,000đ)</option>
            <option value="pho_thong">Phổ Thông (200,000đ)</option>
            <option value="dai_gia">Đại Gia (500,000đ)</option>
            <option value="ty_phu">Tỷ Phú (1,000,000đ)</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Số người chơi</label>
          <select className="w-full p-2 rounded" value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))}>
            <option value={2}>2 người</option>
            <option value={3}>3 người</option>
            <option value={4}>4 người</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Tới trắng</label>
          <select className="w-full p-2 rounded" value={toiTrangRule} onChange={e => setToiTrangRule(e.target.value)}>
            <option value="count_heo">Đếm heo (tính thối)</option>
            <option value="no_heo">Không đếm heo</option>
          </select>
        </div>
        <div className="flex gap-2 mb-2">
          <button
            className={`px-3 py-1 rounded-full font-bold text-xs ${mode === 'multiplayer' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setMode('multiplayer')}
          >
            👥 Nhiều người chơi
          </button>
          <button
            className={`px-3 py-1 rounded-full font-bold text-xs ${mode === 'solo' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setMode('solo')}
          >
            🤖 Chơi với máy
          </button>
        </div>
        {mode === 'solo' && (
          <div className="mb-2">
            <label className="text-xs font-semibold mr-2">Độ khó máy:</label>
            <select
              className="rounded border px-2 py-1 text-xs"
              value={botDifficulty}
              onChange={e => setBotDifficulty(e.target.value as any)}
            >
              <option value="easy">🟢 Dễ</option>
              <option value="medium">🟡 Trung Bình</option>
              <option value="hard">🔴 Khó</option>
            </select>
          </div>
        )}
        <button
          className="btn btn-primary w-full mt-2"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Đang tạo...' : 'Tạo phòng'}
        </button>
      </div>
    </div>
  );
};