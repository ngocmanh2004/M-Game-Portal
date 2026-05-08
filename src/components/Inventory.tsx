import React, { useState } from 'react';
import {
  Package,
  UserCircle2,
  Image,
  Zap,
  Sparkles,
  Music2,
  Layers,
  Check,
  Trash2,
  Play,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { ItemType, TetItemAction } from '../types';
import { SHOP_ITEMS } from '../constants';

interface InventoryProps {
  userId: string | undefined;
  onShowNotification: (msg: string, type: 'win' | 'loss') => void;
  playSound: (type: any) => void;
  updateMoney: (amount: number) => void;
}

type CategoryValue = ItemType | 'ALL';

const categories: Array<{ value: CategoryValue; label: string; icon: React.ReactNode }> = [
  { value: 'ALL', label: 'Tất Cả', icon: <Layers className="w-3.5 h-3.5" /> },
  { value: ItemType.AVATAR, label: 'Avatar', icon: <UserCircle2 className="w-3.5 h-3.5" /> },
  { value: ItemType.MUSIC, label: 'Nhạc Nền', icon: <Music2 className="w-3.5 h-3.5" /> },
  { value: ItemType.BACKGROUND, label: 'Ảnh Nền', icon: <Image className="w-3.5 h-3.5" /> },
  { value: ItemType.BONUS_CARD, label: 'Bonus', icon: <Zap className="w-3.5 h-3.5" /> },
  { value: ItemType.TET_INTERACTIVE, label: 'Vật Phẩm', icon: <Sparkles className="w-3.5 h-3.5" /> },
];

export const Inventory: React.FC<InventoryProps> = ({
  userId,
  onShowNotification,
  playSound,
  updateMoney,
}) => {
  const { items, loading, applyItem, consumeTetItem, deleteItem, activateBonus } = useInventory(userId);
  const [using, setUsing] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>('ALL');

  const filteredInventory =
    selectedCategory === 'ALL'
      ? items
      : items.filter((item) => {
          const shopItem = SHOP_ITEMS.find((si) => si.id === item.itemId);
          return shopItem?.type === selectedCategory;
        });

  const handleUseItem = async (itemId: string, itemType: string) => {
    if (using) return;
    const shopItem = SHOP_ITEMS.find((si) => si.id === itemId);
    if (!shopItem) return;

    setUsing(itemId);
    try {
      if (
        itemType === ItemType.AVATAR ||
        itemType === ItemType.BACKGROUND ||
        itemType === ItemType.MUSIC
      ) {
        const result = await applyItem(itemId);
        playSound('money');
        onShowNotification(result.message, result.success ? 'win' : 'loss');
      } else if (itemType === ItemType.BONUS_CARD) {
        const result = await activateBonus(itemId);
        playSound(result.success ? 'money' : 'loss');
        onShowNotification(result.message, result.success ? 'win' : 'loss');
      } else if (itemType === ItemType.TET_INTERACTIVE) {
        const result = await consumeTetItem(itemId);
        if (result.success && result.reward) {
          if (result.sound) playSound(result.sound);
          onShowNotification(result.message, 'win');
        } else {
          onShowNotification(result.message, 'loss');
        }
      }
    } finally {
      setUsing(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa vật phẩm này?')) return;
    const result = await deleteItem(itemId);
    onShowNotification(result.message, result.success ? 'win' : 'loss');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.15)' }}
          >
            <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
          </div>
          <p className="text-white/40 text-sm font-medium">Đang tải túi đồ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-12 pt-4">
      <div
        className="relative rounded-2xl overflow-hidden p-5 sm:p-7"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #1a1a2e 100%)',
          border: '1px solid rgba(139,92,246,0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
            transform: 'translate(30%,-30%)',
          }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', boxShadow: '0 4px 15px rgba(139,92,246,0.4)' }}
            >
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Túi Đồ</h1>
              <p className="text-white/30 text-xs font-medium mt-0.5">
                {items.length} vật phẩm
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.3)',
            }}
          >
            <ShoppingBag className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 font-bold text-sm">Bộ sưu tập của bạn</span>
          </div>
        </div>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide p-1.5 rounded-2xl"
        style={{
          background: 'rgba(10,10,20,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0"
            style={
              selectedCategory === cat.value
                ? {
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(139,92,246,0.4)',
                  }
                : {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                  }
            }
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {filteredInventory.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: 'rgba(10,10,20,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Package className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-white/40 font-semibold text-sm">Túi đồ trống</p>
          <p className="text-white/20 text-xs mt-1">Ghé Shop để sắm thêm vật phẩm!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filteredInventory.map((userItem) => {
            const shopItem = SHOP_ITEMS.find((si) => si.id === userItem.itemId);
            if (!shopItem) return null;

            const isUsed = userItem.used;
            const usesLeft = userItem.usesLeft;
            const canUse = usesLeft === undefined || usesLeft > 0;
            const isLoading = using === userItem.itemId;

            let cooldownRemaining = 0;
            if (shopItem.cooldown && userItem.lastUsedAt) {
              const elapsed = Date.now() - userItem.lastUsedAt;
              if (elapsed < shopItem.cooldown) {
                cooldownRemaining = Math.ceil((shopItem.cooldown - elapsed) / 60000);
              }
            }

            const isDisabled =
              isLoading ||
              ((shopItem.type === ItemType.AVATAR ||
                shopItem.type === ItemType.BACKGROUND ||
                shopItem.type === ItemType.MUSIC ||
                shopItem.type === ItemType.BONUS_CARD) &&
                isUsed) ||
              (shopItem.type === ItemType.TET_INTERACTIVE && (!canUse || cooldownRemaining > 0));

            return (
              <div
                key={userItem.itemId}
                className="group relative rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1.5"
                style={{
                  background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
                  border: isUsed
                    ? '1px solid rgba(139,92,246,0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isUsed
                    ? '0 4px 20px rgba(139,92,246,0.2)'
                    : '0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                {isUsed && (
                  <div
                    className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', boxShadow: '0 2px 8px rgba(139,92,246,0.5)' }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {(shopItem.type === ItemType.BONUS_CARD || shopItem.type === ItemType.TET_INTERACTIVE) && userItem.quantity > 1 && (
                  <div
                    className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md text-[10px] font-black text-white"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    ×{userItem.quantity}
                  </div>
                )}

                <div className="relative w-full aspect-square overflow-hidden">
                  <img
                    src={shopItem.imageUrl}
                    alt={shopItem.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%231e1e3f'/%3E%3C/svg%3E`;
                    }}
                  />
                </div>

                <div
                  className="px-2.5 py-2"
                  style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="text-white/90 text-[11px] font-semibold truncate mb-2 leading-tight">
                    {shopItem.name}
                  </p>

                  {usesLeft !== undefined && usesLeft >= 0 && (
                    <p className="text-purple-400 text-[10px] font-bold mb-1.5">Còn {usesLeft} lần</p>
                  )}
                  {cooldownRemaining > 0 && (
                    <p className="text-orange-400 text-[10px] font-bold mb-1.5">⏳ {cooldownRemaining}p</p>
                  )}

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleUseItem(userItem.itemId, shopItem.type)}
                      disabled={isDisabled}
                      className="flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all active:scale-95 flex items-center justify-center gap-1 disabled:cursor-not-allowed"
                      style={
                        isLoading
                          ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
                          : isUsed
                          ? { background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }
                          : isDisabled
                          ? { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }
                          : {
                              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                              color: '#fff',
                              boxShadow: '0 2px 10px rgba(139,92,246,0.35)',
                            }
                      }
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isUsed ? (
                        <><Check className="w-3 h-3" /> Đang dùng</>
                      ) : shopItem.type === ItemType.MUSIC ? (
                        <><Play className="w-3 h-3" /> Phát</>
                      ) : shopItem.type === ItemType.TET_INTERACTIVE ? (
                        <><Sparkles className="w-3 h-3" /> Dùng</>
                      ) : (
                        'Dùng'
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteItem(userItem.itemId)}
                      disabled={isUsed}
                      className="w-8 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed"
                      style={
                        isUsed
                          ? { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.15)' }
                          : { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};