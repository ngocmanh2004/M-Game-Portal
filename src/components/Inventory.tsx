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
    <div className="container mx-auto px-2 py-3 max-w-7xl">
      
      {/* Header - Compact */}
      <div className="text-center mb-3">
        <h1 className="text-2xl sm:text-3xl font-festive text-yellow-400 mb-1">
          TÚI ĐỒ
        </h1>
        <div className="bg-white/10 rounded-full px-3 py-1 inline-block border border-yellow-400">
          <span className="text-xs sm:text-sm font-bold text-white">
            {items.length} vật phẩm
          </span>
        </div>
      </div>

      {/* Categories - Compact */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`
              px-2.5 py-1 rounded-lg font-bold text-xs text-white transition-all
              ${selectedCategory === cat.value 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 scale-105' 
                : 'bg-white/20 hover:bg-white/30'
              }
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ⭐ GRID COMPACT - 3-4 ITEMS MỖI HÀNG */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
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
                relative bg-gradient-to-br from-amber-900/80 to-red-900/80 backdrop-blur-sm rounded-lg p-1.5 border-2
                transition-all transform hover:scale-105
                ${isUsed ? 'border-green-400 ring-1 ring-green-400' : 'border-yellow-600/50'}
                ${isAnimating ? getAnimationClass(shopItem.tetAction) : ''}
              `}
            >
              {/* Badges - Compact */}
              {isUsed && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold z-10">
                  ✓
                </div>
              )}

              {/* Image - Smaller */}
              <div className="relative w-full aspect-square mb-1 rounded-md overflow-hidden bg-black/30">
                <img 
                  src={shopItem.imageUrl} 
                  alt={shopItem.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23666'/%3E%3Ctext x='50%25' y='50%25' font-size='30' fill='white' text-anchor='middle' dy='.3em'%3E${shopItem.name[0]}%3C/text%3E%3C/svg%3E`;
                  }}
                />
                {userItem.quantity > 1 && (
                  <div className="absolute bottom-0.5 right-0.5 bg-red-500 text-white px-1 py-0.5 rounded text-[9px] font-bold">
                    x{userItem.quantity}
                  </div>
                )}
              </div>

              {/* Name - Smaller */}
              <h3 className="text-[10px] sm:text-xs font-bold text-white mb-0.5 truncate text-center">
                {shopItem.name}
              </h3>

              {/* Stats - Compact */}
              <div className="text-center mb-1">
                {usesLeft !== undefined && usesLeft >= 0 && (
                  <div className="text-[9px] text-blue-300">
                    {usesLeft} lần
                  </div>
                )}
                {cooldownRemaining > 0 && (
                  <div className="text-[9px] text-orange-300">
                    ⏳{cooldownRemaining}p
                  </div>
                )}
              </div>

              {/* ⭐ BUTTONS - RÕ RÀNG HƠN */}
              <div className="flex gap-1">
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
                    flex-1 py-1 rounded text-[10px] font-bold transition-all
                    ${using === userItem.itemId 
                      ? 'bg-gray-600 text-white cursor-wait' 
                      : isUsed 
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : !canUse || cooldownRemaining > 0
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
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
                    w-8 py-1 rounded text-[10px] font-bold transition-all
                    ${isUsed 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700'
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
        <div className="text-center text-white text-base py-8">
          Chưa có vật phẩm
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