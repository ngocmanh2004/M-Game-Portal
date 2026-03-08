import React from 'react';
import { PlayerSlot } from './PlayerSlot';
import { useXiDachWaitingRoom } from '../../../hooks/useXiDachWaitingRoom';
import { useUserData } from '../../../hooks/useUserData';
import { formatMoney } from '../../../utils/xidach/gameLogic';

interface WaitingRoomProps {
  user: any;
  lobbyId: string;
  onLeaveRoom: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ user, lobbyId, onLeaveRoom }) => {
  const { lobby, loading, setReady, leaveRoom, startGame, transferHost } = useXiDachWaitingRoom(lobbyId, user);
  const { userData } = useUserData(user?.uid);

  if (loading || !lobby) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-400/40 border-t-red-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Đang tải phòng...</p>
        </div>
      </div>
    );
  }

  const playersMap = lobby.players || {};
  const playersArr = Object.values(playersMap).filter(Boolean) as any[];

  const storedPos = Number(window.localStorage.getItem('xidach_position'));
  const myPos = !isNaN(storedPos) && playersMap[storedPos]?.uid === user.uid
    ? storedPos
    : playersArr.findIndex((p: any) => p.uid === user.uid);
  const myPlayer = myPos !== -1 ? playersMap[myPos] : null;

  const isHost = lobby.hostUid === user.uid;
  const allReady = playersArr.length >= 1 && playersArr.every((p: any) => p.ready);

  const handleReady = () => {
    if (myPlayer) setReady(user.uid, myPos, !myPlayer.ready);
  };

  const handleLeave = async () => {
    if (isHost) { await leaveRoom(user.uid, -1); onLeaveRoom(); return; }
    if (myPlayer) { await leaveRoom(user.uid, myPos); onLeaveRoom(); }
  };

  const handleTransferHost = async (targetPosition: number) => {
    await transferHost(user.uid, targetPosition);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-[#0c0c16] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-500" />

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div>
            <h2 className="text-sm font-black text-white">Xì Dách — #{lobby.roomCode}</h2>
            <span className="text-[10px] text-gray-500">
              Cược tối thiểu: <span className="text-amber-400 font-bold">{formatMoney(lobby.betAmount)}đ</span>
            </span>
          </div>
          <button
            onClick={handleLeave}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Dealer row */}
        <div className="px-4 py-2 flex items-center gap-3 border-b border-white/5 bg-red-500/5">
          <img
            src={lobby.hostPhoto || '/assets/image/icons/user.png'}
            alt="dealer"
            className="w-9 h-9 rounded-full border-2 border-red-400/40 object-cover"
          />
          <div>
            <p className="text-[10px] text-red-400 font-bold uppercase">Nhà Cái</p>
            <p className="text-white text-xs font-semibold">{lobby.hostName}</p>
          </div>
        </div>

        {/* Players */}
        <div className="flex-grow overflow-y-auto p-4 grid grid-cols-3 gap-2 content-start">
          {playersArr.map((player: any) => {
            const playerPos = Object.keys(playersMap).find(k => playersMap[k]?.uid === player.uid);
            return (
              <div key={player.uid} className="relative">
                <PlayerSlot
                  player={player.uid === user.uid && userData ? { ...player, money: userData.money } : player}
                  isDealer={false}
                />
                {isHost && !player.isBot && (
                  <button
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-amber-600/80 hover:bg-amber-500 text-white px-1.5 py-0.5 rounded border border-amber-500/30 whitespace-nowrap transition-all active:scale-95 z-10"
                    onClick={() => playerPos !== undefined && handleTransferHost(Number(playerPos))}
                    title="Nhường nhà cái"
                  >
                    Nhường NC
                  </button>
                )}
              </div>
            );
          })}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, lobby.maxPlayers - playersArr.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="rounded-xl border border-dashed border-white/10 min-h-[100px] flex items-center justify-center"
            >
              <span className="text-gray-700 text-xs">Trống</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 flex gap-2">
          {!isHost && (
            <button
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${myPlayer?.ready
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                }`}
              onClick={handleReady}
              disabled={!myPlayer}
            >
              {myPlayer ? (myPlayer.ready ? 'Hủy Sẵn Sàng' : 'Sẵn Sàng') : '...'}
            </button>
          )}
          {isHost && allReady && (
            <button
              className="flex-1 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg transition-all active:scale-95 animate-pulse"
              onClick={startGame}
            >
              Bắt Đầu Ván
            </button>
          )}
          {isHost && !allReady && (
            <div className="flex-1 py-2 text-center text-gray-500 text-xs">
              Chờ người chơi sẵn sàng...
            </div>
          )}
        </div>

        {/* Countdown overlay */}
        {lobby.status === 'starting' && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-400 font-semibold uppercase tracking-widest">Bắt đầu sau</p>
              <div className="text-7xl font-black text-white">{lobby.startingIn || 3}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
