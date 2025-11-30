import React, { useEffect, useState } from 'react';
import { OrientationPrompt } from './OrientationPrompt';
import { LobbyList } from './lobby/LobbyList';
import { WaitingRoom } from './lobby/WaitingRoom';
import { GameBoard } from './game/GameBoard';
import { getDatabase, onValue, ref } from 'firebase/database';

interface TienLenProps {
  user: {
    uid: string;
    username: string;
    email: string;
    balance: number;
    avatar?: string;
    background?: string;
  };
}

export const TienLen: React.FC<TienLenProps> = ({ user }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [view, setView] = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [currentLobbyId, setCurrentLobbyId] = useState<string | null>(null);

  // Detect mobile & orientation
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

  // Lock orientation on mobile landscape (nâng cao: dùng screen.orientation API)
  useEffect(() => {
    if (
      isMobile &&
      !isPortrait &&
      (window.screen.orientation && (window.screen.orientation as any).lock)
    ) {
      (window.screen.orientation as any).lock('landscape').catch(() => {});
    }
    return () => {
      if (isMobile && window.screen.orientation?.unlock) {
        window.screen.orientation.unlock();
      }
    };
  }, [isMobile, isPortrait]);

  // Handler khi join room thành công
  const handleJoinRoom = (lobbyId: string) => {
    setCurrentLobbyId(lobbyId);
    setView('waiting');
  };

  // Handler khi rời phòng
  const handleLeaveRoom = () => {
    setCurrentLobbyId(null);
    setView('lobby');
  };

  // Theo dõi trạng thái phòng để chuyển sang game
  useEffect(() => {
    if (view === 'waiting' && currentLobbyId) {
      const db = getDatabase();
      const lobbyRef = ref(db, `tienlen/lobbies/${currentLobbyId}`);
      const unsubscribe = onValue(lobbyRef, (snap) => {
        const lobby = snap.val();
        if (lobby && lobby.status === 'playing') {
          setView('game');
        }
      });
      return () => unsubscribe();
    }
  }, [view, currentLobbyId]);

  // Handler khi game bắt đầu (bước sau sẽ chuyển sang view 'game')
  // const handleStartGame = () => setView('game');

  // Nếu mobile và portrait thì show prompt
  if (isMobile && isPortrait) {
    return <OrientationPrompt />;
  }

  // Main render
  return (
    <div className="w-full h-full min-h-screen tien-len-game flex flex-col items-center justify-center">
      {view === 'lobby' && (
        <LobbyList user={user} onJoinRoom={handleJoinRoom} />
      )}
      {view === 'waiting' && currentLobbyId && (
        <WaitingRoom
          user={user}
          lobbyId={currentLobbyId}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
      {view === 'game' && currentLobbyId && (
        <GameBoard user={user} gameId={currentLobbyId} />
      )}
    </div>
  );
};