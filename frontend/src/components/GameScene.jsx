import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { toThreeX, toThreeY } from '../utils/coordinateUtils';
import Car from './Car';
import Obstacle from './Obstacle';
import Opponent from './Opponent';
import PowerUp from './PowerUp';
import TrackLines from './TrackLines';

export default function GameScene({ gameState }) {
  if (!gameState || !gameState.track) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #1a1a2e, #0f0f1e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
      }}>
        Loading...
      </div>
    );
  }

  const { track, car, obstacles, opponents, powerups } = gameState;
  const trackWidth = track.width;
  const trackHeight = track.height;

  // Helper functions with closure
  const toX = (x) => toThreeX(x, trackWidth);
  const toY = (y) => toThreeY(y, trackHeight);

  return (
    <Canvas
      camera={{
        position: [0, 0, 600],
        fov: 50,
        near: 1,
        far: 2000,
      }}
      style={{ background: '#0a0a0a' }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[200, 200, 300]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[-200, -200, 200]}
          intensity={0.3}
        />
        
        {/* Grass Background */}
        <mesh position={[0, 0, -0.1]} receiveShadow>
          <planeGeometry args={[trackWidth * 1.5, trackHeight * 1.5]} />
          <meshStandardMaterial color="#228b22" roughness={0.9} />
        </mesh>

        {/* Road */}
        <mesh position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[track.roadRight - track.roadLeft, trackHeight * 1.2]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
        </mesh>

        {/* Track Lines */}
        <TrackLines
          linePositions={track.linePositions}
          toThreeY={toY}
          roadLeft={track.roadLeft}
          roadRight={track.roadRight}
          trackWidth={trackWidth}
        />

        {/* Obstacles */}
        {obstacles && obstacles.map((obstacle, index) => (
          <Obstacle
            key={`obs-${index}`}
            obstacle={obstacle}
            toThreeX={toX}
            toThreeY={toY}
          />
        ))}

        {/* Opponents */}
        {opponents && opponents.map((opponent, index) => (
          <Opponent
            key={`opp-${index}`}
            opponent={opponent}
            toThreeX={toX}
            toThreeY={toY}
          />
        ))}

        {/* Power-ups */}
        {powerups && powerups.map((powerup, index) => (
          <PowerUp
            key={`pu-${index}`}
            powerup={powerup}
            toThreeX={toX}
            toThreeY={toY}
          />
        ))}

        {/* Player Car */}
        <Car
          carData={car}
          trackWidth={trackWidth}
          trackHeight={trackHeight}
        />

        {/* Camera Controls (optional - can be disabled for fixed view) */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          target={[0, 0, 0]}
        />
      </Suspense>
    </Canvas>
  );
}