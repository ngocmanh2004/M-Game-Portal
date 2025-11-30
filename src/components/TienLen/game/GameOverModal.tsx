import React from 'react';
import cn from 'classnames';
import { formatMoney, PlayerResult } from '../../../utils/tienlen/gameLogic';

interface GameOverModalProps {
  open: boolean;
  results: PlayerResult[];
  payouts: Record<string, number>;
  onClose: () => void;
  myUid: string;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  open, results, payouts, onClose, myUid
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl px-6 py-6 min-w-[320px] max-w-[95vw]">
        <div className="text-2xl font-bold text-center text-green-700 mb-2">Kết Quả Ván Bài</div>
        <table className="w-full mb-4">
          <thead>
            <tr className="text-sm text-gray-700">
              <th className="py-1">Hạng</th>
              <th className="py-1">Tên</th>
              <th className="py-1">Tiền</th>
              <th className="py-1">Thắng/Thua</th>
            </tr>
          </thead>
          <tbody>
            {results.map((p, idx) => (
              <tr key={p.uid} className={cn(
                "text-base",
                p.uid === myUid ? "font-bold text-blue-700" : "",
                p.isWinner ? "bg-yellow-100" : ""
              )}>
                <td className="text-center py-1">{p.finishPosition}</td>
                <td className="text-center py-1">{p.displayName}</td>
                <td className="text-center py-1">
                  {formatMoney(p.money + (payouts[p.uid] || 0))}đ
                  <span className={cn(
                    "ml-2 text-xs",
                    (payouts[p.uid] || 0) > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {payouts[p.uid] > 0 ? `+${formatMoney(payouts[p.uid])}` : payouts[p.uid] < 0 ? `${formatMoney(payouts[p.uid])}` : ''}
                  </span>
                </td>
                <td className="text-center py-1">
                  {p.isWinner ? "🥇 Nhất" : p.finishPosition === results.length ? "Bét" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="w-full py-2 rounded bg-green-600 text-white font-bold text-lg hover:bg-green-700 transition-all"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};