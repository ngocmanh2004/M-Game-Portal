import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

export const useChat = (userId: string | undefined, friendId: string | undefined) => {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tìm hoặc tạo chatId giữa 2 user
  useEffect(() => {
    if (!userId || !friendId) return;

    const fetchOrCreateChat = async () => {
      // Tìm chat đã có
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', userId)
      );
      const snapshot = await getDocs(q);
      let found = null;
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.participants.includes(friendId)) {
          found = docSnap.id;
        }
      });

      if (found) {
        setChatId(found);
      } else {
        // Tạo chat mới
        const newChatRef = await addDoc(chatsRef, {
          participants: [userId, friendId],
          createdAt: serverTimestamp()
        });
        setChatId(newChatRef.id);
      }
    };

    fetchOrCreateChat();
  }, [userId, friendId]);

  // Lắng nghe tin nhắn
  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [chatId]);

  // Gửi tin nhắn
  const sendMessage = async (text: string, senderId: string) => {
    if (!chatId || !senderId) return;
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      text,
      senderId,
      createdAt: serverTimestamp()
    });
  };

  return { chatId, messages, sendMessage, loading };
};