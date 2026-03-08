import React from 'react';
import { Card } from './Card';
import { calculateScore, formatMoney } from '../../../utils/xidach/gameLogic';
import cn from 'classnames';

interface DealerAreaProps {
  dealer: any;
  isHost: boolean;
  gameStatus: string;
  onHit: () => void;
  hitLoading: boolean;
  hostName: string;
  hostPhoto: string;
  dealerIsBot?: boolean;
  hostMoney?: number;
}

const statusLabel: Record<string, { text: string; color: string }> = {
  waiting:   { text: 'Chờ...', color: 'text-gray-400' },
  playing:   { text: 'Đang rút', color: 'text-blue-300' },
  stand:     { text: 'Dừng', color: 'text-green-400' },
  busted:    { text: '💥 QUẮC!', color: 'text-red-400' },
  xidach:    { text: '⭐ Xì Dách!', color: 'text-yellow-300' },
  xibang:    { text: '✨ Xì Bàng!', color: 'text-yellow-300' },
  fiveCards: { text: '🃏 Ngũ Linh!', color: 'text-cyan-300' },
};

export const DealerArea: React.FC<DealerAreaProps> = ({
  dealer, isHost, gameStatus, onHit, hitLoading, hostName, hostPhoto, dealerIsBot = false, hostMoney,
}) => {
  const cards: string[] = dealer?.cards || [];
  const st = dealer?.status || 'waiting';
  const label = statusLabel[st] || { text: st, color: 'text-white' };

  // revealAll: mọi người đều thấy bài nhà cái chỉ khi kết thúc hoặc revealing
  // (không phải khi dealerTurn — nhà con không được thấy bài nhà cái trong lúc nhà cái xét)
  const revealAll = gameStatus === 'finished' || gameStatus === 'revealing';
  // Nhà cái (người thật, không phải bot) luôn thấy bài của chính mình
  const hostCanSee = isHost && !dealerIsBot;

  const score = calculateScore(cards);

  // Bot dealer handles itself; manual hit only for human dealer
  const canHitMore = isHost && !dealerIsBot && gameStatus === 'dealerTurn' && (st === 'playing' || st === 'waiting');

  return (
    <div className="flex flex-col items-center w-full px-4">
      {/* Dealer header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <img
            src={hostPhoto || '/assets/image/icons/user.png'}
            alt={hostName}
            className="w-10 h-10 rounded-full border-2 border-red-500 object-cover shadow-lg shadow-red-900/50"
          />
          <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded-full border border-red-400 leading-tight">
            NC
          </div>
        </div>
        <div>
          <div className="text-red-400 text-[9px] font-bold uppercase tracking-widest leading-none">Nhà Cái</div>
          <div className="text-white text-sm font-bold leading-tight">{hostName}</div>
          {hostMoney !== undefined && (
            <div className="text-yellow-400 text-[8px] font-mono leading-tight">{formatMoney(hostMoney)}</div>
          )}
        </div>
        {/* Score badge */}
        <div className={cn(
          'ml-1 rounded-xl px-3 py-1 text-center border',
          st === 'busted' ? 'bg-red-900/60 border-red-600' : 'bg-black/60 border-white/20'
        )}>
          <div className="text-[8px] text-gray-400 leading-none uppercase tracking-wide">Điểm</div>
          <div className={cn('font-black text-base leading-tight', st === 'busted' ? 'text-red-400' : 'text-white')}>
            {(revealAll || hostCanSee) ? score : '?'}
          </div>
        </div>
      </div>

      {/* Cards row */}
      <div className="flex justify-center items-end gap-0.5 mb-1.5 min-h-[72px]">
        {cards.length === 0 && (
          <div className="w-12 h-[68px] rounded-lg border-2 border-dashed border-white/20 bg-black/20 flex items-center justify-center">
            <span className="text-white/20 text-sm">🂠</span>
          </div>
        )}
        {cards.map((card, i) => (
          <Card
            key={i}
            card={card}
            faceDown={!revealAll && !hostCanSee}
            animated={i === 0 && revealAll && !hostCanSee}
            small={false}
          />
        ))}
      </div>

      {/* Status + action */}
      <div className="flex flex-col items-center gap-1">
        <div className={cn('text-xs font-bold tracking-wide', label.color)}>
          {label.text}
        </div>
        {canHitMore && (
          <button
            onClick={onHit}
            disabled={hitLoading}
            className="px-6 py-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-bold text-xs rounded-full border border-blue-400/50 shadow-lg shadow-blue-900/40 active:scale-95 transition-all disabled:opacity-50"
          >
            {hitLoading ? '...' : 'Rút Bài'}
          </button>
        )}
        {dealerIsBot && gameStatus === 'dealerTurn' && (st === 'playing' || st === 'waiting') && (
          <div className="text-[9px] text-blue-300 animate-pulse font-bold">🤖 Đang xét...</div>
        )}
      </div>
    </div>
  );
};

