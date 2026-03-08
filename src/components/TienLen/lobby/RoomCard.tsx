import React from 'react';

interface RoomCardProps {
  room: any;
  onJoin: () => void;
}

function formatMoney(money: number) {
  if (money >= 1_000_000_000) return `${Math.floor(money / 1_000_000_000)}B`;
  if (money >= 1_000_000) return `${Math.floor(money / 1_000_000)}M`;
  if (money >= 1_000) return `${Math.floor(money / 1_000)}K`;
  return money.toString();
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  const playerCount = room.players ? Object.keys(room.players).length : 0;
  const isFull = playerCount >= room.maxPlayers;

  return (
    <div
      onClick={!isFull ? onJoin : undefined}
      className={`
        relative group rounded-xl border transition-all duration-200
        ${isFull
          ? 'border-white/5 bg-black/60 opacity-60 cursor-not-allowed'
          : 'border-white/20 bg-black/80 hover:bg-black/90 hover:border-white/30 hover:-translate-y-0.5 cursor-pointer active:scale-95'
        }
      `}
    >
      {/* Game banner */}
      <div className="h-10 mx-2 mt-2 rounded-lg bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/20 flex items-center justify-center">
        <span className="text-indigo-300 font-black text-xs tracking-widest">TLMN</span>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-xs">#{room.roomCode}</span>
          <span className="text-[10px] text-gray-500 uppercase">{room.roomType}</span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-amber-400 font-bold text-xs">{formatMoney(room.betAmount)}đ</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">{playerCount}/{room.maxPlayers}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-red-400' : 'bg-emerald-400'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};