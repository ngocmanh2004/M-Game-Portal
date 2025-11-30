import React, { useState, useEffect } from 'react';
import { CHIP_VALUES, ASSETS } from '../constants';
import { Bet, SoundType } from '../types';
import { BettingControls } from './BettingControls';
import { Button } from './Button';
import { formatCurrency } from '../utils';
import { useUserData } from '../hooks/useUserData';
import { useAuth } from '../hooks/useAuth';

interface XocDiaProps {
  balance: number;
  updateBalance: (newBalance: number) => void;
  onShowNotification: (msg: string, type: 'win' | 'loss') => void;
  playSound: (type: SoundType) => void;
}

interface TokenProps {
  color: 'white' | 'red';
  isAnimating: boolean;
}

const Token: React.FC<TokenProps> = ({ color, isAnimating }) => {
  const bgColor = color === 'white' ? 'bg-white' : 'bg-red-600';
  const dotColor = color === 'white' ? 'bg-red-600' : 'bg-white';

  return (
    <div
      className={`
        w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full ${bgColor} 
        border-4 border-yellow-500 shadow-xl flex items-center justify-center
        ${isAnimating ? 'animate-spin' : ''}
      `}
    >
      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${dotColor}`}></div>
    </div>
  );
};

export const XocDia: React.FC<XocDiaProps> = ({ balance, updateBalance, onShowNotification, playSound }) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [tokens, setTokens] = useState<('white' | 'red')[]>(['white', 'white', 'white', 'white']);
  const [animatingTokens, setAnimatingTokens] = useState<('white' | 'red')[]>(['red', 'red', 'red', 'red']);
  const [isShaking, setIsShaking] = useState(false);
  const [selectedChip, setSelectedChip] = useState<number>(CHIP_VALUES[0].value);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [selectedBetTarget, setSelectedBetTarget] = useState<'CHAN' | 'LE' | null>(null); // Để biết đặt vào cửa nào
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

  useEffect(() => {
    if (isShaking) {
      const interval = setInterval(() => {
        setAnimatingTokens([
          Math.random() > 0.5 ? 'white' : 'red',
          Math.random() > 0.5 ? 'white' : 'red',
          Math.random() > 0.5 ? 'white' : 'red',
          Math.random() > 0.5 ? 'white' : 'red'
        ]);
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isShaking]);

  const handlePlaceBet = (target: 'CHAN' | 'LE') => {
    if (isShaking) return;
    if (balance < selectedChip) {
      onShowNotification("Không đủ tiền!", 'loss');
      return;
    }
    playSound('money');
    updateBalance(balance - selectedChip);
    setBets(prev => [...prev, { targetId: target, amount: selectedChip }]);
    setSelectedBetTarget(target); // Lưu cửa vừa đặt
  };

  // Handler cho đặt nhanh
  const handleQuickBet = (amount: number) => {
    if (isShaking) {
      onShowNotification("Đang xóc đĩa, vui lòng đợi!", 'loss');
      return;
    }
    
    if (!selectedBetTarget) {
      onShowNotification("Vui lòng chọn cửa Chẵn hoặc Lẻ trước!", 'loss');
      return;
    }

    if (balance < amount) {
      onShowNotification("Không đủ tiền!", 'loss');
      return;
    }

    playSound('money');
    updateBalance(balance - amount);
    setBets(prev => [...prev, { targetId: selectedBetTarget, amount }]);
    onShowNotification(`Đã đặt ${formatCurrency(amount)} vào ${selectedBetTarget === 'CHAN' ? 'CHẴN' : 'LẺ'}!`, 'win');
  };

  const getBetAmount = (target: string) => {
    return bets.filter(b => b.targetId === target).reduce((sum, b) => sum + b.amount, 0);
  };

  const shakePlate = () => {
    if (bets.length === 0) {
      onShowNotification("Vui lòng đặt cửa!", 'loss');
      return;
    }

    setIsShaking(true);
    setLastResult(null);
    playSound('effect');

    setTimeout(() => {
      const results: ('white' | 'red')[] = [
        Math.random() > 0.5 ? 'white' : 'red',
        Math.random() > 0.5 ? 'white' : 'red',
        Math.random() > 0.5 ? 'white' : 'red',
        Math.random() > 0.5 ? 'white' : 'red'
      ];
      setTokens(results);
      setAnimatingTokens(results);
      setIsShaking(false);
      calculateResult(results);
    }, 2500);
  };

  const calculateResult = (results: ('white' | 'red')[]) => {
    const redCount = results.filter(t => t === 'red').length;
    const outcome = redCount % 2 === 0 ? 'CHAN' : 'LE';

    setLastResult(`${redCount} Đỏ - ${outcome === 'CHAN' ? 'CHẴN' : 'LẺ'}`);

    let totalWin = 0;
    let returnedStake = 0;
    
    const winningBets = bets.filter(b => b.targetId === outcome);
    
    winningBets.forEach(b => {
        returnedStake += b.amount;
        totalWin += b.amount;
    });

    if (totalWin > 0 && activeBonus > 0) {
      const bonusAmount = Math.floor(totalWin * (activeBonus / 100));
      totalWin += bonusAmount;
      setTimeout(() => {
        onShowNotification(`⚡ +${activeBonus}% Bonus = +${formatCurrency(bonusAmount)}!`, 'win');
      }, 500);
    }

    if (totalWin > 0) {
        updateBalance(balance + returnedStake + totalWin);
        onShowNotification(`Thắng ${formatCurrency(totalWin)}!`, 'win');
        playSound('win');
    } else {
        onShowNotification(`Về ${outcome === 'CHAN' ? 'Chẵn' : 'Lẻ'} (${redCount} Đỏ)`, 'loss');
        playSound('loss');
    }
    setBets([]);
    setSelectedBetTarget(null); // Reset cửa đã chọn
  };

  const displayTokens = isShaking ? animatingTokens : tokens;

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-3xl mx-auto pb-8 px-2">
      
      {activeBonus > 0 && (
        <div className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 border-4 border-yellow-300 shadow-2xl animate-pulse">
          <p className="text-center text-white font-bold text-lg">
            ⚡ BONUS +{activeBonus}% ĐANG HOẠT ĐỘNG! ⚡
          </p>
        </div>
      )}

      {/* Khu vực Xóc Đĩa - Nhỏ hơn */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex justify-center items-center mt-2 sm:mt-4">
        
        <div className="absolute inset-0 flex justify-center items-center z-0">
           <img src={ASSETS.plate} alt="Plate" className="w-full h-full object-contain drop-shadow-2xl" />
        </div>

        {!isShaking ? (
          <div className="absolute inset-0 grid grid-cols-2 gap-2 sm:gap-3 p-12 sm:p-16 z-10">
            {displayTokens.map((color, i) => (
              <div key={i} className="flex items-center justify-center">
                <Token color={color} isAnimating={false} />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 grid grid-cols-2 gap-2 sm:gap-3 p-12 sm:p-16 z-10 opacity-20">
            {animatingTokens.map((color, i) => (
              <div key={i} className="flex items-center justify-center">
                <Token color={color} isAnimating={true} />
              </div>
            ))}
          </div>
        )}

        {isShaking && (
           <div className="absolute inset-0 z-20 flex justify-center items-center animate-shake">
             <img src={ASSETS.bowl} alt="Bowl" className="w-[90%] h-[90%] object-contain drop-shadow-2xl" />
           </div>
        )}
      </div>

      {lastResult && !isShaking && (
         <div className="text-center -mt-2 z-30">
             <span className="bg-tet-yellow text-red-900 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full font-bold text-sm sm:text-base border-2 border-red-600 inline-block">
                 {lastResult}
             </span>
         </div>
      )}

      <Button 
        size="sm" 
        onClick={shakePlate} 
        disabled={isShaking || bets.length === 0}
        className="px-6 py-2 text-base sm:text-lg"
      >
        {isShaking ? 'Đang Xóc...' : 'Xóc Đĩa! 🥏'}
      </Button>

      {/* Bảng đặt cược - Nhỏ gọn hơn */}
      <div className="flex flex-row w-full gap-2 sm:gap-3 mt-2">
        
        <button
          onClick={() => handlePlaceBet('CHAN')}
          disabled={isShaking}
          className={`
            flex-1 rounded-lg sm:rounded-xl border-3 
            flex flex-col items-center justify-center relative overflow-hidden 
            transition-all min-h-[110px] sm:min-h-[130px]
            ${isShaking ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10 active:scale-95'}
            bg-gradient-to-br from-red-900 to-red-700 backdrop-blur-sm shadow-xl group
            ${selectedBetTarget === 'CHAN' ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-white/30'}
          `}
        >
          <div className="z-10 text-center px-2 py-1">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-transform group-hover:scale-105">
              CHẴN
            </div>
            <div className="text-red-200 text-[10px] sm:text-xs font-bold mt-0.5 bg-black/30 px-1.5 py-0.5 rounded-full">
              0, 2, 4 Đỏ
            </div>
          </div>
          
          {getBetAmount('CHAN') > 0 && (
            <>
              <div className="mt-1 text-sm sm:text-base text-yellow-400 font-mono font-bold bg-black/60 px-2 py-0.5 rounded border border-yellow-400 z-20">
                {formatCurrency(getBetAmount('CHAN'))}
              </div>
              <div className="absolute inset-0 bg-red-500/20 animate-pulse border-2 border-yellow-400 rounded-lg"></div>
            </>
          )}

          {/* Selected indicator */}
          {selectedBetTarget === 'CHAN' && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center z-30">
              <svg className="w-3 h-3 text-red-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        <button
          onClick={() => handlePlaceBet('LE')}
          disabled={isShaking}
          className={`
            flex-1 rounded-lg sm:rounded-xl border-3
            flex flex-col items-center justify-center relative overflow-hidden 
            transition-all min-h-[110px] sm:min-h-[130px]
            ${isShaking ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10 active:scale-95'}
            bg-gradient-to-br from-blue-900 to-blue-700 backdrop-blur-sm shadow-xl group
            ${selectedBetTarget === 'LE' ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-white/30'}
          `}
        >
          <div className="z-10 text-center px-2 py-1">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-transform group-hover:scale-105">
              LẺ
            </div>
            <div className="text-blue-200 text-[10px] sm:text-xs font-bold mt-0.5 bg-black/30 px-1.5 py-0.5 rounded-full">
              1, 3 Đỏ
            </div>
          </div>
          
          {getBetAmount('LE') > 0 && (
            <>
              <div className="mt-1 text-sm sm:text-base text-yellow-400 font-mono font-bold bg-black/60 px-2 py-0.5 rounded border border-yellow-400 z-20">
                {formatCurrency(getBetAmount('LE'))}
              </div>
              <div className="absolute inset-0 bg-blue-500/20 animate-pulse border-2 border-yellow-400 rounded-lg"></div>
            </>
          )}

          {/* Selected indicator */}
          {selectedBetTarget === 'LE' && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center z-30">
              <svg className="w-3 h-3 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </div>

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