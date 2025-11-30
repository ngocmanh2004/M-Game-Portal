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
    if (balance < selectedChip) {
      onShowNotification("Không đủ tiền!", 'loss');
      return;
    }

    playSound('money');
    setSelectedSide(side);
    setBetAmount(prev => prev + selectedChip);
    updateBalance(balance - selectedChip);
  };

  // Handler cho đặt nhanh
  const handleQuickBet = (amount: number) => {
    if (isRolling) {
      onShowNotification("Đang lắc xúc xắc, vui lòng đợi!", 'loss');
      return;
    }
    
    if (!selectedSide) {
      onShowNotification("Vui lòng chọn Tài hoặc Xỉu trước!", 'loss');
      return;
    }

    if (balance < amount) {
      onShowNotification("Không đủ tiền!", 'loss');
      return;
    }

    playSound('money');
    setBetAmount(prev => prev + amount);
    updateBalance(balance - amount);
    onShowNotification(`Đã đặt ${formatCurrency(amount)} vào ${selectedSide === 'tai' ? 'TÀI' : 'XỈU'}!`, 'win');
  };

  const handleRoll = () => {
    if (!selectedSide || betAmount === 0) {
      onShowNotification("Vui lòng đặt cược!", 'loss');
      return;
    }

    setIsRolling(true);
    playSound('dice');

    setTimeout(() => {
      const results = [
        getRandomInt(1, 6),
        getRandomInt(1, 6),
        getRandomInt(1, 6)
      ];
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

        if (activeBonus > 0) {
          setTimeout(() => {
            onShowNotification(`⚡ Bonus +${activeBonus}%`, 'win');
          }, 400);
        }
      } else {
        playSound('loss');
        onShowNotification(`Thua ${formatCurrency(betAmount)}!`, 'loss');
      }

      setTimeout(() => {
        setSelectedSide(null);
        setBetAmount(0);
        setIsRolling(false);
      }, 1500);
    }, 3000);
  };

  const total = diceResults.reduce((a, b) => a + b, 0);

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
          Tài Xỉu
        </h1>
        <div className="h-0.5 w-16 mx-auto mt-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full"></div>
      </div>

      {/* Dice Area - COMPACT */}
      <div className="relative bg-gradient-to-br from-red-950/30 to-yellow-950/30 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border-2 border-yellow-600/30">
        
        <div className="flex gap-1.5 sm:gap-2 justify-center mb-2">
          {diceResults.map((value, index) => (
            <Dice 
              key={index} 
              value={value} 
              type="numeric" 
              isRolling={isRolling}
              game="taixiu"
            />
          ))}
        </div>

        <div className="text-center">
          <div className="inline-block relative">
            <div className="relative bg-gradient-to-r from-red-700 to-yellow-700 rounded-xl px-4 py-2 border-2 border-yellow-400">
              <p className="text-white text-3xl font-black">{total}</p>
              <p className="text-white/90 text-[10px] sm:text-xs">
                {total >= 11 ? 'TÀI (11-17)' : 'XỈU (4-10)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Betting Buttons - COMPACT */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-xl">
        
        {/* TÀI */}
        <button
          onClick={() => handleBet('tai')}
          disabled={isRolling}
          className="group relative overflow-hidden rounded-lg transition-all active:scale-95"
        >
          <div className={`absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-800 rounded-lg blur ${selectedSide === 'tai' ? 'opacity-100' : 'opacity-60'} group-hover:opacity-100 transition-opacity`}></div>
          
          <div className={`relative bg-gradient-to-br from-red-700 to-red-900 rounded-lg p-3 border-2 ${selectedSide === 'tai' ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-red-600'}`}>
            <div className="text-white font-black text-2xl sm:text-3xl mb-1">
              TÀI
            </div>
            <div className="text-white/80 text-[10px] sm:text-xs font-semibold bg-black/30 rounded-full px-2 py-0.5 inline-block">
              11 - 17
            </div>
            {selectedSide === 'tai' && betAmount > 0 && (
              <div className="mt-2 bg-yellow-400 text-red-900 font-bold text-xs px-2 py-1 rounded border border-yellow-300">
                {formatCurrency(betAmount)}
              </div>
            )}
          </div>
        </button>

        {/* XỈU */}
        <button
          onClick={() => handleBet('xiu')}
          disabled={isRolling}
          className="group relative overflow-hidden rounded-lg transition-all active:scale-95"
        >
          <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg blur ${selectedSide === 'xiu' ? 'opacity-100' : 'opacity-60'} group-hover:opacity-100 transition-opacity`}></div>
          
          <div className={`relative bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg p-3 border-2 ${selectedSide === 'xiu' ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-blue-600'}`}>
            <div className="text-white font-black text-2xl sm:text-3xl mb-1">
              XỈU
            </div>
            <div className="text-white/80 text-[10px] sm:text-xs font-semibold bg-black/30 rounded-full px-2 py-0.5 inline-block">
              4 - 10
            </div>
            {selectedSide === 'xiu' && betAmount > 0 && (
              <div className="mt-2 bg-yellow-400 text-blue-900 font-bold text-xs px-2 py-1 rounded border border-yellow-300">
                {formatCurrency(betAmount)}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Roll Button - COMPACT */}
      <button
        onClick={handleRoll}
        disabled={isRolling || !selectedSide}
        className="group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-xs"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-yellow-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
        
        <div className={`relative bg-gradient-to-r from-red-700 to-yellow-700 px-6 py-2.5 rounded-lg border-2 border-yellow-400 ${isRolling ? 'animate-pulse' : ''}`}>
          <span className="text-white font-bold text-base">
            {isRolling ? 'Đang Lắc...' : 'Lắc Xúc Xắc'}
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