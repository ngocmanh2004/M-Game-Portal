import React, { useState } from 'react';
import { formatMoney } from '../../../utils/xidach/gameLogic';

interface BettingPanelProps {
  player: any;
  minBet: number;
  timeLeft: number;
  onConfirmBet: (amount: number) => void;
  hasConfirmed: boolean;
}

const QUICK_BETS = [1, 2, 5, 10]; // multipliers of minBet

export const BettingPanel: React.FC<BettingPanelProps> = ({ player, minBet, timeLeft, onConfirmBet, hasConfirmed }) => {
  const [betInput, setBetInput] = useState(minBet);
  const balance = player?.money || 0;

  const handleQuick = (mult: number) => {
    const val = Math.min(minBet * mult, balance);
    setBetInput(val);
  };

  const handleConfirm = () => {
    const amount = Math.max(minBet, Math.min(betInput, balance));
    onConfirmBet(amount);
  };

  if (hasConfirmed) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-green-400 font-bold text-xs">✓ Đã đặt cược</div>
        <div className="text-[#FFD54F] font-mono text-sm">{formatMoney(player.bet || betInput)}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 bg-black/60 rounded-xl p-3 border border-yellow-600/50 w-full max-w-[200px]">
      {/* Timer */}
      <div className="flex items-center gap-1">
        <div className={`text-xs font-bold ${timeLeft <= 8 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
          ⏱ {timeLeft}s
        </div>
      </div>

      {/* Quick bet buttons */}
      <div className="flex gap-1 flex-wrap justify-center">
        {QUICK_BETS.map(mult => {
          const val = Math.min(minBet * mult, balance);
          return (
            <button
              key={mult}
              onClick={() => handleQuick(mult)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all active:scale-95 ${
                betInput === val ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-[#2C1810] border-[#5D4037] text-[#D7CCC8]'
              }`}
            >
              x{mult}
            </button>
          );
        })}
      </div>

      {/* Input */}
      <div className="flex items-center gap-1 w-full">
        <button onClick={() => setBetInput(Math.max(minBet, betInput - minBet))} className="w-6 h-6 rounded bg-[#3E2723] text-[#FFD54F] font-bold text-xs border border-[#5D4037] flex-shrink-0">-</button>
        <input
          type="number"
          min={minBet}
          max={balance}
          step={minBet}
          value={betInput}
          onChange={e => setBetInput(Math.max(minBet, Math.min(Number(e.target.value), balance)))}
          className="flex-1 bg-[#2C1810] border border-[#5D4037] rounded text-center text-[#FFD54F] text-xs font-mono py-0.5 w-0"
        />
        <button onClick={() => setBetInput(Math.min(balance, betInput + minBet))} className="w-6 h-6 rounded bg-[#3E2723] text-[#FFD54F] font-bold text-xs border border-[#5D4037] flex-shrink-0">+</button>
      </div>

      <div className="text-[8px] text-[#A1887F]">Số dư: {formatMoney(balance)}</div>

      <button
        onClick={handleConfirm}
        className="w-full py-1.5 bg-gradient-to-r from-red-700 to-red-600 text-white font-bold text-xs rounded-lg border-b-2 border-red-900 active:scale-95 transition-all"
      >
        Đặt {formatMoney(betInput)}
      </button>
    </div>
  );
};
