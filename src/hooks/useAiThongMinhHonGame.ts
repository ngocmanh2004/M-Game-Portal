import { useEffect, useState, useRef } from 'react';
import { getDatabase, ref, onValue, update, get } from 'firebase/database';
import { getFirestore, doc, runTransaction as fsRunTransaction } from 'firebase/firestore';
import { quizQuestions } from '../components/SieuTriTue/data/quizQuestions';
import { QuizRoomQuestion } from '../types';
import { trackQuestProgress } from './useDailyQuests';

const db = getDatabase();
const firestore = getFirestore();

const ROUND_CONFIG = [
  { round: 1, count: 10, difficulty: 'easy', timeLimit: 10, advancePercent: 0.7 },
  { round: 2, count: 10, difficulty: 'medium', timeLimit: 8, advancePercent: 0.5 },
  { round: 3, count: 10, difficulty: 'hard', timeLimit: 7, advancePercent: 1.0 },
];

function calcScore(isCorrect: boolean): number {
  return isCorrect ? 1 : 0;
}

function calcQualified(totalPlayers: number, percent: number): number {
  return Math.min(totalPlayers, Math.max(2, Math.ceil(totalPlayers * percent)));
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectQuestions(): QuizRoomQuestion[][] {
  const easyPool = (quizQuestions as any[]).filter((q) => q.difficulty === 'easy');
  const mediumPool = (quizQuestions as any[]).filter((q) => q.difficulty === 'medium');
  const hardPool = (quizQuestions as any[]).filter((q) => q.difficulty === 'hard');

  const pickRandom = (pool: any[], count: number): any[] => {
    const shuffled = shuffleArray(pool);
    return shuffled.slice(0, count);
  };

  const shuffleOptions = (q: any, timeLimit: number): QuizRoomQuestion => {
    const correctAnswer = q.options[q.correctIndex];
    const shuffledOptions = shuffleArray([...q.options]);
    const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
    return {
      id: q.id,
      question: q.question,
      options: shuffledOptions,
      correctIndex: newCorrectIndex,
      category: q.category,
      difficulty: q.difficulty,
      timeLimit,
    };
  };

  const round1 = pickRandom(easyPool, 10).map((q) => shuffleOptions(q, 10));
  const round2 = pickRandom(mediumPool, 10).map((q) => shuffleOptions(q, 8));
  const round3 = pickRandom(hardPool, 10).map((q) => shuffleOptions(q, 7));

  return [round1, round2, round3];
}

export function useAiThongMinhHonGame(roomId: string, uid: string) {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef<string>('');

  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(db, `quizRooms/${roomId}`);
    const unsub = onValue(roomRef, (snap) => {
      setRoom(snap.val());
      setLoading(false);
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    if (!room || !uid || room.status !== 'playing') return;
    const isHost = room.hostUid === uid;
    if (!isHost) return;

    const phase = room.phase;
    const phaseKey = `${phase}-r${room.currentRound}-q${room.currentQuestionIndex}-t${room.questionStartTime}`;
    if (phaseRef.current === phaseKey) return;
    phaseRef.current = phaseKey;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (phase === 'question') {
      const elapsed = (Date.now() - room.questionStartTime) / 1000;
      const remaining = Math.max(0, room.timeLimit - elapsed);
      timerRef.current = setTimeout(() => advanceToReveal(), remaining * 1000);
    } else if (phase === 'reveal') {
      timerRef.current = setTimeout(() => advanceFromReveal(), 3000);
    } else if (phase === 'elimination') {
      timerRef.current = setTimeout(() => advanceFromElimination(), 4000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [room?.phase, room?.currentRound, room?.currentQuestionIndex, room?.questionStartTime, room?.status]);

  const advanceToReveal = async () => {
    const snap = await get(ref(db, `quizRooms/${roomId}`));
    const r = snap.val();
    if (!r) return;

    const questionKey = `r${r.currentRound}q${r.currentQuestionIndex}`;
    const roundIdx = r.currentRound - 1;
    const currentQ = r.questions?.[roundIdx]?.[r.currentQuestionIndex];
    if (!currentQ) return;

    const questionAnswers = r.answers?.[questionKey] || {};
    const updates: Record<string, any> = {};

    // 1. Gather all correct answers with their times
    const correctSubmissions: { uid: string; answerTime: number }[] = [];
    Object.entries(r.players || {}).forEach(([playerUid, player]: any) => {
      if (player.isEliminated) return;
      const answer = questionAnswers[playerUid];
      const isCorrect = answer && answer.answerIndex === currentQ.correctIndex;
      if (isCorrect) {
        correctSubmissions.push({ uid: playerUid, answerTime: answer.answerTime || Number.MAX_VALUE });
      }
    });

    // 2. Sort by speed (ascending time)
    correctSubmissions.sort((a, b) => a.answerTime - b.answerTime);

    // 3. Assign ranks and points (handling ties)
    const pointsMap: Record<string, { points: number; rank: number }> = {};
    let currentRank = 1;
    let rankOffset = 0; // Number of people to skip for next rank due to ties
    let lastTime = -1;

    // Example sequence for 100 -> 90 -> 80
    correctSubmissions.forEach((sub) => {
      if (lastTime !== -1 && sub.answerTime > lastTime) {
        currentRank += 1 + rankOffset;
        rankOffset = 0;
      } else if (lastTime !== -1 && sub.answerTime === lastTime) {
        rankOffset += 1;
      }

      const p = Math.max(10, 100 - (currentRank - 1) * 10);
      pointsMap[sub.uid] = { points: p, rank: currentRank };
      lastTime = sub.answerTime;
    });

    // 4. Update the DB for all active players
    Object.entries(r.players || {}).forEach(([playerUid, player]: any) => {
      if (player.isEliminated) return;
      const answer = questionAnswers[playerUid];
      let gainedPoints = 0;
      let speedRank = 0;

      if (answer && answer.answerIndex === currentQ.correctIndex) {
        const stats = pointsMap[playerUid];
        if (stats) {
          gainedPoints = stats.points;
          speedRank = stats.rank;
        }
      }

      // Record their total score
      updates[`players/${playerUid}/score`] = (player.score || 0) + gainedPoints;

      // Update their specific answer node with the points so GameBoard can show them
      if (answer) {
        updates[`answers/${questionKey}/${playerUid}/gainedPoints`] = gainedPoints;
        updates[`answers/${questionKey}/${playerUid}/speedRank`] = speedRank;
      }
    });

    updates['phase'] = 'reveal';
    await update(ref(db, `quizRooms/${roomId}`), updates);
  };

  const advanceFromReveal = async () => {
    const snap = await get(ref(db, `quizRooms/${roomId}`));
    const r = snap.val();
    if (!r) return;

    const roundIdx = r.currentRound - 1;
    const isLastQuestionInRound = r.currentQuestionIndex >= 9;

    if (!isLastQuestionInRound) {
      const nextQIdx = r.currentQuestionIndex + 1;
      const nextQ = r.questions?.[roundIdx]?.[nextQIdx];
      await update(ref(db, `quizRooms/${roomId}`), {
        phase: 'question',
        currentQuestionIndex: nextQIdx,
        questionStartTime: Date.now(),
        timeLimit: nextQ?.timeLimit || ROUND_CONFIG[roundIdx].timeLimit,
      });
    } else {
      const activePlayers = Object.entries(r.players || {})
        .filter(([, p]: any) => !p.isEliminated)
        .sort(([, a]: any, [, b]: any) => (b as any).score - (a as any).score);

      if (r.currentRound === 3) {
        await endGame(r, activePlayers);
      } else if (r.practiceMode || activePlayers.length <= 2) {
        const nextRound = (r.currentRound + 1) as 1 | 2 | 3;
        const nextConfig = ROUND_CONFIG[nextRound - 1];
        const nextQ = r.questions?.[nextRound - 1]?.[0];
        await update(ref(db, `quizRooms/${roomId}`), {
          phase: 'question',
          currentRound: nextRound,
          currentQuestionIndex: 0,
          questionStartTime: Date.now(),
          timeLimit: nextQ?.timeLimit || nextConfig.timeLimit,
        });
      } else {
        const config = ROUND_CONFIG[roundIdx];
        const qualified = calcQualified(activePlayers.length, config.advancePercent);
        const eliminated = activePlayers.slice(qualified).map(([id]) => id);

        if (eliminated.length === 0) {
          const nextRound = (r.currentRound + 1) as 1 | 2 | 3;
          const nextConfig = ROUND_CONFIG[nextRound - 1];
          const nextQ = r.questions?.[nextRound - 1]?.[0];
          await update(ref(db, `quizRooms/${roomId}`), {
            phase: 'question',
            currentRound: nextRound,
            currentQuestionIndex: 0,
            questionStartTime: Date.now(),
            timeLimit: nextQ?.timeLimit || nextConfig.timeLimit,
          });
        } else {
          const updates: Record<string, any> = { phase: 'elimination' };
          eliminated.forEach((id) => {
            updates[`players/${id}/isEliminated`] = true;
            updates[`players/${id}/eliminatedInRound`] = r.currentRound;
            updates[`players/${id}/isSpectator`] = true;
          });
          await update(ref(db, `quizRooms/${roomId}`), updates);
        }
      }
    }
  };

  const advanceFromElimination = async () => {
    const snap = await get(ref(db, `quizRooms/${roomId}`));
    const r = snap.val();
    if (!r) return;

    const nextRound = (r.currentRound + 1) as 1 | 2 | 3;
    const nextConfig = ROUND_CONFIG[nextRound - 1];
    const nextQ = r.questions?.[nextRound - 1]?.[0];
    await update(ref(db, `quizRooms/${roomId}`), {
      phase: 'question',
      currentRound: nextRound,
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      timeLimit: nextQ?.timeLimit || nextConfig.timeLimit,
    });
  };

  const endGame = async (r: any, sortedActivePlayers: any[]) => {
    const top3 = sortedActivePlayers.slice(0, 3);
    const pot = r.totalPot;
    const rewards: Record<string, number> = {};
    const percents = top3.length === 1 ? [1.0] : top3.length === 2 ? [0.7, 0.3] : [0.6, 0.3, 0.1];

    top3.forEach(([playerUid]: any, i: number) => {
      rewards[playerUid] = Math.floor(pot * percents[i]);
    });

    const winners: Record<string, string> = {};
    if (top3[0]) winners.first = top3[0][0];
    if (top3[1]) winners.second = top3[1][0];
    if (top3[2]) winners.third = top3[2][0];

    for (const [playerUid, amount] of Object.entries(rewards)) {
      try {
        await fsRunTransaction(firestore, async (tx) => {
          const userRef = doc(firestore, 'users', playerUid);
          const userDoc = await tx.get(userRef);
          if (userDoc.exists()) {
            tx.update(userRef, { money: userDoc.data().money + amount });
          }
        });
      } catch (e) { console.error('Reward error:', e); }
    }

    // Track Quests for all active players who made it to the end
    sortedActivePlayers.forEach(([playerUid]: any) => {
      // "Chơi 2 ván Ai Thông Minh Hơn" quest
      trackQuestProgress(playerUid, 'play_aithongminhhon', 1);

      // If first place "Thắng 1 ván bất kỳ"
      if (winners.first === playerUid) {
        trackQuestProgress(playerUid, 'win_any_game', 1);
      }
    });

    await update(ref(db, `quizRooms/${roomId}`), {
      status: 'ended',
      phase: 'podium',
      winners,
      rewards,
    });
  };

  const startGame = async () => {
    const snap = await get(ref(db, `quizRooms/${roomId}`));
    const r = snap.val();
    if (!r) return;

    const selectedQuestions = selectQuestions();
    const players = r.players || {};
    const playerUids = Object.keys(players);

    const practiceMode = playerUids.length === 1;
    let totalPot = 0;

    if (!practiceMode) {
      for (const playerUid of playerUids) {
        try {
          await fsRunTransaction(firestore, async (tx) => {
            const userRef = doc(firestore, 'users', playerUid);
            const userDoc = await tx.get(userRef);
            if (userDoc.exists()) {
              const currentMoney = userDoc.data().money;
              if (currentMoney < r.betAmount) throw new Error('Insufficient balance');
              tx.update(userRef, { money: currentMoney - r.betAmount });
              totalPot += r.betAmount;
            }
          });
        } catch (e) { console.error('Deduct error:', e); }
      }
    }

    const firstQ = selectedQuestions[0][0];
    await update(ref(db, `quizRooms/${roomId}`), {
      status: 'playing',
      practiceMode,
      totalPot,
      questions: selectedQuestions,
      phase: 'question',
      currentRound: 1,
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      timeLimit: firstQ?.timeLimit || 10,
    });
  };

  const submitAnswer = async (answerIndex: number) => {
    if (!room || !uid) return;
    const player = room.players?.[uid];
    if (!player || player.isEliminated || player.isSpectator) return;
    if (room.phase !== 'question') return;

    const questionKey = `r${room.currentRound}q${room.currentQuestionIndex}`;
    const answerTime = (Date.now() - room.questionStartTime) / 1000;
    await update(ref(db, `quizRooms/${roomId}/answers/${questionKey}/${uid}`), {
      answerIndex,
      answerTime: Math.min(answerTime, room.timeLimit),
    });
  };

  return { room, loading, startGame, submitAnswer };
}
