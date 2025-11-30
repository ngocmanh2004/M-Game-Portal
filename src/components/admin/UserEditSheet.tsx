import React, { useState } from 'react';
import { AdminUser } from '../../types/admin.types';
import { formatCurrency } from '../../utils';
import { BottomSheet } from './BottomSheet';

interface UserEditSheetProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: { money: number; isAdmin: boolean; isLocked: boolean }) => Promise<boolean>;
}

export const UserEditSheet: React.FC<UserEditSheetProps> = ({
  user,
  isOpen,
  onClose,
  onSave
}) => {
  const [money, setMoney] = useState(user?.money || 0);
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin || false);
  const [isLocked, setIsLocked] = useState(user?.isLocked || false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (user) {
      setMoney(user.money);
      setIsAdmin(user.isAdmin);
      setIsLocked(user.isLocked || false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    const success = await onSave(user.uid, { money, isAdmin, isLocked });
    setSaving(false);

    if (success) {
      onClose();
    }
  };

  const quickAmounts = [
    { label: '+100K', value: 100000 },
    { label: '+500K', value: 500000 },
    { label: '+1M', value: 1000000 },
    { label: '+10M', value: 10000000 }
  ];

  if (!user) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="full">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center pb-4 border-b border-white/10">
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`}
            alt={user.email}
            className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-yellow-400"
          />
          <h2 className="text-white font-bold text-xl">{user.email}</h2>
          <p className="text-white/60 text-sm">UID: {user.uid}</p>
        </div>

        {/* Money Section */}
        <div>
          <label className="text-white font-bold mb-2 block">💰 Số tiền</label>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <input
              type="number"
              value={money}
              onChange={(e) => setMoney(Number(e.target.value))}
              className="w-full bg-transparent text-yellow-400 text-2xl font-bold text-center outline-none"
            />
            <p className="text-white/50 text-sm text-center mt-2">
              {formatCurrency(money)}
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {quickAmounts.map((amount) => (
              <button
                key={amount.value}
                onClick={() => setMoney(money + amount.value)}
                className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors"
              >
                {amount.label}
              </button>
            ))}
          </div>

          {/* Increment/Decrement */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => setMoney(Math.max(0, money - 100000))}
              className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-3 rounded-lg text-xl"
            >
              - 100K
            </button>
            <button
              onClick={() => setMoney(money + 100000)}
              className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-3 rounded-lg text-xl"
            >
              + 100K
            </button>
          </div>
        </div>

        {/* Admin Toggle */}
        <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
          <div>
            <p className="text-white font-bold">👑 Quyền Admin</p>
            <p className="text-white/60 text-sm">Cấp quyền quản trị viên</p>
          </div>
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className={`relative w-16 h-8 rounded-full transition-colors ${
              isAdmin ? 'bg-yellow-400' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                isAdmin ? 'translate-x-8' : ''
              }`}
            />
          </button>
        </div>

        {/* Lock Toggle */}
        <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
          <div>
            <p className="text-white font-bold">🔒 Khóa tài khoản</p>
            <p className="text-white/60 text-sm">Chặn đăng nhập</p>
          </div>
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`relative w-16 h-8 rounded-full transition-colors ${
              isLocked ? 'bg-red-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                isLocked ? 'translate-x-8' : ''
              }`}
            />
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-50 active:scale-95 transition-all shadow-lg"
        >
          {saving ? '⏳ Đang lưu...' : '✅ Lưu thay đổi'}
        </button>
      </div>
    </BottomSheet>
  );
};