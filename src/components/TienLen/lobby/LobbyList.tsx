import React, { useState, useMemo } from 'react';
import { RoomCard } from './RoomCard';
import { CreateRoomModal } from './CreateRoomModal';
import { JoinByCodeModal } from './JoinByCodeModal';
import { useTienLenLobby } from '../../../hooks/useTienLenLobby';

interface LobbyListProps {
  user: any;
  onJoinRoom: (lobbyId: string) => void;
  onGoHome?: () => void;
}

const ROOMS_PER_PAGE = 9;

export const LobbyList: React.FC<LobbyListProps> = ({ user, onJoinRoom, onGoHome }) => {
  const { lobbies, loading, joinLobbyByCode } = useTienLenLobby();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(lobbies.length / ROOMS_PER_PAGE));
  const currentRooms = useMemo(() => {
    const start = (currentPage - 1) * ROOMS_PER_PAGE;
    return lobbies.slice(start, start + ROOMS_PER_PAGE);
  }, [lobbies, currentPage]);

  if (currentPage > totalPages && totalPages >= 1) setCurrentPage(totalPages);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: 'url(/assets/image/background/sanh_gamedanhbai.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay — keeps background visible but ensures card readability */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Về
            </button>
          )}
          <div>
            <h1 className="text-sm font-black text-white tracking-wide">Tiến Lên</h1>
            <p className="text-[10px] text-gray-500">Chọn bàn chơi bên dưới</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white border border-white/15 bg-black/80 hover:bg-black/90 transition-all active:scale-95"
          >
            Vào ID
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg transition-all active:scale-95"
          >
            Tạo Bàn
          </button>
        </div>
      </div>

      {/* Room Grid */}
      <div className="relative z-10 flex-grow overflow-y-auto p-4">
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        )}

        {!loading && lobbies.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 border border-dashed border-white/10 rounded-2xl">
            <p className="text-sm text-gray-500">Chưa có bàn chơi nào</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline transition-colors"
            >
              Tạo bàn ngay
            </button>
          </div>
        )}

        {!loading && lobbies.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {currentRooms.map(room => (
              <RoomCard
                key={room.lobbyId}
                room={room}
                onJoin={async () => {
                  try {
                    const lobbyId = await joinLobbyByCode(user, room.roomCode);
                    onJoinRoom(lobbyId);
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="relative z-10 flex items-center justify-center gap-3 py-2 border-t border-white/10 bg-black/90 shrink-0">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-all active:scale-95"
          >
            ← Trước
          </button>
          <span className="text-xs text-gray-400 font-mono">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-all active:scale-95"
          >
            Sau →
          </button>
        </div>
      )}

      {showCreate && (
        <CreateRoomModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={gameId => {
            setShowCreate(false);
            onJoinRoom(gameId);
          }}
        />
      )}
      {showJoin && <JoinByCodeModal user={user} onClose={() => setShowJoin(false)} onJoined={onJoinRoom} />}
    </div>
  );
};