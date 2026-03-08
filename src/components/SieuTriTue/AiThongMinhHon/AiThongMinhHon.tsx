import React, { useEffect, useState } from 'react';
import { LobbyList } from './lobby/LobbyList';
import { WaitingRoom } from './lobby/WaitingRoom';
import { GameBoard } from './game/GameBoard';
import { getDatabase, onValue, ref, onDisconnect, update } from 'firebase/database';

interface Props {
  user: { uid: string; username: string; email: string; balance: number; avatar?: string; background?: string };
  onGoHome?: () => void;
}

export const AiThongMinhHon: React.FC<Props> = ({ user, onGoHome }) => {
  const [view, setView] = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  const handleJoinRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setView('waiting');
  };

  const handleLeaveRoom = () => {
    setCurrentRoomId(null);
    setView('lobby');
    window.localStorage.removeItem('quiz_lobby_id');
  };

  useEffect(() => {
    if (view !== 'waiting' || !currentRoomId) return;
    const db = getDatabase();
    const roomRef = ref(db, `quizRooms/${currentRoomId}`);

    // Set up onDisconnect to remove player automatically if they close tab/browser
    const playerRef = ref(db, `quizRooms/${currentRoomId}/players/${user.uid}`);
    const onDisconnectRef = onDisconnect(playerRef);
    onDisconnectRef.remove().catch(console.error);

    const unsub = onValue(roomRef, snap => {
      const room = snap.val();
      if (!room) {
        handleLeaveRoom();
        return;
      }
      if (room.status === 'playing' || room.status === 'ended') setView('game');

      // Auto host migration
      const players = room.players || {};
      const activePlayerUids = Object.keys(players).sort();

      if (activePlayerUids.length > 0 && room.hostUid && !players[room.hostUid]) {
        if (activePlayerUids[0] === user.uid) {
          update(ref(db, `quizRooms/${currentRoomId}`), {
            hostUid: user.uid,
            hostName: players[user.uid].name || user.username
          }).catch(console.error);
        }
      }
    });

    return () => {
      onDisconnectRef.cancel().catch(console.error);
      unsub();
    };
  }, [view, currentRoomId]);

  return (
    <div
      className="w-screen h-screen min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/assets/image/background/sanh_gamesieutritue.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {view === 'lobby' && <LobbyList user={user} onJoinRoom={handleJoinRoom} onGoHome={onGoHome} />}
      {view === 'waiting' && currentRoomId && (
        <WaitingRoom user={user} roomId={currentRoomId} onLeaveRoom={handleLeaveRoom} />
      )}
      {view === 'game' && currentRoomId && (
        <GameBoard user={user} roomId={currentRoomId} onBackToLobby={handleLeaveRoom} />
      )}
    </div>
  );
};
