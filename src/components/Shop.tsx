import React, { useState } from 'react';
import { useShop } from '../hooks/useShop';
import { SHOP_ITEMS } from '../constants';
import { ItemType, SoundType, ShopItem } from '../types';
import { formatCurrency } from '../utils';
import { Button } from './Button';

interface ShopProps {
  userId: string | undefined;
  userMoney: number;
  onShowNotification: (msg: string, type: 'win' | 'loss') => void;
  playSound: (type: SoundType) => void;
}

export const Shop: React.FC<ShopProps> = ({ userId, userMoney, onShowNotification, playSound }) => {
  const { buyItem, loading } = useShop(userId);
  const [selectedTab, setSelectedTab] = useState<'all' | ItemType>('all');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

  const handlePurchase = async (item: ShopItem) => {
    if (userMoney < item.price) {
      onShowNotification('Không đủ tiền!', 'loss');
      playSound('loss');
      return;
    }

    setPurchasingItemId(item.id);
    const result = await buyItem(item.id, userMoney);
    setPurchasingItemId(null);

    if (result.success) {
      playSound('money');
      onShowNotification(result.message, 'win');
      setSelectedItem(null);

      // ⭐ XÓA DÒNG RELOAD - CHỈ ĐÓNG MODAL
      // setTimeout(() => {
      //   window.location.reload();
      // }, 1500);
    } else {
      playSound('loss');
      onShowNotification(result.message, 'loss');
    }
  };

  const filteredItems = selectedTab === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(item => item.type === selectedTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🛒</div>
          <p className="text-white text-xl animate-pulse">Đang tải cửa hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-12 pt-4 animate-fade-in-up">

      {/* HEADER */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 drop-shadow-lg flex items-center gap-3">
            <span className="text-blue-400 animate-pulse">💎</span> CỬA HÀNG
          </h1>
          <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-lg sm:text-xl border border-white/10 shadow-inner flex items-center gap-2">
            <span className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">💰</span>
            <span className="text-yellow-400">{formatCurrency(userMoney)}</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 p-1.5 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/5 inline-flex min-w-max">
          {[
            { id: 'all' as const, name: 'Tất Cả' },
            { id: ItemType.AVATAR, name: 'Avatar' },
            { id: ItemType.BACKGROUND, name: 'Background' },
            { id: ItemType.BONUS_CARD, name: 'Thẻ Bonus' },
            { id: ItemType.TET_INTERACTIVE, name: 'Vật Phẩm' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`
                px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap
                transition-all duration-300
                ${selectedTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] transform scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-white/10 bg-transparent'}
              `}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid - GIỮ NGUYÊN */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
        {filteredItems.map(item => {
          const canAfford = userMoney >= item.price;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`
                relative bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 cursor-pointer
                transition-all duration-300 transform hover:-translate-y-2 hover:bg-white/10 hover:border-white/30 hover:shadow-[0_10px_25px_rgba(0,0,0,0.5)]
                ${canAfford ? '' : 'opacity-50 grayscale-[50%]'}
              `}
            >
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/40 mb-3 shadow-inner">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%231e3a8a'/%3E%3Ctext x='50%25' y='50%25' font-size='40' fill='white' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(item.name[0])}%3C/text%3E%3C/svg%3E`;
                  }}
                />

                {item.bonusPercent && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                    +{item.bonusPercent}%
                  </div>
                )}

                {item.stock !== undefined && item.stock < 999 && (
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] sm:text-xs font-bold text-center rounded-lg py-1">
                    Còn lại: {item.stock}
                  </div>
                )}
              </div>

              <p className="text-white text-sm font-bold text-center truncate mb-1 px-1 drop-shadow-md">
                {item.name}
              </p>

              <div className={`text-center text-sm font-black tracking-wide ${canAfford ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-gray-400'}`}>
                {item.price === 0 ? 'FREE' : `${(item.price / 1000).toFixed(0)}K`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal - GIỮ NGUYÊN */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative bg-[#0f172a]/95 backdrop-blur-3xl rounded-3xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto animate-fade-in-up flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-colors flex items-center justify-center border border-white/10 z-10"
            >
              ✕
            </button>

            {/* Image */}
            <div className="relative w-full aspect-square max-w-[240px] mt-4 rounded-2xl overflow-hidden bg-black/40 shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-5 border border-white/10">
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />

              {/* Type Badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border border-white/10 shadow-lg">
                {selectedItem.type === ItemType.AVATAR && 'Avatar'}
                {selectedItem.type === ItemType.BACKGROUND && 'Background'}
                {selectedItem.type === ItemType.BONUS_CARD && 'Thẻ Bonus'}
                {selectedItem.type === ItemType.TET_INTERACTIVE && 'Vật Phẩm'}
              </div>
            </div>

            {/* Name */}
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-300 mb-2 text-center drop-shadow-md">
              {selectedItem.name}
            </h2>

            {/* Description */}
            <p className="text-gray-300 text-sm sm:text-base mb-5 text-center px-2">
              {selectedItem.description}
            </p>

            {/* Stats */}
            <div className="space-y-3 mb-6 w-full">
              {selectedItem.bonusPercent && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex flex-col items-center">
                  <p className="text-blue-300 text-sm sm:text-base font-bold flex items-center gap-2">
                    <span>⚡</span> Tăng {selectedItem.bonusPercent}% tiền thắng
                  </p>
                  {selectedItem.expiresIn && (
                    <p className="text-gray-400 text-xs mt-1">
                      ⏱️ Hiệu lực: {Math.floor(selectedItem.expiresIn / 3600000)} giờ
                    </p>
                  )}
                </div>
              )}

              {selectedItem.type === ItemType.TET_INTERACTIVE && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 flex flex-col items-center">
                  {selectedItem.minReward && selectedItem.maxReward && (
                    <p className="text-purple-300 text-sm sm:text-base font-bold flex items-center gap-2 mb-1">
                      <span>💰</span> Thưởng: {selectedItem.minReward.toLocaleString()} - {selectedItem.maxReward.toLocaleString()}đ
                    </p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    🔄 Số lần dùng: <strong className="text-gray-200">{selectedItem.maxUses === -1 ? '♾️ Vô hạn' : selectedItem.maxUses}</strong>
                  </p>
                  {selectedItem.cooldown && selectedItem.cooldown > 0 && (
                    <p className="text-gray-400 text-xs mt-1">
                      ⏱️ Cooldown: <strong className="text-gray-200">{Math.floor(selectedItem.cooldown / 60000)} phút</strong>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Price Box */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 mb-6 text-center w-full border border-white/5 shadow-inner">
              <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Giá Bán</p>
              <p className="text-yellow-400 text-3xl sm:text-4xl font-black drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                {selectedItem.price === 0 ? 'MIỄN PHÍ' : formatCurrency(selectedItem.price)}
              </p>
            </div>

            {/* Buy Button */}
            <Button
              onClick={() => handlePurchase(selectedItem)}
              disabled={userMoney < selectedItem.price || purchasingItemId === selectedItem.id || selectedItem.stock === 0}
              className={`w-full text-lg sm:text-xl font-black py-4 border-none shadow-[0_5px_20px_rgba(0,0,0,0.5)] ${selectedItem.price === 0 || userMoney >= selectedItem.price ? '!from-blue-500 !to-purple-600' : ''}`}
            >
              {purchasingItemId === selectedItem.id ? '⏳ Đang xử lý...' :
                selectedItem.stock === 0 ? '❌ HẾT HÀNG' :
                  userMoney < selectedItem.price ? '💸 THIẾU SỐ DƯ' :
                    selectedItem.price === 0 ? '🎁 NHẬN MIỄN PHÍ' : '🛒 MUA PHẨM VẬT'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};