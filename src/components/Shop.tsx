import React, { useState } from 'react';
import {
  ShoppingBag,
  Coins,
  X,
  ShoppingCart,
  Loader2,
  Zap,
  Clock,
  RefreshCw,
  Gift,
  Lock,
  PackageX,
  Layers,
  UserCircle2,
  Image,
  Sparkles,
  Star,
  Music2,
  Check,
} from 'lucide-react';
import { useShop } from '../hooks/useShop';
import { SHOP_ITEMS } from '../constants';
import { ItemType, SoundType, ShopItem } from '../types';
import { formatCurrency, formatPrice } from '../utils';

interface ShopProps {
  userId: string | undefined;
  userMoney: number;
  onShowNotification: (msg: string, type: 'win' | 'loss') => void;
  playSound: (type: SoundType) => void;
}

const tabs: { id: 'all' | ItemType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Tất cả', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: ItemType.AVATAR, label: 'Avatar', icon: <UserCircle2 className="w-3.5 h-3.5" /> },
  { id: ItemType.MUSIC, label: 'Nhạc Nền', icon: <Music2 className="w-3.5 h-3.5" /> },
  { id: ItemType.BACKGROUND, label: 'Ảnh Nền', icon: <Image className="w-3.5 h-3.5" /> },
  { id: ItemType.BONUS_CARD, label: 'Thẻ Bonus', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: ItemType.TET_INTERACTIVE, label: 'Vật Phẩm', icon: <Sparkles className="w-3.5 h-3.5" /> },
]
const typeLabel: Record<ItemType, string> = {
  [ItemType.AVATAR]: 'Avatar',
  [ItemType.MUSIC]: 'Nhạc Nền',
  [ItemType.BACKGROUND]: 'Ảnh Nền',
  [ItemType.BONUS_CARD]: 'Thẻ Bonus',
  [ItemType.TET_INTERACTIVE]: 'Vật Phẩm',
};

