import React, { useEffect, useRef, useState } from 'react';
import { useAiThongMinhHonGame } from '../../../../hooks/useAiThongMinhHonGame';
import { getDatabase, ref, onValue, update, get, remove } from 'firebase/database';

const db = getDatabase();

const formatMoney = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
};

interface Props {
  user: { uid: string; username: string; email: string; balance: number; avatar?: string };
  roomId: string;
  onLeaveRoom: () => void;
}

export const WaitingRoom: React.FC<Props> = ({ user, roomId, onLeaveRoom }) => {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { startGame } = useAiThongMinhHonGame(roomId, user.uid);
  const startGameRef = useRef(startGame);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    startGameRef.current = startGame;
  });

  useEffect(() => {
    const roomRef = ref(db, `quizRooms/${roomId}`);
    const unsub = onValue(roomRef, snap => {
      setRoom(snap.val());
      setLoading(false);
    });
    return () => unsub();
  }, [roomId]);

  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (room?.status === 'starting' && room?.startingIn === 5) {
      const audio = new Audio('/assets/audio/âm thanh đếm ngược 10 giây.mp3');
      audio.volume = 0.6;
      audio.play().catch(e => console.log('Countdown sound error:', e));
      countdownAudioRef.current = audio;

      // Chỉ phát 5 giây
      const stopTimer = setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 5000);

      return () => clearTimeout(stopTimer);
    }
  }, [room?.status, room?.startingIn]);

  useEffect(() => {
    return () => {
      if (countdownAudioRef.current) {
        countdownAudioRef.current.pause();
        countdownAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!room || room.status !== 'starting') return;
    if (!user || room.hostUid !== user.uid) return;
    if (countdownRef.current) return;

    let count = room.startingIn ?? 5;
    countdownRef.current = setInterval(async () => {
      count -= 1;
      if (count > 0) {
        await update(ref(db, `quizRooms/${roomId}`), { startingIn: count });
      } else {
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = null;
        await startGameRef.current();
      }
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [room?.status, roomId, user?.uid]);

  useEffect(() => {
    if (!room || !user || room.status !== 'waiting') return;
    const isHost = room.hostUid === user.uid;
    if (!isHost) return;
    const players = Object.values(room.players || {}).filter(Boolean);
    if (players.length >= 15 && !autoStartedRef.current) {
      autoStartedRef.current = true;
      update(ref(db, `quizRooms/${roomId}`), { status: 'starting', startingIn: 5 });
    }
  }, [room?.players, room?.status, roomId, user?.uid]);

  const handleSetReady = async () => {
    const currentReady = room?.players?.[user.uid]?.isReady || false;
    await update(ref(db, `quizRooms/${roomId}/players/${user.uid}`), { isReady: !currentReady });
  };

  const handleLeave = async () => {
    const snap = await get(ref(db, `quizRooms/${roomId}`));
    if (!snap.exists()) {
      onLeaveRoom();
      return;
    }
    const roomVal = snap.val();

    // We do simple removal. AiThongMinhHon.tsx handles host migration automatically
    const updatedPlayers = { ...(roomVal.players || {}) };
    delete updatedPlayers[user.uid];
    const remaining = Object.values(updatedPlayers).filter(Boolean);

    if (remaining.length === 0) {
      await remove(ref(db, `quizRooms/${roomId}`));
      if (roomVal.roomCode) await remove(ref(db, `quizRoomCodes/${roomVal.roomCode}`));
    } else {
      await remove(ref(db, `quizRooms/${roomId}/players/${user.uid}`));
    }

    onLeaveRoom();
  };

  const handleStartGame = async () => {
    autoStartedRef.current = false;
    await update(ref(db, `quizRooms/${roomId}`), { status: 'starting', startingIn: 5 });
  };

  const copyRoomCode = () => {
    if (!room?.roomCode) return;
    navigator.clipboard.writeText(room.roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) return null;

  const isHost = room.hostUid === user.uid;
  const hostAvatar = room.players?.[room.hostUid]?.avatar || '';
  const guests = Object.entries(room.players || {})
    .filter(([uid, v]: any) => v && uid !== room.hostUid) as [string, any][];
  const totalPlayers = guests.length + 1;
  const myPlayer = room.players?.[user.uid];
  const myReady = myPlayer?.isReady || false;
  const readyCount = guests.filter(([, p]) => p.isReady).length;
  const allGuestsReady = guests.length > 0 && readyCount === guests.length;
  const canStart = isHost && (guests.length === 0 || allGuestsReady);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-[480px] rounded-2xl bg-[#1e293b] border border-[#3b82f6]/40 shadow-2xl shadow-black/60 flex flex-col max-h-[92vh] overflow-hidden">
        <div className="flex flex-col gap-1 items-center pt-5 pb-3 px-5 border-b border-white/10 shrink-0">
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">Mã phòng</p>
          <button
            onClick={copyRoomCode}
            title="Nhấn để sao chép"
            className="px-8 py-2 rounded-xl bg-blue-600/15 border-2 border-blue-500/50 hover:bg-blue-600/25 hover:border-blue-400 text-blue-300 font-mono text-3xl font-black tracking-[0.25em] transition-all active:scale-95"
          >
            {room.roomCode}
          </button>
          {copied && <p className="text-green-400 text-xs font-semibold mt-0.5">Đã sao chép!</p>}
          <div className="mt-1.5 px-4 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30">
            <span className="text-yellow-400 font-bold text-base">💰 {formatMoney(room.betAmount)}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider text-center mb-3">
            Người chơi ({totalPlayers}/15)
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <div
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${isHost ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-white/5 border-white/10'
                }`}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-black text-base overflow-hidden ring-2 ring-yellow-500/50">
                {hostAvatar ? (
                  <img src={hostAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (room.hostName?.[0] || '?').toUpperCase()
                )}
              </div>
              <span className="text-white text-[11px] font-bold truncate w-full text-center leading-tight">
                {room.hostName}
              </span>
              <span className="text-[10px] text-yellow-400 font-bold bg-yellow-500/15 px-1.5 py-0.5 rounded-full">
                HOST
              </span>
            </div>

            {guests.map(([uid, p]) => (
              <div
                key={uid}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${uid === user.uid
                  ? 'bg-blue-900/25 border-blue-500/60'
                  : 'bg-white/5 border-white/10'
                  }`}
              >
                <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-black text-base overflow-hidden ring-2 ring-blue-500/30">
                  {p.avatar ? (
                    <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (p.name?.[0] || p.displayName?.[0] || '?').toUpperCase()
                  )}
                  {p.isReady && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1e293b] flex items-center justify-center">
                      <span className="text-[8px] text-white font-black">✓</span>
                    </div>
                  )}
                </div>
                <span className="text-white text-[11px] font-bold truncate w-full text-center leading-tight">
                  {p.name || p.displayName || 'Người chơi'}
                </span>
                <span className="text-[10px] text-white/30">{formatMoney(p.balance || 0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-4 pt-3 border-t border-white/10 shrink-0">
          {!isHost && (
            <button
              onClick={handleSetReady}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${myReady
                ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-900/30'
                : 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-900/30'
                }`}
            >
              {myReady ? '⏸ Hủy Sẵn Sàng' : '✅ Sẵn Sàng'}
            </button>
          )}

          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg ${guests.length === 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                : allGuestsReady
                  ? 'bg-green-500 hover:bg-green-400 text-white shadow-green-900/30 animate-pulse'
                  : 'bg-white/10 text-white/30 cursor-not-allowed shadow-none'
                }`}
            >
              {guests.length === 0
                ? '🎮 Luyện Tập (1 người)'
                : allGuestsReady
                  ? '🚀 Tất cả đã sẵn sàng — Bắt Đầu!'
                  : `⏳ Chờ sẵn sàng (${readyCount}/${guests.length})`}
            </button>
          )}

          <button
            onClick={handleLeave}
            className="w-full py-2.5 rounded-xl bg-white/8 hover:bg-red-900/35 border border-white/5 hover:border-red-700/30 text-white/40 hover:text-red-400 font-semibold text-sm transition-all active:scale-95"
          >
            Rời Phòng
          </button>
        </div>
      </div>

      {room.status === 'starting' && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
          <p className="text-white/70 text-xl font-bold mb-4 tracking-wide">Trò chơi bắt đầu sau</p>
          <span
            className="text-[clamp(80px,20vw,120px)] font-black text-white leading-none select-none"
            style={{
              textShadow: '0 0 60px rgba(59,130,246,0.9), 0 0 20px rgba(59,130,246,0.6)',
              animation: 'quizCountdown 1s ease-in-out infinite',
            }}
          >
            {room.startingIn ?? 5}
          </span>
          <p className="text-white/40 text-sm mt-6 tracking-widest uppercase">Chuẩn bị nào!</p>
          <style>{`
            @keyframes quizCountdown {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.15); opacity: 0.85; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};
