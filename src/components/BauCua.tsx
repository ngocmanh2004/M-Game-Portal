import React, { useState, useEffect } from 'react';
import { BAU_CUA_ITEMS, CHIP_VALUES, ASSETS } from '../constants';
import { Bet, SoundType } from '../types';
import { Dice } from './Dice';
import { BettingControls } from './BettingControls';
import { formatCurrency, getRandomInt } from '../utils';
import { useUserData } from '../hooks/useUserData';
import { useAuth } from '../hooks/useAuth';

interface BauCuaProps {
  balance: number;
  updateBalance: (newBalance: number) => void;
  onShowNotification: (msg: string, type: 'win' | 'loss') => void;
  playSound: (type: SoundType) => void;
}

export const BauCua: React.FC<BauCuaProps> = ({ balance, updateBalance, onShowNotification, playSound }) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [diceResults, setDiceResults] = useState<string[]>(['bau', 'cua', 'nai']);
  const [animatingDice, setAnimatingDice] = useState<string[]>(['nai', 'nai', 'nai']);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedChip, setSelectedChip] = useState<number>(CHIP_VALUES[0].value);
  const [selectedBetTarget, setSelectedBetTarget] = useState<string | null>(null);
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

  const handlePlaceBet = (itemId: string) => {
    if (isRolling) return;
    if (balance < selectedChip) { onShowNotification("Không đủ tiền!", 'loss'); return; }
    playSound('money');
    updateBalance(balance - selectedChip);
    setBets(prev => [...prev, { targetId: itemId, amount: selectedChip }]);
    setSelectedBetTarget(itemId);
  };

  const handleQuickBet = (amount: number) => {
    if (isRolling) { onShowNotification("Đang xóc đĩa, vui lòng đợi!", 'loss'); return; }
    if (!selectedBetTarget) { onShowNotification("Vui lòng chọn ô cược trước!", 'loss'); return; }
    if (balance < amount) { onShowNotification("Không đủ tiền!", 'loss'); return; }
    playSound('money');
    updateBalance(balance - amount);
    setBets(prev => [...prev, { targetId: selectedBetTarget, amount }]);
    onShowNotification(`Đã đặt ${formatCurrency(amount)} vào ${BAU_CUA_ITEMS.find(i => i.id === selectedBetTarget)?.name}!`, 'win');
  };

  const calculateTotalBetOnItem = (itemId: string) =>
    bets.filter(b => b.targetId === itemId).reduce((sum, b) => sum + b.amount, 0);

  const rollDice = () => {
    if (bets.length === 0) { onShowNotification("Vui lòng đặt cược trước!", 'loss'); return; }
    setIsRolling(true);
    playSound('effect');
    setTimeout(() => {
      const results = [
        BAU_CUA_ITEMS[getRandomInt(0, 5)].id,
        BAU_CUA_ITEMS[getRandomInt(0, 5)].id,
        BAU_CUA_ITEMS[getRandomInt(0, 5)].id,
      ];
      setDiceResults(results);
      setAnimatingDice(results);
      setIsRolling(false);
      calculateWinnings(results);
    }, 2500);
  };

  const calculateWinnings = (results: string[]) => {
    let totalWin = 0;
    const uniqueBetTargets = Array.from(new Set(bets.map(b => b.targetId)));
    uniqueBetTargets.forEach(targetId => {
      const totalBetAmount = bets.filter(b => b.targetId === targetId).reduce((s, b) => s + b.amount, 0);
      const matchCount = results.filter(r => r === targetId).length;
      if (matchCount > 0) totalWin += totalBetAmount * (matchCount + 1);
    });
    if (totalWin > 0 && activeBonus > 0) {
      const bonusAmount = Math.floor(totalWin * (activeBonus / 100));
      totalWin += bonusAmount;
    }
    if (totalWin > 0) {
      updateBalance(balance + totalWin);
      playSound('win');
      onShowNotification(`Thắng ${formatCurrency(totalWin)}!`, 'win');
      if (activeBonus > 0) setTimeout(() => onShowNotification(`Bonus +${activeBonus}%`, 'win'), 400);
    } else {
      const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
      playSound('loss');
      onShowNotification(`Thua ${formatCurrency(totalBet)}!`, 'loss');
    }
    setBets([]);
    setSelectedBetTarget(null);
  };

  const getImage = (id: string) => BAU_CUA_ITEMS.find(i => i.id === id)?.image || '';

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
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Bầu Cua Tôm Cá</h1>
        <div className="h-0.5 w-20 mx-auto mt-1.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full" />
      </div>

      {/* Dice Area */}
      <div className="relative w-60 h-60 sm:w-72 sm:h-72 flex justify-center items-center bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl">
        <div className="absolute inset-0 flex justify-center items-center z-0">
          <img src={ASSETS.plate} alt="Plate" className="w-full h-full object-contain drop-shadow-2xl" />
        </div>
        {!isRolling ? (
          <div className="absolute inset-0 flex gap-1 justify-center items-center z-10 p-6">
            {diceResults.map((id, index) => (
              <Dice key={index} value={getImage(id)} type="icon" isRolling={false} game="baucua" />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex gap-1 justify-center items-center z-10 p-6 opacity-20">
            {animatingDice.map((id, index) => (
              <Dice key={index} value={getImage(id)} type="icon" isRolling={true} game="baucua" />
            ))}
          </div>
        )}
        {isRolling && (
          <div className="absolute inset-0 z-20 flex justify-center items-center animate-shake">
            <img src={ASSETS.bowl} alt="Bowl" className="w-[90%] h-[90%] object-contain drop-shadow-2xl" />
          </div>
        )}
      </div>

      {/* Betting Grid */}
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {BAU_CUA_ITEMS.map((item) => {
            const currentBet = calculateTotalBetOnItem(item.id);
            const isSelected = selectedBetTarget === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handlePlaceBet(item.id)}
                disabled={isRolling}
                className={`
                  group relative rounded-2xl border transition-all duration-200 active:scale-95
                  min-h-[90px] sm:min-h-[110px] flex flex-col items-center justify-center gap-1.5 p-3
                  ${isSelected
                    ? 'bg-black/70 border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.3)]'
                    : 'bg-black/50 border-white/10 hover:bg-black/70 hover:border-white/25 hover:scale-[1.02]'
                  }
                  ${isRolling ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 transform group-hover:scale-110 transition-transform">
                  <img src={item.boardImage} alt={item.name} className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-xs sm:text-sm text-white">{item.name}</span>
                {currentBet > 0 && (
                  <span className="text-[10px] sm:text-xs font-bold text-amber-400 bg-black/60 border border-amber-400/30 px-2 py-0.5 rounded-full">
                    {formatCurrency(currentBet)}
                  </span>
                )}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Roll Button */}
      <button
        onClick={rollDice}
        disabled={isRolling || bets.length === 0}
        className="w-full max-w-xs py-3 rounded-2xl font-black text-base text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-900/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRolling ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang Xóc...
          </span>
        ) : 'Xóc Đĩa'}
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