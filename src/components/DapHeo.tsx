import React, { useState, useEffect } from 'react';
import { PIG_TYPES } from '../constants';
import { PigType, SoundType } from '../types';
import { PigCard } from './PigCard';
import { PigDisplay } from './PigDisplay';
import { ResultPopup } from './ResultPopup';
import { BoomPopup } from './BoomPopup';
import { JackpotPopup } from './JackpotPopup';
import { Button } from './Button';
import { getRandomInt } from '../utils';
import { useUserData } from '../hooks/useUserData';
import { useAuth } from '../hooks/useAuth';

interface DapHeoProps {
  balance: number;
  updateBalance: (newBalance: number) => void;
  onShowNotification: (msg: string, type: 'win' | 'loss') => void;
  playSound: (type: SoundType) => void;
}

export const DapHeo: React.FC<DapHeoProps> = ({ balance, updateBalance, onShowNotification, playSound }) => {
  const [selectedPig, setSelectedPig] = useState<PigType | null>(null);
  const [isSmashing, setIsSmashing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showBoom, setShowBoom] = useState(false);
  const [showJackpot, setShowJackpot] = useState(false);
  const [reward, setReward] = useState(0);
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

  const handlePurchase = (pig: PigType) => {
    if (balance < pig.price) { onShowNotification("Không đủ tiền để mua heo này!", 'loss'); return; }
    playSound('money');
    updateBalance(balance - pig.price);
    setSelectedPig(pig);
    onShowNotification(`Đã mua ${pig.name}!`, 'win');
  };

  const handleSmash = () => {
    if (!selectedPig) { onShowNotification("Vui lòng chọn heo trước!", 'loss'); return; }
    setIsSmashing(true);
    playSound('pig');
    setTimeout(() => {
      const randomValue = Math.random();
      if (randomValue < selectedPig.boomChance) {
        playSound('loss');
        setTimeout(() => playSound('boom'), 100);
        setReward(0);
        setIsSmashing(false);
        setShowBoom(true);
        onShowNotification("HEO NỔ TUNG! Mất trắng!", 'loss');
      } else if (randomValue < selectedPig.boomChance + selectedPig.jackpotChance) {
        playSound('win');
        setTimeout(() => playSound('lucky'), 100);
        let jackpotReward = selectedPig.jackpotReward;
        if (activeBonus > 0) {
          const bonusAmount = Math.floor(jackpotReward * (activeBonus / 100));
          jackpotReward += bonusAmount;
          setTimeout(() => onShowNotification(`+${activeBonus}% Bonus = +${bonusAmount.toLocaleString()}đ!`, 'win'), 1500);
        }
        setReward(jackpotReward);
        updateBalance(balance + jackpotReward);
        setIsSmashing(false);
        setShowJackpot(true);
        onShowNotification(`NỔ HŨ! Trúng ${jackpotReward.toLocaleString()}đ!`, 'win');
      } else {
        playSound('win');
        let randomReward = getRandomInt(selectedPig.minReward, selectedPig.maxReward);
        if (activeBonus > 0) {
          const bonusAmount = Math.floor(randomReward * (activeBonus / 100));
          randomReward += bonusAmount;
          setTimeout(() => onShowNotification(`+${activeBonus}% Bonus = +${bonusAmount.toLocaleString()}đ!`, 'win'), 1000);
        }
        setReward(randomReward);
        updateBalance(balance + randomReward);
        setIsSmashing(false);
        setShowResult(true);
      }
      setSelectedPig(null);
    }, 2000);
  };

  const handleCloseResult = () => { setShowResult(false); setReward(0); };
  const handleCloseBoom = () => setShowBoom(false);
  const handleCloseJackpot = () => { setShowJackpot(false); setReward(0); };

  return (
    <>
      {/* Bonus fixed banner */}
      {activeBonus > 0 && (
        <div className="fixed top-16 left-0 right-0 z-[100] px-2 sm:px-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-2 text-center max-w-6xl mx-auto">
            <p className="text-amber-300 font-bold text-sm">Bonus +{activeBonus}% đang hoạt động</p>
          </div>
        </div>
      )}

      <div className={`flex flex-col items-center gap-5 w-full max-w-6xl mx-auto pb-8 px-3 ${activeBonus > 0 ? 'pt-20 sm:pt-24' : ''}`}>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Đập Heo Đất</h1>
          <p className="text-gray-400 text-sm mt-1">Chọn heo, đập thôi, nhận lộc liền tay!</p>
          <div className="h-0.5 w-20 mx-auto mt-2 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full" />
        </div>

        {/* Info badges */}
        {!activeBonus && (
          <div className="flex gap-2 flex-wrap justify-center">
            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full">
              Cơ hội Nổ Hũ!
            </span>
            <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-3 py-1 rounded-full">
              Cẩn thận BOOM!
            </span>
          </div>
        )}

        {/* Result Popups */}
        {showResult && <ResultPopup reward={reward} onClose={handleCloseResult} />}
        {showBoom && <BoomPopup onClose={handleCloseBoom} />}
        {showJackpot && <JackpotPopup reward={reward} onClose={handleCloseJackpot} />}

        {/* Pig Display Area */}
        <div className="w-full bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-5 sm:p-7">
          <PigDisplay pig={selectedPig} isSmashing={isSmashing} />
        </div>

        {/* Smash Button */}
        {selectedPig && !isSmashing && (
          <Button
            size="lg"
            onClick={handleSmash}
            className="px-10 sm:px-14 py-3 sm:py-4 text-lg sm:text-xl animate-pulse hover:animate-none shadow-[0_0_24px_rgba(99,102,241,0.5)]"
          >
            ĐẬP HEO NGAY!
          </Button>
        )}

        {isSmashing && (
          <div className="text-center">
            <p className="text-white text-lg sm:text-xl font-bold animate-bounce">Đang đập heo...</p>
          </div>
        )}

        {/* Pig Selection */}
        <div className="w-full">
          <h3 className="text-center font-black text-base sm:text-lg text-white mb-3">Chọn Heo Đất</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {PIG_TYPES.map((pig) => (
              <PigCard
                key={pig.id}
                pig={pig}
                onPurchase={handlePurchase}
                balance={balance}
                disabled={selectedPig !== null || isSmashing}
              />
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-4">
          <h4 className="font-bold text-white text-sm mb-2">Hướng dẫn</h4>
          <ul className="text-gray-400 text-xs sm:text-sm space-y-1">
            <li>Chọn mua heo → Đập heo → Nhận thưởng!</li>
            <li><strong className="text-white">Jackpot:</strong> 300K – 5M tùy heo</li>
            <li><strong className="text-white">BOOM:</strong> Mất trắng!</li>
            {activeBonus > 0 && (
              <li className="text-amber-400 font-bold">+{activeBonus}% Bonus!</li>
            )}
          </ul>
        </div>

        {/* Odds Table */}
        <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-4">
          <h4 className="font-bold text-white text-sm mb-3 text-center">Bảng Thưởng</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {PIG_TYPES.map((pig) => (
              <div key={pig.id} className={`bg-gradient-to-br ${pig.color} p-3 rounded-xl border border-white/20`}>
                <p className="text-white font-bold text-center text-xs mb-2">{pig.name}</p>
                <div className="text-[10px] text-white/80 space-y-0.5">
                  <p>Giá: {pig.price.toLocaleString()}đ</p>
                  <p>Thưởng: {pig.minReward.toLocaleString()}–{pig.maxReward.toLocaleString()}đ</p>
                  <p className="text-amber-300 font-bold">Jackpot: {pig.jackpotReward.toLocaleString()}đ</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};