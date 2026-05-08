import React, { useEffect, useState, useRef } from 'react';
import { useAiThongMinhHonGame } from '../../../../hooks/useAiThongMinhHonGame';
import { useVoiceChat } from '../../../../hooks/useVoiceChat';
import { getDatabase, ref, update, get, remove } from 'firebase/database';

const db = getDatabase();

interface Props {
  user: { uid: string; username: string; email: string; balance: number; avatar?: string };
  roomId: string;
  onBackToLobby: () => void;
}

function formatMoney(amount: number): string {
  if (!amount && amount !== 0) return '0';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString();
}

const ROUND_LABELS: Record<number, string> = {
  1: 'VÒNG 1 - DỄ',
  2: 'VÒNG 2 - TRUNG BÌNH',
  3: 'VÒNG 3 - KHÓ',
};

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

const CONFETTI_COLORS = ['#fbbf24', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#ec4899', '#f97316'];

function isCorrectAnswer(answerIndex: any, correctIndex: any): boolean {
  const parsedAnswer = Number(answerIndex);
  const parsedCorrect = Number(correctIndex);
  if (!Number.isInteger(parsedAnswer) || !Number.isInteger(parsedCorrect)) return false;
  return parsedAnswer === parsedCorrect;
}

function ConfettiParticle({ index }: { index: number }) {
  const left = `${(index * 37 + 13) % 100}%`;
  const delay = `${(index * 0.15) % 3}s`;
  const duration = `${2.5 + (index * 0.1) % 2}s`;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + (index % 8);
  const rotate = index * 23;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top: '-20px',
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: index % 3 === 0 ? '50%' : index % 3 === 1 ? '2px' : '0',
        transform: `rotate(${rotate}deg)`,
        animation: `confettiFall ${duration} ${delay} linear infinite`,
        opacity: 0.9,
      }}
    />
  );
}

