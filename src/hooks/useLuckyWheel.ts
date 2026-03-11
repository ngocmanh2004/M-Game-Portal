import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export interface WheelPrize {
    id: string;
    label: string;
    type: 'gold' | 'ticket' | 'icon';
    value: number;
    prob: number; // probability weight
    color: string;
}

export const WHEEL_PRIZES: WheelPrize[] = [
    { id: '1', label: '200K Vàng', type: 'gold', value: 200000, prob: 45, color: '#fef08a' },     // ~45%
    { id: '2', label: '500K Vàng', type: 'gold', value: 500000, prob: 25, color: '#fde047' },     // ~25%
    { id: '3', label: '+1 Lượt', type: 'ticket', value: 1, prob: 15, color: '#6ee7b7' },          // ~15%
    { id: '4', label: '1M Vàng', type: 'gold', value: 1000000, prob: 10, color: '#facc15' },      // ~10%
    { id: '5', label: '2M Vàng', type: 'gold', value: 2000000, prob: 4.9, color: '#eab308' },     // ~4.9%
    { id: '6', label: '5M Vàng!', type: 'gold', value: 5000000, prob: 0.1, color: '#ef4444' },    // ~0.1% Jackpot
    { id: '7', label: 'Hụt Rồi', type: 'icon', value: 0, prob: 0, color: '#94a3b8' }              // Hidden/Fallback
];

// Helper to determine prize
function getPrizeIndex(): number {
    const totalWeight = WHEEL_PRIZES.reduce((acc, prize) => acc + prize.prob, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < WHEEL_PRIZES.length; i++) {
        random -= WHEEL_PRIZES[i].prob;
        if (random <= 0) return i;
    }
    return 0; // Fallback to first prize
}

export function useLuckyWheel(uid: string | null) {
    const [tickets, setTickets] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }
        const db = getFirestore();
        const fetchTickets = async () => {
            try {
                const userRef = doc(db, 'users', uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const today = new Date().toISOString().split('T')[0];

                    if (data.lastSpinDate !== today) {
                        // New day => grant 1 free spin if they don't have many
                        const newTickets = (data.tickets || 0) + 1;
                        await updateDoc(userRef, {
                            lastSpinDate: today,
                            tickets: newTickets
                        });
                        setTickets(newTickets);
                    } else {
                        setTickets(data.tickets || 0);
                    }
                }
            } catch (err) {
                console.error("Lỗi khi tải thông tin vòng quay:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [uid]);

    const spin = async (): Promise<WheelPrize | null> => {
        if (!uid || tickets <= 0) return null;

        // Optimistic UI update
        setTickets(prev => prev - 1);

        const prizeIndex = getPrizeIndex();
        const prize = WHEEL_PRIZES[prizeIndex];

        try {
            const db = getFirestore();
            const userRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const currentData = userDoc.data();
                const currentMoney = currentData.money || 0;
                const currentTickets = currentData.tickets || 0;

                // Final updates to DB
                let newMoney = currentMoney;
                let newDbTickets = Math.max(0, currentTickets - 1); // Deduct the spin cost

                if (prize.type === 'gold') {
                    newMoney += prize.value;
                } else if (prize.type === 'ticket') {
                    newDbTickets += prize.value;
                }

                await updateDoc(userRef, {
                    money: newMoney,
                    tickets: newDbTickets
                });

                // Sync the state with true DB tickets
                setTickets(newDbTickets);
            }
            return prize;
        } catch (err) {
            console.error("Lỗi khi quay:", err);
            // Revert initial UI change if error
            setTickets(prev => prev + 1);
            return null;
        }
    };

    return { tickets, spin, loading, WHEEL_PRIZES };
}
