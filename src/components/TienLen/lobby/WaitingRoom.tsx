import React from 'react';
import { PlayerSlot } from './PlayerSlot';
import { RoomCodeDisplay } from './RoomCodeDisplay';
import { useTienLenWaitingRoom } from '../../../hooks/useTienLenWaitingRoom';

interface WaitingRoomProps {
  user: any;
  lobbyId: string;
  onLeaveRoom: () => void;
}

function formatMoney(money: number) {
  if (money >= 1_000_000_000) return `${Math.floor(money / 1_000_000_000)}B`;
  if (money >= 1_000_000) return `${Math.floor(money / 1_000_000)}M${Math.floor((money % 1_000_000) / 100_000) || ''}`;
  if (money >= 1_000) return `${Math.floor(money / 1_000)}K${Math.floor((money % 1_000) / 100) || ''}`;
  return money.toString();
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  user,
  lobbyId,
  onLeaveRoom,
}) => {
  const { lobby, loading, setReady, leaveRoom, startGame } = useTienLenWaitingRoom(lobbyId);

  if (loading || !lobby) {
    return <div className="text-white text-center py-8">Đang tải phòng...</div>;
  }

  // Lấy vị trí từ localStorage nếu có
  const storedPos = Number(window.localStorage.getItem('tienlen_position'));
  const myPos = !isNaN(storedPos) && lobby.players[storedPos]?.uid === user.uid
    ? storedPos
    : Object.values(lobby.players).findIndex((p: any) => p.uid === user.uid);
  const myPlayer = myPos !== -1 ? lobby.players[myPos] : null;

  const handleReady = () => {
    if (myPlayer) setReady(user.uid, myPos, !myPlayer.ready);
  };
  const handleLeave = async () => {
    if (myPlayer) {
      await leaveRoom(myPos);
      onLeaveRoom();
    }
  };

  // Kiểm tra host và tất cả đã sẵn sàng
  const isHost = lobby.hostUid === user.uid;
  const enoughPlayers = Object.values(lobby.players).length >= 2;
  const allReady = enoughPlayers && Object.values(lobby.players).every((p: any) => p.ready);

  // Detect mobile landscape
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLandscape = window.innerWidth > window.innerHeight;

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center ${isMobile && isLandscape ? 'bg-gradient-to-br from-yellow-100 via-yellow-300 to-yellow-100' : ''}`}>
      <div className={`rounded-xl shadow-lg p-2 border-2 border-yellow-400 bg-white/90 w-[99vw] max-w-[480px] min-h-[220px]`}>
        <RoomCodeDisplay code={lobby.roomCode} />
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-black font-bold text-sm">Loại phòng: <span className="text-yellow-700">{lobby.roomType}</span></div>
            <div className="text-black text-xs">Cược: <span className="font-semibold">{formatMoney(lobby.betAmount)}đ</span></div>
          </div>
          <button className="bg-yellow-400 text-black font-bold rounded shadow border border-yellow-700 px-3 py-1 hover:bg-yellow-500 transition-all" onClick={handleLeave} disabled={!myPlayer}>Rời phòng</button>
        </div>
        <div className={`flex flex-row justify-center gap-2 mb-2`}>
          {Object.values(lobby.players).map((player: any, idx: number) => (
            <PlayerSlot key={player.uid} player={player} isHost={lobby.hostUid === player.uid} />
          ))}
        </div>
        <button
          className="btn btn-primary mt-2 w-full text-sm py-2"
          onClick={handleReady}
          disabled={!myPlayer}
        >
          {myPlayer ? (myPlayer.ready ? 'Hủy sẵn sàng' : 'Sẵn sàng') : 'Đang vào phòng...'}
        </button>
        {isHost && allReady && (
          <button
            className="btn btn-success mt-2 w-full text-sm py-2"
            onClick={startGame}
          >
            Bắt đầu (5s)
          </button>
        )}
        {lobby.status === 'starting' && (
          <div className="text-yellow-700 text-center text-base font-bold my-2">
            Game sẽ bắt đầu sau {lobby.startingIn || 5} giây...
          </div>
        )}
      </div>
    </div>
  );
};