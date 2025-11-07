// import React from 'react';

// export default function HUD({ gameState, onRestart, onBoost }) {
//   if (!gameState) {
//     return (
//       <div style={styles.container}>
//         <div style={styles.connecting}>
//           <h2>🔌 Connecting to game server...</h2>
//           <p>Make sure Python backend is running on port 8000</p>
//         </div>
//       </div>
//     );
//   }

//   const { car, score, level, input, boostActive, invincible, gameOver } = gameState;
//   const speedKmh = Math.round(Math.abs(car.speed * 15));
//   const steeringDeg = Math.round(input.steering);

//   return (
//     <div style={styles.container}>
//       {/* Top Left - Stats */}
//       <div style={styles.topLeft}>
//         <div style={styles.statItem}>
//           <span style={styles.label}>SCORE</span>
//           <span style={styles.value}>{score}</span>
//         </div>
//         <div style={styles.statItem}>
//           <span style={styles.label}>LEVEL</span>
//           <span style={styles.value}>{level}</span>
//         </div>
//         <div style={styles.statItem}>
//           <span style={styles.label}>SPEED</span>
//           <span style={styles.value}>{speedKmh} km/h</span>
//         </div>
//         <div style={styles.statItem}>
//           <span style={styles.label}>STEERING</span>
//           <span style={styles.value}>{steeringDeg}°</span>
//         </div>
//       </div>

//       {/* Top Right - Status */}
//       <div style={styles.topRight}>
//         <div style={{
//           ...styles.status,
//           backgroundColor: input.handDetected ? '#00ff00' : (input.aiActive ? '#ffaa00' : '#ff0000')
//         }}>
//           {input.handDetected ? '✋ HANDS ON' : (input.aiActive ? '🤖 AI DRIVE' : '⚠️ HANDS OFF')}
//         </div>
        
//         {boostActive && (
//           <div style={{...styles.status, backgroundColor: '#ffd700'}}>
//             ⚡ BOOST ACTIVE
//           </div>
//         )}
        
//         {invincible && (
//           <div style={{...styles.status, backgroundColor: '#ff00ff'}}>
//             🛡️ INVINCIBLE
//           </div>
//         )}
//       </div>

//       {/* Bottom Right - Camera Preview */}
//       {gameState.camPreview && (
//         <div style={styles.cameraPreview}>
//           <img
//             src={`data:image/jpeg;base64,${gameState.camPreview}`}
//             alt="Hand Tracking"
//             style={styles.cameraImage}
//           />
//           <div style={styles.cameraLabel}>Hand Tracking</div>
//         </div>
//       )}

//       {/* Bottom Left - Controls */}
//       <div style={styles.bottomLeft}>
//         <button 
//           onClick={onRestart} 
//           style={styles.button}
//           onMouseEnter={(e) => e.target.style.backgroundColor = '#ff4444'}
//           onMouseLeave={(e) => e.target.style.backgroundColor = '#dc143c'}
//         >
//           🔄 RESTART (R)
//         </button>
//         <button 
//           onClick={onBoost} 
//           style={styles.button}
//           disabled={boostActive}
//           onMouseEnter={(e) => !boostActive && (e.target.style.backgroundColor = '#ffcc00')}
//           onMouseLeave={(e) => e.target.style.backgroundColor = boostActive ? '#666' : '#ffd700'}
//         >
//           ⚡ BOOST (B)
//         </button>
//       </div>

