import { useState, useEffect } from 'react';
import { 
  doc, 
  updateDoc, 
  collection, 
  getDocs,
  writeBatch,
  increment,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { SHOP_ITEMS } from '../constants';
import { ItemType, TetItemAction, TetItemUseResult } from '../types';

interface InventoryItem {
  itemId: string;
  quantity: number;
  purchasedAt: number;
  used?: boolean;
  usesLeft?: number;
  lastUsedAt?: number;
  displayOnDashboard?: boolean;
  expiresAt?: number;
  activatedAt?: number;
}

export const useInventory = (userId: string | undefined) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchInventory = async () => {
      try {
        const userItemsRef = collection(db, 'userItems', userId, 'items');
        const querySnapshot = await getDocs(userItemsRef);

        const fetchedItems: InventoryItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedItems.push({
            itemId: doc.id,
            quantity: data.quantity || 1,
            purchasedAt: data.purchasedAt || Date.now(),
            used: data.used || false,
            usesLeft: data.usesLeft,
            lastUsedAt: data.lastUsedAt,
            displayOnDashboard: data.displayOnDashboard || false,
            expiresAt: data.expiresAt,
            activatedAt: data.activatedAt
          });
        });

        setItems(fetchedItems);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [userId]);

  // Apply Avatar/Background
  const applyItem = async (itemId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Chưa đăng nhập!' };

    try {
      const shopItem = SHOP_ITEMS.find(item => item.id === itemId);
      if (!shopItem) return { success: false, message: 'Vật phẩm không tồn tại!' };

      const batch = writeBatch(db);

      const sameTypeItems = items.filter(item => {
        const si = SHOP_ITEMS.find(s => s.id === item.itemId);
        return si?.type === shopItem.type;
      });

      sameTypeItems.forEach(item => {
        const itemRef = doc(db, 'userItems', userId, 'items', item.itemId);
        batch.update(itemRef, { used: false });
      });

      const selectedItemRef = doc(db, 'userItems', userId, 'items', itemId);
      batch.update(selectedItemRef, { used: true });

      const userRef = doc(db, 'users', userId);
      if (shopItem.type === ItemType.AVATAR) {
        batch.update(userRef, { avatar: shopItem.imageUrl });
      } else if (shopItem.type === ItemType.BACKGROUND) {
        batch.update(userRef, { background: shopItem.imageUrl });
      }

      await batch.commit();

      setItems(prev => prev.map(item => {
        const si = SHOP_ITEMS.find(s => s.id === item.itemId);
        if (si?.type === shopItem.type) {
          return { ...item, used: item.itemId === itemId };
        }
        return item;
      }));

      if (shopItem.type === ItemType.BACKGROUND) {
        document.body.style.backgroundImage = `url(${shopItem.imageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';

        window.dispatchEvent(new CustomEvent('background-updated', { 
          detail: { backgroundUrl: shopItem.imageUrl } 
        }));
      }

      return { 
        success: true, 
        message: shopItem.type === ItemType.AVATAR ? '✅ Đã đổi Avatar!' : '✅ Đã đổi Background!' 
      };
    } catch (error) {
      console.error('Error applying item:', error);
      return { success: false, message: 'Có lỗi xảy ra!' };
    }
  };

  // Activate Bonus Card
  const activateBonus = async (itemId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Chưa đăng nhập!' };

    try {
      const userItem = items.find(ui => ui.itemId === itemId);
      if (!userItem) return { success: false, message: 'Không sở hữu vật phẩm!' };
      if (userItem.used) return { success: false, message: 'Thẻ đã được kích hoạt!' };

      const shopItem = SHOP_ITEMS.find(si => si.id === itemId);
      if (!shopItem || shopItem.type !== ItemType.BONUS_CARD) {
        return { success: false, message: 'Vật phẩm không hợp lệ!' };
      }

      const itemRef = doc(db, 'userItems', userId, 'items', itemId);
      const now = Date.now();
      
      await updateDoc(itemRef, { 
        used: true,
        activatedAt: now,
        expiresAt: now + (shopItem.expiresIn || 86400000)
      });

      setItems(prev => prev.map(item => 
        item.itemId === itemId 
          ? { ...item, used: true, activatedAt: now, expiresAt: now + (shopItem.expiresIn || 86400000) }
          : item
      ));

      return { 
        success: true, 
        message: `✅ Kích hoạt +${shopItem.bonusPercent}% thành công!` 
      };
    } catch (error) {
      console.error('Error activating bonus:', error);
      return { success: false, message: 'Có lỗi xảy ra!' };
    }
  };

  // ⭐ CONSUME TET ITEM - ĐÃ FIX INCREMENT
  const consumeTetItem = async (itemId: string): Promise<TetItemUseResult> => {
    if (!userId) return { 
      success: false, 
      message: 'Chưa đăng nhập!' 
    };

    const userItem = items.find(ui => ui.itemId === itemId);
    if (!userItem) return { 
      success: false, 
      message: 'Không sở hữu vật phẩm!' 
    };

    const shopItem = SHOP_ITEMS.find(si => si.id === itemId);
    if (!shopItem || shopItem.type !== ItemType.TET_INTERACTIVE) {
      return { 
        success: false, 
        message: 'Vật phẩm không hợp lệ!' 
      };
    }

    if (userItem.usesLeft !== undefined && userItem.usesLeft <= 0) {
      return { 
        success: false, 
        message: 'Đã hết lượt sử dụng!' 
      };
    }

    if (shopItem.cooldown && userItem.lastUsedAt) {
      const timeSinceLastUse = Date.now() - userItem.lastUsedAt;
      if (timeSinceLastUse < shopItem.cooldown) {
        const remainingMinutes = Math.ceil((shopItem.cooldown - timeSinceLastUse) / 60000);
        return { 
          success: false, 
          message: `Còn ${remainingMinutes} phút nữa!` 
        };
      }
    }

    try {
      const minReward = shopItem.minReward || 0;
      const maxReward = shopItem.maxReward || 0;
      const reward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;

      console.log(`💰 Reward calculated: ${reward}`);

      const batch = writeBatch(db);

      // ⭐ INCREMENT TIỀN
      if (reward > 0) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          money: increment(reward)
        });
        console.log(`✅ Adding ${reward} to user balance`);
      }

      // Update item
      const itemRef = doc(db, 'userItems', userId, 'items', itemId);
      const updates: any = {
        lastUsedAt: Date.now()
      };

      if (shopItem.maxUses && shopItem.maxUses > 0) {
        if (userItem.usesLeft === undefined) {
          updates.usesLeft = shopItem.maxUses - 1;
        } else {
          updates.usesLeft = increment(-1);
        }
      }

      batch.update(itemRef, updates);
      await batch.commit();

      console.log('✅ Firestore updated successfully');

      // Update local state
      setItems(prev => {
        const newItems = prev.map(item => {
          if (item.itemId === itemId) {
            const newUsesLeft = item.usesLeft !== undefined 
              ? Math.max(0, item.usesLeft - 1)
              : (shopItem.maxUses && shopItem.maxUses > 0 ? shopItem.maxUses - 1 : undefined);
            
            return {
              ...item,
              usesLeft: newUsesLeft,
              lastUsedAt: Date.now()
            };
          }
          return item;
        });

        // ⭐ FIX: HOÀN CHỈNH LOGIC XÓA ITEM HẾT SỐ LẦN
        return newItems.filter(item => {
          if (item.usesLeft === 0) return false;
          return true;
        });
      });

      // Determine animation & sound
      let animation = 'bounce';
      let sound: any = 'money';

      switch (shopItem.tetAction) {
        case TetItemAction.FIREWORK:
          animation = 'firework';
          sound = 'boom';
          break;
        case TetItemAction.TREE:
          animation = 'shake';
          sound = 'lucky';
          break;
        case TetItemAction.FOOD:
          animation = 'pop';
          sound = 'win';
          break;
        case TetItemAction.LANTERN:
          animation = 'glow';
          sound = 'effect';
          break;
      }

      return {
        success: true,
        message: `🎉 +${reward.toLocaleString()}đ`,
        reward,
        animation,
        sound
      };

    } catch (error) {
      console.error('❌ Error using tet item:', error);
      return { 
        success: false, 
        message: 'Có lỗi xảy ra!' 
      };
    }
  };

  // ⭐ DELETE ITEM
  const deleteItem = async (itemId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Chưa đăng nhập!' };

    try {
      const userItem = items.find(ui => ui.itemId === itemId);
      if (!userItem) return { success: false, message: 'Vật phẩm không tồn tại!' };

      if (userItem.used) {
        return { success: false, message: 'Không thể xóa vật phẩm đang sử dụng!' };
      }

      const itemRef = doc(db, 'userItems', userId, 'items', itemId);

      if (userItem.quantity > 1) {
        await updateDoc(itemRef, {
          quantity: increment(-1)
        });

        setItems(prev => prev.map(item =>
          item.itemId === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        ));
      } else {
        await deleteDoc(itemRef);

        setItems(prev => prev.filter(item => item.itemId !== itemId));
      }

      return { success: true, message: '✅ Đã xóa vật phẩm!' };
    } catch (error) {
      console.error('Error deleting item:', error);
      return { success: false, message: 'Có lỗi xảy ra!' };
    }
  };

  // Toggle dashboard display
  const toggleDashboardDisplay = async (itemId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Chưa đăng nhập!' };

    try {
      const userItem = items.find(ui => ui.itemId === itemId);
      if (!userItem) return { success: false, message: 'Vật phẩm không tồn tại!' };

      const itemRef = doc(db, 'userItems', userId, 'items', itemId);
      const newDisplayValue = !userItem.displayOnDashboard;

      await updateDoc(itemRef, {
        displayOnDashboard: newDisplayValue
      });

      setItems(prev => prev.map(item =>
        item.itemId === itemId
          ? { ...item, displayOnDashboard: newDisplayValue }
          : item
      ));

      return {
        success: true,
        message: newDisplayValue ? '✅ Đã hiển thị trên Dashboard!' : '❌ Đã ẩn khỏi Dashboard!'
      };
    } catch (error) {
      console.error('Error toggling dashboard display:', error);
      return { success: false, message: 'Có lỗi xảy ra!' };
    }
  };

  // Get active bonus
  const getActiveBonus = async (): Promise<number> => {
    const bonusCards = items.filter(item => {
      const shopItem = SHOP_ITEMS.find(si => si.id === item.itemId);
      return shopItem?.type === ItemType.BONUS_CARD && item.used;
    });

    let totalBonus = 0;
    const now = Date.now();

    for (const card of bonusCards) {
      if (card.expiresAt && card.expiresAt > now) {
        const shopItem = SHOP_ITEMS.find(si => si.id === card.itemId);
        if (shopItem?.bonusPercent) {
          totalBonus += shopItem.bonusPercent;
        }
      }
    }

    return totalBonus;
  };

  // Get dashboard items
  const getDashboardItems = () => {
    return items.filter(item => item.displayOnDashboard);
  };

  return {
    items,
    loading,
    applyItem,
    activateBonus,
    consumeTetItem,
    deleteItem,
    toggleDashboardDisplay,
    getActiveBonus,
    getDashboardItems
  };
};