import React from 'react';

interface PlayerSlotProps {
  player: any;
  isHost?: boolean;
}

export const PlayerSlot: React.FC<PlayerSlotProps> = ({ player, isHost }) => (
  <div className="bg-white/10 rounded-xl p-2 flex flex-col items-center border-2 border-yellow-400 shadow min-w-[90px] max-w-[120px] mx-1">
    <div className="relative mb-1">
      <img
        src={player.photoURL || player.avatar || '/assets/image/icons/user.png'}
        alt={player.displayName || player.email}
        className="w-10 h-10 rounded-full border-2 border-yellow-300 shadow object-cover"
      />
      {isHost && (
        <span className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full px-1 py-0.5 text-xs font-bold shadow" title="Chủ phòng">👑</span>
      )}
    </div>
    <div className="font-bold text-white text-xs truncate max-w-[80px]">{player.displayName || player.email}</div>
    <div className="text-green-300 font-mono text-xs">{player.balance?.toLocaleString()}đ</div>
    <div className="mt-1">
      {player.ready ? (
        <span className="px-2 py-0.5 bg-green-600 rounded-full text-white text-[10px] font-semibold shadow">✓ Sẵn sàng</span>
      ) : (
        <span className="px-2 py-0.5 bg-gray-500 rounded-full text-white text-[10px] font-semibold shadow">Chờ...</span>
      )}
    </div>
  </div>
);