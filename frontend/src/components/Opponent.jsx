import React from 'react';

export default function Opponent({ opponent, toThreeX, toThreeY }) {
  const x = toThreeX(opponent.x);
  const y = toThreeY(opponent.y);

  return (
    <group position={[x, y, 0.12]}>
      {/* Opponent car body */}
      <mesh castShadow>
        <boxGeometry args={[36, 70, 12]} />
        <meshStandardMaterial 
          color="#0064c8" 
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
      
      {/* Windshield */}
      <mesh position={[0, 0, 7]}>
        <boxGeometry args={[26, 40, 4]} />
        <meshStandardMaterial 
          color="#000000" 
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}