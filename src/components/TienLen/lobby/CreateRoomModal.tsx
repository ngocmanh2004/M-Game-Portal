import React, { useState } from 'react';
import { useTienLenLobby } from '../../../hooks/useTienLenLobby';

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
  const { createLobby } = useTienLenLobby();

  const betAmountMap: Record<string, number> = {
    tap_su: 10000,
    thuong: 50000,
    pho_thong: 200000,
    dai_gia: 500000,
    ty_phu: 1000000,
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const lobbyId = await createLobby(
        user,
        roomType,
        betAmountMap[roomType],
        maxPlayers,
        toiTrangRule
      );
      onCreated(lobbyId);
    } catch (err) {
      alert('Tạo phòng thất bại!');
    }
    setLoading(false);
    onClose();
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