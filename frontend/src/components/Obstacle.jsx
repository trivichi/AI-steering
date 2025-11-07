import React from 'react';
import { getObstacleColor } from '../utils/coordinateUtils';

export default function Obstacle({ obstacle, toThreeX, toThreeY }) {
  const x = toThreeX(obstacle.x);
  const y = toThreeY(obstacle.y);
  const color = getObstacleColor(obstacle.type);

  return (
    <mesh position={[x, y, 0.08]} castShadow>
      <boxGeometry args={[obstacle.width, obstacle.height, 12]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}