export const Shop: React.FC<ShopProps> = ({ userId, userMoney, onShowNotification, playSound }) => {
  const { buyItem, loading, hasItem } = useShop(userId);
  const [selectedTab, setSelectedTab] = useState<'all' | ItemType>('all');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 18;

  const handleTabChange = (tab: 'all' | ItemType) => {
    setSelectedTab(tab);
    setCurrentPage(1);
  };

  const handlePurchase = async (item: ShopItem) => {
    if (userMoney < item.price) {
      onShowNotification('Không đủ tiền!', 'loss');
      playSound('loss');
      return;
    }
    setPurchasingItemId(item.id);
    try {
      const result = await buyItem(item.id, userMoney);
      if (result.success) {
        playSound('money');
        onShowNotification(result.message, 'win');
        setSelectedItem(null);
      } else {
        playSound('loss');
        onShowNotification(result.message, 'loss');
      }
    } finally {
      setPurchasingItemId(null);
    }
  };

  const filteredItems =
    selectedTab === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter((item) => item.type === selectedTab);
  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const paginatedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
          </div>
          <p className="text-white/50 text-sm font-medium">Đang tải cửa hàng...</p>
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
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}
            >
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Cửa Hàng</h1>
            </div>
          </div>

          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(161,120,0,0.5) 0%, rgba(120,87,0,0.6) 100%)',
              border: '1px solid rgba(234,179,8,0.5)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
            }}
          >
            <span className="text-yellow-300 font-black text-base" style={{ textShadow: '0 0 12px rgba(251,191,36,0.6)' }}>💰 {formatCurrency(userMoney)}</span>
          </div>
        </div>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide p-1.5 rounded-2xl"
        style={{
          background: 'rgba(10,10,20,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(4px)',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0"
            style={
              selectedTab === tab.id
                ? {
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                  }
                : {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                  }
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {paginatedItems.map((item) => {
          const canAfford = userMoney >= item.price;
          const isFree = item.price === 0;
          const isOwned = hasItem(item.id) &&
            item.type !== ItemType.BONUS_CARD &&
            item.type !== ItemType.TET_INTERACTIVE;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03]"
              style={{
                background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ boxShadow: 'inset 0 0 0 1.5px rgba(99,102,241,0.5)' }}
              />

              <div className="relative w-full aspect-square overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%231e1e3f'/%3E%3C/svg%3E`;
                  }}
                />

                {item.bonusPercent && (
                  <span
                    className="absolute top-1.5 right-1.5 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #ec4899)', boxShadow: '0 2px 6px rgba(239,68,68,0.5)' }}
                  >
                    +{item.bonusPercent}%
                  </span>
                )}

                {isFree && (
                  <span
                    className="absolute top-1.5 left-1.5 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', boxShadow: '0 2px 6px rgba(52,211,153,0.5)' }}
                  >
                    FREE
                  </span>
                )}

                {item.stock !== undefined && item.stock < 999 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 text-white text-[9px] font-bold text-center py-1"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
                  >
                    Còn {item.stock}
                  </div>
                )}
              </div>

              <div
                className="px-2.5 py-2"
                style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <p className="text-white/90 text-[11px] font-semibold truncate mb-0.5 leading-tight">{item.name}</p>
                <div className="flex items-center justify-between gap-1">
                  <p
                    className="text-xs font-black tracking-wide"
                    style={{
                      color: isFree ? '#34d399' : canAfford ? '#fbbf24' : '#6b7280',
                      textShadow: isFree
                        ? '0 0 10px rgba(52,211,153,0.7)'
                        : canAfford
                        ? '0 0 10px rgba(251,191,36,0.8)'
                        : 'none',
                    }}
                  >
                    {isFree ? 'Miễn phí' : formatPrice(item.price)}
                  </p>
                  {isOwned && (
                    <span
                      className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' }}
                    >
                      <Check className="w-2.5 h-2.5" /> Đã có
                    </span>
                  )}
                </div>
              </div>

            </div>

          );
        })}
      </div>

      {totalPages > 1 && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl mx-auto w-fit"
          style={{
            background: 'rgba(10,10,20,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className="w-9 h-9 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={
                currentPage === page
                  ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }
                  : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }
              }
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
          >
            ›
          </button>


        </div>

      )}

      {selectedItem && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative w-full max-w-[320px] rounded-2xl overflow-hidden flex flex-col items-center"
            style={{
              background: 'linear-gradient(145deg, #13131f 0%, #0e0e1c 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full aspect-square">
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, #0e0e1c 0%, transparent 50%)' }}
              />
              <span
                className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {typeLabel[selectedItem.type] ?? 'Vật phẩm'}
              </span>
            </div>

            <div className="px-6 pb-6 w-full -mt-2">
              <h2 className="text-xl font-black text-white text-center mb-1">{selectedItem.name}</h2>
              <p className="text-white/45 text-xs text-center mb-5 leading-relaxed">{selectedItem.description}</p>

              {(selectedItem.bonusPercent || selectedItem.type === ItemType.TET_INTERACTIVE) && (
                <div
                  className="rounded-xl p-4 mb-4 space-y-2"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  {selectedItem.bonusPercent && (
                    <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold">
                      <Zap className="w-4 h-4 text-indigo-400" />
                      Tăng {selectedItem.bonusPercent}% tiền thắng
                    </div>
                  )}
                  {selectedItem.expiresIn && (
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      Hiệu lực: {Math.floor(selectedItem.expiresIn / 3600000)} giờ
                    </div>
                  )}
                  {selectedItem.minReward && selectedItem.maxReward && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold">
                      <Coins className="w-4 h-4" />
                      {selectedItem.minReward.toLocaleString()} – {selectedItem.maxReward.toLocaleString()}đ
                    </div>
                  )}
                  {selectedItem.maxUses !== undefined && (
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Số lần dùng: {selectedItem.maxUses === -1 ? 'Vô hạn' : selectedItem.maxUses}
                    </div>
                  )}
                  {selectedItem.cooldown && selectedItem.cooldown > 0 && (
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      Cooldown: {Math.floor(selectedItem.cooldown / 60000)} phút
                    </div>
                  )}
                </div>
              )}

              <div
                className="rounded-xl p-4 mb-5 text-center"
                style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.15)' }}
              >
                <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-1">Giá bán</p>
                <p
                  className="text-3xl font-black"
                  style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.4)' }}
                >
                  {selectedItem.price === 0 ? 'MIỄN PHÍ' : formatCurrency(selectedItem.price)}
                </p>
              </div>

              <button
                onClick={() => handlePurchase(selectedItem)}
                disabled={
                  userMoney < selectedItem.price ||
                  purchasingItemId === selectedItem.id ||
                  selectedItem.stock === 0
                }
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-black text-sm transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
                style={
                  selectedItem.stock === 0
                    ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }
                    : userMoney < selectedItem.price
                    ? { background: 'rgba(156,163,175,0.1)', border: '1px solid rgba(156,163,175,0.2)', color: '#6b7280' }
                    : {
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                      }
                }
              >
                {purchasingItemId === selectedItem.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : selectedItem.stock === 0 ? (
                  <>
                    <PackageX className="w-4 h-4" />
                    Hết hàng
                  </>
                ) : userMoney < selectedItem.price ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Không đủ tiền
                  </>
                ) : selectedItem.price === 0 ? (
                  <>
                    <Gift className="w-4 h-4" />
                    Nhận miễn phí
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Mua ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};