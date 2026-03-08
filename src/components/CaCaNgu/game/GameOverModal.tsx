import React, { useMemo, useEffect } from 'react';
import { CaNguTransaction } from '../../../types';

interface GameOverModalProps {
  winner: string | null;
  winnerName: string;
  winnerColor: 'red' | 'blue' | 'yellow' | 'green';
  balances: Record<string, number>;
  players: Record<string, { uid: string; name: string; color: 'red' | 'blue' | 'yellow' | 'green'; avatar?: string }>;
  transactions: CaNguTransaction[];
  betAmount: number;
  onClose: () => void;
  onLeave?: () => void;
}

let _confettiCSSInjected = false;
function injectConfettiCSS() {
  if (_confettiCSSInjected || typeof document === 'undefined') return;
  _confettiCSSInjected = true;
  const s = document.createElement('style');
  s.id = 'cacangu-confetti-css';
  s.textContent = `
    @keyframes confettiFall {
      0%   { transform: translateY(-20px) rotate(0deg) scaleX(1);   opacity: 1; }
      50%  { opacity: 1; scaleX(-1); }
      100% { transform: translateY(110vh) rotate(780deg) scaleX(1); opacity: 0; }
    }
    @keyframes confettiSway {
      0%,100% { margin-left: 0; }
      25%     { margin-left: 18px; }
      75%     { margin-left: -18px; }
    }
    @keyframes trophyFloat {
      0%,100% { transform: translateY(0) scale(1)    rotate(-3deg); }
      50%     { transform: translateY(-8px) scale(1.08) rotate(3deg); }
    }
    @keyframes winnerPulse {
      0%,100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
      50%     { box-shadow: 0 0 24px 6px currentColor; opacity: 0.9; }
    }
    @keyframes slideUp {
      from { transform: translateY(40px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    @keyframes badgePop {
      0%   { transform: scale(0) rotate(-12deg); }
      70%  { transform: scale(1.15) rotate(4deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
  `;
  document.head.appendChild(s);
}

const CONFETTI_COLORS = ['#f59e0b','#ef4444','#3b82f6','#22c55e','#a855f7','#ec4899','#06b6d4','#f97316'];

const WINNER_BORDER: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', yellow: '#eab308', green: '#22c55e',
};
const WINNER_BG: Record<string, string> = {
  red: 'rgba(127,29,29,0.5)', blue: 'rgba(30,58,95,0.5)', yellow: 'rgba(113,63,18,0.5)', green: 'rgba(20,83,45,0.5)',
};
const COLOR_LABEL: Record<string, string> = {
  red: 'Đỏ', blue: 'Xanh', yellow: 'Vàng', green: 'Xanh Lá',
};
const COLOR_TEXT: Record<string, string> = {
  red: '#fca5a5', blue: '#93c5fd', yellow: '#fde047', green: '#86efac',
};