export const GameBoard: React.FC<Props> = ({ user, roomId, onBackToLobby }) => {
  const { room, loading, submitAnswer } = useAiThongMinhHonGame(roomId, user.uid);

  // Compute peer UIDs for VoiceChat
  const peerUids = Object.keys(room?.players || {}).filter(uid => uid !== user.uid);
  const { isMicOn, toggleMic, speakingUids, peerMicStates } = useVoiceChat('aithongminhhon', roomId, user.uid, peerUids);

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(room?.timeLimit || 10);
  const [elimCountdown, setElimCountdown] = useState(4);
  const elimTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const loseAudioRef = useRef<HTMLAudioElement | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const wowAudioRef = useRef<HTMLAudioElement | null>(null);
  const clockStartedRef = useRef(false);

  useEffect(() => {
    clockAudioRef.current = new Audio('/assets/audio/slow-clock.mp3');
    clockAudioRef.current.loop = false;
    clockAudioRef.current.volume = 0.5;
    winAudioRef.current = new Audio('/assets/audio/win.mp3');
    winAudioRef.current.volume = 0.7;
    loseAudioRef.current = new Audio('/assets/audio/lose.mp3');
    loseAudioRef.current.volume = 0.7;
    clickAudioRef.current = new Audio('/assets/audio/money.mp3');
    clickAudioRef.current.volume = 0.7;
    wowAudioRef.current = new Audio('/assets/audio/wow.mp3');
    wowAudioRef.current.volume = 0.7;
    return () => {
      // Don't pause, just set to null to avoid AudioContext errors
      clockAudioRef.current = null;
      winAudioRef.current = null;
      loseAudioRef.current = null;
      clickAudioRef.current = null;
      wowAudioRef.current = null;
    };
  }, []);

  // Reset clock-started flag on each new question
  useEffect(() => {
    if (room?.phase === 'question') {
      clockStartedRef.current = false;
    } else {
      // Stop clock sound when leaving question phase
      if (clockAudioRef.current && !clockAudioRef.current.paused) {
        clockAudioRef.current.pause();
        clockAudioRef.current.currentTime = 0;
      }
    }
  }, [room?.phase, room?.currentQuestionIndex, room?.currentRound]);

  // Play clock sound exactly once when timeLeft first drops to 8
  useEffect(() => {
    if (!clockAudioRef.current) return;
    if (room?.phase === 'question' && timeLeft <= 8 && timeLeft > 0) {
      if (!clockStartedRef.current) {
        clockStartedRef.current = true;
        clockAudioRef.current.currentTime = 0;
        clockAudioRef.current.play().catch(() => { });
      }
    } else if (timeLeft === 0 || room?.phase !== 'question') {
      if (!clockAudioRef.current.paused) {
        clockAudioRef.current.pause();
        clockAudioRef.current.currentTime = 0;
      }
    }
  }, [timeLeft, room?.phase]);

  useEffect(() => {
    if (room?.phase !== 'reveal') return;
    const questionKey = `r${room.currentRound}q${room.currentQuestionIndex}`;
    const myAnswer = room?.answers?.[questionKey]?.[user.uid];
    const roundIdx = (room.currentRound || 1) - 1;
    const q = room?.questions?.[roundIdx]?.[room?.currentQuestionIndex || 0];
    const isCorrect = myAnswer && q && isCorrectAnswer(myAnswer.answerIndex, q.correctIndex);
    if (isCorrect) {
      winAudioRef.current && (winAudioRef.current.currentTime = 0);
      winAudioRef.current?.play().catch(() => { });
    } else if (myAnswer !== undefined) {
      loseAudioRef.current && (loseAudioRef.current.currentTime = 0);
      loseAudioRef.current?.play().catch(() => { });
    }
  }, [room?.phase, room?.currentQuestionIndex, room?.currentRound]);

  useEffect(() => {
    if (!room || room.phase !== 'question') return;
    const updateTimer = () => {
      const elapsed = (Date.now() - room.questionStartTime) / 1000;
      const remaining = Math.max(0, room.timeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 200);
    return () => clearInterval(interval);
  }, [room?.questionStartTime, room?.timeLimit, room?.phase]);

  useEffect(() => {
    if (room?.phase === 'question') {
      setSelectedAnswer(null);
    }
  }, [room?.phase, room?.currentQuestionIndex]);

  useEffect(() => {
    if (room?.phase === 'podium') {
      winAudioRef.current && (winAudioRef.current.currentTime = 0);
      winAudioRef.current?.play().catch(() => { });
    }
    if (room?.phase === 'elimination') {
      wowAudioRef.current && (wowAudioRef.current.currentTime = 0);
      wowAudioRef.current?.play().catch(() => { });
      setElimCountdown(4);
      let count = 4;
      elimTimerRef.current = setInterval(() => {
        count--;
        setElimCountdown(count);
        if (count <= 0 && elimTimerRef.current) {
          clearInterval(elimTimerRef.current);
        }
      }, 1000);
    }
    return () => {
      if (elimTimerRef.current) clearInterval(elimTimerRef.current);
    };
  }, [room?.phase, room?.currentRound]);

  const handleLeaveGame = async () => {
    try {
      const snap = await get(ref(db, `quizRooms/${roomId}`));
      if (snap.exists()) {
        const roomVal = snap.val();
        const updatedPlayers = { ...(roomVal.players || {}) };
        delete updatedPlayers[user.uid];
        const remaining = Object.values(updatedPlayers).filter(Boolean);

        if (remaining.length === 0) {
          await remove(ref(db, `quizRooms/${roomId}`));
          if (roomVal.roomCode) await remove(ref(db, `quizRoomCodes/${roomVal.roomCode}`));
        } else {
          await remove(ref(db, `quizRooms/${roomId}/players/${user.uid}`));
        }
      }
    } catch (e) {
      console.error(e);
    }
    onBackToLobby();
  };

  const handleAnswer = async (index: number) => {
    if (room?.phase !== 'question') return;
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(() => { });
    }
    setSelectedAnswer(index);
    await submitAnswer(index);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen overflow-x-hidden overflow-y-auto bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-full border-4 border-blue-500 border-t-transparent"
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <p className="text-white text-lg font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Đang tải...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="w-full min-h-screen overflow-x-hidden overflow-y-auto bg-[#0f172a] flex items-center justify-center flex-col gap-4">
        <p className="text-white text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Phòng không tồn tại
        </p>
        <button
          onClick={handleLeaveGame}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-all"
        >
          Về Lobby
        </button>
      </div>
    );
  }

  const roundIdx = (room.currentRound || 1) - 1;
  const currentQ = room?.questions?.[roundIdx]?.[room?.currentQuestionIndex || 0];
  const questionKey = `r${room.currentRound}q${room.currentQuestionIndex}`;
  const answerCount = Object.keys(room?.answers?.[questionKey] || {}).length;
  const activePlayers = Object.values(room?.players || {}).filter((p: any) => !p.isEliminated).length;
  const myPlayer = room?.players?.[user.uid];
  const isSpectator = myPlayer?.isEliminated || myPlayer?.isSpectator;
  const myAnswer = room?.answers?.[questionKey]?.[user.uid];
  const isMyAnswerCorrect = myAnswer && currentQ && isCorrectAnswer(myAnswer.answerIndex, currentQ.correctIndex);
  const hasMyAnswer = myAnswer !== undefined && myAnswer !== null;
  const timerRadius = 36;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerProgress = timeLeft / (room.timeLimit || 10);
  const timerDashoffset = timerCircumference * (1 - timerProgress);
  const isTimerRed = timeLeft < 3;

  const sortedPlayers = Object.entries(room?.players || {})
    .map(([uid, p]: [string, any]) => ({ uid, ...p }))
    .sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

  const getButtonStyleClean = (index: number): string => {
    if (room.phase === 'reveal' && currentQ) {
      const isCorrect = isCorrectAnswer(index, currentQ.correctIndex);
      const isSelected = index === selectedAnswer;
      if (isSelected && isMyAnswerCorrect) {
        return 'bg-green-500 shadow-[0_0_20px_#22c55e] border-green-400 text-white scale-105';
      }
      if (isSelected && !isMyAnswerCorrect) {
        return 'bg-red-500 shadow-[0_0_20px_#ef4444] border-red-400 text-white';
      }
      if (isCorrect) {
        return 'bg-green-500/50 border-green-500 text-white';
      }
      return 'bg-white/5 border-white/10 text-white/40 opacity-50';
    }
    if (selectedAnswer === index) {
      return 'bg-blue-600 border-blue-400 ring-2 ring-blue-300 text-white shadow-[0_0_15px_#3b82f6]';
    }
    return 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all';
  };

  if (room.phase === 'podium') {
    const top3 = sortedPlayers.slice(0, 3);
    const podiumOrder = [1, 0, 2];
    const podiumHeights = ['h-32', 'h-44', 'h-24'];
    const podiumMedals = ['🥈', '🥇', '🥉'];
    const confettiCount = 28;

    return (
      <div className="w-full min-h-screen overflow-x-hidden overflow-y-auto bg-[#0f172a] flex flex-col items-center justify-center relative py-10"
        style={{ fontFamily: 'Poppins, sans-serif' }}>
        <style>{`
          @keyframes confettiFall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0.3; }
          }
          @keyframes podiumRise {
            from { transform: scaleY(0); opacity: 0; }
            to { transform: scaleY(1); opacity: 1; }
          }
          @keyframes fadeSlideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes goldPulse {
            0%, 100% { text-shadow: 0 0 10px #fbbf24, 0 0 20px #f59e0b; }
            50% { text-shadow: 0 0 20px #fbbf24, 0 0 40px #f59e0b, 0 0 60px #fbbf24; }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
          .animate-shake { animation: shake 0.5s ease-in-out; }
        `}</style>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: confettiCount }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-4">
          <h1
            className="text-4xl font-black text-white mb-2 tracking-widest"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              animation: 'goldPulse 2s ease-in-out infinite',
              color: '#fbbf24',
            }}
          >
            KẾT QUẢ
          </h1>
          <p className="text-white/60 text-sm mb-10">Ai thông minh hơn?</p>

          <div className="flex items-end justify-center gap-4 w-full mb-8">
            {podiumOrder.map((playerIdx, podiumPos) => {
              const player = top3[playerIdx];
              if (!player) return <div key={podiumPos} className="w-28" />;
              const isFirst = playerIdx === 0;
              return (
                <div
                  key={podiumPos}
                  className="flex flex-col items-center"
                  style={{ animation: `fadeSlideUp 0.6s ${podiumPos * 0.2}s ease-out both` }}
                >
                  <div className="text-3xl mb-1">{podiumMedals[podiumPos]}</div>
                  <div
                    className={`relative w-16 h-16 rounded-full overflow-hidden border-4 mb-2 ${isFirst ? 'border-yellow-400 shadow-[0_0_20px_#fbbf24]' : 'border-white/40'}`}
                  >
                    {player.avatar ? (
                      <img src={player.avatar} alt={player.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {(player.username || 'P')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-white font-black text-base md:text-lg mb-1 break-words max-w-[120px] text-center leading-tight">
                    {player.name || player.username || 'Player'}
                  </p>
                  <p className="text-white/70 text-xs mb-1">{player.score || 0} điểm</p>
                  {player.reward > 0 && (
                    <p
                      className="text-sm font-black"
                      style={{ color: '#fbbf24', animation: 'goldPulse 2s ease-in-out infinite' }}
                    >
                      +{formatMoney(player.reward)}
                    </p>
                  )}
                  <div
                    className={`w-24 ${podiumHeights[podiumPos]} mt-2 rounded-t-lg flex items-center justify-center origin-bottom`}
                    style={{
                      background: podiumPos === 1 ? 'linear-gradient(180deg, #fbbf24, #d97706)' : podiumPos === 0 ? 'linear-gradient(180deg, #94a3b8, #64748b)' : 'linear-gradient(180deg, #b45309, #92400e)',
                      animation: `podiumRise 0.8s ${podiumPos * 0.15}s ease-out both`,
                    }}
                  >
                    <span className="text-white font-black text-lg">#{playerIdx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {sortedPlayers.length > 3 && (
            <div className="w-full bg-white/5 rounded-xl border border-white/10 p-3 mb-6 max-h-36 overflow-y-auto">
              {sortedPlayers.slice(3).map((player: any, i: number) => (
                <div key={player.uid} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-xs w-5">#{i + 4}</span>
                    <span className="text-white text-sm break-words break-all md:break-normal max-w-[150px] leading-tight flex items-center">
                      {player.name || player.username}
                      {player.uid === user.uid && <span className="ml-1 text-yellow-400 text-[10px] font-black leading-none">(Bạn)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 text-xs">{player.score || 0} điểm</span>
                    {player.reward > 0 && (
                      <span className="text-yellow-400 text-xs font-bold">+{formatMoney(player.reward)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleLeaveGame}
            className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_#3b82f6] transition-all active:scale-95 border border-blue-400"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Về Lobby
          </button>
        </div>
      </div>
    );
  }

  if (room.phase === 'elimination') {
    const eliminated = sortedPlayers.filter((p: any) => p.isEliminated && p.eliminatedRound === room.currentRound);
    const survivors = sortedPlayers.filter((p: any) => !p.isEliminated);

    return (
      <div className="w-full min-h-screen overflow-x-hidden overflow-y-auto bg-[#0f172a] flex items-center justify-center py-10"
        style={{ fontFamily: 'Poppins, sans-serif' }}>
        <style>{`
          @keyframes sadBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes fadeSlideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div className="w-full max-w-lg px-4 flex flex-col items-center gap-6">
          <div
            className="text-center"
            style={{ animation: 'fadeSlideUp 0.5s ease-out' }}
          >
            <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              KẾT THÚC VÒNG {room.currentRound}
            </h1>
            <p className="text-white/50 text-sm">{ROUND_LABELS[room.currentRound] || `VÒNG ${room.currentRound}`}</p>
          </div>

          {eliminated.length > 0 && (
            <div className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-3 text-center">
                Bị loại
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {eliminated.map((p: any, i: number) => (
                  <div
                    key={p.uid}
                    className="flex flex-col items-center gap-1"
                    style={{ animation: `sadBounce 1s ${i * 0.1}s ease-in-out infinite` }}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-500/50 grayscale">
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold">
                          {(p.username || 'P')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-lg">💀</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center mt-1">
                      <p className="text-white/60 text-xs break-words break-all max-w-[70px] text-center leading-tight">
                        {p.name || p.username}
                      </p>
                      {p.uid === user.uid && <span className="text-yellow-400 text-[10px] font-black leading-none mt-0.5">(Bạn)</span>}
                    </div>
                    <p className="text-white/40 text-[10px]">{p.score || 0} điểm</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {survivors.length > 0 && (
            <div className="w-full bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3 text-center">
                Tiếp tục
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {survivors.map((p: any, i: number) => (
                  <div
                    key={p.uid}
                    className="flex flex-col items-center gap-1"
                    style={{ animation: `fadeSlideUp 0.4s ${i * 0.08}s ease-out both` }}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-green-500">
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-green-600 flex items-center justify-center text-white font-bold">
                          {(p.username || 'P')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center mt-1">
                      <p className="text-white text-xs break-words break-all max-w-[70px] text-center leading-tight">
                        {p.name || p.username}
                      </p>
                      {p.uid === user.uid && <span className="text-yellow-400 text-[10px] font-black leading-none mt-0.5">(Bạn)</span>}
                    </div>
                    <span className="text-green-400 text-[10px] font-bold bg-green-500/20 px-1.5 py-0.5 mt-1 rounded-full border border-green-500/40">
                      ✓ Tiếp tục
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-1">
            <p className="text-white/40 text-sm">Vòng tiếp theo bắt đầu sau</p>
            <div
              className="text-5xl font-black text-blue-400"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {Math.max(0, elimCountdown)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (room.phase === 'leaderboard') {
    return (
      <div className="w-full min-h-screen overflow-x-hidden overflow-y-auto bg-[#0f172a]/95 backdrop-blur-sm flex items-center justify-center py-10"
        style={{ fontFamily: 'Poppins, sans-serif' }}>
        <style>{`
          @keyframes fadeSlideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div className="w-full max-w-sm px-4 flex flex-col items-center gap-4">
          <h2 className="text-2xl font-black text-white tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            BẢNG XẾP HẠNG
          </h2>
          <p className="text-white/40 text-xs mb-2">Sau câu {(room.currentQuestionIndex || 0) + 1}</p>

          <div className="w-full flex flex-col gap-2">
            {sortedPlayers.slice(0, 10).map((player: any, i: number) => {
              const isMe = player.uid === user.uid;
              const displayName = player.name || player.username || player.displayName || player.email?.split('@')[0] || 'Người chơi';
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              return (
                <div
                  key={player.uid}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isMe ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/10'}`}
                  style={{ animation: `fadeSlideUp 0.4s ${i * 0.06}s ease-out both` }}
                >
                  <div className="w-7 flex items-center justify-center">
                    {medal ? (
                      <span className="text-xl">{medal}</span>
                    ) : (
                      <span className="text-white/40 text-sm font-bold">#{i + 1}</span>
                    )}
                  </div>
                  <div className={`w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0 ${isMe ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'border-white/20'}`}>
                    {player.avatar ? (
                      <img src={player.avatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {displayName[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col items-start justify-center pr-2">
                    <div className="flex flex-col gap-0.5 text-left w-full">
                      <span className={`font-bold text-sm leading-tight break-words break-all ${isMe ? 'text-blue-300' : 'text-white'}`}>
                        {displayName}
                      </span>
                      {isMe && <span className="text-yellow-400 text-[10px] font-black leading-none">(Bạn)</span>}
                    </div>
                    {player.isEliminated && (
                      <p className="text-red-400 text-xs">Đã bị loại</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-black text-lg">{player.score || 0}</p>
                    <p className="text-white/30 text-xs">điểm</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-screen bg-[#0f172a] flex flex-col overflow-x-hidden overflow-y-auto"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      <style>{`
        @keyframes slideInFromTop {
          from { transform: translateY(-40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          100% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        }
        @keyframes correctFlash {
          0%, 100% { background-color: rgba(34, 197, 94, 0.8); }
          50% { background-color: rgba(34, 197, 94, 1); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .slide-in-top { animation: slideInFromTop 0.4s ease-out; }
      `}</style>

      {isSpectator && (
        <div className="bg-red-900/80 border-b border-red-700 px-4 py-2 text-center">
          <p className="text-red-300 text-sm font-bold">
            👁 Bạn đang xem - Đã bị loại vòng {myPlayer?.eliminatedRound || '?'}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-white/10 flex-shrink-0">
        {/* Left side: Round info and Mic button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="bg-blue-600/20 border border-blue-500/40 rounded-xl px-3 py-1.5">
            <p className="text-blue-300 text-xs font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {ROUND_LABELS[room.currentRound || 1] || `VÒNG ${room.currentRound}`}
            </p>
            <p className="text-white/60 text-[10px] text-center">
              Câu {(room.currentQuestionIndex || 0) + 1}/{room.questionsPerRound || 10}
            </p>
          </div>

          {/* Mic button on the left */}
          <button
            onClick={toggleMic}
            className={`flex items-center justify-center w-10 h-10 md:w-auto md:px-3 md:py-2 rounded-lg border transition-colors ${isMicOn ? 'bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'}`}
            title={isMicOn ? 'Tắt Mic' : 'Bật Mic'}
          >
            {isMicOn ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Center: Timer */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg width="88" height="88" className="-rotate-90">
            <circle
              cx="44"
              cy="44"
              r={timerRadius}
              fill="none"
              stroke="#1e293b"
              strokeWidth="5"
            />
            <circle
              cx="44"
              cy="44"
              r={timerRadius}
              fill="none"
              stroke={isTimerRed ? '#ef4444' : '#3b82f6'}
              strokeWidth="5"
              strokeDasharray={timerCircumference}
              strokeDashoffset={timerDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s ease',
                filter: isTimerRed ? 'drop-shadow(0 0 6px #ef4444)' : 'drop-shadow(0 0 4px #3b82f6)',
              }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span
              className={`text-2xl font-black leading-none ${isTimerRed ? 'text-red-400' : 'text-white'}`}
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {timeLeft}
            </span>
            <span className="text-white/30 text-[8px]">giây</span>
          </div>
        </div>

        {/* Right side: Player count and Leave button */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 md:px-3 md:py-1.5 text-right">
            <p className="text-white text-xs md:text-sm font-bold">👥 {activePlayers}</p>
            <p className="text-white/40 text-[10px]">đang chơi</p>
          </div>
          <button
            onClick={handleLeaveGame}
            className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/30 text-red-400 text-xs font-bold transition-colors px-2.5 py-1.5 rounded-lg border border-red-500/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Rời</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 py-3 gap-4 min-h-0 overflow-hidden">
        {currentQ ? (
          <div className="slide-in-top bg-white/5 border border-white/10 rounded-2xl p-4 flex-shrink-0 relative">
            {room.phase === 'reveal' && (
              <div
                className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black border ${
                  !hasMyAnswer
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : isMyAnswerCorrect
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : 'bg-red-500/20 text-red-400 border-red-500/50'
                }`}
              >
                {!hasMyAnswer ? '... Chưa trả lời' : isMyAnswerCorrect ? 'Chính xác' : 'Sai'}
              </div>
            )}
            {currentQ.category && (
              <div className="inline-flex items-center bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-0.5 mb-3">
                <span className="text-blue-300 text-xs font-semibold capitalize">{currentQ.category}</span>
              </div>
            )}
            <p className="text-white text-lg font-bold leading-snug text-center">
              {currentQ.question}
            </p>
          </div>
        ) : (
          <div className="slide-in-top bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-center flex-shrink-0">
            <p className="text-white/40 text-sm">Đang tải câu hỏi...</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
          {(currentQ?.options || ['', '', '', '']).map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={isSpectator || room.phase !== 'question'}
              className={`relative flex items-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm text-left transition-all active:scale-95 disabled:cursor-not-allowed ${getButtonStyleClean(index)}`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${selectedAnswer === index ? 'bg-white/30' : 'bg-white/10'}`}
              >
                {ANSWER_LABELS[index]}
              </span>
              <span className="flex-1 leading-tight">{option}</span>
            </button>
          ))}
        </div>

        {room.phase === 'reveal' && currentQ && (
          <div className="flex flex-col gap-3 mt-4 bg-black/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] slide-in-top flex-shrink-0 w-full max-w-lg mx-auto">
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 text-lg sm:text-xl font-black text-center mb-2 flex items-center justify-center gap-2">
              <span>⚡</span> Bảng Vàng Tốc Độ <span>⚡</span>
            </h3>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto px-1 custom-scrollbar w-full">
              {Object.entries(room.answers?.[questionKey] || {})
                .map(([uid, data]: [string, any]) => {
                  const pInfo = room.players?.[uid] || {};
                  return {
                    uid,
                    displayName: pInfo.name || pInfo.username || pInfo.displayName || pInfo.email?.split('@')[0] || 'Người chơi',
                    avatar: pInfo.avatar || '/assets/image/avatar-default.png',
                    ...data
                  };
                })
                .filter((p: any) => p.speedRank > 0)
                .sort((a, b) => a.speedRank - b.speedRank)
                .map((player: any) => {
                  let emoji = '🏅';
                  let highlightClass = 'bg-white/5 border border-white/10';
                  if (player.speedRank === 1) {
                    emoji = '🥇';
                    highlightClass = 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]';
                  }
                  else if (player.speedRank === 2) {
                    emoji = '🥈';
                    highlightClass = 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-300/50 shadow-[0_0_15px_rgba(209,213,219,0.2)]';
                  }
                  else if (player.speedRank === 3) {
                    emoji = '🥉';
                    highlightClass = 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-600/50 shadow-[0_0_15px_rgba(217,119,6,0.2)]';
                  }
                  const isMe = player.uid === user.uid;
                  return (
                    <div key={player.uid} className={`flex items-center justify-between p-2 sm:p-3 rounded-xl transition-all ${highlightClass} ${isMe ? 'ring-2 ring-blue-400' : ''}`} style={{ animation: `slideInRight ${0.2 + player.speedRank * 0.1}s ease-out forwards`, opacity: 0 }}>
                      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                        <span className="text-xl sm:text-2xl drop-shadow-md w-6 sm:w-8 text-center shrink-0">{emoji}</span>
                        <img src={player.avatar} alt="avatar" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/20 object-cover shrink-0" onError={(e) => { e.currentTarget.src = "/assets/image/avatar-default.png"; }} />
                        <span className={`text-sm sm:text-base font-bold truncate ${isMe ? 'text-blue-300' : 'text-white'}`}>{player.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-2">
                        <span className="text-white/70 text-xs sm:text-sm font-mono bg-black/40 px-2 py-1 rounded-lg border border-white/5">{player.answerTime?.toFixed(2)}s</span>
                        <div className="flex flex-col items-end shrink-0 w-12 sm:w-16">
                          <span className="text-yellow-400 font-extrabold text-sm sm:text-base pop-in-anim">+{player.gainedPoints || 0}</span>
                          <span className="text-[10px] text-yellow-500/70 uppercase font-bold tracking-wider leading-none">PTS</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {Object.entries(room.answers?.[questionKey] || {}).filter(([_, data]: [string, any]) => !data.speedRank).length > 0 && (
                <div className="text-center mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-xs sm:text-sm font-semibold">❌ Các câu trả lời sai: 0 pts</p>
                </div>
              )}
            </div>
            <style>{`
              @keyframes slideInRight {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
              }
              @keyframes popIn {
                0% { transform: scale(0.5); opacity: 0; }
                70% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); }
              }
              .pop-in-anim { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
              .custom-scrollbar::-webkit-scrollbar { width: 4px; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
            `}</style>
          </div>
        )}

        <div className="flex items-center justify-center flex-shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'pulse 1.5s infinite' }} />
            <p className="text-white/60 text-xs">
              Đã trả lời:{' '}
              <span className="text-white font-bold">{answerCount}</span>
              {' / '}
              <span className="text-white font-bold">{activePlayers}</span>
              {' người'}
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <div className="flex gap-2 overflow-x-auto pb-1 h-full items-center" style={{ scrollbarWidth: 'none' }}>
            {sortedPlayers.slice(0, 15).map((player: any, i: number) => {
              const isMe = player.uid === user.uid;
              const displayName = player.name || player.username || player.displayName || player.email?.split('@')[0] || 'Người chơi';
              const hasAnswered = !!room?.answers?.[questionKey]?.[player.uid];
              const isSpeaking = speakingUids.includes(player.uid);
              const isMuted = isMe ? !isMicOn : peerMicStates[player.uid] === false;
              const uniqueColor = i === 0 ? 'border-yellow-400' : i === 1 ? 'border-gray-300' : i === 2 ? 'border-amber-600' : 'border-blue-400';
              return (
                <div
                  key={player.uid}
                  className={`relative flex flex-col items-center gap-1 flex-shrink-0 p-2 rounded-xl border transition-all ${isMe ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'border-white/10 bg-white/5'} ${player.isEliminated ? 'grayscale opacity-50' : ''}`}
                  style={{ minWidth: 80 }}
                >
                  <div className="absolute -top-2 -left-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border border-white text-[10px] font-bold text-white z-10">
                    {i + 1}
                  </div>
                  <div className="relative mt-1">
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 ${isMe ? 'border-yellow-400' : uniqueColor} ${isSpeaking ? 'ring-2 ring-green-400 ring-offset-1 ring-offset-[#0f172a]' : ''}`}
                    >
                      {player.avatar ? (
                        <img src={player.avatar} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
                          {displayName[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    {isMuted && !player.isEliminated && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-white text-white z-20">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={3} /></svg>
                      </div>
                    )}
                    {player.isEliminated && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base">💀</span>
                      </div>
                    )}
                    {hasAnswered && !player.isEliminated && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-green-300 z-20">
                        <span className="text-white text-[10px] sm:text-xs font-black">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center w-full mt-1">
                    <p className={`text-white text-xs md:text-sm font-semibold text-center leading-tight break-words w-full px-1`}>
                      {displayName}
                    </p>
                    {isMe && <span className="text-yellow-400 text-[10px] font-black leading-none mt-0.5">(Bạn)</span>}
                  </div>
                  <p className="text-yellow-400 text-xs md:text-sm font-bold mt-0.5">{player.score || 0}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

