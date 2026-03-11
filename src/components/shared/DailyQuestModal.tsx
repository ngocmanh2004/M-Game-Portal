import React, { useState } from 'react';
import { useDailyQuests } from '../../hooks/useDailyQuests';
import { formatCurrency } from '../../utils';

interface Props {
    uid: string;
    onClose: () => void;
}

export const DailyQuestModal: React.FC<Props> = ({ uid, onClose }) => {
    const { quests, loading, claimReward } = useDailyQuests(uid);
    const [claimingId, setClaimingId] = useState<string | null>(null);

    const handleClaim = async (id: string) => {
        setClaimingId(id);
        await claimReward(id);
        setClaimingId(null);
    };

    const totalCompleted = quests.filter(q => (q.progress || 0) >= q.target).length;
    const isAllDone = quests.length > 0 && totalCompleted === quests.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Container */}
            <div className="relative w-full max-w-lg bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-3xl border border-white/10 shadow-2xl flex flex-col p-6 overflow-hidden animate-slide-up">

                {/* Abstract shapes bg */}
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-indigo-500/20 blur-[50px] rounded-full point-events-none" />
                <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-pink-500/10 blur-[50px] rounded-full point-events-none" />

                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-400 to-teal-600 uppercase tracking-widest drop-shadow-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        Nhiệm Vụ Mỗi Ngày
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-gray-400 text-sm mb-6">Làm nhiệm vụ mỗi ngày để nhận vô vàn phần thưởng. Tự động làm mới lúc 0h.</p>

                {loading ? (
                    <div className="py-12 flex justify-center w-full">
                        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                        {quests.map(quest => {
                            const isCompleted = (quest.progress || 0) >= quest.target;
                            const canClaim = isCompleted && !quest.isClaimed;

                            return (
                                <div
                                    key={quest.id}
                                    className={`relative overflow-hidden p-[1px] rounded-2xl transition-all duration-300 ${quest.isClaimed ? 'opacity-60 bg-white/5 border-white/5' :
                                            isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 scale-[1.02]' : 'bg-white/10'
                                        }`}
                                >
                                    <div className="bg-[#1e293b] p-4 rounded-[15px] flex items-center justify-between gap-4 h-full">

                                        <div className="flex-1">
                                            <h4 className={`text-base font-bold mb-1 ${isCompleted && !quest.isClaimed ? 'text-emerald-400' : 'text-white'}`}>
                                                {quest.title}
                                            </h4>
                                            <p className="text-gray-400 text-xs mb-3">{quest.description}</p>

                                            {/* Progress bar */}
                                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-700 ease-out ${quest.isClaimed ? 'bg-gray-500' : 'bg-emerald-400'}`}
                                                    style={{ width: `${Math.min(100, ((quest.progress || 0) / quest.target) * 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 font-mono tracking-widest text-right">
                                                {Math.min(quest.progress || 0, quest.target)} / {quest.target}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-center gap-2 min-w-[90px]">
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
                                                <span className="text-lg">
                                                    {quest.rewardType === 'gold' ? '💰' : '🎟️'}
                                                </span>
                                                <span className={`font-black text-sm ${quest.rewardType === 'gold' ? 'text-yellow-400' : 'text-pink-400'}`}>
                                                    +{quest.rewardType === 'gold' ? formatCurrency(quest.rewardValue) : quest.rewardValue}
                                                </span>
                                            </div>

                                            {quest.isClaimed ? (
                                                <span className="text-gray-500 font-bold text-xs uppercase tracking-wider h-[32px] flex items-center">
                                                    Đã Nhận
                                                </span>
                                            ) : canClaim ? (
                                                <button
                                                    onClick={() => handleClaim(quest.id)}
                                                    disabled={claimingId === quest.id}
                                                    className="px-4 py-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs rounded-lg uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center h-[32px]"
                                                >
                                                    {claimingId === quest.id ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Nhận'}
                                                </button>
                                            ) : (
                                                <span className="text-white/30 font-bold text-xs uppercase tracking-wider h-[32px] flex items-center">
                                                    Chưa Xong
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {isAllDone && (
                            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-center animate-pulse">
                                <p className="text-yellow-400 font-black text-lg">🎉 CHÚC MỪNG HOÀN THÀNH 🎉</p>
                                <p className="text-yellow-200/60 text-xs">Bạn đã nhận hết toàn bộ quà nhiệm vụ hôm nay. Hãy quay lại vào ngày mai nhé!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
        </div>
    );
};
