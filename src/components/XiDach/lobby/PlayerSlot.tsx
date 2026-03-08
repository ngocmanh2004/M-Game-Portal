import React from 'react';
import { formatMoney } from '../../../utils/xidach/gameLogic';

interface PlayerSlotProps {
  player: any;
  isDealer?: boolean;
  showDeltaMoney?: boolean;
}

export const PlayerSlot: React.FC<PlayerSlotProps> = ({ player, isDealer, showDeltaMoney }) => {
  const deltaM = player?.deltaM || 0;

  return (
    <div className="bg-black/40 rounded-lg p-2 flex flex-col items-center border border-yellow-500/30 shadow-lg relative min-w-[90px]">
      <div className="relative mb-1">
        <img
          src={player.photoURL || player.avatar || '/assets/image/icons/user.png'}
          alt={player.displayName}
          className="w-12 h-12 rounded-full border-2 border-yellow-500 shadow object-cover"
        />
        {isDealer && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-1 py-0.5 text-[8px] font-bold border border-white shadow">
            NHÀ CÁI
          </span>
        )}
      </div>
      <div className="font-bold text-white text-[10px] truncate w-full text-center">
        {player.displayName || 'User'}
      </div>
      <div className="text-yellow-400 font-mono text-[10px] bg-black/50 px-2 rounded-full mt-1 border border-yellow-500/20 w-full text-center">
        {formatMoney(player.money ?? player.balance ?? 0)}
      </div>
      {showDeltaMoney && deltaM !== 0 && (
        <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${deltaM > 0 ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400' : 'bg-red-500/30 text-red-300 border border-red-400'}`}>
          {deltaM > 0 ? '+' : ''}{formatMoney(Math.abs(deltaM))}
        </div>
      )}
      <div className="mt-1.5 w-full">
        {player.ready ? (
          <div className="w-full py-0.5 bg-green-600/80 rounded text-white text-[8px] font-bold text-center border border-green-500 uppercase">Sẵn sàng</div>
        ) : (
          <div className="w-full py-0.5 bg-gray-600/50 rounded text-gray-400 text-[8px] font-bold text-center border border-gray-500 uppercase">Đang chờ</div>
        )}
      </div>
    </div>
  );
};
