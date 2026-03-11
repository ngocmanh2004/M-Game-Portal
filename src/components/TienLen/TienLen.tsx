import React, { useEffect, useState } from 'react';
import { OrientationPrompt } from './OrientationPrompt';
import { LobbyList } from './lobby/LobbyList';
import { WaitingRoom } from './lobby/WaitingRoom';
import { GameBoard } from './game/GameBoard';
import { getDatabase, onValue, ref } from 'firebase/database';

interface TienLenProps {
  user: { uid: string; username: string; email: string; balance: number; avatar?: string; background?: string; };
  onGoHome?: () => void;
  onSetPlayingInternalMusic?: (isPlaying: boolean) => void;
}

export const TienLen: React.FC<TienLenProps> = ({ user, onGoHome, onSetPlayingInternalMusic }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [view, setView] = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [currentLobbyId, setCurrentLobbyId] = useState<string | null>(null);

  useEffect(() => {
    const check = () => { setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)); setIsPortrait(window.innerHeight > window.innerWidth); };
    check(); window.addEventListener('resize', check); window.addEventListener('orientationchange', check);
    return () => { window.removeEventListener('resize', check); window.removeEventListener('orientationchange', check); };
  }, []);

  useEffect(() => {
    if (isMobile && !isPortrait && (window.screen.orientation && (window.screen.orientation as any).lock)) { (window.screen.orientation as any).lock('landscape').catch(() => { }); }
  }, [isMobile, isPortrait]);

  const handleJoinRoom = (lobbyId: string) => { setCurrentLobbyId(lobbyId); setView('waiting'); };
  const handleLeaveRoom = () => { setCurrentLobbyId(null); setView('lobby'); };

  useEffect(() => {
    if (onSetPlayingInternalMusic) {
      onSetPlayingInternalMusic(view === 'game');
    }
    return () => {
      if (onSetPlayingInternalMusic) onSetPlayingInternalMusic(false);
    };
  }, [view, onSetPlayingInternalMusic]);

  useEffect(() => {
    if (view === 'waiting' && currentLobbyId) {
      const db = getDatabase();
      const lobbyRef = ref(db, `tienlen/lobbies/${currentLobbyId}`);
      const unsubscribe = onValue(lobbyRef, (snap) => {
        const lobby = snap.val();
        if (lobby && lobby.status === 'playing') setView('game');
      });
      return () => unsubscribe();
    }
  }, [view, currentLobbyId]);

  if (isMobile && isPortrait) return <OrientationPrompt />;

  return (
    <div className="w-screen h-screen min-h-screen tien-len-game flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/image/background/sanh_gamedanhbai.png)`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {view === 'lobby' && <LobbyList user={user} onJoinRoom={handleJoinRoom} onGoHome={onGoHome} />}
      {view === 'waiting' && currentLobbyId && <WaitingRoom user={user} lobbyId={currentLobbyId} onLeaveRoom={handleLeaveRoom} />}
      {view === 'game' && currentLobbyId && <GameBoard user={user} gameId={currentLobbyId} onBackToLobby={handleLeaveRoom} />}
    </div>
  );
};