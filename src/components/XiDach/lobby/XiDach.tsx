import React, { useEffect, useState } from 'react';
import { LobbyList } from './LobbyList';
import { WaitingRoom } from './WaitingRoom';
import { GameBoard } from '../game/GameBoard';
import { getDatabase, onValue, ref } from 'firebase/database';

interface XiDachProps {
  user: { uid: string; username: string; email: string; balance: number; avatar?: string; background?: string };
  onGoHome?: () => void;
}

export const XiDach: React.FC<XiDachProps> = ({ user, onGoHome }) => {
  const [view, setView] = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [currentLobbyId, setCurrentLobbyId] = useState<string | null>(null);

  const handleJoinRoom = (lobbyId: string) => {
    setCurrentLobbyId(lobbyId);
    setView('waiting');
  };

  const handleLeaveRoom = () => {
    setCurrentLobbyId(null);
    setView('lobby');
    window.localStorage.removeItem('xidach_position');
  };

  // Watch lobby → game transition
  useEffect(() => {
    if (view !== 'waiting' || !currentLobbyId) return;
    const db = getDatabase();
    const lobbyRef = ref(db, `xidach/lobbies/${currentLobbyId}`);
    const unsub = onValue(lobbyRef, snap => {
      const lobby = snap.val();
      if (lobby?.status === 'playing') setView('game');
    });
    return () => unsub();
  }, [view, currentLobbyId]);

  // If solo mode (game created directly), go straight to game
  useEffect(() => {
    if (view !== 'waiting' || !currentLobbyId) return;
    const db = getDatabase();
    const gameRef = ref(db, `xidach/games/${currentLobbyId}`);
    const unsub = onValue(gameRef, snap => {
      if (snap.exists()) setView('game');
    });
    return () => unsub();
  }, [view, currentLobbyId]);

  return (
    <div className="w-screen h-screen min-h-screen xidach-game flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/image/background/sanh_gamedanhbai.png)`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {view === 'lobby' && <LobbyList user={user} onJoinRoom={handleJoinRoom} onGoHome={onGoHome} />}
      {view === 'waiting' && currentLobbyId && (
        <WaitingRoom user={user} lobbyId={currentLobbyId} onLeaveRoom={handleLeaveRoom} />
      )}
      {view === 'game' && currentLobbyId && (
        <GameBoard user={user} gameId={currentLobbyId} onBackToLobby={handleLeaveRoom} />
      )}
    </div>
  );
};
