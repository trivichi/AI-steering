// import React, { useRef } from 'react';
// import { useFrame } from '@react-three/fiber';
// import { toThreeX, toThreeY } from '../utils/coordinateUtils';

// export default function Car({ carData, trackWidth, trackHeight }) {
//   const meshRef = useRef();
  
//   useFrame(() => {
//     if (!meshRef.current || !carData) return;
    
//     const targetX = toThreeX(carData.x, trackWidth);
//     const targetY = toThreeY(carData.y, trackHeight);
    
//     // Smooth interpolation
//     meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.2;
//     meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.2;
    
//     // Tilt based on steering
//     if (carData.steering) {
//       const targetRotation = (carData.steering / 50) * 0.3; // Max 0.3 rad tilt
//       meshRef.current.rotation.z += (targetRotation - meshRef.current.rotation.z) * 0.1;
//     }
//   });

//   if (!carData) return null;

//   return (
//     <group ref={meshRef} position={[0, 0, 0.15]}>
//       {/* Main car body */}
//       <mesh castShadow>
//         <boxGeometry args={[35, 70, 15]} />
//         <meshStandardMaterial 
//           color="#dc143c" 
//           metalness={0.6}
//           roughness={0.4}
//         />
//       </mesh>
      
//       {/* Windshield */}
//       <mesh position={[0, 5, 8]}>
//         <boxGeometry args={[25, 30, 5]} />
//         <meshStandardMaterial 
//           color="#000000" 
//           metalness={0.9}
//           roughness={0.1}
//           transparent
//           opacity={0.8}
//         />
//       </mesh>
      
//       {/* Wheels */}
//       {[-15, 15].map((x) => (
//         <React.Fragment key={x}>
//           <mesh position={[x, -25, -5]} castShadow>
//             <cylinderGeometry args={[6, 6, 8, 16]} rotation={[0, 0, Math.PI / 2]} />
//             <meshStandardMaterial color="#1a1a1a" />
//           </mesh>
//           <mesh position={[x, 25, -5]} castShadow>
//             <cylinderGeometry args={[6, 6, 8, 16]} rotation={[0, 0, Math.PI / 2]} />
//             <meshStandardMaterial color="#1a1a1a" />
//           </mesh>
//         </React.Fragment>
//       ))}
//     </group>
//   );
// }


import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { toThreeX, toThreeY } from '../utils/coordinateUtils';
import * as THREE from 'three';

export default function Car({ carData, trackWidth, trackHeight }) {
  const groupRef = useRef();
  const wheelsRef = useRef([]);
  const exhaustRef = useRef([]);
  
  // Create exhaust particles
  const exhaustParticles = useMemo(() => {
    const particles = [];
    const geometry = new THREE.SphereGeometry(2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x555555,
      transparent: true,
      opacity: 0.6
    });
    
    for (let i = 0; i < 10; i++) {
      particles.push({
        mesh: new THREE.Mesh(geometry, material),
        life: Math.random(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -Math.random() * 3,
          0
        )
      });
    }
    return particles;
  }, []);
  
  useFrame((state, delta) => {
    if (!groupRef.current || !carData) return;
    
    const targetX = toThreeX(carData.x, trackWidth);
    const targetY = toThreeY(carData.y, trackHeight);
    
    // Smooth interpolation
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.3;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.3;
    
    // Dynamic tilt based on steering and speed
    if (carData.steering) {
      const targetRotation = (carData.steering / 50) * 0.4;
      groupRef.current.rotation.z += (targetRotation - groupRef.current.rotation.z) * 0.15;
      
      // Bank effect
      const bankAngle = (carData.steering / 50) * 0.2;
      groupRef.current.rotation.x = bankAngle * 0.5;
    }
    
    // Animate wheels
    wheelsRef.current.forEach((wheel, i) => {
      if (wheel) {
        wheel.rotation.x += carData.speed * 0.1;
        // Front wheels turn with steering
        if (i < 2) {
          wheel.rotation.y = (carData.steering / 50) * 0.5;
        }
      }
    });
    
    // Exhaust particles when moving
    if (carData.speed > 2) {
      exhaustParticles.forEach((particle, i) => {
        particle.life -= delta * 2;
        if (particle.life <= 0) {
          particle.life = 1;
          particle.mesh.position.set(
            groupRef.current.position.x + (Math.random() - 0.5) * 20,
            groupRef.current.position.y - 40,
            5
          );
          particle.mesh.scale.set(1, 1, 1);
          particle.mesh.material.opacity = 0.6;
        } else {
          particle.mesh.position.add(particle.velocity);
          particle.mesh.scale.multiplyScalar(0.95);
          particle.mesh.material.opacity = particle.life * 0.6;
        }
      });
    }
  });

  if (!carData) return null;

  return (
    <>
      <group ref={groupRef} position={[0, 0, 0.15]}>
        {/* Main car body - sleek F1 style */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[35, 75, 18]} />
          <meshStandardMaterial 
            color="#dc143c" 
            metalness={0.8}
            roughness={0.2}
            envMapIntensity={1.5}
          />
        </mesh>
        
        {/* Nose cone */}
        <mesh position={[0, 45, 0]} castShadow>
          <coneGeometry args={[12, 25, 4]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial 
            color="#dc143c" 
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Cockpit */}
        <mesh position={[0, 0, 12]} castShadow>
          <boxGeometry args={[28, 40, 8]} />
          <meshStandardMaterial 
            color="#000000" 
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.7}
          />
        </mesh>
        
        {/* Rear wing */}
        <mesh position={[0, -35, 15]} castShadow>
          <boxGeometry args={[40, 8, 3]} />
          <meshStandardMaterial 
            color="#dc143c" 
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        
        {/* Wing supports */}
        {[-15, 15].map((x) => (
          <mesh key={x} position={[x, -35, 8]} castShadow>
            <boxGeometry args={[2, 6, 10]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        ))}
        
        {/* Wheels with animation */}
        {[
          [-18, 28, -8],   // Front left
          [18, 28, -8],    // Front right
          [-18, -28, -8],  // Rear left
          [18, -28, -8]    // Rear right
        ].map((pos, i) => (
          <group key={i} position={pos}>
            <mesh
              ref={(el) => wheelsRef.current[i] = el}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[8, 8, 10, 16]} />
              <meshStandardMaterial 
                color="#1a1a1a" 
                metalness={0.4}
                roughness={0.6}
              />
            </mesh>
            {/* Brake disc */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[6, 6, 2, 16]} />
              <meshStandardMaterial 
                color="#ff4444" 
                metalness={0.9}
                roughness={0.1}
                emissive="#ff0000"
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        ))}
        
        {/* Speed lines when moving fast */}
        {carData.speed > 8 && (
          <>
            {[-20, 20].map((x) => (
              <mesh key={x} position={[x, -40, 0]}>
                <boxGeometry args={[2, 30, 2]} />
                <meshBasicMaterial 
                  color="#ffffff" 
                  transparent 
                  opacity={0.3}
                />
              </mesh>
            ))}
          </>
        )}
        
        {/* Glow effect */}
        <pointLight
          position={[0, 40, 5]}
          intensity={carData.speed / 10}
          distance={50}
          color="#ff0000"
        />
        <pointLight
          position={[0, -40, 5]}
          intensity={0.5}
          distance={30}
          color="#ff0000"
        />
      </group>
      
      {/* Exhaust particles */}
      {exhaustParticles.map((particle, i) => (
        <primitive key={i} object={particle.mesh} />
      ))}
    </>
  );
}