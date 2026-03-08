import React from 'react';
import { PlayerSlot } from './PlayerSlot';
import { RoomCodeDisplay } from './RoomCodeDisplay';
import { useTienLenWaitingRoom } from '../../../hooks/useTienLenWaitingRoom';
import { useUserData } from '../../../hooks/useUserData';

interface WaitingRoomProps { user: any; lobbyId: string; onLeaveRoom: () => void; }

function formatMoney(money: number) {
  if (!money) return '0';
  if (money >= 1_000_000_000) return `${Math.floor(money / 1_000_000_000)}B`;
  if (money >= 1_000_000) return `${Math.floor(money / 1_000_000)}M`;
  if (money >= 1_000) return `${Math.floor(money / 1_000)}K`;
  return money.toString();
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ user, lobbyId, onLeaveRoom }) => {
  const { lobby, loading, setReady, leaveRoom, startGame } = useTienLenWaitingRoom(lobbyId, user?.uid);
  const { userData } = useUserData(user?.uid);

  if (loading || !lobby) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Đang tải phòng...</p>
        </div>
      </div>
    );
  }

  const playersMap = lobby.players || {};
  const playersArr = Object.values(playersMap).filter(Boolean);
  const storedPos = Number(window.localStorage.getItem('tienlen_position'));
  const myPos = !isNaN(storedPos) && playersMap[storedPos]?.uid === user.uid ? storedPos : playersArr.findIndex((p: any) => p.uid === user.uid);
  const myPlayer = myPos !== -1 ? playersMap[myPos] : null;

  const handleReady = () => { if (myPlayer) setReady(user.uid, myPos, !myPlayer.ready); };
  const handleLeave = async () => { if (myPlayer) { onLeaveRoom(); await leaveRoom(myPos); } };

  const isHost = lobby.hostUid === user.uid;
  const allReady = playersArr.length >= 2 && playersArr.every((p: any) => p.ready);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-[#0c0c16] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top gradient accent */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div>
            <h2 className="text-sm font-black text-white">Phòng Chờ</h2>
            <div className="flex gap-3 mt-0.5 text-[10px] text-gray-500">
              <span>Cược: <span className="text-amber-400 font-bold">{formatMoney(lobby.betAmount)}đ</span></span>
              <span>Loại: <span className="text-white capitalize">{lobby.roomType}</span></span>
            </div>
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

        {/* Room code */}
        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Mã phòng</span>
          <div className="scale-75 origin-right">
            <RoomCodeDisplay code={lobby.roomCode} />
          </div>
        </div>

        {/* Players list */}
        <div className="flex-grow overflow-y-auto p-4 grid grid-cols-3 gap-2 content-start">
          {playersArr.map((player: any) => (
            <PlayerSlot
              key={player.uid}
              player={player.uid === user.uid && userData ? { ...player, balance: userData.money } : player}
              isHost={lobby.hostUid === player.uid}
            />
          ))}
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 border-t border-white/10 flex gap-2">
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

          {isHost && allReady && (
            <button
              className="flex-1 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transition-all active:scale-95 animate-pulse"
              onClick={startGame}
            >
              Bắt Đầu
            </button>
          )}
        </div>

        {/* Starting overlay */}
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