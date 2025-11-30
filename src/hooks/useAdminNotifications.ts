import { useState, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { AdminNotification, NotificationType } from '../types';

export const useAdminNotifications = () => {
  const [loading, setLoading] = useState(false);

  // ⭐ GỬI THÔNG BÁO
  const sendNotification = async (
    adminUserId: string,
    notification: Omit<AdminNotification, 'id' | 'createdBy' | 'createdAt'>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const notifRef = doc(collection(db, 'notifications'));
      
      await setDoc(notifRef, {
        ...notification,
        id: notifRef.id,
        createdBy: adminUserId,
        createdAt: serverTimestamp(),
        readBy: [],
        claimedBy: []
      });

      // Nếu gửi cho all users, tạo userNotifications cho tất cả
      if (notification.targetType === 'all') {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const batch = writeBatch(db);

        usersSnapshot.docs.forEach((userDoc) => {
          const userNotifRef = doc(collection(db, 'userNotifications'));
          batch.set(userNotifRef, {
            id: userNotifRef.id,
            userId: userDoc.id,
            notificationId: notifRef.id,
            read: false,
            claimed: false,
            createdAt: Date.now()
          });
        });

        await batch.commit();
      } else if (notification.targetUserIds) {
        // Gửi cho users cụ thể
        const batch = writeBatch(db);

        notification.targetUserIds.forEach((userId) => {
          const userNotifRef = doc(collection(db, 'userNotifications'));
          batch.set(userNotifRef, {
            id: userNotifRef.id,
            userId,
            notificationId: notifRef.id,
            read: false,
            claimed: false,
            createdAt: Date.now()
          });
        });

        await batch.commit();
      }

      console.log('✅ Notification sent:', notifRef.id);
      return true;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ⭐ LẤY DANH SÁCH THÔNG BÁO ADMIN ĐÃ GỬI
  const getNotifications = async (limitCount: number = 50): Promise<AdminNotification[]> => {
    try {
      const q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as AdminNotification);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return [];
    }
  };

  // ⭐ XÓA THÔNG BÁO
  const deleteNotification = async (notificationId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));

      // Xóa tất cả userNotifications liên quan
      const userNotifsQuery = query(
        collection(db, 'userNotifications'),
        where('notificationId', '==', notificationId)
      );

      const snapshot = await getDocs(userNotifsQuery);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log('✅ Notification deleted');
      return true;
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      return false;
    }
  };

  return {
    loading,
    sendNotification,
    getNotifications,
    deleteNotification
  };
};