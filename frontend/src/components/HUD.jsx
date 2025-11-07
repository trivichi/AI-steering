import React from 'react';

export default function HUD({ gameState, onRestart, onBoost }) {
  if (!gameState) {
    return (
      <div style={styles.container}>
        <div style={styles.connecting}>
          <h2>🔌 Connecting to game server...</h2>
          <p>Make sure Python backend is running on port 8000</p>
        </div>
      </div>
    );
  }

  const { car, score, level, input, boostActive, invincible, gameOver } = gameState;
  const speedKmh = Math.round(Math.abs(car.speed * 15));
  const steeringDeg = Math.round(input.steering);

  return (
    <div style={styles.container}>
      {/* Top Left - Stats */}
      <div style={styles.topLeft}>
        <div style={styles.statItem}>
          <span style={styles.label}>SCORE</span>
          <span style={styles.value}>{score}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.label}>LEVEL</span>
          <span style={styles.value}>{level}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.label}>SPEED</span>
          <span style={styles.value}>{speedKmh} km/h</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.label}>STEERING</span>
          <span style={styles.value}>{steeringDeg}°</span>
        </div>
      </div>

      {/* Top Right - Status */}
      <div style={styles.topRight}>
        <div style={{
          ...styles.status,
          backgroundColor: input.handDetected ? '#00ff00' : (input.aiActive ? '#ffaa00' : '#ff0000')
        }}>
          {input.handDetected ? '✋ HANDS ON' : (input.aiActive ? '🤖 AI DRIVE' : '⚠️ HANDS OFF')}
        </div>
        
        {boostActive && (
          <div style={{...styles.status, backgroundColor: '#ffd700'}}>
            ⚡ BOOST ACTIVE
          </div>
        )}
        
        {invincible && (
          <div style={{...styles.status, backgroundColor: '#ff00ff'}}>
            🛡️ INVINCIBLE
          </div>
        )}
      </div>

      {/* Bottom Right - Camera Preview */}
      {gameState.camPreview && (
        <div style={styles.cameraPreview}>
          <img
            src={`data:image/jpeg;base64,${gameState.camPreview}`}
            alt="Hand Tracking"
            style={styles.cameraImage}
          />
          <div style={styles.cameraLabel}>Hand Tracking</div>
        </div>
      )}

      {/* Bottom Left - Controls */}
      <div style={styles.bottomLeft}>
        <button 
          onClick={onRestart} 
          style={styles.button}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#ff4444'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc143c'}
        >
          🔄 RESTART (R)
        </button>
        <button 
          onClick={onBoost} 
          style={styles.button}
          disabled={boostActive}
          onMouseEnter={(e) => !boostActive && (e.target.style.backgroundColor = '#ffcc00')}
          onMouseLeave={(e) => e.target.style.backgroundColor = boostActive ? '#666' : '#ffd700'}
        >
          ⚡ BOOST (B)
        </button>
      </div>

      {/* Game Over Overlay */}
      {gameOver && (
        <div style={styles.gameOver}>
          <div style={styles.gameOverContent}>
            <h1 style={styles.gameOverTitle}>GAME OVER</h1>
            <p style={styles.gameOverScore}>Final Score: {score}</p>
            <p style={styles.gameOverLevel}>Level: {level}</p>
            <button onClick={onRestart} style={styles.restartButton}>
              🔄 RESTART GAME
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    fontFamily: 'monospace',
    zIndex: 10,
  },
  connecting: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: '40px',
    borderRadius: '10px',
  },
  topLeft: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  statItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '10px 20px',
    borderRadius: '5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    minWidth: '200px',
  },
  label: {
    color: '#aaa',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  value: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  topRight: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  status: {
    padding: '10px 20px',
    borderRadius: '5px',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '14px',
    textAlign: 'center',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
  },
  cameraPreview: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    border: '3px solid white',
    borderRadius: '5px',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraImage: {
    width: '200px',
    height: '150px',
    display: 'block',
  },
  cameraLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '5px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  bottomLeft: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    display: 'flex',
    gap: '10px',
    pointerEvents: 'auto',
  },
  button: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#dc143c',
    color: 'white',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
  },
  gameOver: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  gameOverContent: {
    textAlign: 'center',
    color: 'white',
    animation: 'fadeIn 0.5s',
  },
  gameOverTitle: {
    fontSize: '72px',
    marginBottom: '20px',
    color: '#dc143c',
    textShadow: '0 0 20px rgba(220, 20, 60, 0.8)',
  },
  gameOverScore: {
    fontSize: '32px',
    marginBottom: '10px',
  },
  gameOverLevel: {
    fontSize: '24px',
    marginBottom: '40px',
    color: '#aaa',
  },
  restartButton: {
    padding: '20px 40px',
    fontSize: '20px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: '#dc143c',
    color: 'white',
    transition: 'all 0.2s',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
  },
};