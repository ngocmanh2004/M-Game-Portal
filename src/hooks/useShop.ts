import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { ShopItem, UserItem } from '../types';
import { SHOP_ITEMS } from '../constants';

export const useShop = (userId: string | undefined) => {
  const [items] = useState<ShopItem[]>(SHOP_ITEMS);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Thay đổi useEffect thành realtime listener:
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserItems = async () => {
      try {
        const userItemsRef = collection(db, 'userItems', userId, 'items');
        const snapshot = await getDocs(userItemsRef);

        const loadedItems: UserItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedItems.push({
            itemId: docSnap.id,
            quantity: data.quantity || 1,
            obtainedAt: data.obtainedAt || Date.now(),
            used: data.used || false,
            usesLeft: data.usesLeft,
            lastUsedAt: data.lastUsedAt,
            displayOnDashboard: data.displayOnDashboard,
            activatedAt: data.activatedAt,
            expiresAt: data.expiresAt
          });
        });

        setUserItems(loadedItems);
        setLoading(false);
      } catch (error) {
        console.error('Error loading shop:', error);
        setUserItems([]);
        setLoading(false);
      }
    };

    fetchUserItems();
    
    // ⭐ THÊM: Auto refresh mỗi 2 giây (để cập nhật sau khi mua)
    const interval = setInterval(fetchUserItems, 2000);
    return () => clearInterval(interval);
  }, [userId]);

  const buyItem = async (itemId: string, userMoney: number) => {
    console.log('🛒 Buying item:', itemId, 'User money:', userMoney);
    
    if (!userId) {
      console.error('❌ No userId');
      return { success: false, message: 'Chưa đăng nhập!' };
    }

    const item = items.find(i => i.id === itemId);
    if (!item) {
      console.error('❌ Item not found:', itemId);
      return { success: false, message: 'Vật phẩm không tồn tại!' };
    }

    if (userMoney < item.price) {
      console.error('❌ Not enough money:', userMoney, '<', item.price);
      return { success: false, message: 'Không đủ tiền!' };
    }

    try {
      console.log('💰 Deducting money...');
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        money: increment(-item.price)
      });

      console.log('📦 Adding item to inventory...');
      const userItemRef = doc(db, 'userItems', userId, 'items', itemId);
      const userItemSnap = await getDoc(userItemRef);

      if (userItemSnap.exists()) {
        await updateDoc(userItemRef, {
          quantity: increment(1)
        });
      } else {
        const newItem: UserItem = {
          itemId,
          quantity: 1,
          obtainedAt: Date.now(),
          used: false
        };

        if (item.maxUses !== undefined && item.maxUses > 0) {
          newItem.usesLeft = item.maxUses;
        }

        await setDoc(userItemRef, newItem);
      }

      console.log('✅ Purchase successful!');
      
      // Reload userItems
      const updatedSnapshot = await getDocs(collection(db, 'userItems', userId, 'items'));
      const updatedItems: UserItem[] = [];
      updatedSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        updatedItems.push({
          itemId: docSnap.id,
          quantity: data.quantity || 1,
          obtainedAt: data.obtainedAt || Date.now(),
          used: data.used || false,
          usesLeft: data.usesLeft,
          lastUsedAt: data.lastUsedAt,
          displayOnDashboard: data.displayOnDashboard,
          activatedAt: data.activatedAt,
          expiresAt: data.expiresAt
        });
      });
      setUserItems(updatedItems);

      return { 
        success: true, 
        message: `Mua thành công ${item.name}!` 
      };
    } catch (error: any) {
      console.error('❌ Error buying item:', error);
      return { success: false, message: `Lỗi: ${error.message}` };
    }
  };

  const hasItem = (itemId: string) => {
    return userItems.some(ui => ui.itemId === itemId && ui.quantity > 0);
  };

  const getItemQuantity = (itemId: string) => {
    const userItem = userItems.find(ui => ui.itemId === itemId);
    return userItem?.quantity || 0;
  };

  return { 
    items, 
    userItems, 
    loading, 
    buyItem, 
    hasItem, 
    getItemQuantity 
  };
};