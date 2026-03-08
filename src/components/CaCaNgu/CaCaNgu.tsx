import React, { useEffect, useState } from 'react';
import { getDatabase, onValue, ref } from 'firebase/database';
import { OrientationPrompt } from './OrientationPrompt';
import { LobbyList } from './lobby/LobbyList';
import { WaitingRoom } from './lobby/WaitingRoom';
import { GameBoard } from './game/GameBoard';

interface CaCaNguProps {
  user: { uid: string; username: string; email: string; balance: number; avatar?: string; background?: string };
  onGoHome?: () => void;
}

export const CaCaNgu: React.FC<CaCaNguProps> = ({ user, onGoHome }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [view, setView] = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [currentLobbyId, setCurrentLobbyId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    const check = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  useEffect(() => {
    if (isMobile && !isPortrait && window.screen.orientation && (window.screen.orientation as any).lock) {
      (window.screen.orientation as any).lock('landscape').catch(() => {});
    }
  }, [isMobile, isPortrait]);

  useEffect(() => {
    if (view !== 'waiting' || !currentLobbyId) return;
    const db = getDatabase();
    const lobbyRef = ref(db, `cacangu/lobbies/${currentLobbyId}`);
    const unsub = onValue(lobbyRef, (snap) => {
      const lobby = snap.val();
      if (lobby?.status === 'started' && lobby.gameId) {
        setGameId(lobby.gameId);
        setView('game');
      }
    });
    return () => unsub();
  }, [view, currentLobbyId]);

  const handleJoinRoom = (lobbyId: string) => {
    setCurrentLobbyId(lobbyId);
    setView('waiting');
  };

  const handleLeaveRoom = () => {
    setCurrentLobbyId(null);
    setGameId(null);
    setView('lobby');
  };

  if (isMobile && isPortrait) return <OrientationPrompt />;

  return (
    <div
      className="w-screen h-screen min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#1a0a00' }}
    >
      {view === 'lobby' && (
        <LobbyList user={user} onJoinRoom={handleJoinRoom} onGoHome={onGoHome} />
      )}
      {view === 'waiting' && currentLobbyId && (
        <WaitingRoom user={user} lobbyId={currentLobbyId} onLeaveRoom={handleLeaveRoom} />
      )}
      {view === 'game' && gameId && (
        <GameBoard user={user} gameId={gameId} onBackToLobby={handleLeaveRoom} />
      )}
    </div>
  );
};
