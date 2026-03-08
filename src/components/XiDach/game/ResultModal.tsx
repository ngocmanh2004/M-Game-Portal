import React from 'react';
import { formatMoney, calculateScore } from '../../../utils/xidach/gameLogic';
import cn from 'classnames';

interface ResultModalProps {
  game: any;
  myUid: string;
  onNextRound: () => void;
  onLeave: () => void;
  isHost: boolean;
  countdown: number;
}

const resultLabels: Record<string, { label: string; color: string; icon: string }> = {
  win:       { label: 'THẮNG', color: 'text-green-400', icon: '🏆' },
  lose:      { label: 'THUA', color: 'text-red-400', icon: '💸' },
  draw:      { label: 'HÒA', color: 'text-gray-300', icon: '🤝' },
  xidach:    { label: 'XÌ DÁCH', color: 'text-yellow-400', icon: '⭐' },
  xibang:    { label: 'XÌ BÀNG', color: 'text-yellow-300', icon: '✨' },
  fiveCards: { label: '5 LÁ', color: 'text-cyan-400', icon: '🃏' },
};

const handStatusLabel: Record<string, { text: string; color: string }> = {
  stand:     { text: 'Dừng', color: 'text-gray-300' },
  busted:    { text: 'QUẮC', color: 'text-red-400' },
  xidach:    { text: 'Xì Dách', color: 'text-yellow-300' },
  xibang:    { text: 'Xì Bàng', color: 'text-yellow-300' },
  fiveCards: { text: 'Ngũ Linh', color: 'text-cyan-300' },
};

export const ResultModal: React.FC<ResultModalProps> = ({ game, myUid, onNextRound, onLeave, isHost, countdown }) => {
  const players = game.players || {};
  const playerOrder: string[] = game.playerOrder || Object.keys(players);
  const isHost_ = game.hostUid === myUid;
  const dealer = game.dealer || {};
  const dealerScore = dealer.score || calculateScore(dealer.cards || []);
  const dealerHandLabel = handStatusLabel[dealer.status] || { text: dealer.status || '', color: 'text-gray-400' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      <div className="relative w-full max-w-sm bg-[#3E2723] rounded-2xl border-[3px] border-[#FFD54F] shadow-2xl p-4">
        <h2 className="text-[#FFD54F] font-black text-center text-lg uppercase tracking-wider mb-3">Kết Quả Ván</h2>

        {/* Dealer result */}
        <div className="mb-3 p-2 bg-black/40 rounded-lg border border-red-700/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={game.hostPhoto || '/assets/image/icons/user.png'} alt="Nhà Cái" className="w-7 h-7 rounded-full border border-red-500 object-cover flex-shrink-0" />
              <div>
                <div className="text-[9px] text-red-400 font-bold uppercase leading-none">Nhà Cái</div>
                <div className="text-white text-[10px] font-bold leading-none">{game.hostName || 'Dealer'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#FFD54F] font-black text-sm leading-none">{dealerScore} điểm</div>
              <div className={cn('text-[9px] font-bold uppercase', dealerHandLabel.color)}>{dealerHandLabel.text}</div>
            </div>
          </div>
        </div>

        {/* Players results */}
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto mb-3">
          {playerOrder.map((pos: string) => {
            const player = players[pos];
            if (!player) return null;
            const result = player.result || 'lose';
            const cfg = resultLabels[result] || { label: result, color: 'text-white', icon: '?' };
            const isMe = player.uid === myUid;
            const playerScore = player.score || calculateScore(player.cards || []);
            const handLabel = handStatusLabel[player.status] || { text: player.status || '', color: 'text-gray-400' };
            return (
              <div key={pos} className={cn(
                'flex items-center gap-2 p-2 rounded-lg border',
                isMe ? 'border-yellow-500/60 bg-yellow-900/20' : 'border-white/10 bg-black/20'
              )}>
                <img src={player.photoURL || '/assets/image/icons/user.png'} alt={player.displayName} className="w-7 h-7 rounded-full border border-white/20 object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[10px] font-bold truncate leading-tight">
                    {player.displayName}{isMe && ' (bạn)'}{player.isBot && ' 🤖'}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[#FFD54F] text-[9px] font-mono font-bold">{playerScore}đ</span>
                    {handLabel.text && (
                      <span className={cn('text-[8px] font-bold uppercase', handLabel.color)}>{handLabel.text}</span>
                    )}
                    <span className="text-gray-500 text-[8px]">cược {formatMoney(player.bet || 0)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={cn('text-[10px] font-black', cfg.color)}>{cfg.icon} {cfg.label}</div>
                  <div className={cn('text-[9px] font-bold', (player.deltaM || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {(player.deltaM || 0) > 0 ? '+' : ''}{formatMoney(player.deltaM || 0)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isHost_ ? (
            <button
              onClick={onNextRound}
              className="flex-1 py-2 bg-gradient-to-r from-red-700 to-red-500 text-white font-bold text-xs rounded-lg border-b-2 border-red-900 active:scale-95 transition-all"
            >
              Ván Tiếp ({countdown}s)
            </button>
          ) : (
            <div className="flex-1 text-center text-[#A1887F] text-xs py-2">
              Đợi nhà cái... ({countdown}s)
            </div>
          )}
          <button
            onClick={onLeave}
            className="px-3 py-2 bg-[#5D4037] text-[#D7CCC8] font-bold text-xs rounded-lg border border-[#8D6E63] active:scale-95 transition-all"
          >
            Rời
          </button>
        </div>
      </div>
    </div>
  );
};
