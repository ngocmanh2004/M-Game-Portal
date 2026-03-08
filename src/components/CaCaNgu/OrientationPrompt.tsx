import React from 'react';

export const OrientationPrompt: React.FC = () => (
  <div
    className="fixed inset-0 flex flex-col items-center justify-center z-50"
    style={{ background: '#1a0a00' }}
  >
    <div className="text-6xl mb-6 animate-bounce select-none">📱</div>
    <div
      className="text-xl font-bold text-center px-8 mb-3"
      style={{ color: '#FFD700' }}
    >
      Vui lòng xoay ngang thiết bị để chơi Cờ Cá Ngựa
    </div>
    <div className="text-sm" style={{ color: '#A1887F' }}>
      Please rotate your device to landscape
    </div>
  </div>
);
