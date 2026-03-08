import React from 'react';
import { CaNguLobby } from '../../../types';

interface RoomCardProps {
  lobby: CaNguLobby;
  myUid: string;
  onJoin: () => void;
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `${Math.floor(amount / 1_000_000_000)}B`;
  if (amount >= 1_000_000) return `${Math.floor(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `${Math.floor(amount / 1_000)}K`;
  return amount.toString();
}

const SLOT_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-yellow-400', 'bg-emerald-500'];

export const RoomCard: React.FC<RoomCardProps> = ({ lobby, myUid, onJoin }) => {
  const players = lobby.players || {};
  const playerUids = Object.keys(players).filter(k => players[k] != null);
  const playerCount = playerUids.length;
  const isFull = playerCount >= 4;
  const isAlreadyIn = playerUids.includes(myUid);
  const disabled = isFull && !isAlreadyIn;

  return (
    <div
      onClick={!disabled ? onJoin : undefined}
      className={`
        relative group rounded-xl border transition-all duration-200
        ${disabled
          ? 'border-white/5 bg-black/60 opacity-60 cursor-not-allowed'
          : 'border-white/20 bg-black/80 hover:bg-black/90 hover:border-amber-500/50 hover:-translate-y-0.5 cursor-pointer active:scale-95'
        }
      `}
    >
      {/* Game banner */}
      <div className="h-10 mx-2 mt-2 rounded-lg bg-gradient-to-r from-amber-900/60 to-orange-900/60 border border-amber-500/20 flex items-center justify-center">
        <span className="text-amber-300 font-black text-xs tracking-widest">CỜ CÁ NGỰA</span>
      </div>

      <div className="px-3 py-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-xs">
            #{lobby.roomCode || lobby.id.slice(-5)}
          </span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isFull ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>
            {isFull ? 'Đầy' : 'Trống'}
          </span>
        </div>

        <div className="text-[10px] text-gray-500 truncate">
          Chủ: <span className="text-gray-300">{lobby.hostName}</span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-amber-400 font-bold text-xs">{formatMoney(lobby.betAmount)}đ</span>
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full border border-black/40 ${i < playerCount ? SLOT_COLORS[i] : 'bg-white/10'}`}
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">{playerCount}/4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
