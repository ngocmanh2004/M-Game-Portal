import React from 'react';

export const OrientationPrompt: React.FC = () => (
  <div className="orientation-prompt flex flex-col items-center justify-center min-h-screen bg-[#0B6623] text-white">
    <img
      src="https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyeXdvcDFianc1aGVmOGowY3hxY2txZWM2bHloaWJuMDU2cWM5ZXJtNSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/1DtYcLp3GDlY2RsVXd/source.gif"
      alt="Rotate phone"
      className="w-24 h-24 mb-4"
      style={{ filter: 'drop-shadow(0 0 8px #FFD700)' }}
    />
    <div className="text-xl font-bold mb-2">Vui lòng xoay ngang màn hình để chơi</div>
    <div className="text-sm opacity-80">Please rotate your device to landscape</div>
  </div>
);