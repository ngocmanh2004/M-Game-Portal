import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { useInventory } from '../hooks/useInventory';
import { Button } from './Button';
import { SHOP_ITEMS } from '../constants';
import { ItemType, SoundType } from '../types';
import { useDailyQuests } from '../hooks/useDailyQuests';
import { LuckyWheelPopup } from './shared/LuckyWheelPopup';

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
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);

  const { quests, claimReward, loading: questsLoading } = useDailyQuests(user?.uid || null);

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

  if (loading || inventoryLoading || questsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/40 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-12 pt-4 animate-fade-in-up">

      {/* PAGE HEADER */}
      <div className="bg-[#1a1c23] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-30"></div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">
              Nhiệm Vụ
            </h1>
            <p className="text-gray-400 text-sm sm:text-base font-medium">Hoàn thành nhiệm vụ để nhận thưởng hấp dẫn</p>
          </div>
          <div className="relative bg-[#0d0f14] px-5 py-2.5 rounded-2xl font-black text-sm sm:text-base border border-white/5 flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-gray-400 text-xs">Số dư Vàng</span>
              <span className="text-xl font-black text-yellow-400">{formatCurrency(userData?.money || 0)}</span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="flex flex-col items-center">
              <span className="text-gray-400 text-xs text-center">Vé Quay</span>
              <div className="flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowLuckyWheel(true)}>
                <span className="text-xl font-black text-rose-400">🎟️ {userData?.tickets || 0}</span>
              </div>
            </div>
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

      {/* LUCKY WHEEL BANNER - COMPACT */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 p-4 sm:p-5 cursor-pointer shadow-lg hover:brightness-110 transition-all duration-300"
        onClick={() => setShowLuckyWheel(true)}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center p-2 animate-[spin_10s_linear_infinite]">
              <img src="/assets/image/logos/wheel.png" alt="Wheel" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">Vòng Quay May Mắn</h3>
              <p className="text-rose-100 text-xs font-medium">Lượt quay miễn phí hàng ngày đang chờ bạn!</p>
            </div>
          </div>
          <button className="bg-white text-rose-600 px-4 py-2 rounded-lg font-black text-sm shadow-md active:scale-95 transition-transform">
            Quay Ngay
          </button>
        </div>
      </div>

      {/* TET ITEMS */}
      {dashboardItems.length > 0 && (
        <div className="bg-[#1a1c23] border border-white/10 rounded-2xl p-5 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-purple-500 to-pink-600"></span>
            Vật Phẩm Của Bạn
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
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
                  className={`relative bg-[#0d0f14] rounded-xl p-1.5 border ${canUse ? 'border-white/15 hover:border-purple-400/50 cursor-pointer' : 'border-white/5 opacity-50'
                    } transition-all duration-300 ${isAnimating ? animationClass : ''}`}
                  onClick={() => canUse && handleUseTetItem(userItem.itemId)}
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black/40">
                    <img src={shopItem.imageUrl} alt={shopItem.name} className="w-full h-full object-cover" />
                    {userItem.quantity > 1 && (
                      <div className="absolute top-0.5 right-0.5 bg-black/60 text-[10px] text-white px-1 rounded-sm font-black border border-white/10">x{userItem.quantity}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST MISSION VIEW */}
      <div className="space-y-4">

        {/* SECTION: NHIỆM VỤ HÀNG NGÀY */}
        <div className="bg-[#1a1c23] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-white/5 px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Nhiệm Vụ Hàng Ngày</h3>
            <span className="text-[10px] text-gray-500 font-bold bg-[#0d0f14] px-2 py-0.5 rounded">Làm mới lúc 00:00</span>
          </div>

          <div className="divide-y divide-white/5">
            {/* DAILY CHECKIN ROW */}
            <div className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-xl shrink-0">📅</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">Điểm Danh Hàng Ngày</h4>
                <p className="text-[11px] text-gray-400">Đăng nhập nhận thưởng 500K Vàng</p>
                <div className="mt-2 w-full max-w-[150px] bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{ width: userData?.lastCheckin === new Date().toLocaleDateString('vi-VN') ? '100%' : '0%' }}></div>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-yellow-400">+500K Vàng</p>
                </div>
                <button
                  onClick={handleCheckin}
                  disabled={userData?.lastCheckin === new Date().toLocaleDateString('vi-VN')}
                  className={`px-4 py-1.5 rounded-lg font-black text-xs min-w-[100px] transition-all ${userData?.lastCheckin === new Date().toLocaleDateString('vi-VN')
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : 'bg-yellow-500 text-black hover:scale-105 active:scale-95 shadow-md'
                    }`}
                >
                  {userData?.lastCheckin === new Date().toLocaleDateString('vi-VN') ? 'Đã Nhận' : 'Điểm Danh'}
                </button>
              </div>
            </div>

            {/* QUESTS FROM HOOK ROWs */}
            {quests.map(quest => (
              <div key={quest.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner shrink-0 ${quest.rewardType === 'gold' ? 'bg-yellow-500/10' : 'bg-rose-500/10'}`}>
                  {quest.id.includes('play') ? '🎮' : quest.id.includes('win') ? '🏆' : '🎁'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{quest.title}</h4>
                  <p className="text-[11px] text-gray-400">{quest.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-full max-w-[150px] bg-white/10 h-1 rounded-full overflow-hidden">
                      <div className={`${quest.rewardType === 'gold' ? 'bg-yellow-500' : 'bg-rose-500'} h-full transition-all`} style={{ width: `${Math.min(100, ((quest.isClaimed ? quest.target : quest.progress!) / quest.target) * 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold">{quest.isClaimed ? quest.target : quest.progress}/{quest.target}</span>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-black ${quest.rewardType === 'gold' ? 'text-yellow-400' : 'text-rose-400'}`}>
                      +{quest.rewardValue.toLocaleString()} {quest.rewardType === 'gold' ? 'Vàng' : 'Vé Quay'}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const success = await claimReward(quest.id);
                      if (success) {
                        playSound(quest.rewardType === 'gold' ? 'money' : 'win');
                        setMessage({ text: `Nhận thưởng thành công!`, type: 'success' });
                        setTimeout(() => setMessage(null), 3000);
                      }
                    }}
                    disabled={quest.isClaimed || (quest.progress! < quest.target)}
                    className={`px-4 py-1.5 rounded-lg font-black text-xs min-w-[100px] transition-all ${quest.isClaimed
                      ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                      : quest.progress! >= quest.target
                        ? 'bg-blue-600 text-white hover:scale-105 active:scale-95 shadow-md animate-pulse'
                        : 'bg-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    {quest.isClaimed ? 'Đã Nhận' : quest.progress! >= quest.target ? 'Nhận Thưởng' : 'Chưa Xong'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: NHIỆM VỤ ĐẶC BIỆT */}
        <div className="bg-[#1a1c23] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-white/5 px-5 py-3 border-b border-white/5">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Nhiệm Vụ Đặc Biệt</h3>
          </div>

          <div className="divide-y divide-white/5">
            {/* TIKTOK TASK ROW */}
            <div className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-xl shrink-0">🎵</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">Theo dõi TikTok</h4>
                <p className="text-[11px] text-gray-400">Follow @ngocmanh494 để nhận thưởng</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-yellow-400">+1M Vàng</p>
                  <p className="text-[10px] font-bold text-rose-400">+1 Vé Quay</p>
                </div>
                <button
                  onClick={() => handleTask('followTiktok', 'https://www.tiktok.com/@ngocmanh494')}
                  disabled={userData?.tasks.followTiktok}
                  className={`px-4 py-1.5 rounded-lg font-black text-xs min-w-[100px] transition-all ${userData?.tasks.followTiktok
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:scale-105 active:scale-95 shadow-md'
                    }`}
                >
                  {userData?.tasks.followTiktok ? 'Đã Xong' : 'Thực Hiện'}
                </button>
              </div>
            </div>

            {/* YOUTUBE TASK ROW */}
            <div className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-xl shrink-0">📺</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">Đăng ký YouTube</h4>
                <p className="text-[11px] text-gray-400">Sub kênh @manh494 nhận ngay quà</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-yellow-400">+1M Vàng</p>
                  <p className="text-[10px] font-bold text-rose-400">+1 Vé Quay</p>
                </div>
                <button
                  onClick={() => handleTask('subscribeYoutube', 'https://www.youtube.com/@manh494')}
                  disabled={userData?.tasks.subscribeYoutube}
                  className={`px-4 py-1.5 rounded-lg font-black text-xs min-w-[100px] transition-all ${userData?.tasks.subscribeYoutube
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:scale-105 active:scale-95 shadow-md'
                    }`}
                >
                  {userData?.tasks.subscribeYoutube ? 'Đã Xong' : 'Thực Hiện'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW TO EARN */}
      <div className="bg-[#1a1c23] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600"></span>
          Hướng dẫn
        </h4>
        <ul className="text-gray-400 text-sm space-y-3 font-medium">
          <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Click vật phẩm để nhận thưởng ngẫu nhiên mỗi ngày</li>
          <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Điểm danh mỗi ngày nhận +500,000đ</li>
          <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Hoàn thành nhiệm vụ trên mạng xã hội nhận +1,000,000đ/nhiệm vụ</li>
          <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Dùng tiền để chơi các mini-game và lên bảng xếp hạng</li>
        </ul>
      </div>

      {/* RENDER MODAL IN DASHBOARD ONLY */}
      {showLuckyWheel && user && (
        <LuckyWheelPopup uid={user.uid} onClose={() => setShowLuckyWheel(false)} />
      )}
    </div>
  );
};
