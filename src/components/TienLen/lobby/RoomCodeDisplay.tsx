import React from 'react';

interface RoomCodeDisplayProps {
  code: string;
}

export const RoomCodeDisplay: React.FC<RoomCodeDisplayProps> = ({ code }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/tien-len?room=${code}`;
    if (navigator.share) {
      navigator.share({ title: 'Mã phòng Tiến Lên', text: `Mã phòng: ${code}`, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Đã copy link phòng!');
    }
  };

  return (
    <div className="flex flex-col items-center mb-4">
      <div className="text-white text-lg font-semibold mb-1">Mã Phòng</div>
      <div className="flex items-center gap-2">
        <div className="bg-black/80 text-yellow-300 font-mono text-3xl px-6 py-2 rounded-lg border-2 border-yellow-400 tracking-widest shadow-lg">
          {code}
        </div>
        <button className="btn btn-secondary" onClick={handleCopy}>📋</button>
        <button className="btn btn-primary" onClick={handleShare}>🔗</button>
      </div>
    </div>
  );
};