import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { useInventory } from '../hooks/useInventory';
import { Button } from './Button';
import { SHOP_ITEMS } from '../constants';
import { ItemType, SoundType } from '../types';

interface DashboardProps {
  playSound: (type: SoundType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ playSound }) => {
  const { user } = useAuth();
  const { userData, loading, updateTask, checkin } = useUserData(user?.uid);
  const {
    loading: inventoryLoading,   // ⭐ BỎ items
    consumeTetItem,
    getDashboardItems,
    getActiveBonus
  } = useInventory(user?.uid);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [usingItem, setUsingItem] = useState<string | null>(null);
  const [itemAnimation, setItemAnimation] = useState<{ itemId: string; animation: string } | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleTask = async (taskName: 'followTiktok' | 'subscribeYoutube', url: string) => {
    // ⭐ MỞ LINK NGAY
    window.open(url, '_blank');

    // ⭐ HIỆN THÔNG BÁO ĐANG ĐỢI
    setMessage({
      text: '⏳ Đang kiểm tra... Vui lòng đợi 3 giây!',
      type: 'success'
    });

    // ⭐ ĐỢI 3 GIÂY RỒI TỰ ĐỘNG CỘNG TIỀN
    await new Promise(resolve => setTimeout(resolve, 3000));

    const result = await updateTask(taskName);
    if (result) {
      playSound(result.success ? 'win' : 'loss');
      setMessage({
        text: result.message,
        type: result.success ? 'success' : 'error'
      });

      // ⭐ TỰ ĐỘNG ẨN THÔNG BÁO SAU 2 GIÂY
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleCheckin = async () => {
    const result = await checkin();
    if (result) {
      playSound(result.success ? 'money' : 'loss');
      setMessage({
        text: result.message,
        type: result.success ? 'success' : 'error'
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUseTetItem = async (itemId: string) => {
    if (usingItem) return;

    setUsingItem(itemId);
    const result = await consumeTetItem(itemId);

    if (result.success) {
      // Play sound & animation
      if (result.sound) {
        playSound(result.sound);
      }
      if (result.animation) {
        setItemAnimation({ itemId, animation: result.animation });
        setTimeout(() => setItemAnimation(null), 2000);
      }
    } else {
      playSound('loss');
    }

    setMessage({
      text: result.message,
      type: result.success ? 'success' : 'error'
    });
    setTimeout(() => setMessage(null), 3000);
    setUsingItem(null);
  };

  const dashboardItems = getDashboardItems();
  const [activeBonus, setActiveBonus] = useState<number>(0);

  React.useEffect(() => {
    let isMounted = true;
    const fetchBonus = async () => {
      const bonus = await getActiveBonus();
      if (isMounted) setActiveBonus(bonus);
    };
    fetchBonus();
    return () => { isMounted = false; };
  }, [getActiveBonus]);

  if (loading || inventoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/40 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg font-medium">Loading missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-12 pt-4 animate-fade-in-up">

      {/* PAGE HEADER */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 mb-1">
              Nhiệm Vụ
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Hoàn thành nhiệm vụ để nhận thưởng hấp dẫn</p>
          </div>
          <div className="relative bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-2xl font-black text-sm sm:text-base border border-white/10 flex items-center gap-3">
            <span className="text-gray-400">Số dư</span>
            <span className="text-2xl font-black text-yellow-400">{formatCurrency(userData?.money || 0)}</span>
          </div>
        </div>
        {activeBonus > 0 && (
          <div className="relative mt-4 bg-green-500/20 border border-green-400/30 rounded-2xl px-4 py-2.5 inline-flex items-center gap-2">
            <span className="text-green-300 font-bold text-sm">Bonus +{activeBonus}% đang hoạt động!</span>
          </div>
        )}
      </div>

      {/* NOTIFICATION */}
      {message && (
        <div className={`p-4 rounded-2xl border text-center font-bold text-base animate-fade-in-up ${message.type === 'success'
          ? 'bg-green-500/20 border-green-400/30 text-green-300'
          : 'bg-red-500/20 border-red-400/30 text-red-300'
          }`}>
          {message.text}
        </div>
      )}

      {/* TET ITEMS */}
      {dashboardItems.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-2 h-8 rounded-full bg-gradient-to-b from-purple-400 to-pink-500"></span>
            Vật Phẩm Của Bạn
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {dashboardItems.map((userItem) => {
              const shopItem = SHOP_ITEMS.find(si => si.id === userItem.itemId);
              if (!shopItem || shopItem.type !== ItemType.TET_INTERACTIVE) return null;
              const isAnimating = itemAnimation?.itemId === userItem.itemId;
              const animationClass = isAnimating ? `animate-${itemAnimation.animation}` : '';
              let cooldownRemaining = 0;
              if (shopItem.cooldown && userItem.lastUsedAt) {
                const timeSinceLastUse = Date.now() - userItem.lastUsedAt;
                if (timeSinceLastUse < shopItem.cooldown) {
                  cooldownRemaining = Math.ceil((shopItem.cooldown - timeSinceLastUse) / 60000);
                }
              }
              const canUse = !usingItem &&
                (userItem.usesLeft === undefined || userItem.usesLeft > 0) &&
                cooldownRemaining === 0;
              return (
                <div
                  key={userItem.itemId}
                  className={`relative bg-white/5 backdrop-blur-md rounded-2xl p-3 border ${canUse ? 'border-white/15 hover:border-purple-400/50 cursor-pointer hover:bg-white/10' : 'border-white/5 opacity-60'
                    } transition-all duration-300 hover:-translate-y-1 ${isAnimating ? animationClass : ''}`}
                  onClick={() => canUse && handleUseTetItem(userItem.itemId)}
                >
                  <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden bg-black/40">
                    <img src={shopItem.imageUrl} alt={shopItem.name} className={`w-full h-full object-cover ${isAnimating ? 'animate-pulse' : ''}`} />
                    {userItem.quantity > 1 && (
                      <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-lg text-xs font-black border border-white/20">x{userItem.quantity}</div>
                    )}
                    {userItem.usesLeft !== undefined && (
                      <div className="absolute bottom-1.5 left-1.5 bg-blue-500/80 text-white px-2 py-0.5 rounded-lg text-xs font-bold">{userItem.usesLeft} lần</div>
                    )}
                    {cooldownRemaining > 0 && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
                        <div className="text-white text-center">
                          <div className="text-xl font-black">⏳</div>
                          <div className="text-xs font-bold">{cooldownRemaining}m</div>
                        </div>
                      </div>
                    )}
                    {usingItem === userItem.itemId && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                        <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <h4 className="text-white font-bold text-sm truncate text-center mb-1">{shopItem.name}</h4>
                  {shopItem.minReward && shopItem.maxReward && (
                    <div className="text-yellow-400 text-xs text-center font-bold">{shopItem.minReward.toLocaleString()} - {shopItem.maxReward.toLocaleString()}đ</div>
                  )}
                  {canUse && <div className="mt-1.5 text-center text-purple-400 text-xs font-bold animate-pulse">Nhấn để dùng</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUEST CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* DAILY CHECKIN */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Điểm Danh Hàng Ngày</h3>
              <p className="text-gray-400 text-sm">Điểm danh để nhận thưởng mỗi ngày</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{userData?.lastCheckin === new Date().toLocaleDateString('vi-VN') ? 'Hoàn thành' : '0 / 1'}</span>
              <span>+500,000đ</span>
            </div>
            <div className="bg-white/10 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full h-2.5 transition-all duration-700"
                style={{ width: userData?.lastCheckin === new Date().toLocaleDateString('vi-VN') ? '100%' : '0%' }}
              ></div>
            </div>
          </div>

          <p className="text-yellow-300 font-semibold text-sm mb-4">
            Thưởng: <span className="font-black text-yellow-400 text-base">+500,000đ</span>
          </p>

          <button
            onClick={handleCheckin}
            disabled={userData?.lastCheckin === new Date().toLocaleDateString('vi-VN')}
            className={`w-full py-2.5 rounded-xl font-black text-sm sm:text-base transition-all active:scale-95 ${userData?.lastCheckin === new Date().toLocaleDateString('vi-VN')
              ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-[1.02] shadow-[0_5px_15px_rgba(251,191,36,0.3)]'
              }`}
          >
            {userData?.lastCheckin === new Date().toLocaleDateString('vi-VN') ? '✓ Đã điểm danh' : 'Điểm Danh Ngay'}
          </button>
        </div>

        {/* TIKTOK TASK */}
        <div className={`bg-white/5 backdrop-blur-xl border rounded-3xl p-6 shadow-xl hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 ${userData?.tasks.followTiktok ? 'border-green-400/30' : 'border-white/10'
          }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Theo dõi TikTok</h3>
              <p className="text-gray-400 text-sm">@ngocmanh494</p>
            </div>
            {userData?.tasks.followTiktok && (
              <span className="bg-green-500/20 border border-green-400/30 text-green-400 text-xs font-bold px-3 py-1 rounded-full">Hoàn thành</span>
            )}
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{userData?.tasks.followTiktok ? '1 / 1' : '0 / 1'}</span>
              <span>+1,000,000đ</span>
            </div>
            <div className="bg-white/10 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-pink-400 to-rose-500 rounded-full h-2.5 transition-all duration-700"
                style={{ width: userData?.tasks.followTiktok ? '100%' : '0%' }}
              ></div>
            </div>
          </div>
          <p className="text-yellow-300 font-semibold text-sm mb-4">Thưởng: <span className="font-black text-yellow-400 text-base">+1,000,000đ</span></p>
          <button
            onClick={() => handleTask('followTiktok', 'https://www.tiktok.com/@ngocmanh494')}
            disabled={userData?.tasks.followTiktok}
            className={`w-full py-2.5 rounded-xl font-black text-sm sm:text-base transition-all active:scale-95 ${userData?.tasks.followTiktok
              ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:scale-[1.02] shadow-[0_5px_15px_rgba(244,63,94,0.3)]'
              }`}
          >
            {userData?.tasks.followTiktok ? '✓ Đã hoàn thành' : 'Thực hiện Nhiệm Vụ'}
          </button>
        </div>

        {/* YOUTUBE TASK */}
        <div className={`bg-white/5 backdrop-blur-xl border rounded-3xl p-6 shadow-xl hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 ${userData?.tasks.subscribeYoutube ? 'border-green-400/30' : 'border-white/10'
          }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Đăng ký YouTube</h3>
              <p className="text-gray-400 text-sm">@manh494</p>
            </div>
            {userData?.tasks.subscribeYoutube && (
              <span className="bg-green-500/20 border border-green-400/30 text-green-400 text-xs font-bold px-3 py-1 rounded-full">Hoàn thành</span>
            )}
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{userData?.tasks.subscribeYoutube ? '1 / 1' : '0 / 1'}</span>
              <span>+1,000,000đ</span>
            </div>
            <div className="bg-white/10 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-red-500 to-red-700 rounded-full h-2.5 transition-all duration-700"
                style={{ width: userData?.tasks.subscribeYoutube ? '100%' : '0%' }}
              ></div>
            </div>
          </div>
          <p className="text-yellow-300 font-semibold text-sm mb-4">Thưởng: <span className="font-black text-yellow-400 text-base">+1,000,000đ</span></p>
          <button
            onClick={() => handleTask('subscribeYoutube', 'https://www.youtube.com/@manh494')}
            disabled={userData?.tasks.subscribeYoutube}
            className={`w-full py-2.5 rounded-xl font-black text-sm sm:text-base transition-all active:scale-95 ${userData?.tasks.subscribeYoutube
              ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-red-700 text-white hover:scale-[1.02] shadow-[0_5px_15px_rgba(239,68,68,0.3)]'
              }`}
          >
            {userData?.tasks.subscribeYoutube ? '✓ Đã hoàn thành' : 'Thực hiện Nhiệm Vụ'}
          </button>
        </div>

      </div>

      {/* HOW TO EARN */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8">
        <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
          <span className="w-2 h-6 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500"></span>
          Hướng dẫn
        </h4>
        <ul className="text-gray-400 text-sm space-y-3">
          <li className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> Click vật phẩm để nhận thưởng ngẫu nhiên mỗi ngày</li>
          <li className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> Điểm danh mỗi ngày nhận +500,000đ</li>
          <li className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> Hoàn thành nhiệm vụ trên mạng xã hội nhận +1,000,000đ/nhiệm vụ</li>
          <li className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> Dùng tiền để chơi các mini-game và lên bảng xếp hạng</li>
        </ul>
      </div>

    </div>
  );
};
