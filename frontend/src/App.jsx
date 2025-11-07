import React, { useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import GameScene from './components/GameScene';
import HUD from './components/HUD';

function App() {
  const { gameState, connected, restart, boost } = useGameSocket();

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        restart();
      } else if (e.key === 'b' || e.key === 'B') {
        boost();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [restart, boost]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 3D Game Scene */}
      <GameScene gameState={gameState} />
      
      {/* HUD Overlay */}
      <HUD 
        gameState={gameState} 
        onRestart={restart}
        onBoost={boost}
      />
      
      {/* Connection Status */}
      {!connected && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#ff4444',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '10px 20px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 1000,
        }}>
          ⚠️ Disconnected from server
        </div>
      )}
    </div>
  );
}

export default App;