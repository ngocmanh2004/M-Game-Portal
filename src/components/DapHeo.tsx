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
    if (balance < pig.price) {
      onShowNotification("Không đủ tiền để mua heo này!", 'loss');
      return;
    }

    playSound('money');
    updateBalance(balance - pig.price);
    setSelectedPig(pig);
    onShowNotification(`Đã mua ${pig.name}! 🐷`, 'win');
  };

  const handleSmash = () => {
    if (!selectedPig) {
      onShowNotification("Vui lòng chọn heo trước!", 'loss');
      return;
    }

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
        onShowNotification("💣 HEO NỔ TUNG! Mất trắng!", 'loss');
      } 
      else if (randomValue < selectedPig.boomChance + selectedPig.jackpotChance) {
        playSound('win');
        setTimeout(() => playSound('lucky'), 100);
        
        // ⭐ DÙNG jackpotReward THAY VÌ maxReward
        let jackpotReward = selectedPig.jackpotReward;

        if (activeBonus > 0) {
          const bonusAmount = Math.floor(jackpotReward * (activeBonus / 100));
          jackpotReward += bonusAmount;
          setTimeout(() => {
            onShowNotification(`⚡ +${activeBonus}% Bonus = +${bonusAmount.toLocaleString()}đ!`, 'win');
          }, 1500);
        }

        setReward(jackpotReward);
        updateBalance(balance + jackpotReward);
        setIsSmashing(false);
        setShowJackpot(true);
        onShowNotification(`🎰 NỔ HŨ! Trúng ${jackpotReward.toLocaleString()}đ!`, 'win');
      } 
      else {
        playSound('win');
        
        let randomReward = getRandomInt(selectedPig.minReward, selectedPig.maxReward);

        if (activeBonus > 0) {
          const bonusAmount = Math.floor(randomReward * (activeBonus / 100));
          randomReward += bonusAmount;
          setTimeout(() => {
            onShowNotification(`⚡ +${activeBonus}% Bonus = +${bonusAmount.toLocaleString()}đ!`, 'win');
          }, 1000);
        }

        setReward(randomReward);
        updateBalance(balance + randomReward);
        setIsSmashing(false);
        setShowResult(true);
      }
      
      setSelectedPig(null);
    }, 2000);
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setReward(0);
  };

  const handleCloseBoom = () => {
    setShowBoom(false);
  };

  const handleCloseJackpot = () => {
    setShowJackpot(false);
    setReward(0);
  };

  return (
    <>
      {/* ⭐ FIXED POSITION - RA NGOÀI CONTAINER HOÀN TOÀN */}
      {activeBonus > 0 && (
        <div className="fixed top-16 left-0 right-0 z-[100] px-2 sm:px-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-3 sm:p-4 border-4 border-yellow-300 shadow-2xl animate-pulse max-w-6xl mx-auto">
            <p className="text-center text-white font-bold text-sm sm:text-base md:text-lg">
              ⚡ BONUS +{activeBonus}% ĐANG HOẠT ĐỘNG! ⚡
            </p>
          </div>
        </div>
      )}

      {/* ⭐ CONTAINER VỚI PADDING-TOP ĐỂ TRÁNH BỊ CHE */}
      <div className={`flex flex-col items-center gap-4 sm:gap-6 w-full max-w-6xl mx-auto pb-8 px-2 ${activeBonus > 0 ? 'pt-20 sm:pt-24' : ''}`}>
        
        {/* Game Title */}
        <div className="text-center">
          <h2 className="font-festive text-2xl sm:text-3xl md:text-4xl text-tet-yellow drop-shadow-lg mb-1 sm:mb-2">
            Đập Heo Đất - Nổ Hũ May Mắn 🐷
          </h2>
          <p className="text-white/90 text-xs sm:text-sm md:text-base italic">
            Chọn heo, đập thôi, nhận lộc liền tay! 💰
          </p>
          
          {/* CHỈ HIỂN THỊ KHI CHƯA CÓ BONUS */}
          {!activeBonus && (
            <div className="mt-2 flex flex-col sm:flex-row gap-2 justify-center items-center">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border-2 border-yellow-300">
                <p className="text-white text-[10px] sm:text-xs font-bold flex items-center gap-1">
                  🎰 Cơ hội NỔ HŨ!
                </p>
              </div>
              <div className="bg-red-600/80 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border-2 border-red-400">
                <p className="text-white text-[10px] sm:text-xs font-bold flex items-center gap-1">
                  ⚠️ Cẩn thận BOOM!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Result Popups */}
        {showResult && <ResultPopup reward={reward} onClose={handleCloseResult} />}
        {showBoom && <BoomPopup onClose={handleCloseBoom} />}
        {showJackpot && <JackpotPopup reward={reward} onClose={handleCloseJackpot} />}

        {/* Pig Display Area */}
        <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-tet-gold/50 p-4 sm:p-6 md:p-8 shadow-2xl">
          <PigDisplay pig={selectedPig} isSmashing={isSmashing} />
        </div>

        {/* Smash Button */}
        {selectedPig && !isSmashing && (
          <Button
            size="lg"
            onClick={handleSmash}
            className="px-8 sm:px-12 py-3 sm:py-4 text-xl sm:text-2xl animate-pulse hover:animate-none shadow-[0_0_30px_rgba(255,215,0,0.6)]"
          >
            ĐẬP HEO NGAY! 🔨
          </Button>
        )}

        {isSmashing && (
          <div className="text-center">
            <p className="text-tet-yellow text-lg sm:text-xl md:text-2xl font-bold animate-bounce drop-shadow-lg">
              Đang đập heo... 💥
            </p>
          </div>
        )}

        {/* Pig Selection */}
        <div className="w-full">
          <h3 className="text-center font-festive text-xl sm:text-2xl md:text-3xl text-tet-yellow mb-3 sm:mb-4 drop-shadow-lg">
            Chọn Heo Đất 🏮
          </h3>
          
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
        <div className="w-full bg-yellow-400/20 backdrop-blur-md border-2 border-yellow-500/50 rounded-xl p-3 sm:p-4">
          <h4 className="font-bold text-tet-yellow text-sm sm:text-base mb-2 flex items-center gap-2">
            <span>📌</span> Hướng dẫn:
          </h4>
          <ul className="text-white/90 text-xs sm:text-sm space-y-1">
            <li>🐷 Chọn mua heo → 🔨 Đập heo → 💰 Nhận thưởng!</li>
            <li>🎰 <strong>Jackpot:</strong> 300k - 5M tùy heo!</li>
            <li>💣 <strong>BOOM:</strong> Mất trắng!</li>
            {activeBonus > 0 && (
              <li className="text-yellow-300 font-bold">⚡ +{activeBonus}% Bonus!</li>
            )}
          </ul>
        </div>

        {/* Odds Table */}
        <div className="w-full bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-md border-2 border-purple-500/50 rounded-xl p-3 sm:p-4">
          <h4 className="font-bold text-purple-200 text-sm sm:text-base mb-2 text-center">
            📊 Bảng Thưởng
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {PIG_TYPES.map((pig) => (
              <div key={pig.id} className={`bg-gradient-to-br ${pig.color} p-2 rounded-lg border border-white/30`}>
                <p className="text-white font-bold text-center text-xs mb-1">{pig.name}</p>
                <div className="text-[10px] text-white/90 space-y-0.5">
                  <p>💵 {pig.price.toLocaleString()}đ</p>
                  <p>💰 {pig.minReward.toLocaleString()}-{pig.maxReward.toLocaleString()}đ</p>
                  <p className="text-yellow-300 font-bold">🎰 {pig.jackpotReward.toLocaleString()}đ</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};