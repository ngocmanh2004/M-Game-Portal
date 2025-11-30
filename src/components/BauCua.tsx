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
  const [selectedBetTarget, setSelectedBetTarget] = useState<string | null>(null); // Để biết đặt vào ô nào
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
    if (balance < selectedChip) {
      onShowNotification("Không đủ tiền!", 'loss');
      return;
    }

    playSound('money');
    updateBalance(balance - selectedChip);
    setBets(prev => [...prev, { targetId: itemId, amount: selectedChip }]);
    setSelectedBetTarget(itemId); // Lưu ô vừa đặt
  };

  // Handler cho đặt nhanh
  const handleQuickBet = (amount: number) => {
    if (isRolling) {
      onShowNotification("Đang xóc đĩa, vui lòng đợi!", 'loss');
      return;
    }
    
    if (!selectedBetTarget) {
      onShowNotification("Vui lòng chọn ô cược trước!", 'loss');
      return;
    }

    if (balance < amount) {
      onShowNotification("Không đủ tiền!", 'loss');
      return;
    }

    playSound('money');
    updateBalance(balance - amount);
    setBets(prev => [...prev, { targetId: selectedBetTarget, amount }]);
    onShowNotification(`Đã đặt ${formatCurrency(amount)} vào ${BAU_CUA_ITEMS.find(i => i.id === selectedBetTarget)?.name}!`, 'win');
  };

  const calculateTotalBetOnItem = (itemId: string) => {
    return bets.filter(b => b.targetId === itemId).reduce((sum, b) => sum + b.amount, 0);
  };

  const rollDice = () => {
    if (bets.length === 0) {
      onShowNotification("Vui lòng đặt cược trước!", 'loss');
      return;
    }
    
    setIsRolling(true);
    playSound('effect');
    
    setTimeout(() => {
      const results = [
        BAU_CUA_ITEMS[getRandomInt(0, 5)].id,
        BAU_CUA_ITEMS[getRandomInt(0, 5)].id,
        BAU_CUA_ITEMS[getRandomInt(0, 5)].id
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

      if (matchCount > 0) {
        totalWin += totalBetAmount * (matchCount + 1);
      }
    });

    if (totalWin > 0 && activeBonus > 0) {
      const bonusAmount = Math.floor(totalWin * (activeBonus / 100));
      totalWin += bonusAmount;
    }

    if (totalWin > 0) {
      updateBalance(balance + totalWin);
      playSound('win');
      onShowNotification(`Thắng ${formatCurrency(totalWin)}!`, 'win');

      if (activeBonus > 0) {
        setTimeout(() => {
          onShowNotification(`⚡ Bonus +${activeBonus}%`, 'win');
        }, 400);
      }
    } else {
      const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
      playSound('loss');
      onShowNotification(`Thua ${formatCurrency(totalBet)}!`, 'loss');
    }
    
    setBets([]);
    setSelectedBetTarget(null); // Reset ô đã chọn
  };

  const getImage = (id: string) => BAU_CUA_ITEMS.find(i => i.id === id)?.image || '';

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4 w-full max-w-5xl mx-auto pb-4 px-3">
      
      {/* Bonus Banner - COMPACT */}
      {activeBonus > 0 && (
        <div className="w-full relative overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 animate-shine"></div>
          <div className="relative bg-gradient-to-r from-red-700 to-yellow-600 p-2 border-2 border-yellow-400">
            <p className="text-center text-white font-bold text-xs sm:text-sm">
              Bonus +{activeBonus}%
            </p>
          </div>
        </div>
      )}

      {/* Title - COMPACT */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-festive text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500">
          Bầu Cua Tôm Cá
        </h1>
        <div className="h-0.5 w-20 mx-auto mt-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full"></div>
      </div>

      {/* Dice Area - TĂNG KÍCH THƯỚC */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex justify-center items-center bg-gradient-to-br from-red-950/30 to-yellow-950/30 rounded-2xl border-2 border-yellow-600/30 backdrop-blur-sm">
        
        <div className="absolute inset-0 flex justify-center items-center z-0">
          <img src={ASSETS.plate} alt="Plate" className="w-full h-full object-contain drop-shadow-2xl" />
        </div>

        {!isRolling ? (
          <div className="absolute inset-0 flex gap-1 justify-center items-center z-10 p-6">
            {diceResults.map((id, index) => (
              <Dice 
                key={index} 
                value={getImage(id)} 
                type="icon" 
                isRolling={false}
                game="baucua"
              />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex gap-1 justify-center items-center z-10 p-6 opacity-20">
            {animatingDice.map((id, index) => (
              <Dice 
                key={index} 
                value={getImage(id)} 
                type="icon" 
                isRolling={true}
                game="baucua"
              />
            ))}
          </div>
        )}

        {isRolling && (
          <div className="absolute inset-0 z-20 flex justify-center items-center animate-shake">
            <img src={ASSETS.bowl} alt="Bowl" className="w-[90%] h-[90%] object-contain drop-shadow-2xl" />
          </div>
        )}
      </div>

      {/* Betting Grid - COMPACT */}
      <div className="w-full max-w-3xl">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {BAU_CUA_ITEMS.map((item, index) => {
            const currentBet = calculateTotalBetOnItem(item.id);
            const isSelected = selectedBetTarget === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handlePlaceBet(item.id)}
                disabled={isRolling}
                className="group relative overflow-hidden rounded-lg transition-all active:scale-95"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.color} rounded-lg blur opacity-60 group-hover:opacity-100 transition-opacity`}></div>

                <div className={`relative ${item.color} rounded-lg p-2 sm:p-3 border ${
                  isSelected ? 'border-yellow-400 border-2' : 'border-white/20'
                } min-h-[85px] sm:min-h-[100px] flex flex-col items-center justify-center`}>
                  
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mb-1 filter drop-shadow-lg transform group-hover:scale-110 transition-transform">
                    <img src={item.boardImage} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  
                  <div className="font-bold text-xs sm:text-sm text-white drop-shadow-md">
                    {item.name}
                  </div>
                  
                  {currentBet > 0 && (
                    <div className="mt-1 bg-yellow-400 text-red-900 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded border border-yellow-300">
                      {formatCurrency(currentBet)}
                    </div>
                  )}

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-red-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Roll Button - COMPACT */}
      <button
        onClick={rollDice}
        disabled={isRolling || bets.length === 0}
        className="group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-xs"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-yellow-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
        
        <div className={`relative bg-gradient-to-r from-red-700 to-yellow-700 px-6 py-2.5 rounded-lg border-2 border-yellow-400 ${isRolling ? 'animate-pulse' : ''}`}>
          <span className="text-white font-bold text-base">
            {isRolling ? 'Đang Xóc...' : 'Xóc Đĩa'}
          </span>
        </div>
      </button>

      {/* Betting Controls - COMPACT */}
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