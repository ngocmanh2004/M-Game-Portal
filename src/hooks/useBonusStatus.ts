import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface BonusStatus {
  bonusPercent: number;
  expiresAt: number;
  timeLeft: string; // "09:30:12"
  isActive: boolean;
}

export const useBonusStatus = (userId: string | undefined): BonusStatus | null => {
  const [status, setStatus] = useState<BonusStatus | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef = useRef<number>(0);
  const bonusPercentRef = useRef<number>(0);

  const formatTime = (ms: number): string => {
    if (ms <= 0) return '00:00:00';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = expiresAtRef.current - Date.now();
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setStatus(null);
        // Xóa activeBonus khỏi Firestore khi hết hạn
        if (userId) {
          updateDoc(doc(db, 'userItems', userId), { activeBonus: null }).catch(() => {});
        }
        return;
      }
      setStatus({
        bonusPercent: bonusPercentRef.current,
        expiresAt: expiresAtRef.current,
        timeLeft: formatTime(remaining),
        isActive: true,
      });
    }, 1000);
  };

  useEffect(() => {
    if (!userId) {
      setStatus(null);
      return;
    }

    const parentRef = doc(db, 'userItems', userId);
    const unsubscribe = onSnapshot(parentRef, (snap) => {
      if (!snap.exists()) { setStatus(null); return; }

      const data = snap.data();
      const bonus = data?.activeBonus;

      if (!bonus || !bonus.expiresAt || !bonus.bonusPercent) {
        setStatus(null);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      const remaining = bonus.expiresAt - Date.now();
      if (remaining <= 0) {
        setStatus(null);
        updateDoc(parentRef, { activeBonus: null }).catch(() => {});
        return;
      }

      expiresAtRef.current = bonus.expiresAt;
      bonusPercentRef.current = bonus.bonusPercent;

      setStatus({
        bonusPercent: bonus.bonusPercent,
        expiresAt: bonus.expiresAt,
        timeLeft: formatTime(remaining),
        isActive: true,
      });

      startCountdown();
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userId]);

  return status;
};
