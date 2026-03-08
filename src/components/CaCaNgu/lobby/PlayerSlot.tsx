import React from 'react';
import { CaNguColor } from '../../../types';
import { COLOR_META } from '../../../utils/cacangu/boardConfig';

interface PlayerSlotProps {
  player?: { name: string; avatar?: string; ready: boolean };
  color?: CaNguColor;
  isHost?: boolean;
  isEmpty?: boolean;
  slotNumber: number;
}

export const PlayerSlot: React.FC<PlayerSlotProps> = ({
  player,
  color,
  isHost,
  isEmpty,
  slotNumber,
}) => {
  const meta = color ? COLOR_META[color] : null;

  if (isEmpty || !player) {
    return (
      <div
        className={`rounded-xl p-3 flex flex-col items-center justify-center border-2 border-dashed min-h-[130px] bg-black/20 ${
          meta ? meta.border : 'border-[#5D2A00]'
        }`}
      >
        {meta && (
          <div
            className={`w-4 h-4 rounded-full mb-2 opacity-30 ${meta.bg}`}
          />
        )}
        <div className="text-[#5D2A00] text-[10px] font-bold animate-pulse">
          Đang chờ...
        </div>
        <div className="text-[8px] mt-1" style={{ color: '#3E1A00' }}>
          Slot {slotNumber + 1}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-2 flex flex-col items-center border-2 shadow-lg relative min-h-[130px] justify-center bg-black/40 ${
        meta ? `${meta.border}` : 'border-[#5D2A00]'
      }`}
    >
      <div className="relative mb-1.5">
        <img
          src={player.avatar || '/assets/image/icons/user.png'}
          alt={player.name}
          className={`w-12 h-12 rounded-full border-2 object-cover shadow ${
            meta ? meta.border : 'border-yellow-500'
          }`}
        />
        {isHost && (
          <span
            className="absolute -top-2 -right-2 bg-yellow-500 text-black rounded-full p-0.5 text-[10px] border border-white shadow"
            title="Chủ phòng"
          >
            👑
          </span>
        )}
      </div>

      <div className="font-bold text-white text-[10px] truncate w-full text-center leading-tight">
        {player.name}
      </div>

      {meta && color && (
        <div
          className={`text-[8px] font-bold px-2 py-0.5 rounded-full mt-1 border ${meta.bg} ${meta.text} ${meta.border}`}
        >
          {meta.label}
        </div>
      )}

      <div className="mt-1.5 w-full">
        {player.ready ? (
          <div className="w-full py-0.5 bg-green-700/80 rounded text-white text-[8px] font-bold text-center border border-green-500 uppercase tracking-wide">
            ✓ Sẵn sàng
          </div>
        ) : (
          <div className="w-full py-0.5 bg-gray-700/50 rounded text-gray-400 text-[8px] font-bold text-center border border-gray-600 uppercase tracking-wide animate-pulse">
            Đang chờ...
          </div>
        )}
      </div>
    </div>
  );
};
