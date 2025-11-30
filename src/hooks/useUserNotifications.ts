import { useState, useEffect } from 'react';
import { 
  collection, 
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { AdminNotification, UserNotification } from '../types';

export const useUserNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<(UserNotification & { details: AdminNotification })[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastResult, setLastResult] = useState<{ type: 'win' | 'loss' | 'info', message: string } | null>(null);

  // ⭐ REALTIME: Lắng nghe thông báo
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'userNotifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const userNotifs: UserNotification[] = snapshot.docs.map(doc => doc.data() as UserNotification);

      // Fetch chi tiết thông báo
      const notifsWithDetails = await Promise.all(
        userNotifs.map(async (userNotif) => {
          const notifDoc = await getDoc(doc(db, 'notifications', userNotif.notificationId));
          return {
            ...userNotif,
            details: notifDoc.exists() ? notifDoc.data() as AdminNotification : null
          };
        })
      );

      const validNotifs = notifsWithDetails.filter(n => n.details !== null);
      setNotifications(validNotifs as any);
      setUnreadCount(validNotifs.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // ⭐ ĐÁNH DẤU ĐÃ ĐỌC
  const markAsRead = async (userNotificationId: string, notificationId: string) => {
    console.log('[markAsRead] userNotificationId:', userNotificationId, 'notificationId:', notificationId, 'userId:', userId);
    try {
      await updateDoc(doc(db, 'userNotifications', userNotificationId), {
        read: true
      });

      const notif = notifications.find(n => n.id === userNotificationId);
      const readByArr = notif?.details?.readBy;
      console.log('[markAsRead] readByArr:', readByArr);
      await updateDoc(doc(db, 'notifications', notificationId), {
        readBy: Array.isArray(readByArr) ? [...readByArr, userId] : [userId]
      });
      console.log('[markAsRead] Đánh dấu đã đọc thành công');
    } catch (error) {
      console.error('❌ [markAsRead] Error:', error);
    }
  };

  // ⭐ NHẬN QUÀ
  const claimGift = async (
    userNotificationId: string, 
    notificationDetails: AdminNotification
  ): Promise<{ success: boolean; message: string }> => {
    console.log('[claimGift] Bắt đầu nhận quà', { userNotificationId, notificationDetails, userId });
    if (!userId) {
      console.warn('[claimGift] Không có userId!');
      return { success: false, message: 'Chưa đăng nhập' };
    }

    try {
      const userNotif = notifications.find(n => n.id === userNotificationId);
      console.log('[claimGift] userNotif:', userNotif);
      if (userNotif?.claimed) {
        setLastResult({ type: 'info', message: 'Bạn đã nhận quà này rồi!' });
        console.warn('[claimGift] Đã nhận quà rồi!');
        return { success: false, message: 'Đã nhận quà rồi!' };
      }

      const userRef = doc(db, 'users', userId);

      // Cộng tiền nếu có
      if (notificationDetails.giftMoney) {
        console.log('[claimGift] Cộng tiền:', notificationDetails.giftMoney, 'cho user:', userId);
        await updateDoc(userRef, {
          money: increment(notificationDetails.giftMoney)
        });
        console.log('[claimGift] Đã cộng tiền!');
      }

      // Thêm vật phẩm nếu có
      console.log('[claimGift] giftItems:', notificationDetails.giftItems);
      if (notificationDetails.giftItems && notificationDetails.giftItems.length > 0) {
        for (const giftItem of notificationDetails.giftItems) {
          console.log('[claimGift] Thêm vật phẩm:', giftItem, 'vào userItems cho userId:', userId);
          const userItemRef = doc(db, 'userItems', userId, 'items', giftItem.itemId);
          const userItemSnap = await getDoc(userItemRef);

          if (userItemSnap.exists()) {
            console.log('[claimGift] Vật phẩm đã có, tăng số lượng');
            await updateDoc(userItemRef, {
              quantity: increment(giftItem.quantity)
            });
          } else {
            console.log('[claimGift] Vật phẩm chưa có, tạo mới:', `userItems/${userId}/items/${giftItem.itemId}`);
            await setDoc(userItemRef, {
              itemId: giftItem.itemId,
              quantity: giftItem.quantity,
              purchasedAt: Date.now()
            });
          }
        }
      } else {
        console.log('[claimGift] Không có vật phẩm nào để nhận!');
      }

      // Đánh dấu đã nhận
      await updateDoc(doc(db, 'userNotifications', userNotificationId), {
        claimed: true
      });
      console.log('[claimGift] Đánh dấu đã nhận thành công');

      // Đảm bảo không bao giờ truyền undefined cho Firestore array field
      const claimedByArr = notificationDetails.claimedBy;
      console.log('[claimGift] claimedByArr:', claimedByArr);
      await updateDoc(doc(db, 'notifications', notificationDetails.id), {
        claimedBy: Array.isArray(claimedByArr) ? [...claimedByArr, userId] : [userId]
      });
      console.log('[claimGift] Đánh dấu claimedBy thành công');

      setLastResult({ type: 'win', message: '🎁 Nhận quà thành công! Kiểm tra túi đồ nhé!' });
      return { success: true, message: '🎁 Đã nhận quà!' };
    } catch (error: any) {
      // Nếu đã nhận được vật phẩm, chỉ log lỗi, không hiện popup lỗi
      if (
        error?.code === 'permission-denied' ||
        (typeof error?.message === 'string' && error.message.includes('Missing or insufficient permissions'))
      ) {
        console.warn('[claimGift] Đã nhận quà nhưng không thể update claimedBy (không ảnh hưởng):', error);
        setLastResult({ type: 'win', message: '🎁 Nhận quà thành công! Kiểm tra túi đồ nhé!' });
        return { success: true, message: '🎁 Đã nhận quà!' };
      }
      setLastResult({ type: 'loss', message: 'Có lỗi xảy ra khi nhận quà!' });
      console.error('❌ [claimGift] Error:', error);
      return { success: false, message: 'Có lỗi xảy ra!' };
    }
  };

  // ⭐ XÓA THÔNG BÁO
  const deleteNotification = async (userNotificationId: string) => {
    console.log('[deleteNotification] userNotificationId:', userNotificationId, 'userId:', userId);
    try {
      await deleteDoc(doc(db, 'userNotifications', userNotificationId));
      setLastResult({ type: 'info', message: 'Đã xóa thông báo!' });
      console.log('[deleteNotification] Xóa thành công');
    } catch (error) {
      setLastResult({ type: 'loss', message: 'Xóa thông báo thất bại!' });
      console.error('❌ [deleteNotification] Error:', error);
    }
  };

  // ⭐ ĐÓNG POPUP
  const closeResult = () => setLastResult(null);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    claimGift,
    deleteNotification,
    lastResult,
    closeResult
  };
};