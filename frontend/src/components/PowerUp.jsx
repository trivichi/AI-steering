import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getPowerUpColor } from '../utils/coordinateUtils';

export default function PowerUp({ powerup, toThreeX, toThreeY }) {
  const meshRef = useRef();
  const x = toThreeX(powerup.x);
  const y = toThreeY(powerup.y);
  const color = getPowerUpColor(powerup.type);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.05;
      // Pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={[x, y, 0.1]}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[15, 0]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[18, 22, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}