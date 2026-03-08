import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { EmojiPickerButton } from '../../shared/GameReactions';
import { calculateScore, formatMoney } from '../../../utils/xidach/gameLogic';
import cn from 'classnames';

const TURN_DURATION = 30;
const WARNING_TIME = 5;

interface PlayerSeatProps {
  player: any;
  isMyTurn: boolean;
  isTurn: boolean;
  isMe: boolean;
  gameStatus: string;
  betAmount: number;
  timeLeft?: number;
  revealCards?: boolean; // true when dealerTurn or finished phase
  isMicOn?: boolean;
  isSpeaking?: boolean;
  onToggleMic?: () => void;
  onSendEmoji?: (emoji: string) => void;
  onHit: () => void;
  onStand: () => void;
  onBet?: (amount: number) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  betting: { label: 'Đặt cược', color: 'text-yellow-400', bg: 'bg-black/30 border-white/10' },
  playing: { label: 'Đang chơi', color: 'text-blue-300', bg: 'bg-black/30 border-white/10' },
  stand: { label: 'Dừng', color: 'text-green-400', bg: 'bg-black/30 border-white/10' },
  busted: { label: 'QUẮC!', color: 'text-red-400', bg: 'bg-black/30 border-white/10' },
  quac: { label: 'QUẮC!', color: 'text-red-400', bg: 'bg-black/30 border-white/10' },
  xidach: { label: 'Xì Dách!', color: 'text-yellow-300', bg: 'bg-black/30 border-yellow-500/40' },
  xibang: { label: 'Xì Bàng!', color: 'text-yellow-300', bg: 'bg-black/30 border-yellow-500/40' },
  fiveCards: { label: 'Ngũ Linh!', color: 'text-cyan-300', bg: 'bg-black/30 border-cyan-500/40' },
};

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player, isMyTurn, isTurn, isMe, gameStatus, betAmount, timeLeft, revealCards = false,
  isMicOn, isSpeaking, onToggleMic, onSendEmoji,
  onHit, onStand,
}) => {
  // Nặn bài: số lá bài đầu (trong 2 lá deal) mà người chơi đã tự xem
  const [peekCount, setPeekCount] = useState(0);

  const cards: string[] = player?.cards || [];
  const st = player?.status || 'waiting';
  // Xì Dách / Xì Bàng: tự động lật bài (tay đặc biệt, mọi người cần thấy)
  const forceReveal = st === 'xidach' || st === 'xibang';

  // Reset peek khi vòng mới (bài được xóa)
  useEffect(() => {
    if (cards.length === 0) setPeekCount(0);
  }, [cards.length]);

  // Auto-reveal toàn bộ khi có Xì Dách / Xì Bàng
  useEffect(() => {
    if (forceReveal) setPeekCount(cards.length);
  }, [forceReveal, cards.length]);

  if (!player) return null;

  // Tính trạng thái face-down cho từng lá
  const getCardFaceDown = (cardIndex: number): boolean => {
    if (revealCards || forceReveal) return false;  // dealerTurn/finished hoặc xì: hiện hết
    if (!isMe) return true;                         // người khác: luôn úp đến khi được lật
    if (cardIndex >= 2) return false;               // lá rút thêm (3+): luôn ngửa với chủ bài
    return cardIndex >= peekCount;                  // nặn bài: 2 lá deal ban đầu
  };

  // Animation cho lá vừa được nặn
  const getCardAnimated = (cardIndex: number): boolean =>
    isMe && !revealCards && cardIndex === peekCount - 1 && cardIndex < 2;

  // Score: hiện sau khi xem đủ 2 lá deal (hoặc khi bài được lật công khai)
  const fullyPeeked = peekCount >= Math.min(cards.length, 2) && cards.length > 0;
  const canSeeScore = (isMe && (fullyPeeked || forceReveal)) || revealCards;
  const score = canSeeScore ? calculateScore(cards) : 0;

  // Ẩn trạng thái thật của nhà con khi chưa được nhà cái lật bài
  // (người khác không được biết nhà con đó quắc/dừng trước khi bị lật)
  const isHidden = !isMe && !revealCards && !forceReveal && st !== 'betting' && st !== 'playing';
  const neutralCfg = { label: 'Xong', color: 'text-gray-400', bg: 'bg-black/30 border-gray-600' };
  const cfg = isHidden ? neutralCfg : (statusConfig[st] || { label: st, color: 'text-gray-400', bg: 'bg-black/30 border-gray-600' });
  // Must have fully peeked initial 2 cards before being allowed to act (nặn bài mechanic)
  const canAct = isMyTurn && gameStatus === 'playing' && st === 'playing' && (fullyPeeked || forceReveal);
  // Nhà con phải có ≥16 điểm để được phép dừng
  const canStand = canAct && score >= 16;
  const showResult = gameStatus === 'finished' && player.result;

  // Nặn bài: còn lá chưa xem trong 2 lá deal
  const canPeek = isMe && !revealCards && !forceReveal && peekCount < Math.min(cards.length, 2);
  const handleCardClick = () => {
    if (canPeek) setPeekCount(p => p + 1);
  };

  const resultConfig: Record<string, { label: string; color: string }> = {
    win: { label: 'THẮNG', color: 'text-green-400' },
    lose: { label: 'THUA', color: 'text-red-400' },
    draw: { label: 'HÒA', color: 'text-gray-300' },
    xidach: { label: 'XÌ DÁCH +1.5x', color: 'text-yellow-400' },
    xibang: { label: 'XÌ BÀNG +1x', color: 'text-yellow-400' },
    fiveCards: { label: '5 LÁ +1x', color: 'text-cyan-400' },
  };

  return (
    <div className={cn(
      'flex flex-col items-center px-2 py-2 rounded-2xl border-2 transition-all duration-200 w-[88px] md:w-auto md:min-w-[88px]',
      cfg.bg,
      isMyTurn && gameStatus === 'playing' && 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-black scale-105',
      isMe ? 'border-yellow-500/50' : 'border-white/[0.08]',
    )}>
      {/* Player info */}
      <div className="flex items-center gap-1 mb-1.5 w-full justify-center">
        <div className="relative w-7 h-7 flex-shrink-0">
          {isTurn && timeLeft !== undefined && (
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke={timeLeft <= WARNING_TIME ? '#EF4444' : '#EAB308'}
                strokeWidth="3"
                strokeDasharray="100"
                strokeDashoffset={100 - (timeLeft / TURN_DURATION) * 100}
                pathLength="100"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
              />
            </svg>
          )}
          <img
            src={player.photoURL || '/assets/image/icons/user.png'}
            alt={player.displayName}
            className={cn('w-full h-full rounded-full border-2 object-cover', isMe ? 'border-yellow-400' : 'border-white/30')}
          />
          {isTurn && timeLeft !== undefined && (
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[7px] font-bold px-1 rounded-full border border-gray-600 whitespace-nowrap z-20">
              {timeLeft}s
            </div>
          )}
          {/* Speaking Indicator Glow */}
          {isSpeaking && (
            <div className="absolute -inset-1.5 rounded-full border border-green-400 bg-green-500/20 animate-pulse pointer-events-none z-10" />
          )}
          {/* Remote mute indicator */}
          {!isMe && isMicOn === false && (
            <div className="absolute -top-1 -right-1 bg-red-600/90 text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white/40 shadow-sm z-30" title="Tắt mic">
              🔇
            </div>
          )}
        </div>
        <div className="min-w-0 z-20">
          <div className="text-white text-[9px] font-bold truncate leading-tight">
            {player.displayName}{player.isBot && ' 🤖'}
          </div>
          <div className="text-yellow-400 text-[8px] font-mono leading-tight">
            {formatMoney(player.money || 0)}
          </div>
        </div>
      </div>

      {/* Local Player Settings (Mic & Emoji) */}
      {isMe && (
        <div className="flex gap-2 justify-center mb-1.5 z-20">
          {onSendEmoji && <EmojiPickerButton onSend={onSendEmoji} />}
          {onToggleMic && (
            <button
              onClick={onToggleMic}
              title={isMicOn ? 'Tắt mic' : 'Bật mic'}
              className={cn(
                "text-base rounded-full w-7 h-7 flex items-center justify-center border active:scale-90 transition-all shadow-lg",
                isMicOn ? "bg-green-600/80 border-green-400" : "bg-red-600/80 border-red-400"
              )}
            >
              {isMicOn ? '🎙️' : '🔇'}
            </button>
          )}
        </div>
      )}

      {/* Bet */}
      {player.bet > 0 && (
        <div className="text-[8px] text-yellow-400 bg-black/40 px-1.5 rounded-full mb-1 border border-yellow-700/30 leading-tight">
          {formatMoney(player.bet)}
        </div>
      )}

      {/* Cards + nặn bài */}
      <div
        className={cn('flex flex-wrap md:flex-nowrap justify-center mb-1 relative', canPeek && 'cursor-pointer select-none')}
        onClick={handleCardClick}
      >
        {cards.length > 0 ? (
          (!isMe && !revealCards && !forceReveal) ? (
            /* Other players: 1 face-down card + count badge */
            <div className="relative inline-block">
              <Card card={cards[0]} faceDown={true} small={true} />
              <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-yellow-300 shadow-sm z-10">
                {cards.length}
              </div>
            </div>
          ) : (
            /* Own cards or revealed: show all horizontally */
            cards.map((card, i) => (
              <Card
                key={i}
                card={card}
                faceDown={getCardFaceDown(i)}
                animated={getCardAnimated(i)}
                small={true}
              />
            ))
          )
        ) : (
          <div className="w-10 h-14 rounded border border-dashed border-white/20 bg-black/10 flex items-center justify-center">
            <span className="text-white/20 text-[10px]">🂠</span>
          </div>
        )}
        {/* Hint nặn bài */}
        {canPeek && cards.length > 0 && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] text-yellow-300 whitespace-nowrap animate-pulse pointer-events-none">
            Nhấn xem bài
          </div>
        )}
      </div>

      {/* Score */}
      {cards.length > 0 && canSeeScore && (
        <div className="text-[10px] font-black text-white bg-black/60 px-2 py-0.5 rounded-full border border-white/15 mb-0.5 mt-2">
          {score}
        </div>
      )}
      {cards.length > 0 && !canSeeScore && (
        <div className="text-[9px] font-bold text-gray-600 bg-black/20 px-2 py-0.5 rounded-full border border-white/5 mb-0.5 mt-2">
          {isMe ? `${peekCount}/2` : '?'}
        </div>
      )}

      {/* Status badge */}
      <div className={cn('text-[8px] font-bold uppercase tracking-wide', cfg.color)}>{cfg.label}</div>

      {/* Nặn bài prompt - must peek before acting */}
      {isMyTurn && gameStatus === 'playing' && st === 'playing' && !fullyPeeked && cards.length > 0 && (
        <div className="text-[8px] text-orange-300 font-bold animate-pulse mt-0.5">
          Nhấn bài để nặn ({peekCount}/2)
        </div>
      )}

      {/* Result overlay */}
      {showResult && player.result && resultConfig[player.result] && (
        <div className={cn('text-[9px] font-black uppercase mt-0.5', resultConfig[player.result].color)}>
          {resultConfig[player.result].label}
          {player.deltaM !== 0 && (
            <span className={player.deltaM > 0 ? ' text-green-400' : ' text-red-400'}>
              {' '}({player.deltaM > 0 ? '+' : ''}{formatMoney(player.deltaM)})
            </span>
          )}
        </div>
      )}

      {/* Time bar + controls */}
      {canAct && (
        <div className="w-full mt-1.5">
          {timeLeft !== undefined && (
            <div className="w-full h-1 bg-gray-800 rounded-full mb-1.5 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', timeLeft > 5 ? 'bg-green-500' : 'bg-red-500')}
                style={{ width: `${(timeLeft / TURN_DURATION) * 100}%` }}
              />
            </div>
          )}
          <div className="flex gap-1 w-full">
            <button
              onClick={onHit}
              className="flex-1 py-1.5 bg-blue-600 text-white font-bold text-[10px] rounded-lg border-b-2 border-blue-900 active:scale-95 transition-all"
            >
              Rút
            </button>
            <button
              onClick={canStand ? onStand : undefined}
              disabled={!canStand}
              className={cn(
                'flex-1 py-1.5 font-bold text-[10px] rounded-lg border-b-2 border-gray-900 transition-all',
                canStand ? 'bg-gray-700 text-white active:scale-95' : 'bg-gray-800/60 text-gray-600 cursor-not-allowed opacity-60'
              )}
            >
              {canStand ? 'Dừng' : `≥16 (${score})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
