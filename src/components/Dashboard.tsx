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
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <p className="text-white text-xl">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 w-full max-w-4xl mx-auto px-3 sm:px-4 pb-8 pt-4 sm:pt-6">
      
      {/* Title */}
      <div className="text-center">
        <h2 className="font-festive text-3xl sm:text-4xl md:text-5xl text-tet-yellow drop-shadow-lg mb-2 animate-pulse">
          Bảng Điều Khiển 🎮
        </h2>
        <p className="text-white/90 text-sm sm:text-base italic">
          Email: {userData?.email}
        </p>
        {activeBonus > 0 && (
          <p className="text-green-400 font-bold text-lg mt-2 animate-bounce">
            ⚡ Bonus +{activeBonus}% đang hoạt động!
          </p>
        )}
      </div>

      {/* Notification */}
      {message && (
        <div className={`w-full p-4 rounded-2xl border-2 text-center font-bold text-lg animate-scale-in ${
          message.type === 'success' 
            ? 'bg-green-100 border-green-500 text-green-800'
            : 'bg-red-100 border-red-500 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Số dư */}
      <div className="w-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-6 sm:p-8 border-4 border-tet-gold shadow-2xl">
        <div className="text-center">
          <p className="text-white text-lg sm:text-xl mb-2">💰 Số dư hiện tại</p>
          <p className="font-festive text-4xl sm:text-5xl md:text-6xl text-white drop-shadow-lg">
            {formatCurrency(userData?.money || 0)}
          </p>
        </div>
      </div>

      {/* ⭐ VẬT PHẨM TẾT - PHẦN MỚI */}
      {dashboardItems.length > 0 && (
        <div className="w-full bg-gradient-to-br from-red-600 to-pink-600 rounded-3xl p-6 sm:p-8 border-4 border-tet-gold shadow-2xl">
          <h3 className="text-tet-yellow text-2xl sm:text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
            <span className="animate-bounce">🎆</span>
            Vật Phẩm Tết Của Bạn
            <span className="animate-bounce">🎆</span>
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
                  className={`
                    relative bg-white/20 backdrop-blur-md rounded-2xl p-4 border-2 border-white/30
                    transition-all transform hover:scale-105 hover:border-yellow-400
                    ${canUse ? 'cursor-pointer' : 'opacity-60'}
                    ${isAnimating ? animationClass : ''}
                  `}
                  onClick={() => canUse && handleUseTetItem(userItem.itemId)}
                >
                  {/* Image */}
                  <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden bg-white/10">
                    <img 
                      src={shopItem.imageUrl} 
                      alt={shopItem.name}
                      className={`w-full h-full object-cover ${isAnimating ? 'animate-pulse' : ''}`}
                    />
                    
                    {/* Quantity Badge */}
                    {userItem.quantity > 1 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                        x{userItem.quantity}
                      </div>
                    )}

                    {/* Uses Left */}
                    {userItem.usesLeft !== undefined && (
                      <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {userItem.usesLeft} lần
                      </div>
                    )}

                    {/* Cooldown */}
                    {cooldownRemaining > 0 && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-2xl mb-1">⏳</div>
                          <div className="text-xs font-bold">{cooldownRemaining}m</div>
                        </div>
                      </div>
                    )}

                    {/* Using Overlay */}
                    {usingItem === userItem.itemId && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-2xl animate-spin">⏳</div>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h4 className="text-white font-bold text-sm text-center truncate mb-1">
                    {shopItem.name}
                  </h4>

                  {/* Reward Range */}
                  <div className="text-yellow-300 text-xs text-center font-bold">
                    {shopItem.minReward && shopItem.maxReward && (
                      <>💰 {shopItem.minReward.toLocaleString()} - {shopItem.maxReward.toLocaleString()}đ</>
                    )}
                  </div>

                  {/* Action Hint */}
                  {canUse && (
                    <div className="mt-2 text-center">
                      <div className="text-green-400 text-xs font-bold animate-pulse">
                        👆 Nhấn để dùng!
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-white/80 text-sm text-center mt-4">
            💡 Mẹo: Vào Túi Đồ để đặt thêm vật phẩm lên Dashboard!
          </p>
        </div>
      )}

      {/* Điểm danh */}
      <div className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-4 border-tet-gold/50 shadow-2xl">
        <h3 className="text-tet-yellow text-2xl sm:text-3xl font-bold mb-4 text-center">
          📅 Điểm Danh Hàng Ngày
        </h3>
        <div className="text-center space-y-4">
          <p className="text-white text-base sm:text-lg">
            {userData?.lastCheckin === new Date().toLocaleDateString('vi-VN')
              ? '✅ Bạn đã điểm danh hôm nay!'
              : '🎁 Điểm danh nhận +500.000đ'}
          </p>
          <Button
            onClick={handleCheckin}
            size="lg"
            disabled={userData?.lastCheckin === new Date().toLocaleDateString('vi-VN')}
            className="text-xl sm:text-2xl px-8 py-4"
          >
            {userData?.lastCheckin === new Date().toLocaleDateString('vi-VN')
              ? '✅ Đã điểm danh'
              : '🎁 Điểm danh ngay!'}
          </Button>
        </div>
      </div>

      {/* Nhiệm vụ */}
      <div className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-4 border-tet-gold/50 shadow-2xl">
        <h3 className="text-tet-yellow text-2xl sm:text-3xl font-bold mb-6 text-center">
          🎯 Nhiệm Vụ Hàng Ngày
        </h3>

        <div className="space-y-4">
          {/* Task 1: TikTok */}
          <div className={`p-4 sm:p-6 rounded-2xl border-4 ${
            userData?.tasks.followTiktok
              ? 'bg-green-600/20 border-green-500'
              : 'bg-pink-600/20 border-pink-500'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <h4 className="text-white font-bold text-lg sm:text-xl mb-1">
                  {userData?.tasks.followTiktok ? '✅' : '🎵'} Theo dõi TikTok
                </h4>
                <p className="text-white/80 text-sm sm:text-base">
                  @ngocmanh494 - Nhận +1.000.000đ
                </p>
              </div>
              <Button
                onClick={() => handleTask('followTiktok', 'https://www.tiktok.com/@ngocmanh494')}
                disabled={userData?.tasks.followTiktok}
                className={userData?.tasks.followTiktok ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {userData?.tasks.followTiktok ? 'Đã hoàn thành' : 'Làm nhiệm vụ'}
              </Button>
            </div>
          </div>

          {/* Task 2: YouTube */}
          <div className={`p-4 sm:p-6 rounded-2xl border-4 ${
            userData?.tasks.subscribeYoutube
              ? 'bg-green-600/20 border-green-500'
              : 'bg-red-600/20 border-red-500'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <h4 className="text-white font-bold text-lg sm:text-xl mb-1">
                  {userData?.tasks.subscribeYoutube ? '✅' : '📺'} Đăng ký YouTube
                </h4>
                <p className="text-white/80 text-sm sm:text-base">
                  @manh494 - Nhận +1.000.000đ
                </p>
              </div>
              <Button
                onClick={() => handleTask('subscribeYoutube', 'https://www.youtube.com/@manh494')}
                disabled={userData?.tasks.subscribeYoutube}
                className={userData?.tasks.subscribeYoutube ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {userData?.tasks.subscribeYoutube ? 'Đã hoàn thành' : 'Làm nhiệm vụ'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="w-full bg-yellow-400/20 backdrop-blur-md border-2 border-yellow-500/50 rounded-2xl p-4 sm:p-6">
        <h4 className="font-bold text-tet-yellow text-lg sm:text-xl mb-3">
          📌 Hướng dẫn:
        </h4>
        <ul className="text-white/90 text-sm sm:text-base space-y-2">
          <li>🎆 Click vật phẩm Tết để nhận thưởng ngẫu nhiên</li>
          <li>🎁 Điểm danh mỗi ngày nhận +500.000đ</li>
          <li>🎯 Hoàn thành nhiệm vụ nhận +1.000.000đ/nhiệm vụ</li>
          <li>💰 Dùng tiền để chơi các mini-game</li>
          <li>🛒 Vào Shop mua vật phẩm Tết độc đáo</li>
          <li>🔄 Dữ liệu đồng bộ realtime trên nhiều thiết bị</li>
        </ul>
      </div>
    </div>
  );
};