//       {/* Game Over Overlay */}
//       {gameOver && (
//         <div style={styles.gameOver}>
//           <div style={styles.gameOverContent}>
//             <h1 style={styles.gameOverTitle}>GAME OVER</h1>
//             <p style={styles.gameOverScore}>Final Score: {score}</p>
//             <p style={styles.gameOverLevel}>Level: {level}</p>
//             <button onClick={onRestart} style={styles.restartButton}>
//               🔄 RESTART GAME
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// const styles = {
//   container: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width: '100%',
//     height: '100%',
//     pointerEvents: 'none',
//     fontFamily: 'monospace',
//     zIndex: 10,
//   },
//   connecting: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)',
//     textAlign: 'center',
//     color: 'white',
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     padding: '40px',
//     borderRadius: '10px',
//   },
//   topLeft: {
//     position: 'absolute',
//     top: '20px',
//     left: '20px',
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '10px',
//   },
//   statItem: {
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     padding: '10px 20px',
//     borderRadius: '5px',
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     gap: '20px',
//     minWidth: '200px',
//   },
//   label: {
//     color: '#aaa',
//     fontSize: '12px',
//     fontWeight: 'bold',
//   },
//   value: {
//     color: '#fff',
//     fontSize: '18px',
//     fontWeight: 'bold',
//   },
//   topRight: {
//     position: 'absolute',
//     top: '20px',
//     right: '20px',
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '10px',
//   },
//   status: {
//     padding: '10px 20px',
//     borderRadius: '5px',
//     color: '#000',
//     fontWeight: 'bold',
//     fontSize: '14px',
//     textAlign: 'center',
//     boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
//   },
//   cameraPreview: {
//     position: 'absolute',
//     bottom: '20px',
//     right: '20px',
//     border: '3px solid white',
//     borderRadius: '5px',
//     overflow: 'hidden',
//     backgroundColor: '#000',
//   },
//   cameraImage: {
//     width: '200px',
//     height: '150px',
//     display: 'block',
//   },
//   cameraLabel: {
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     color: 'white',
//     padding: '5px',
//     textAlign: 'center',
//     fontSize: '12px',
//     fontWeight: 'bold',
//   },
//   bottomLeft: {
//     position: 'absolute',
//     bottom: '20px',
//     left: '20px',
//     display: 'flex',
//     gap: '10px',
//     pointerEvents: 'auto',
//   },
//   button: {
//     padding: '12px 24px',
//     fontSize: '14px',
//     fontWeight: 'bold',
//     fontFamily: 'monospace',
//     border: 'none',
//     borderRadius: '5px',
//     cursor: 'pointer',
//     backgroundColor: '#dc143c',
//     color: 'white',
//     transition: 'all 0.2s',
//     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
//   },
//   gameOver: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width: '100%',
//     height: '100%',
//     backgroundColor: 'rgba(0, 0, 0, 0.9)',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     pointerEvents: 'auto',
//   },
//   gameOverContent: {
//     textAlign: 'center',
//     color: 'white',
//     animation: 'fadeIn 0.5s',
//   },
//   gameOverTitle: {
//     fontSize: '72px',
//     marginBottom: '20px',
//     color: '#dc143c',
//     textShadow: '0 0 20px rgba(220, 20, 60, 0.8)',
//   },
//   gameOverScore: {
//     fontSize: '32px',
//     marginBottom: '10px',
//   },
//   gameOverLevel: {
//     fontSize: '24px',
//     marginBottom: '40px',
//     color: '#aaa',
//   },
//   restartButton: {
//     padding: '20px 40px',
//     fontSize: '20px',
//     fontWeight: 'bold',
//     fontFamily: 'monospace',
//     border: 'none',
//     borderRadius: '10px',
//     cursor: 'pointer',
//     backgroundColor: '#dc143c',
//     color: 'white',
//     transition: 'all 0.2s',
//     boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
//   },
// };

import React, { useState, useEffect } from 'react';

