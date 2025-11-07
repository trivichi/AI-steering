import React from 'react';

export default function TrackLines({ linePositions, toThreeY, roadLeft, roadRight, trackWidth }) {
  if (!linePositions) return null;

  return (
    <group>
      {linePositions.map((y, index) => {
        const threeY = toThreeY(y);
        return (
          <React.Fragment key={index}>
            {/* Center line */}
            <mesh position={[0, threeY, 0.04]}>
              <boxGeometry args={[6, 40, 1]} />
              <meshStandardMaterial color="#ffff66" />
            </mesh>
            
            {/* Left edge line */}
            <mesh position={[-(trackWidth / 2) + 225 - roadLeft + 7.5, threeY, 0.04]}>
              <boxGeometry args={[15, 40, 1]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            
            {/* Right edge line */}
            <mesh position={[(trackWidth / 2) - 225 + (roadRight - (roadLeft + 450)) - 7.5, threeY, 0.04]}>
              <boxGeometry args={[15, 40, 1]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </React.Fragment>
        );
      })}
    </group>
  );
}