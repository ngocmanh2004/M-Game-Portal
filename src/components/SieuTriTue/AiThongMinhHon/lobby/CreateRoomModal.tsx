import React, { useState } from 'react';
import { useAiThongMinhHonLobby } from '../../../../hooks/useAiThongMinhHonLobby';

const BET_OPTIONS = [
  { label: '500K', value: 500_000 },
  { label: '1M', value: 1_000_000 },
  { label: '5M', value: 5_000_000 },
  { label: '10M', value: 10_000_000 },
  { label: '20M', value: 20_000_000 },
  { label: '50M', value: 50_000_000 },
  { label: '100M', value: 100_000_000 },
  { label: '500M', value: 500_000_000 },
  { label: '1B', value: 1_000_000_000 },
];

interface Props {
  user: any;
  onClose: () => void;
  onCreated: (roomId: string) => void;
}

export const CreateRoomModal: React.FC<Props> = ({ user, onClose, onCreated }) => {
  const { createLobby } = useAiThongMinhHonLobby();
  const [selectedBet, setSelectedBet] = useState(1_000_000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const roomId = await createLobby(user, selectedBet);
      onCreated(roomId);
    } catch (e: any) {
      setError(e.message || 'Không thể tạo phòng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#1e293b] border border-[#3b82f6]/30 p-6 flex flex-col gap-5 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Tạo Phòng Quiz</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
            Chọn mức cược
          </p>
          <div className="grid grid-cols-3 gap-2">
            {BET_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelectedBet(opt.value)}
                className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  selectedBet === opt.value
                    ? 'bg-blue-600 border-2 border-blue-400 text-white shadow-[0_0_16px_rgba(59,130,246,0.55)]'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-700/30 rounded-xl py-2 px-3">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-semibold text-sm transition-all active:scale-95"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang tạo...
              </>
            ) : (
              'Tạo Phòng'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
