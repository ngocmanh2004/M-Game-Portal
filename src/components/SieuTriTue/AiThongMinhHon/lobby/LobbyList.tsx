import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useAiThongMinhHonLobby } from '../../../../hooks/useAiThongMinhHonLobby';
import { CreateRoomModal } from './CreateRoomModal';

const formatMoney = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
};

const ROOMS_PER_PAGE = 6;

interface Props {
  user: any;
  onJoinRoom: (roomId: string) => void;
  onGoHome?: () => void;
}

/* ─── Join-by-code modal ─── */
const JoinByCodeModal: React.FC<{
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}> = ({ onClose, onJoin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    try {
      await onJoin(code.trim().toUpperCase());
      onClose();
    } catch (e: any) {
      setError(e.message || 'Mã phòng không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-white">Vào Bằng Mã Phòng</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-500 text-sm mb-4">Nhập mã phòng do chủ phòng chia sẻ.</p>

          <input
            ref={inputRef}
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="VD: ABC123"
            maxLength={10}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/60 text-white text-lg font-mono tracking-[0.3em] text-center placeholder-gray-600 outline-none transition-all mb-2"
          />

          {error && (
            <p className="text-red-400 text-xs text-center mb-3">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang vào...
              </span>
            ) : 'Vào Phòng'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main LobbyList ─── */
export const LobbyList: React.FC<Props> = ({ user, onJoinRoom, onGoHome }) => {
  const { lobbies, loading, joinLobbyByCode } = useAiThongMinhHonLobby();
  const [showCreate, setShowCreate] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState('');
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(lobbies.length / ROOMS_PER_PAGE));
  const visibleLobbies = useMemo(
    () => lobbies.slice(page * ROOMS_PER_PAGE, (page + 1) * ROOMS_PER_PAGE),
    [lobbies, page]
  );

  if (page >= totalPages && page > 0) setPage(totalPages - 1);

  const handleJoinByCode = async (code: string) => {
    const roomId = await joinLobbyByCode(user, code);
    onJoinRoom(roomId);
  };

  const handleJoinRoom = async (lobby: any) => {
    if (lobby.hostUid === user.uid || lobby.players?.[user.uid]) {
      onJoinRoom(lobby.lobbyId);
      return;
    }
    setJoiningId(lobby.lobbyId);
    setJoinError('');
    try {
      const roomId = await joinLobbyByCode(user, lobby.roomCode);
      onJoinRoom(roomId);
    } catch (e: any) {
      setJoinError(e.message || 'Không thể vào phòng');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: 'url(/assets/image/background/sanh_gamesieutritue.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/80 backdrop-blur-sm shrink-0">
        <button
          onClick={onGoHome}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-all active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Về Nhà</span>
        </button>

        <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
          Ai Thông Minh Hơn?
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCodeModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-xs font-bold transition-all active:scale-95"
          >
            <span className="hidden sm:inline">Vào Bằng </span>Mã
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
          >
            + Tạo Phòng
          </button>
        </div>
      </div>

      {/* ── Room list error ── */}
      {joinError && (
        <div className="relative z-10 mx-4 mt-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {joinError}
        </div>
      )}

      {/* ── Room grid ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-3">
            <div className="w-8 h-8 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Đang tải phòng...</span>
          </div>
        ) : visibleLobbies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-gray-400 font-bold text-base">Chưa có phòng nào</p>
            <p className="text-gray-600 text-sm text-center max-w-xs">
              Tạo phòng để bắt đầu cuộc thi trí tuệ!
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-sm transition-all active:scale-95 shadow-lg"
            >
              Tạo Phòng Ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {visibleLobbies.map(lobby => {
              const guestCount = Object.values(lobby.players || {}).filter(Boolean).length;
              const totalCount = guestCount + 1;
              const isMine = lobby.hostUid === user.uid;
              const isJoining = joiningId === lobby.lobbyId;

              return (
                <div
                  key={lobby.lobbyId}
                  className="group flex flex-col gap-3 p-4 rounded-2xl border border-white/10 bg-black/75 hover:bg-black/85 hover:border-white/20 transition-all duration-200"
                >
                  {/* Top row: host + code */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-sm truncate max-w-[120px]">
                          {lobby.hostName}
                        </span>
                        {isMine && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                            Bạn
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-600/20 text-indigo-300 text-xs font-mono border border-indigo-500/20 tracking-widest self-start">
                        #{lobby.roomCode}
                      </span>
                    </div>
                    {/* Player count badge */}
                    <div className="flex items-center gap-1 shrink-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                      <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span className="text-xs text-gray-300 font-medium">{totalCount}<span className="text-gray-600">/15</span></span>
                    </div>
                  </div>

                  {/* Bet amount */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Cược</span>
                      <span className="text-amber-400 font-bold text-sm">{formatMoney(lobby.betAmount)}đ</span>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(lobby)}
                      disabled={isJoining}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow transition-all active:scale-95 disabled:opacity-50 group-hover:shadow-indigo-900/40 group-hover:shadow-lg"
                    >
                      {isJoining ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                          ...
                        </span>
                      ) : isMine ? 'Vào Phòng' : 'Tham Gia'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="relative z-10 flex items-center justify-center gap-2 py-3 border-t border-white/10 bg-black/80 shrink-0">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 text-white text-sm transition-all"
          >
            ←
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${page === i
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-900/40'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400'
                }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 text-white text-sm transition-all"
          >
            →
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {showCodeModal && (
        <JoinByCodeModal
          onClose={() => setShowCodeModal(false)}
          onJoin={handleJoinByCode}
        />
      )}

      {showCreate && (
        <CreateRoomModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={roomId => {
            setShowCreate(false);
            onJoinRoom(roomId);
          }}
        />
      )}
    </div>
  );
};
