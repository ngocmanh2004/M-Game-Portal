import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

export type QuestType = 'login' | 'play_tienlen' | 'play_aithongminhhon' | 'win_any_game';

export interface DailyQuest {
    id: QuestType;
    title: string;
    description: string;
    target: number;
    rewardValue: number;
    rewardType: 'gold' | 'ticket';
    progress?: number;
    isClaimed?: boolean;
}

export const QUEST_DEFINITIONS: Record<string, DailyQuest> = {
    login: {
        id: 'login',
        title: 'Đăng nhập hằng ngày',
        description: 'Vào game 1 lần',
        target: 1,
        rewardValue: 1,
        rewardType: 'ticket'
    },
    play_tienlen: {
        id: 'play_tienlen',
        title: 'Chiến Thần Tiến Lên',
        description: 'Chơi 3 ván Tiến Lên Miền Nam',
        target: 3,
        rewardValue: 500000,
        rewardType: 'gold'
    },
    play_aithongminhhon: {
        id: 'play_aithongminhhon',
        title: 'Đấu Trí Đỉnh Cao',
        description: 'Chơi 2 ván Ai Thông Minh Hơn',
        target: 2,
        rewardValue: 1,
        rewardType: 'ticket'
    },
    win_any_game: {
        id: 'win_any_game',
        title: 'Chuỗi Thắng Bất Bại',
        description: 'Thắng 1 ván bất kỳ',
        target: 1,
        rewardValue: 500000,
        rewardType: 'gold'
    }
};

export function useDailyQuests(uid: string | null) {
    const [quests, setQuests] = useState<DailyQuest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        const fetchQuests = async () => {
            try {
                const db = getFirestore();
                const userRef = doc(db, 'users', uid);
                const snap = await getDoc(userRef);

                if (snap.exists()) {
                    const data = snap.data();
                    const today = new Date().toISOString().split('T')[0];

                    let currQuests = data.dailyQuests || {};
                    let needsUpdate = false;

                    // Reset quests daily
                    if (data.lastQuestDate !== today) {
                        currQuests = {
                            login: { progress: 1, isClaimed: false }, // Login is automatically 1 on new day
                            play_tienlen: { progress: 0, isClaimed: false },
                            play_aithongminhhon: { progress: 0, isClaimed: false },
                            win_any_game: { progress: 0, isClaimed: false },
                        };
                        needsUpdate = true;
                    } else {
                        // Ensure login progress is 1 if it somehow isn't
                        if (!currQuests.login || currQuests.login.progress < 1) {
                            currQuests.login = { progress: 1, isClaimed: false };
                            needsUpdate = true;
                        }
                    }

                    if (needsUpdate) {
                        await updateDoc(userRef, {
                            dailyQuests: currQuests,
                            lastQuestDate: today
                        });
                    }

                    const parsedQuests = Object.keys(QUEST_DEFINITIONS).map(key => ({
                        ...QUEST_DEFINITIONS[key],
                        progress: currQuests[key]?.progress || 0,
                        isClaimed: currQuests[key]?.isClaimed || false,
                    }));

                    setQuests(parsedQuests);
                }
            } catch (e) {
                console.error("Daily Quests Error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchQuests();
    }, [uid]);

    const claimReward = async (questId: string) => {
        if (!uid) return false;

        // Optimistically update
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, isClaimed: true } : q));

        try {
            const db = getFirestore();
            const userRef = doc(db, 'users', uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                const data = snap.data();
                const questDef = QUEST_DEFINITIONS[questId];
                const currentQuests = data.dailyQuests || {};

                const qData = currentQuests[questId];
                if (!qData || qData.progress < questDef.target || qData.isClaimed) {
                    // Restore UI if invalid
                    setQuests(prev => prev.map(q => q.id === questId ? { ...q, isClaimed: false } : q));
                    return false;
                }

                let newMoney = data.money || 0;
                let newTickets = data.tickets || 0;

                if (questDef.rewardType === 'gold') {
                    newMoney += questDef.rewardValue;
                } else if (questDef.rewardType === 'ticket') {
                    newTickets += questDef.rewardValue;
                }

                currentQuests[questId].isClaimed = true;

                await updateDoc(userRef, {
                    money: newMoney,
                    tickets: newTickets,
                    dailyQuests: currentQuests
                });

                return true;
            }
        } catch (e) {
            console.error("Claim error:", e);
            // Revert optimism
            setQuests(prev => prev.map(q => q.id === questId ? { ...q, isClaimed: false } : q));
        }
        return false;
    };

    return { quests, loading, claimReward };
}

// Global utility helper to easily track progress anywhere without needing entire hook state
export const trackQuestProgress = async (uid: string, questId: string, amount: number = 1) => {
    if (!uid) return;
    try {
        const db = getFirestore();
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();
            const today = new Date().toISOString().split('T')[0];

            // If the date is old, wait for the main hook to reset it first, don't update stale data.
            // In a better architecture we do Cloud Functions, but client-side this is best effort.
            if (data.lastQuestDate !== today) return;

            const currQuests = data.dailyQuests || {};
            if (!currQuests[questId]) {
                currQuests[questId] = { progress: 0, isClaimed: false };
            }

            // Only add progress if hasn't been claimed yet
            if (!currQuests[questId].isClaimed) {
                currQuests[questId].progress += amount;
                await updateDoc(userRef, { dailyQuests: currQuests });
            }
        }
    } catch (e) {
        console.error("Tracking progress failed: ", e);
    }
}
