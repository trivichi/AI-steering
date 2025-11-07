import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { toThreeX, toThreeY } from '../utils/coordinateUtils';

export default function Car({ carData, trackWidth, trackHeight }) {
  const meshRef = useRef();
  
  useFrame(() => {
    if (!meshRef.current || !carData) return;
    
    const targetX = toThreeX(carData.x, trackWidth);
    const targetY = toThreeY(carData.y, trackHeight);
    
    // Smooth interpolation
    meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.2;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.2;
    
    // Tilt based on steering
    if (carData.steering) {
      const targetRotation = (carData.steering / 50) * 0.3; // Max 0.3 rad tilt
      meshRef.current.rotation.z += (targetRotation - meshRef.current.rotation.z) * 0.1;
    }
  });

  if (!carData) return null;

  return (
    <group ref={meshRef} position={[0, 0, 0.15]}>
      {/* Main car body */}
      <mesh castShadow>
        <boxGeometry args={[35, 70, 15]} />
        <meshStandardMaterial 
          color="#dc143c" 
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      
      {/* Windshield */}
      <mesh position={[0, 5, 8]}>
        <boxGeometry args={[25, 30, 5]} />
        <meshStandardMaterial 
          color="#000000" 
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Wheels */}
      {[-15, 15].map((x) => (
        <React.Fragment key={x}>
          <mesh position={[x, -25, -5]} castShadow>
            <cylinderGeometry args={[6, 6, 8, 16]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[x, 25, -5]} castShadow>
            <cylinderGeometry args={[6, 6, 8, 16]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
}