import React, { useState, useEffect } from 'react';
import { CHIP_VALUES } from '../constants';
import { SoundType } from '../types';
import { Dice } from './Dice';
import { BettingControls } from './BettingControls';
import { formatCurrency, getRandomInt } from '../utils';
import { useUserData } from '../hooks/useUserData';
import { useAuth } from '../hooks/useAuth';

interface TaiXiuProps {
  balance: number;
  updateBalance: (newBalance: number) => void;
  onShowNotification: (msg: string, type: 'win' | 'loss') => void;
  playSound: (type: SoundType) => void;
}

export const TaiXiu: React.FC<TaiXiuProps> = ({ balance, updateBalance, onShowNotification, playSound }) => {
  const [selectedSide, setSelectedSide] = useState<'tai' | 'xiu' | null>(null);
  const [betAmount, setBetAmount] = useState(0);
  const [diceResults, setDiceResults] = useState<number[]>([1, 2, 3]);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedChip, setSelectedChip] = useState<number>(CHIP_VALUES[0].value);
  const { user } = useAuth();
  const { getActiveBonus } = useUserData(user?.uid);
  const [activeBonus, setActiveBonus] = useState(0);

  useEffect(() => {
    const loadBonus = async () => {
      const bonus = await getActiveBonus();
      setActiveBonus(bonus);
    };
    loadBonus();
  }, [getActiveBonus]);

  const handleBet = (side: 'tai' | 'xiu') => {
    if (isRolling) return;
    if (balance < selectedChip) { onShowNotification("Không đủ tiền!", 'loss'); return; }
    playSound('money');
    setSelectedSide(side);
    setBetAmount(prev => prev + selectedChip);
    updateBalance(balance - selectedChip);
  };

  const handleQuickBet = (amount: number) => {
    if (isRolling) { onShowNotification("Đang lắc xúc xắc, vui lòng đợi!", 'loss'); return; }
    if (!selectedSide) { onShowNotification("Vui lòng chọn Tài hoặc Xỉu trước!", 'loss'); return; }
    if (balance < amount) { onShowNotification("Không đủ tiền!", 'loss'); return; }
    playSound('money');
    setBetAmount(prev => prev + amount);
    updateBalance(balance - amount);
    onShowNotification(`Đã đặt ${formatCurrency(amount)} vào ${selectedSide === 'tai' ? 'TÀI' : 'XỈU'}!`, 'win');
  };

  const handleRoll = () => {
    if (!selectedSide || betAmount === 0) { onShowNotification("Vui lòng đặt cược!", 'loss'); return; }
    setIsRolling(true);
    playSound('dice');
    setTimeout(() => {
      const results = [getRandomInt(1, 6), getRandomInt(1, 6), getRandomInt(1, 6)];
      setDiceResults(results);
      const total = results.reduce((a, b) => a + b, 0);
      const result: 'tai' | 'xiu' = total >= 11 ? 'tai' : 'xiu';
      let winAmount = 0;
      if (result === selectedSide) {
        winAmount = betAmount * 2;
        if (activeBonus > 0) {
          const bonusAmount = Math.floor(winAmount * (activeBonus / 100));
          winAmount += bonusAmount;
        }
        updateBalance(balance + winAmount);
        playSound('win');
        onShowNotification(`Thắng ${formatCurrency(winAmount)}!`, 'win');
        if (activeBonus > 0) setTimeout(() => onShowNotification(`Bonus +${activeBonus}%`, 'win'), 400);
      } else {
        playSound('loss');
        onShowNotification(`Thua ${formatCurrency(betAmount)}!`, 'loss');
      }
      setTimeout(() => { setSelectedSide(null); setBetAmount(0); setIsRolling(false); }, 1500);
    }, 3000);
  };

  const total = diceResults.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto pb-6 px-3">

      {/* Bonus banner */}
      {activeBonus > 0 && (
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-2 text-center">
          <p className="text-amber-300 font-bold text-sm">Bonus +{activeBonus}% đang hoạt động</p>
        </div>
      )}

      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Tài Xỉu</h1>
        <div className="h-0.5 w-16 mx-auto mt-1.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full" />
      </div>

      {/* Dice Area */}
      <div className="w-full max-w-xs bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-5">
        <div className="flex gap-2 sm:gap-3 justify-center mb-4">
          {diceResults.map((value, index) => (
            <Dice key={index} value={value} type="numeric" isRolling={isRolling} game="taixiu" />
          ))}
        </div>
        <div className="text-center">
          <div className="inline-block bg-black/50 border border-white/10 rounded-xl px-6 py-2.5">
            <p className="text-white text-3xl font-black">{total}</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {total >= 11 ? 'TÀI (11–17)' : 'XỈU (4–10)'}
            </p>
          </div>
        </div>
      </div>

      {/* Betting Panels */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {/* TÀI */}
        <button
          onClick={() => handleBet('tai')}
          disabled={isRolling}
          className={`
            group relative rounded-2xl border transition-all duration-200 active:scale-95
            min-h-[120px] sm:min-h-[140px] flex flex-col items-center justify-center gap-2 p-4
            ${selectedSide === 'tai'
              ? 'bg-rose-500/20 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
              : 'bg-black/50 border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:scale-[1.02]'
            }
            ${isRolling ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          <span className="font-black text-3xl sm:text-4xl text-white tracking-wide">TÀI</span>
          <span className="text-xs text-gray-400 bg-black/40 border border-white/10 px-2.5 py-0.5 rounded-full">11 – 17</span>
          {selectedSide === 'tai' && betAmount > 0 && (
            <span className="text-xs font-bold text-amber-400 bg-black/60 border border-amber-400/30 px-2 py-0.5 rounded-full">
              {formatCurrency(betAmount)}
            </span>
          )}
        </button>

        {/* XỈU */}
        <button
          onClick={() => handleBet('xiu')}
          disabled={isRolling}
          className={`
            group relative rounded-2xl border transition-all duration-200 active:scale-95
            min-h-[120px] sm:min-h-[140px] flex flex-col items-center justify-center gap-2 p-4
            ${selectedSide === 'xiu'
              ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
              : 'bg-black/50 border-white/10 hover:bg-sky-500/10 hover:border-sky-500/30 hover:scale-[1.02]'
            }
            ${isRolling ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          <span className="font-black text-3xl sm:text-4xl text-white tracking-wide">XỈU</span>
          <span className="text-xs text-gray-400 bg-black/40 border border-white/10 px-2.5 py-0.5 rounded-full">4 – 10</span>
          {selectedSide === 'xiu' && betAmount > 0 && (
            <span className="text-xs font-bold text-amber-400 bg-black/60 border border-amber-400/30 px-2 py-0.5 rounded-full">
              {formatCurrency(betAmount)}
            </span>
          )}
        </button>
      </div>

      {/* Roll Button */}
      <button
        onClick={handleRoll}
        disabled={isRolling || !selectedSide}
        className="w-full max-w-xs py-3 rounded-2xl font-black text-base text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-900/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRolling ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang Lắc...
          </span>
        ) : 'Lắc Xúc Xắc'}
      </button>

      {/* Betting Controls */}
      <BettingControls
        selectedChip={selectedChip}
        onSelectChip={setSelectedChip}
        balance={balance}
        playSound={playSound}
        onQuickBet={handleQuickBet}
      />
    </div>
  );
};