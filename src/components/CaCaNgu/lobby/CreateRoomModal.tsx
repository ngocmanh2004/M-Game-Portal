import React, { useState } from 'react';
import { BET_LEVELS } from '../../../utils/cacangu/boardConfig';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (betAmount: number) => void;
}

function formatBet(amount: number): string {
  if (amount >= 1_000_000) return `${Math.floor(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `${Math.floor(amount / 1_000)}K`;
  return amount.toString();
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, onCreate }) => {
  const [selected, setSelected] = useState<number>(BET_LEVELS[0]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-6 border-2 shadow-2xl relative"
        style={{ background: '#1a0a00', borderColor: '#8B6914' }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-lg font-bold active:scale-95 transition-all"
          style={{ color: '#FFD54F' }}
        >
          ✕
        </button>

        <h2
          className="text-base font-bold uppercase tracking-wide text-center mb-5"
          style={{ color: '#FFD700' }}
        >
          Tạo Phòng Mới
        </h2>

        <div className="mb-5">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#A1887F' }}>
            Chọn mức cược
          </label>
          <div className="grid grid-cols-3 gap-2">
            {BET_LEVELS.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelected(amount)}
                className={`py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                  selected === amount
                    ? 'border-yellow-400 text-[#1a0a00] shadow-[0_0_14px_rgba(255,215,0,0.45)]'
                    : 'border-[#5D2A00] text-[#D7CCC8] hover:border-[#8B6914]'
                }`}
                style={
                  selected === amount
                    ? { background: '#FFD700' }
                    : { background: '#2C1008' }
                }
              >
                {formatBet(amount)}
              </button>
            ))}
          </div>
          <div className="mt-2.5 text-center text-[10px]" style={{ color: '#A1887F' }}>
            Mức cược:{' '}
            <span className="font-bold" style={{ color: '#FFD700' }}>
              {selected.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm border active:scale-95 transition-all"
            style={{ background: '#2C1008', color: '#A1887F', borderColor: '#5D2A00' }}
          >
            Hủy
          </button>
          <button
            onClick={() => onCreate(selected)}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm border-b-4 active:scale-95 transition-all"
            style={{
              background: 'linear-gradient(to right, #8B6914, #c9980a)',
              color: '#1a0a00',
              borderColor: '#6B4F10',
            }}
          >
            Tạo Phòng
          </button>
        </div>
      </div>
    </div>
  );
};
