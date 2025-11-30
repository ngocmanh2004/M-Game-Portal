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
    <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto px-2 sm:px-4 pb-8 pt-2">
    
      {/* ⭐ HEADER MỚI - BỎ ICON, ĐƠN GIẢN HƠN */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-4 sm:p-5 border-2 border-yellow-400 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            SHOP THẦN BÍ
          </h1>
          <div className="bg-yellow-400 text-red-900 px-4 py-2 rounded-xl font-bold text-base sm:text-lg border-2 border-yellow-300 shadow-lg">
            💰 {formatCurrency(userMoney)}
          </div>
        </div>
      </div>

      {/* ⭐ TABS MỚI - BỎ ICON */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'all' as const, name: 'Tất Cả' },
          { id: ItemType.AVATAR, name: 'Avatar' },
          { id: ItemType.BACKGROUND, name: 'Background' },
          { id: ItemType.BONUS_CARD, name: 'Thẻ Bonus' },
          { id: ItemType.TET_INTERACTIVE, name: 'Vật Phẩm Tết' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`
              px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap
              transition-all duration-300
              ${selectedTab === tab.id 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-red-900 shadow-lg scale-105' 
                : 'bg-white/20 text-white hover:bg-white/30'}
            `}
          >
            {tab.name}
          </button>
        ))}
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
                relative bg-gradient-to-br from-amber-900 to-amber-800 rounded-lg p-2 border-2 cursor-pointer
                transition-all transform hover:scale-105 hover:shadow-xl
                ${canAfford ? 'border-yellow-400' : 'border-gray-500 opacity-60'}
              `}
            >
              <div className="relative w-full aspect-square rounded-md overflow-hidden bg-black/30 mb-1">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%238b4513'/%3E%3Ctext x='50%25' y='50%25' font-size='40' fill='white' text-anchor='middle' dy='.3em'%3E${item.name[0]}%3C/text%3E%3C/svg%3E`;
                  }}
                />
                
                {item.bonusPercent && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-bl font-bold">
                    +{item.bonusPercent}%
                  </div>
                )}

                {item.stock !== undefined && item.stock < 999 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center">
                    Còn {item.stock}
                  </div>
                )}
              </div>

              <p className="text-white text-xs font-bold text-center truncate mb-1">
                {item.name}
              </p>

              <div className={`text-center text-xs font-bold ${canAfford ? 'text-yellow-300' : 'text-gray-400'}`}>
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
            className="relative bg-gradient-to-br from-amber-900 to-red-900 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md border-4 border-yellow-400 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="sticky top-0 float-right w-8 h-8 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 shadow-lg z-10 -mt-2 -mr-2"
            >
              ✕
            </button>

            {/* Image - ⭐ GIẢM SIZE */}
            <div className="relative w-full aspect-square max-w-[250px] mx-auto rounded-xl overflow-hidden bg-black/30 mb-3 border-4 border-yellow-400">
              <img 
                src={selectedItem.imageUrl} 
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
              
              {/* Type Badge */}
              <div className="absolute top-1 left-1 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-bold">
                {selectedItem.type === ItemType.AVATAR && '👤 Avatar'}
                {selectedItem.type === ItemType.BACKGROUND && '🎨 Nền'}
                {selectedItem.type === ItemType.BONUS_CARD && '💳 Bonus'}
                {selectedItem.type === ItemType.TET_INTERACTIVE && '🎆 Vật Tết'}
              </div>
            </div>

            {/* Name */}
            <h2 className="text-xl sm:text-2xl font-bold text-yellow-300 mb-2 text-center">
              {selectedItem.name}
            </h2>

            {/* Description */}
            <p className="text-white/90 text-xs sm:text-sm mb-3 text-center">
              {selectedItem.description}
            </p>

            {/* Stats */}
            <div className="space-y-2 mb-3">
              {selectedItem.bonusPercent && (
                <div className="bg-yellow-400/20 border border-yellow-400 rounded-lg p-2">
                  <p className="text-yellow-300 text-xs sm:text-sm font-bold">
                    ⚡ Tăng {selectedItem.bonusPercent}% tiền thắng
                  </p>
                  {selectedItem.expiresIn && (
                    <p className="text-white/70 text-xs">
                      ⏱️ Hiệu lực: {Math.floor(selectedItem.expiresIn / 3600000)} giờ
                    </p>
                  )}
                </div>
              )}

              {selectedItem.type === ItemType.TET_INTERACTIVE && (
                <div className="bg-red-400/20 border border-red-400 rounded-lg p-2">
                  {selectedItem.minReward && selectedItem.maxReward && (
                    <p className="text-red-300 text-xs sm:text-sm font-bold">
                      💰 Thưởng: {selectedItem.minReward.toLocaleString()} - {selectedItem.maxReward.toLocaleString()}đ
                    </p>
                  )}
                  <p className="text-white/70 text-xs">
                    🔄 Số lần dùng: {selectedItem.maxUses === -1 ? '♾️ Vô hạn' : selectedItem.maxUses}
                  </p>
                  {selectedItem.cooldown && selectedItem.cooldown > 0 && (
                    <p className="text-white/70 text-xs">
                      ⏱️ Cooldown: {Math.floor(selectedItem.cooldown / 60000)} phút
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="bg-black/30 rounded-lg p-2 mb-3 text-center">
              <p className="text-white/70 text-xs mb-1">Giá</p>
              <p className="text-yellow-300 text-xl sm:text-2xl font-bold">
                {selectedItem.price === 0 ? 'MIỄN PHÍ' : formatCurrency(selectedItem.price)}
              </p>
            </div>

            {/* Buy Button */}
            <Button
              onClick={() => handlePurchase(selectedItem)}
              disabled={userMoney < selectedItem.price || purchasingItemId === selectedItem.id || selectedItem.stock === 0}
              className="w-full text-base sm:text-lg font-bold"
              size="md"
            >
              {purchasingItemId === selectedItem.id ? '⏳ Đang mua...' : 
               selectedItem.stock === 0 ? '❌ Hết hàng' :
               userMoney < selectedItem.price ? '💸 Không đủ tiền' : 
               selectedItem.price === 0 ? '🎁 Nhận ngay!' : '🛒 Mua ngay!'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};