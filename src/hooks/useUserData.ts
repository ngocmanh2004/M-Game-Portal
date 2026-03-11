import { useState, useEffect } from 'react';
import { doc, updateDoc, increment, onSnapshot, getDoc } from 'firebase/firestore'; // ⭐ THÊM getDoc
import { db } from '../firebase';
import { UserData } from '../types';
import { SHOP_ITEMS } from '../constants';
import { ItemType } from '../types';

export const useUserData = (userId: string | undefined) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // ⭐ REALTIME LISTENER
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', userId);

    // ⭐ LẮNG NGHE REALTIME
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      } else {
        setUserData(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to user data:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const updateMoney = async (newBalance: number) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId), { money: newBalance });
      setUserData(prev => prev ? { ...prev, money: newBalance } : null);
    } catch (error) {
      console.error('Error updating money:', error);
    }
  };

  // ⭐ MỚI: Tính bonus đang active
  const getActiveBonus = async (): Promise<number> => {
    if (!userId) return 0;

    try {
      const userItemsRef = doc(db, 'userItems', userId);
      const userItemsSnap = await getDoc(userItemsRef); // ⭐ getDoc ĐÃ ĐƯỢC IMPORT

      if (!userItemsSnap.exists()) return 0;

      const data = userItemsSnap.data();
      if (!data.activeBonus) return 0;

      const { bonusPercent, expiresAt } = data.activeBonus;

      if (Date.now() > expiresAt) {
        await updateDoc(userItemsRef, { activeBonus: null });
        return 0;
      }

      return bonusPercent;
    } catch (error) {
      console.error('Error getting active bonus:', error);
      return 0;
    }
  };

  const updateNickname = async (newNickname: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Chưa đăng nhập' };
    try {
      await updateDoc(doc(db, 'users', userId), { nickname: newNickname });
      setUserData(prev => prev ? { ...prev, nickname: newNickname } : null);
      return { success: true, message: 'Cập nhật biệt danh thành công' };
    } catch (error) {
      console.error('Error updating nickname:', error);
      return { success: false, message: 'Lỗi khi cập nhật biệt danh' };
    }
  };

  const updateTask = async (taskName: 'followTiktok' | 'subscribeYoutube'): Promise<{ success: boolean; message: string } | null> => {
    if (!userId || !userData) return null;

    const taskRewards = {
      followTiktok: 1000000,
      subscribeYoutube: 1000000
    };

    const taskLabels = {
      followTiktok: 'Follow TikTok',
      subscribeYoutube: 'Subscribe YouTube'
    };

    if (userData.tasks?.[taskName]) {
      return {
        success: false,
        message: `Bạn đã hoàn thành nhiệm vụ ${taskLabels[taskName]} rồi!`
      };
    }

    try {
      const userRef = doc(db, 'users', userId);
      const reward = taskRewards[taskName];

      await updateDoc(userRef, {
        [`tasks.${taskName}`]: true,
        money: increment(reward),
        tickets: increment(1)
      });

      const updatedUserDoc = await getDoc(doc(db, 'users', userId)); // ⭐ getDoc ĐÃ ĐƯỢC IMPORT
      if (updatedUserDoc.exists()) {
        const newData = updatedUserDoc.data() as UserData;
        setUserData(newData);
      }

      return {
        success: true,
        message: `🎉 Hoàn thành nhiệm vụ! Nhận ${reward.toLocaleString('vi-VN')} đ và 1 Vé Quay`
      };
    } catch (error) {
      console.error('Error updating task:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra!'
      };
    }
  };

  const checkin = async () => {
    if (!userId || !userData) return null;

    const today = new Date().toLocaleDateString('vi-VN');
    if (userData.lastCheckin === today) {
      return { success: false, message: 'Đã điểm danh hôm nay rồi!' };
    }

    try {
      const reward = 500000;
      await updateDoc(doc(db, 'users', userId), {
        lastCheckin: today,
        money: increment(reward)
      });

      setUserData(prev => prev ? {
        ...prev,
        lastCheckin: today,
        money: prev.money + reward
      } : null);

      return { success: true, message: `+${reward.toLocaleString()}đ - Điểm danh thành công!` };
    } catch (error) {
      console.error('Error checking in:', error);
      return { success: false, message: 'Có lỗi xảy ra!' };
    }
  };

  return {
    userData,
    loading,
    updateMoney,
    updateTask,
    checkin,
    updateNickname,
    getActiveBonus  // ⭐ Export function mới
  };
};