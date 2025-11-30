import React from 'react';

interface RoomCardProps {
  room: any;
  onJoin: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => (
  <div className="bg-white/10 rounded-xl p-4 flex flex-col gap-2 border border-yellow-400 shadow-lg">
    <div className="flex justify-between items-center">
      <div>
        <div className="font-bold text-lg text-yellow-300">Mã phòng: {room.roomCode}</div>
        <div className="text-white">Loại: <span className="font-semibold">{room.roomType}</span></div>
        <div className="text-white">Cược: <span className="font-semibold">{room.betAmount.toLocaleString()}đ</span></div>
        <div className="text-white">Người chơi: {room.playerCount}/{room.maxPlayers}</div>
      </div>
      <button className="btn btn-success" onClick={onJoin}>Vào phòng</button>
    </div>
  </div>
);