import React, { useEffect, useState } from 'react';
import { OrientationPrompt } from './OrientationPrompt';
import { LobbyList } from './lobby/LobbyList';
import { WaitingRoom } from './lobby/WaitingRoom';
import { GameBoard } from './game/GameBoard';
import { getDatabase, onValue, ref } from 'firebase/database';

interface TienLenProps {
  user: { uid: string; username: string; email: string; balance: number; avatar?: string; background?: string; };
  onGoHome?: () => void;
  isMuted?: boolean;
  toggleSound?: () => void;
}

export const TienLen: React.FC<TienLenProps> = ({ user, onGoHome, isMuted, toggleSound }) => {
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
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);


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
      {toggleSound && (
        <button
          onClick={toggleSound}
          className="fixed top-16 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-110"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
          title={isMuted ? 'Bật nhạc' : 'Tắt nhạc'}
        >
          {isMuted
            ? <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 19L19 20.27 20.27 19 5.27 4 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            : <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          }
        </button>
      )}
      {view === 'lobby' && <LobbyList user={user} onJoinRoom={handleJoinRoom} onGoHome={onGoHome} />}
      {view === 'waiting' && currentLobbyId && <WaitingRoom user={user} lobbyId={currentLobbyId} onLeaveRoom={handleLeaveRoom} />}
      {view === 'game' && currentLobbyId && <GameBoard user={user} gameId={currentLobbyId} onBackToLobby={handleLeaveRoom} />}
    </div>
  );
};