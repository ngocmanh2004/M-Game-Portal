import React from 'react';

interface PlayerSlotProps {
  player: any;
  isHost?: boolean;
  showDeltaMoney?: boolean;
}

function formatMoney(money: number) {
  if (!money && money !== 0) return '0';
  if (money >= 1_000_000_000) return `${Math.floor(money / 1_000_000_000)}B`;
  if (money >= 1_000_000) return `${Math.floor(money / 1_000_000)}M`;
  if (money >= 1_000) return `${Math.floor(money / 1_000)}K`;
  return money.toString();
}

export const PlayerSlot: React.FC<PlayerSlotProps> = ({
  player,
  isHost,
  showDeltaMoney = false,
}) => {
  const deltaM = player?.deltaM || 0;

  return (
    <div className="bg-black/40 rounded-xl p-2.5 flex flex-col items-center border border-white/10 shadow relative">
      {/* Host badge */}
      {isHost && (
        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full border border-black shadow">
          Host
        </span>
      )}

      {/* Avatar */}
      <img
        src={player.photoURL || player.avatar || '/assets/image/icons/user.png'}
        alt={player.displayName}
        className="w-12 h-12 rounded-full border-2 border-white/20 shadow object-cover mb-1.5"
      />

      {/* Name */}
      <div className="font-semibold text-white text-[10px] truncate w-full text-center">
        {player.displayName || 'User'}
      </div>

      {/* Balance */}
      <div className="text-amber-400 font-bold text-[10px] mt-0.5 w-full text-center">
        {formatMoney(player.money ?? player.balance)}đ
      </div>

      {/* Delta money */}
      {showDeltaMoney && deltaM !== 0 && (
        <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${deltaM > 0
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
            : 'bg-red-500/20 text-red-300 border border-red-500/20'
          }`}>
          {deltaM > 0 ? '+' : ''}{formatMoney(Math.abs(deltaM))}
        </div>
      )}

      {/* Ready status */}
      <div className="mt-1.5 w-full">
        {player.ready ? (
          <div className="w-full py-0.5 bg-emerald-600/80 rounded-lg text-white text-[8px] font-bold text-center uppercase">
            Sẵn sàng
          </div>
        ) : (
          <div className="w-full py-0.5 bg-white/5 rounded-lg text-gray-500 text-[8px] font-bold text-center uppercase">
            Chờ
          </div>
        )}
      </div>
    </div>
  );
};