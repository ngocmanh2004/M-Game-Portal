import React, { useState, useMemo } from 'react';
import { RoomCard } from './RoomCard';
import { CreateRoomModal } from './CreateRoomModal';
import { useCaCaNguLobby } from '../../../hooks/useCaCaNguLobby';
import { CaNguLobby } from '../../../types';

interface LobbyListProps {
  user: { uid: string; username: string; email: string; balance: number; avatar?: string; background?: string };
  onJoinRoom: (lobbyId: string) => void;
  onGoHome?: () => void;
}

const ROOMS_PER_PAGE = 9;

function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `${Math.floor(amount / 1_000_000_000)}B`;
  if (amount >= 1_000_000) return `${Math.floor(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `${Math.floor(amount / 1_000)}K`;
  return amount.toString();
}

export const LobbyList: React.FC<LobbyListProps> = ({ user, onJoinRoom, onGoHome }) => {
  const { lobbies, loading, createRoom, joinRoom } = useCaCaNguLobby(user.uid);
  const [showCreate, setShowCreate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(lobbies.length / ROOMS_PER_PAGE));
  const currentRooms = useMemo(() => {
    const start = (currentPage - 1) * ROOMS_PER_PAGE;
    return lobbies.slice(start, start + ROOMS_PER_PAGE);
  }, [lobbies, currentPage]);

  if (currentPage > totalPages && totalPages >= 1) setCurrentPage(totalPages);

  const handleCreate = async (betAmount: number) => {
    setActionLoading(true);
    try {
      const lobbyId = await createRoom({ betAmount, hostName: user.username, hostAvatar: user.avatar });
      setShowCreate(false);
      onJoinRoom(lobbyId);
    } catch (err: any) {
      alert(err.message || 'Tạo phòng thất bại!');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (lobby: CaNguLobby) => {
    setActionLoading(true);
    try {
      await joinRoom(lobby.id, user.uid, user.username, user.avatar);
      onJoinRoom(lobby.id);
    } catch (err: any) {
      alert(err.message || 'Không thể vào phòng!');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: 'url(/assets/image/background/sanh_gamecocangua.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/75" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-black/70 hover:bg-black/80 border border-white/10 px-3 py-1.5 rounded-lg transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Về
            </button>
          )}
          <div>
            <h1 className="text-sm font-black text-white tracking-wide">Cờ Cá Ngựa</h1>
            <p className="text-[10px] text-gray-500">
              Số dư: <span className="text-amber-400 font-bold">{formatMoney(user.balance)}đ</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          disabled={actionLoading}
          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          Tạo Phòng
        </button>
      </div>

      {/* Grid */}
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
            <p className="text-sm text-gray-500">Chưa có phòng nào</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline transition-colors"
            >
              Tạo phòng ngay
            </button>
          </div>
        )}

        {!loading && lobbies.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {currentRooms.map(room => (
              <RoomCard
                key={room.id}
                lobby={room as CaNguLobby}
                myUid={user.uid}
                onJoin={() => handleJoin(room as CaNguLobby)}
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
            className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-all"
          >
            ← Trước
          </button>
          <span className="text-xs text-gray-400 font-mono">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-all"
          >
            Sau →
          </button>
        </div>
      )}

      {showCreate && (
        <CreateRoomModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
};
