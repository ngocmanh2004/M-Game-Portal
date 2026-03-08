import React, { useState, useEffect } from 'react';
import { CHIP_VALUES, ASSETS } from '../constants';
import { Bet, SoundType } from '../types';
import { BettingControls } from './BettingControls';
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
    <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full ${bgColor} border-4 border-yellow-500 shadow-xl flex items-center justify-center ${isAnimating ? 'animate-spin' : ''}`}>
      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${dotColor}`} />
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
  const [selectedBetTarget, setSelectedBetTarget] = useState<'CHAN' | 'LE' | null>(null);
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
          Math.random() > 0.5 ? 'white' : 'red',
        ]);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isShaking]);

  const handlePlaceBet = (target: 'CHAN' | 'LE') => {
    if (isShaking) return;
    if (balance < selectedChip) { onShowNotification("Không đủ tiền!", 'loss'); return; }
    playSound('money');
    updateBalance(balance - selectedChip);
    setBets(prev => [...prev, { targetId: target, amount: selectedChip }]);
    setSelectedBetTarget(target);
  };

  const handleQuickBet = (amount: number) => {
    if (isShaking) { onShowNotification("Đang xóc đĩa, vui lòng đợi!", 'loss'); return; }
    if (!selectedBetTarget) { onShowNotification("Vui lòng chọn cửa Chẵn hoặc Lẻ trước!", 'loss'); return; }
    if (balance < amount) { onShowNotification("Không đủ tiền!", 'loss'); return; }
    playSound('money');
    updateBalance(balance - amount);
    setBets(prev => [...prev, { targetId: selectedBetTarget, amount }]);
    onShowNotification(`Đã đặt ${formatCurrency(amount)} vào ${selectedBetTarget === 'CHAN' ? 'CHẴN' : 'LẺ'}!`, 'win');
  };

  const getBetAmount = (target: string) =>
    bets.filter(b => b.targetId === target).reduce((sum, b) => sum + b.amount, 0);

  const shakePlate = () => {
    if (bets.length === 0) { onShowNotification("Vui lòng đặt cửa!", 'loss'); return; }
    setIsShaking(true);
    setLastResult(null);
    playSound('effect');
    setTimeout(() => {
      const results: ('white' | 'red')[] = [
        Math.random() > 0.5 ? 'white' : 'red',
        Math.random() > 0.5 ? 'white' : 'red',
        Math.random() > 0.5 ? 'white' : 'red',
        Math.random() > 0.5 ? 'white' : 'red',
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
    setLastResult(`${redCount} Đỏ — ${outcome === 'CHAN' ? 'CHẴN' : 'LẺ'}`);
    let totalWin = 0;
    let returnedStake = 0;
    const winningBets = bets.filter(b => b.targetId === outcome);
    winningBets.forEach(b => { returnedStake += b.amount; totalWin += b.amount; });
    if (totalWin > 0 && activeBonus > 0) {
      const bonusAmount = Math.floor(totalWin * (activeBonus / 100));
      totalWin += bonusAmount;
      setTimeout(() => onShowNotification(`+${activeBonus}% Bonus = +${formatCurrency(bonusAmount)}!`, 'win'), 500);
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
    setSelectedBetTarget(null);
  };

  const displayTokens = isShaking ? animatingTokens : tokens;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl mx-auto pb-6 px-3">

      {/* Bonus banner */}
      {activeBonus > 0 && (
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-2 text-center">
          <p className="text-amber-300 font-bold text-sm">Bonus +{activeBonus}% đang hoạt động</p>
        </div>
      )}

      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Xóc Đĩa</h1>
        <div className="h-0.5 w-16 mx-auto mt-1.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full" />
      </div>

      {/* Tokens Area */}
      <div className="relative w-52 h-52 sm:w-60 sm:h-60 md:w-64 md:h-64 flex justify-center items-center bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl">
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

      {/* Last result */}
      {lastResult && !isShaking && (
        <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-center">
          <span className="text-amber-400 font-bold text-sm">{lastResult}</span>
        </div>
      )}

      {/* Shake Button */}
      <button
        onClick={shakePlate}
        disabled={isShaking || bets.length === 0}
        className="w-full max-w-xs py-3 rounded-2xl font-black text-base text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-900/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isShaking ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang Xóc...
          </span>
        ) : 'Xóc Đĩa'}
      </button>

      {/* Betting Panels */}
      <div className="flex gap-3 w-full max-w-sm">
        {/* CHẴN */}
        <button
          onClick={() => handlePlaceBet('CHAN')}
          disabled={isShaking}
          className={`
            flex-1 relative rounded-2xl border transition-all duration-200 active:scale-95
            min-h-[120px] flex flex-col items-center justify-center gap-2 p-4
            ${selectedBetTarget === 'CHAN'
              ? 'bg-rose-500/20 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
              : 'bg-black/50 border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:scale-[1.02]'
            }
            ${isShaking ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          <span className="font-black text-2xl sm:text-3xl text-white tracking-wide">CHẴN</span>
          <span className="text-xs text-gray-400 bg-black/40 border border-white/10 px-2 py-0.5 rounded-full">0, 2, 4 Đỏ</span>
          {getBetAmount('CHAN') > 0 && (
            <span className="text-xs font-bold text-amber-400 bg-black/60 border border-amber-400/30 px-2 py-0.5 rounded-full">
              {formatCurrency(getBetAmount('CHAN'))}
            </span>
          )}
          {selectedBetTarget === 'CHAN' && (
            <div className="absolute top-2 right-2 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        {/* LẺ */}
        <button
          onClick={() => handlePlaceBet('LE')}
          disabled={isShaking}
          className={`
            flex-1 relative rounded-2xl border transition-all duration-200 active:scale-95
            min-h-[120px] flex flex-col items-center justify-center gap-2 p-4
            ${selectedBetTarget === 'LE'
              ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
              : 'bg-black/50 border-white/10 hover:bg-sky-500/10 hover:border-sky-500/30 hover:scale-[1.02]'
            }
            ${isShaking ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          <span className="font-black text-2xl sm:text-3xl text-white tracking-wide">LẺ</span>
          <span className="text-xs text-gray-400 bg-black/40 border border-white/10 px-2 py-0.5 rounded-full">1, 3 Đỏ</span>
          {getBetAmount('LE') > 0 && (
            <span className="text-xs font-bold text-amber-400 bg-black/60 border border-amber-400/30 px-2 py-0.5 rounded-full">
              {formatCurrency(getBetAmount('LE'))}
            </span>
          )}
          {selectedBetTarget === 'LE' && (
            <div className="absolute top-2 right-2 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </div>

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