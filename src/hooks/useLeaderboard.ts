import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { LeaderboardEntry } from '../types';

export const useLeaderboard = (topCount: number = 10) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          orderBy('money', 'desc'),
          limit(topCount)
        );

        const snapshot = await getDocs(q);
        const entries: LeaderboardEntry[] = [];

        snapshot.docs.forEach((docSnap: QueryDocumentSnapshot<DocumentData>, index: number) => {
          const data = docSnap.data();
          entries.push({
            uid: docSnap.id,
            email: data.email || 'Unknown',
            avatar: data.avatar,
            background: data.background,
            money: data.money || 0,
            rank: index + 1
          });
        });

        setLeaderboard(entries);
        setLoading(false);
      } catch (error) {
        console.error('Leaderboard error:', error);
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // ⭐ REFRESH MỖI 10 GIÂY
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [topCount]);

  return { leaderboard, loading };
};