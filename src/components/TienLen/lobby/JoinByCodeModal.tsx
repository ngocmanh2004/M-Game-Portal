import React, { useState } from 'react';
import { useTienLenLobby } from '../../../hooks/useTienLenLobby';

interface JoinByCodeModalProps {
  user: any;
  onClose: () => void;
  onJoined: (lobbyId: string) => void;
}

export const JoinByCodeModal: React.FC<JoinByCodeModalProps> = ({ user, onClose, onJoined }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { joinLobbyByCode } = useTienLenLobby();

  const handleJoin = async () => {
    setLoading(true);
    try {
      await joinLobbyByCode(user, code);
      // ...chuyển view...
    } catch (err: any) {
      alert(err.message || 'Lỗi vào phòng!');
    }
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg relative">
        <button className="absolute top-2 right-2 text-red-500 text-xl" onClick={onClose}>✖</button>
        <h2 className="text-xl font-bold mb-4">Vào Phòng Bằng Mã</h2>
        <input
          className="w-full p-2 rounded border mb-4"
          placeholder="Nhập mã phòng (5 số)"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
          maxLength={5}
        />
        <button
          className="btn btn-primary w-full"
          onClick={handleJoin}
          disabled={loading || code.length !== 5}
        >
          {loading ? 'Đang vào...' : 'Vào phòng'}
        </button>
      </div>
    </div>
  );
};