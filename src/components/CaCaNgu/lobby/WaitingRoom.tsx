import React, { useEffect, useState } from 'react';
import { PlayerSlot } from './PlayerSlot';
import { useCaCaNguWaitingRoom } from '../../../hooks/useCaCaNguWaitingRoom';
import { CaNguColor } from '../../../types';

interface WaitingRoomProps {
  user: { uid: string; username: string; email: string; balance: number; avatar?: string; background?: string };
  lobbyId: string;
  onLeaveRoom: () => void;
}

function formatMoney(amount: number): string {
  if (!amount) return '0';
  if (amount >= 1_000_000_000) return `${Math.floor(amount / 1_000_000_000)}B`;
  if (amount >= 1_000_000) return `${Math.floor(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `${Math.floor(amount / 1_000)}K`;
  return amount.toString();
}

const COLOR_ORDER: CaNguColor[] = ['red', 'blue', 'yellow', 'green'];

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ user, lobbyId, onLeaveRoom }) => {
  const { lobby, loading, setReady, startGame, leaveRoom } = useCaCaNguWaitingRoom(lobbyId, user.uid);

  // Local countdown driven by startingTs — avoids Firebase round-trip delays
  const [countdown, setCountdown] = useState<number>(3);
  useEffect(() => {
    const status = (lobby as any)?.status;
    const startingTs = (lobby as any)?.startingTs as number | undefined;
    if (status !== 'starting') { setCountdown(3); return; }
    const tick = () => {
      const elapsed = startingTs ? Date.now() - startingTs : 0;
      setCountdown(Math.max(1, Math.ceil((3000 - elapsed) / 1000)));
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [(lobby as any)?.status, (lobby as any)?.startingTs]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !lobby) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/85">
        <div className="text-white text-xs animate-pulse">Đang tải...</div>
      </div>
    );
  }

  const players = (lobby.players || {}) as Record<string, any>;
  const playerUids = Object.keys(players).filter((k) => players[k] != null);
  const playerCount = playerUids.length;

  const sortedUids = [...playerUids].sort(
    (a, b) => (players[a]?.joinedAt || 0) - (players[b]?.joinedAt || 0)
  );

  const isHost = lobby.hostUid === user.uid;
  const myPlayer = players[user.uid] ?? null;
  const allReady =
    playerCount >= 2 && playerUids.every((uid) => players[uid]?.ready === true);

  const handleLeave = async () => {
    await leaveRoom();
    onLeaveRoom();
  };

  const slots = Array.from({ length: 4 }, (_, i) => {
    const uid = sortedUids[i] ?? null;
    const p = uid ? players[uid] : null;
    return {
      player: p ? { name: p.name, avatar: p.avatar, ready: p.ready } : undefined,
      color: COLOR_ORDER[i],
      isHost: uid ? uid === lobby.hostUid : false,
      isEmpty: !uid,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-2xl border-2 shadow-2xl p-4 flex flex-col max-h-[95vh]"
        style={{ background: '#1a0a00', borderColor: '#8B6914' }}
      >
        <div
          className="absolute inset-0 opacity-10 rounded-2xl"
          style={{
            background:
              'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)',
          }}
        />

        <button
          className="absolute top-2 right-2 p-1 rounded border shadow z-20 active:scale-95"
          style={{ background: '#2C1008', color: '#FFD54F', borderColor: '#5D2A00' }}
          onClick={handleLeave}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="relative z-10 flex flex-col items-center mb-3">
          <div
            className="font-bold text-sm uppercase tracking-widest mb-1"
            style={{ color: '#FFD700' }}
          >
            🐴 Cờ Cá Ngựa
          </div>
          {lobby.roomCode && (
            <div className="text-[10px]" style={{ color: '#A1887F' }}>
              Phòng #{lobby.roomCode}
            </div>
          )}
          <div
            className="mt-2 px-4 py-1.5 rounded-full border"
            style={{ background: '#2C1008', borderColor: '#8B6914' }}
          >
            <span className="text-xs" style={{ color: '#A1887F' }}>
              Mức cược:{' '}
            </span>
            <span className="font-bold text-xs" style={{ color: '#FFD700' }}>
              {formatMoney(lobby.betAmount)}đ
            </span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3 mb-3 flex-grow">
          {slots.map((slot, i) => (
            <PlayerSlot
              key={i}
              player={slot.player}
              color={slot.color}
              isHost={slot.isHost}
              isEmpty={slot.isEmpty}
              slotNumber={i}
            />
          ))}
        </div>

        <div
          className="relative z-20 pt-2 border-t flex justify-center gap-3"
          style={{ borderColor: '#5D2A00' }}
        >
          {!isHost && (
            <button
              className={`flex-1 py-2 rounded-lg font-bold text-xs shadow transition-all active:scale-95 uppercase tracking-wide ${
                myPlayer?.ready
                  ? 'bg-yellow-600 text-white border-b-4 border-yellow-800'
                  : 'bg-green-700 text-white border-b-4 border-green-900'
              }`}
              onClick={() => myPlayer && setReady(!myPlayer.ready)}
              disabled={!myPlayer}
            >
              {myPlayer ? (myPlayer.ready ? 'Bỏ Sẵn Sàng' : 'Sẵn Sàng') : '...'}
            </button>
          )}

          {isHost && allReady && (
            <button
              className="flex-1 py-2 rounded-lg font-bold text-xs shadow transition-all active:scale-95 uppercase tracking-wide animate-pulse border-b-4"
              style={{
                background: 'linear-gradient(to right, #8B6914, #FFD700)',
                color: '#1a0a00',
                borderColor: '#6B4F10',
              }}
              onClick={startGame}
            >
              Bắt Đầu
            </button>
          )}

          {isHost && !allReady && (
            <div className="flex-1 py-2 text-center text-xs" style={{ color: '#A1887F' }}>
              {playerCount < 2
                ? `Chờ người chơi... (${playerCount}/2)`
                : 'Chờ tất cả sẵn sàng...'}
            </div>
          )}
        </div>

        {(lobby as any).status === 'starting' && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col items-center animate-bounce">
              <div className="text-sm font-bold uppercase mb-1" style={{ color: '#FFD700' }}>
                Bắt đầu sau
              </div>
              <div className="text-6xl font-black text-white">
                {countdown}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