export default function HUD({ gameState, onRestart, onBoost }) {
  const [pulseBoost, setPulseBoost] = useState(false);
  
  useEffect(() => {
    if (gameState?.boostActive) {
      setPulseBoost(true);
      const timer = setTimeout(() => setPulseBoost(false), 500);
      return () => clearTimeout(timer);
    }
  }, [gameState?.boostActive]);

  if (!gameState) {
    return (
      <div style={styles.container}>
        <div style={styles.connecting}>
          <div style={styles.connectingSpinner}>⚡</div>
          <h2 style={{ marginBottom: '10px' }}>Connecting to Game Server</h2>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Ensure Python backend is running on port 8000
          </p>
        </div>
      </div>
    );
  }

  const { car, score, level, input, boostActive, invincible, gameOver } = gameState;
  const speedKmh = Math.round(Math.abs(car.speed * 15));
  const steeringDeg = Math.round(input.steering);
  const speedPercent = (speedKmh / 225) * 100; // Max speed ~225 km/h

  return (
    <div style={styles.container}>
      {/* Top Left - Stats with futuristic design */}
      <div style={styles.topLeft}>
        {/* Score */}
        <div style={{...styles.statCard, ...styles.scoreCard}}>
          <div style={styles.statLabel}>SCORE</div>
          <div style={styles.statValue}>{score.toLocaleString()}</div>
          <div style={styles.statBar}>
            <div style={{...styles.statBarFill, width: `${Math.min((score % 1000) / 10, 100)}%`}} />
          </div>
        </div>

        {/* Level */}
        <div style={{...styles.statCard, background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.1), rgba(255, 69, 0, 0.1))'}}>
          <div style={styles.statLabel}>LEVEL</div>
          <div style={styles.statValue}>{level}</div>
        </div>

        {/* Speed with gauge */}
        <div style={{...styles.statCard, ...styles.speedCard}}>
          <div style={styles.statLabel}>SPEED</div>
          <div style={styles.statValue}>{speedKmh} <span style={{fontSize: '14px', color: '#888'}}>km/h</span></div>
          <div style={styles.speedGauge}>
            <div style={{
              ...styles.speedGaugeFill,
              width: `${speedPercent}%`,
              background: speedPercent > 80 ? 
                'linear-gradient(90deg, #ff0000, #ff4444)' : 
                'linear-gradient(90deg, #00ff00, #00cc00)'
            }} />
          </div>
        </div>

        {/* Steering */}
        <div style={styles.statCard}>
          <div style={styles.statLabel}>STEERING</div>
          <div style={styles.statValue}>{steeringDeg}°</div>
          <div style={styles.steeringIndicator}>
            <div style={{
              ...styles.steeringBar,
              transform: `translateX(${steeringDeg * 0.5}px)`
            }} />
          </div>
        </div>
      </div>

      {/* Top Right - Status indicators */}
      <div style={styles.topRight}>
        <div style={{
          ...styles.statusBadge,
          background: input.handDetected ? 
            'linear-gradient(135deg, #00ff00, #00cc00)' : 
            (input.aiActive ? 
              'linear-gradient(135deg, #ffaa00, #ff8800)' : 
              'linear-gradient(135deg, #ff0000, #cc0000)'),
          boxShadow: input.handDetected ? 
            '0 0 20px rgba(0, 255, 0, 0.5)' : 
            (input.aiActive ? 
              '0 0 20px rgba(255, 170, 0, 0.5)' : 
              '0 0 20px rgba(255, 0, 0, 0.5)')
        }}>
          <span style={styles.statusIcon}>
            {input.handDetected ? '✋' : (input.aiActive ? '🤖' : '⚠️')}
          </span>
          <span style={styles.statusText}>
            {input.handDetected ? 'MANUAL' : (input.aiActive ? 'AI DRIVE' : 'NO INPUT')}
          </span>
        </div>
        
        {boostActive && (
          <div style={{
            ...styles.statusBadge,
            background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.8)',
            animation: pulseBoost ? 'pulse 0.5s' : 'none'
          }}>
            <span style={styles.statusIcon}>⚡</span>
            <span style={styles.statusText}>BOOST</span>
          </div>
        )}
        
        {invincible && (
          <div style={{
            ...styles.statusBadge,
            background: 'linear-gradient(135deg, #ff00ff, #cc00cc)',
            boxShadow: '0 0 30px rgba(255, 0, 255, 0.8)'
          }}>
            <span style={styles.statusIcon}>🛡️</span>
            <span style={styles.statusText}>SHIELD</span>
          </div>
        )}
      </div>

      {/* Bottom Right - Camera Preview */}
      {gameState.camPreview && (
        <div style={styles.cameraContainer}>
          <div style={styles.cameraHeader}>HAND TRACKING</div>
          <img
            src={`data:image/jpeg;base64,${gameState.camPreview}`}
            alt="Hand Tracking"
            style={styles.cameraImage}
          />
          <div style={styles.cameraOverlay}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: input.handDetected ? '#00ff00' : '#ff0000',
              boxShadow: `0 0 10px ${input.handDetected ? '#00ff00' : '#ff0000'}`
            }} />
          </div>
        </div>
      )}

      {/* Bottom Left - Controls */}
      <div style={styles.bottomLeft}>
        <button 
          onClick={onRestart} 
          style={styles.controlButton}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <span style={styles.buttonIcon}>🔄</span>
          <span>RESTART</span>
          <span style={styles.buttonKey}>R</span>
        </button>
        <button 
          onClick={onBoost} 
          style={{
            ...styles.controlButton,
            background: boostActive ? 
              'linear-gradient(135deg, #666, #444)' : 
              'linear-gradient(135deg, #ffd700, #ffaa00)',
            cursor: boostActive ? 'not-allowed' : 'pointer',
            opacity: boostActive ? 0.5 : 1
          }}
          disabled={boostActive}
          onMouseEnter={(e) => !boostActive && (e.target.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <span style={styles.buttonIcon}>⚡</span>
          <span>BOOST</span>
          <span style={styles.buttonKey}>B</span>
        </button>
      </div>

      {/* Game Over Overlay */}
      {gameOver && (
        <div style={styles.gameOverOverlay}>
          <div style={styles.gameOverContent}>
            <div style={styles.gameOverTitle}>RACE OVER</div>
            <div style={styles.gameOverStats}>
              <div style={styles.gameOverStat}>
                <div style={styles.gameOverStatLabel}>FINAL SCORE</div>
                <div style={styles.gameOverStatValue}>{score.toLocaleString()}</div>
              </div>
              <div style={styles.gameOverStat}>
                <div style={styles.gameOverStatLabel}>LEVEL REACHED</div>
                <div style={styles.gameOverStatValue}>{level}</div>
              </div>
            </div>
            <button 
              onClick={onRestart} 
              style={styles.restartButton}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #dc143c, #aa0000)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <span style={{fontSize: '24px', marginRight: '10px'}}>🏁</span>
              RESTART RACE
            </button>
          </div>
        </div>
      )}

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
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
    fontFamily: "'Orbitron', 'Rajdhani', monospace",
    zIndex: 10,
  },
  connecting: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    color: 'white',
    background: 'linear-gradient(135deg, rgba(220, 20, 60, 0.2), rgba(0, 0, 0, 0.8))',
    padding: '50px',
    borderRadius: '20px',
    border: '2px solid #dc143c',
    boxShadow: '0 0 50px rgba(220, 20, 60, 0.5)',
  },
  connectingSpinner: {
    fontSize: '48px',
    animation: 'spin 2s linear infinite',
    marginBottom: '20px',
  },
  topLeft: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statCard: {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))',
    backdropFilter: 'blur(10px)',
    padding: '15px 20px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    minWidth: '220px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    animation: 'fadeIn 0.3s',
  },
  scoreCard: {
    background: 'linear-gradient(135deg, rgba(220, 20, 60, 0.2), rgba(0, 0, 0, 0.8))',
    border: '1px solid rgba(220, 20, 60, 0.5)',
  },
  speedCard: {
    background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 0, 0, 0.8))',
    border: '1px solid rgba(0, 255, 0, 0.3)',
  },
  statLabel: {
    color: '#888',
    fontSize: '11px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    marginBottom: '5px',
  },
  statValue: {
    color: '#fff',
    fontSize: '28px',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
  },
  statBar: {
    marginTop: '8px',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #dc143c, #ff4444)',
    transition: 'width 0.3s',
  },
  speedGauge: {
    marginTop: '8px',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  speedGaugeFill: {
    height: '100%',
    transition: 'width 0.2s, background 0.3s',
    boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
  },
  steeringIndicator: {
    marginTop: '8px',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
    position: 'relative',
  },
  steeringBar: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: '20px',
    height: '100%',
    background: 'linear-gradient(90deg, #00ffff, #0088ff)',
    borderRadius: '2px',
    transition: 'transform 0.1s',
    boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
  },
  topRight: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statusBadge: {
    padding: '15px 25px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '1px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s',
    animation: 'fadeIn 0.3s',
  },
  statusIcon: {
    fontSize: '24px',
  },
  statusText: {
    color: '#fff',
    textShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
  },
  cameraContainer: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    border: '2px solid rgba(0, 255, 255, 0.5)',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'rgba(0, 0, 0, 0.8)',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)',
  },
  cameraHeader: {
    background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.3), rgba(0, 0, 0, 0.8))',
    padding: '8px',
    fontSize: '11px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    color: '#00ffff',
    textAlign: 'center',
  },
  cameraImage: {
    width: '200px',
    height: '150px',
    display: 'block',
  },
  cameraOverlay: {
    position: 'absolute',
    top: '35px',
    right: '10px',
    padding: '5px',
    background: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '50%',
  },
  bottomLeft: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    display: 'flex',
    gap: '12px',
    pointerEvents: 'auto',
  },
  controlButton: {
    padding: '15px 30px',
    fontSize: '14px',
    fontWeight: 'bold',
    fontFamily: "'Orbitron', monospace",
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #dc143c, #aa0000)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    letterSpacing: '1px',
  },
  buttonIcon: {
    fontSize: '20px',
  },
  buttonKey: {
    fontSize: '11px',
    padding: '3px 8px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    marginLeft: '5px',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    animation: 'fadeIn 0.5s',
  },
  gameOverContent: {
    textAlign: 'center',
    color: 'white',
  },
  gameOverTitle: {
    fontSize: '72px',
    fontWeight: 'bold',
    marginBottom: '40px',
    background: 'linear-gradient(135deg, #dc143c, #ff4444)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 40px rgba(220, 20, 60, 0.5)',
    letterSpacing: '8px',
  },
  gameOverStats: {
    display: 'flex',
    gap: '40px',
    justifyContent: 'center',
    marginBottom: '50px',
  },
  gameOverStat: {
    padding: '20px 40px',
    background: 'linear-gradient(135deg, rgba(220, 20, 60, 0.2), rgba(0, 0, 0, 0.8))',
    borderRadius: '12px',
    border: '2px solid rgba(220, 20, 60, 0.5)',
  },
  gameOverStatLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '10px',
    letterSpacing: '2px',
  },
  gameOverStatValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
  },
  restartButton: {
    padding: '20px 50px',
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: "'Orbitron', monospace",
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '15px',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #dc143c, #aa0000)',
    color: 'white',
    transition: 'all 0.3s',
    boxShadow: '0 8px 30px rgba(220, 20, 60, 0.5)',
    letterSpacing: '2px',
    display: 'inline-flex',
    alignItems: 'center',
  },
};