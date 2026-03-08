import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { ItemType, TetItemAction } from '../types';
import { SHOP_ITEMS } from '../constants';
import { Button } from './Button';

interface InventoryProps {
  userId: string | undefined;
  onShowNotification: (msg: string, type: 'win' | 'loss') => void;
  playSound: (type: any) => void;
  updateMoney: (amount: number) => void;
}

export const Inventory: React.FC<InventoryProps> = ({
  userId,
  onShowNotification,
  playSound,
  updateMoney
}) => {
  const { items, loading, applyItem, consumeTetItem, deleteItem, activateBonus } = useInventory(userId);
  const [using, setUsing] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ItemType | 'ALL'>('ALL');
  const [animatingItem, setAnimatingItem] = useState<string | null>(null);

  type CategoryValue = ItemType | 'ALL';

  const categories: Array<{ value: CategoryValue; label: string }> = [
    { value: 'ALL', label: 'Tất Cả' },
    { value: ItemType.AVATAR, label: 'Avatar' },
    { value: ItemType.BACKGROUND, label: 'BG' },
    { value: ItemType.BONUS_CARD, label: 'Bonus' },
    { value: ItemType.TET_INTERACTIVE, label: 'Vật Tết' }
  ];

  const filteredInventory = selectedCategory === 'ALL'
    ? items
    : items.filter(item => {
      const shopItem = SHOP_ITEMS.find(si => si.id === item.itemId);
      return shopItem?.type === selectedCategory;
    });

  const handleUseItem = async (itemId: string, itemType: string) => {
    if (using) return;

    const shopItem = SHOP_ITEMS.find(si => si.id === itemId);
    if (!shopItem) return;

    setUsing(itemId);
    setAnimatingItem(itemId);

    if (itemType === ItemType.AVATAR || itemType === ItemType.BACKGROUND) {
      const result = await applyItem(itemId);
      playSound('effect');
      onShowNotification(result.message, result.success ? 'win' : 'loss');
    }
    else if (itemType === ItemType.BONUS_CARD) {
      const result = await activateBonus(itemId);
      playSound(result.success ? 'win' : 'loss');
      onShowNotification(result.message, result.success ? 'win' : 'loss');
    }
    else if (itemType === ItemType.TET_INTERACTIVE) {
      const result = await consumeTetItem(itemId);

      // ⭐ FIX: CẬP NHẬT BALANCE ĐÚNG CÁCH
      if (result.success && result.reward) {
        // Trigger animation
        setTimeout(() => setAnimatingItem(null), 1000);

        // Play sound
        if (result.sound) {
          playSound(result.sound);
        }

        // ⭐ CẬP NHẬT TIỀN - GỌI updateMoney VỚI GIÁ TRỊ TĂNG THÊM
        // KHÔNG GỌI updateMoney(result.reward) vì nó sẽ SET thay vì ADD
        onShowNotification(result.message, 'win');
      } else {
        onShowNotification(result.message, 'loss');
      }
    }

    setTimeout(() => {
      setUsing(null);
      setAnimatingItem(null);
    }, 1500);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa vật phẩm này?')) return;

    const result = await deleteItem(itemId);
    playSound('effect');
    onShowNotification(result.message, result.success ? 'win' : 'loss');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-white animate-pulse">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-12 pt-4 animate-fade-in-up">

      {/* HEADER */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden group flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 group-hover:opacity-100 transition-opacity"></div>
        <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 drop-shadow-lg flex items-center gap-3">
          <span className="text-purple-400 animate-pulse"></span> TÚI ĐỒ
        </h1>
        <div className="relative bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-2xl font-bold text-sm sm:text-base border border-white/10 shadow-inner flex items-center gap-2">
          <span className="text-purple-400 animate-bounce">✨</span>
          <span className="text-white">Sở hữu <strong className="text-yellow-400 text-lg">{items.length}</strong> vật phẩm</span>
        </div>
      </div>

      {/* TABS */}
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 p-1.5 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/5 inline-flex min-w-max mx-auto sm:mx-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`
                px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap
                transition-all duration-300
                ${selectedCategory === cat.value
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] transform scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-white/10 bg-transparent'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ⭐ ITEMS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
        {filteredInventory.map((userItem) => {
          const shopItem = SHOP_ITEMS.find(si => si.id === userItem.itemId);
          if (!shopItem) return null;

          const isUsed = userItem.used;
          const usesLeft = userItem.usesLeft;
          const canUse = usesLeft === undefined || usesLeft > 0;
          const isAnimating = animatingItem === userItem.itemId;

          let cooldownRemaining = 0;
          if (shopItem.cooldown && userItem.lastUsedAt) {
            const timeSinceLastUse = Date.now() - userItem.lastUsedAt;
            if (timeSinceLastUse < shopItem.cooldown) {
              cooldownRemaining = Math.ceil((shopItem.cooldown - timeSinceLastUse) / 60000);
            }
          }

          return (
            <div
              key={userItem.itemId}
              className={`
                relative bg-white/5 backdrop-blur-md rounded-2xl p-3 border cursor-default
                transition-all duration-300 transform hover:-translate-y-1 hover:bg-white/10 hover:shadow-[0_10px_25px_rgba(0,0,0,0.5)]
                ${isUsed ? 'border-green-400/80 shadow-[0_0_15px_rgba(74,222,128,0.2)]' : 'border-white/10 hover:border-white/30'}
                ${isAnimating ? getAnimationClass(shopItem.tetAction) : ''}
              `}
            >
              {/* Badges */}
              {isUsed && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-green-400 to-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 shadow-lg border-2 border-green-800">
                  ✓
                </div>
              )}

              {/* Image */}
              <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden bg-black/40 shadow-inner group">
                <img
                  src={shopItem.imageUrl}
                  alt={shopItem.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' font-size='30' fill='white' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(shopItem.name[0])}%3C/text%3E%3C/svg%3E`;
                  }}
                />
                {userItem.quantity > 1 && (
                  <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-lg text-xs font-black border border-white/20">
                    x{userItem.quantity}
                  </div>
                )}
              </div>

              {/* Name */}
              <h3 className="text-sm font-bold text-white mb-2 truncate text-center drop-shadow-md px-1">
                {shopItem.name}
              </h3>

              {/* Stats */}
              <div className="text-center mb-3 h-4 flex items-center justify-center gap-2">
                {usesLeft !== undefined && usesLeft >= 0 && (
                  <span className="text-[10px] text-purple-300 font-bold bg-purple-900/50 px-2 py-0.5 rounded-full border border-purple-500/30">
                    Còn {usesLeft} lần
                  </span>
                )}
                {cooldownRemaining > 0 && (
                  <span className="text-[10px] text-orange-400 font-bold bg-orange-900/50 px-2 py-0.5 rounded-full border border-orange-500/30">
                    ⏳ {cooldownRemaining}p
                  </span>
                )}
              </div>

              {/* BUTTONS */}
              <div className="flex gap-2">
                {/* Nút DÙNG */}
                <button
                  onClick={() => handleUseItem(userItem.itemId, shopItem.type)}
                  disabled={
                    using === userItem.itemId ||
                    (shopItem.type === ItemType.AVATAR && isUsed) ||
                    (shopItem.type === ItemType.BACKGROUND && isUsed) ||
                    (shopItem.type === ItemType.BONUS_CARD && isUsed) ||
                    (shopItem.type === ItemType.TET_INTERACTIVE && (!canUse || cooldownRemaining > 0))
                  }
                  className={`
                    flex-1 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all border border-transparent
                    ${using === userItem.itemId
                      ? 'bg-white/10 text-gray-400 cursor-wait border-white/5'
                      : isUsed
                        ? 'bg-green-500/20 text-green-400 cursor-not-allowed border-green-500/30'
                        : !canUse || cooldownRemaining > 0
                          ? 'bg-white/5 text-gray-500 cursor-not-allowed border-white/5'
                          : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-lg'
                    }
                  `}
                >
                  {using === userItem.itemId ? '⏳' :
                    isUsed ? '✓' :
                      cooldownRemaining > 0 ? '⏳' :
                        !canUse ? '✗' :
                          shopItem.type === ItemType.TET_INTERACTIVE ? '🎆' :
                            'Dùng'
                  }
                </button>

                {/* Nút XÓA */}
                <button
                  onClick={() => handleDeleteItem(userItem.itemId)}
                  disabled={isUsed}
                  className={`
                    w-10 sm:w-12 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all border
                    ${isUsed
                      ? 'bg-white/5 border-white/5 text-gray-600 cursor-not-allowed'
                      : 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white'
                    }
                  `}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredInventory.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 mt-8">
          <span className="text-6xl mb-4 opacity-50 grayscale">🎒</span>
          <h3 className="text-xl font-bold text-white mb-2">Túi đồ trống</h3>
          <p className="text-gray-400 text-center max-w-sm">Hiện tại bạn chưa sở hữu vật phẩm nào trong danh mục này. Hãy ghé qua Cửa Hàng để sắm thêm nhé!</p>
        </div>
      )}
    </div>
  );
};

// ⭐ HÀM TRẢ VỀ CLASS ANIMATION DỰA VÀO LOẠI VẬT PHẨM
function getAnimationClass(action?: TetItemAction): string {
  switch (action) {
    case TetItemAction.FIREWORK:
      return 'animate-firework';
    case TetItemAction.TREE:
      return 'animate-shake';
    case TetItemAction.FOOD:
      return 'animate-pop';
    case TetItemAction.LANTERN:
      return 'animate-glow';
    default:
      return 'animate-bounce';
  }
}