function formatMoney(n: number): string {
  if (!n && n !== 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString('vi-VN');
}

const REASON_LABEL: Record<string, string> = {
  kick:        'Đá quân',
  kickDouble:  'Đá quân đôi',
  homeCol6:    'Vào chuồng',
  endPenalty:  'Phạt kết thúc',
};

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  winnerName,
  winnerColor,
  balances,
  players,
  transactions,
  betAmount: _betAmount,
  onClose,
  onLeave,
}) => {
  useEffect(() => {
    injectConfettiCSS();
  }, []);

  const confetti = useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${(Math.random() * 3.5).toFixed(2)}s`,
        duration: `${(2.8 + Math.random() * 2.2).toFixed(2)}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: `${6 + Math.floor(Math.random() * 8)}px`,
        borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
      })),
    []
  );

  const sortedPlayers = useMemo(() => {
    return Object.values(players).sort((a, b) => (balances[b.uid] ?? 0) - (balances[a.uid] ?? 0));
  }, [players, balances]);

  const notableEvents = useMemo(() => {
    const grouped: Record<string, { reason: string; count: number; totalAmount: number; toUid: string }> = {};
    transactions.forEach(tx => {
      const key = `${tx.toUid}:${tx.reason}`;
      if (!grouped[key]) grouped[key] = { reason: tx.reason, count: 0, totalAmount: 0, toUid: tx.toUid };
      grouped[key].count++;
      grouped[key].totalAmount += tx.amount;
    });
    return Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5);
  }, [transactions]);

  const winnerBorder = WINNER_BORDER[winnerColor] ?? '#f59e0b';
  const winnerBg = WINNER_BG[winnerColor] ?? 'rgba(0,0,0,0.5)';

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden z-[9991]"
        aria-hidden="true"
      >
        {confetti.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.left,
              top: '-24px',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.borderRadius,
              animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards, confettiSway ${p.duration} ${p.delay} ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <div
        className="relative z-[9992] flex flex-col w-full max-w-sm mx-3 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1c1008 0%, #0f0a00 100%)',
          border: `2px solid ${winnerBorder}`,
          boxShadow: `0 0 40px ${winnerBorder}55, 0 20px 60px rgba(0,0,0,0.8)`,
          animation: 'slideUp 0.4s cubic-bezier(.2,.8,.4,1.1)',
        }}
      >
        <div
          className="px-5 pt-5 pb-4 flex flex-col items-center gap-2"
          style={{ background: `linear-gradient(180deg, ${winnerBg} 0%, transparent 100%)` }}
        >
          <div style={{ fontSize: '3.5rem', animation: 'trophyFloat 2.2s ease-in-out infinite' }}>
            🏆
          </div>

          <div
            className="text-lg font-black tracking-wide uppercase"
            style={{ color: '#ffd700', textShadow: '0 0 20px #ffd700, 0 2px 4px rgba(0,0,0,0.8)' }}
          >
            Chiến Thắng!
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div
              className="font-black text-xl"
              style={{ color: COLOR_TEXT[winnerColor] ?? '#fff' }}
            >
              {winnerName}
            </div>
            <div
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: WINNER_BG[winnerColor],
                border: `1px solid ${winnerBorder}`,
                color: COLOR_TEXT[winnerColor],
                animation: 'badgePop 0.5s 0.3s cubic-bezier(.2,.8,.4,1.2) both',
              }}
            >
              {COLOR_LABEL[winnerColor]}
            </div>
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 mt-1">
            Kết Quả
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left pb-1 font-medium">Người chơi</th>
                <th className="text-center pb-1 font-medium">Màu</th>
                <th className="text-right pb-1 font-medium">Thắng / Thua</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((p, idx) => {
                const net = balances[p.uid] ?? 0;
                const isWinner = p.uid === winner;
                return (
                  <tr
                    key={p.uid}
                    className="border-t"
                    style={{
                      borderColor: 'rgba(255,255,255,0.06)',
                      background: isWinner ? `${WINNER_BG[p.color]}` : 'transparent',
                    }}
                  >
                    <td className="py-1.5 flex items-center gap-1.5">
                      <img
                        src={p.avatar || '/assets/image/icons/user.png'}
                        alt={p.name}
                        className="w-5 h-5 rounded-full object-cover border"
                        style={{ borderColor: WINNER_BORDER[p.color] }}
                      />
                      <span
                        className="font-semibold truncate max-w-[90px]"
                        style={{ color: isWinner ? COLOR_TEXT[p.color] : '#d1d5db' }}
                      >
                        {p.name}
                      </span>
                      {isWinner && <span className="text-[10px]">🥇</span>}
                      {idx === sortedPlayers.length - 1 && !isWinner && (
                        <span className="text-[10px] opacity-70">💀</span>
                      )}
                    </td>
                    <td className="py-1.5 text-center">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: WINNER_BG[p.color],
                          color: COLOR_TEXT[p.color],
                          border: `1px solid ${WINNER_BORDER[p.color]}55`,
                        }}
                      >
                        {COLOR_LABEL[p.color]}
                      </span>
                    </td>
                    <td className="py-1.5 text-right font-black">
                      <span
                        style={{
                          color: net >= 0 ? '#4ade80' : '#f87171',
                          textShadow: net >= 0
                            ? '0 0 8px rgba(74,222,128,0.6)'
                            : '0 0 8px rgba(248,113,113,0.6)',
                        }}
                      >
                        {net >= 0 ? '+' : ''}
                        {formatMoney(net)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {notableEvents.length > 0 && (
          <div className="px-4 pb-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Sự Kiện Nổi Bật
            </div>
            <div className="flex flex-col gap-0.5">
              {notableEvents.map((ev, i) => {
                const toPlayer = players[ev.toUid];
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[10px] px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <span className="text-gray-300">
                      {toPlayer?.name ?? ev.toUid.slice(0, 6)}{' '}
                      <span className="text-gray-500">—</span>{' '}
                      {REASON_LABEL[ev.reason] ?? ev.reason}
                      {ev.count > 1 && <span className="text-gray-500 ml-0.5">×{ev.count}</span>}
                    </span>
                    <span className="text-yellow-400 font-bold">+{formatMoney(ev.totalAmount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-4 pb-5 pt-1 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              color: '#fff',
              border: '1px solid #3b82f6',
              boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
            }}
          >
            Ván Tiếp Theo
          </button>
          <button
            onClick={() => { onLeave ? onLeave() : onClose(); }}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#d1d5db',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            Rời Phòng
          </button>
        </div>
      </div>
    </div>
  );
};
