import React, { useState } from 'react';
import { RoomCard } from './RoomCard';
import { CreateRoomModal } from './CreateRoomModal';
import { JoinByCodeModal } from './JoinByCodeModal';
import { useTienLenLobby } from '../../../hooks/useTienLenLobby';

interface LobbyListProps {
  user: any;
  onJoinRoom: (lobbyId: string) => void;
}

export const LobbyList: React.FC<LobbyListProps> = ({ user, onJoinRoom }) => {
  const { lobbies, loading, joinLobbyByCode } = useTienLenLobby();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div className="w-full max-w-3xl mx-auto py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Danh sách phòng Tiến Lên</h2>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Tạo Phòng
          </button>
          <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>
            Vào Phòng
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && <div className="col-span-2 text-center text-gray-300">Đang tải phòng...</div>}
        {!loading && lobbies.length === 0 && (
          <div className="col-span-2 text-center text-gray-300">Chưa có phòng nào, hãy tạo phòng mới!</div>
        )}
        {lobbies.map((room) => (
          <RoomCard
            key={room.lobbyId}
            room={room}
            onJoin={async () => {
              try {
                // Lấy mã phòng từ room
                const code = room.roomCode;
                const lobbyId = await joinLobbyByCode(user, code);
                onJoinRoom(lobbyId);
              } catch (err: any) {
                alert(err.message || 'Lỗi vào phòng!');
              }
            }}
          />
        ))}
      </div>
      {showCreate && (
        <CreateRoomModal user={user} onClose={() => setShowCreate(false)} onCreated={onJoinRoom} />
      )}
      {showJoin && (
        <JoinByCodeModal user={user} onClose={() => setShowJoin(false)} onJoined={onJoinRoom} />
      )}
    </div>
  );
};