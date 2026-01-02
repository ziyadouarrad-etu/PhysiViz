import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment as EnvironmentDrei, ContactShadows, Text, Center } from '@react-three/drei';
import * as THREE from 'three';
import { Entity, PhysicsScene } from '../types';

// Declare intrinsic elements for React Three Fiber to fix TypeScript errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      boxGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      extrudeGeometry: any;
      arrowHelper: any;
      ambientLight: any;
      pointLight: any;
      directionalLight: any;
      color: any;
    }
  }
}

interface SceneViewerProps {
  sceneData: PhysicsScene;
}

const RenderEntity: React.FC<{ entity: Entity }> = ({ entity }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { geometry, physics, name } = entity;
  const position = new THREE.Vector3(...physics.position);

  // Helper to determine color (deterministic hash from name)
  const getColor = (str: string) => {
    if (geometry.color) return geometry.color;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  const color = getColor(name || 'Object');

  // Velocity Arrow helper
  const VelocityArrow = () => {
    const vel = new THREE.Vector3(...physics.velocity);
    const speed = vel.length();
    if (speed < 0.1) return null;
    
    return (
      <arrowHelper 
        args={[vel.normalize(), new THREE.Vector3(0,0,0), Math.min(speed, 5), 0xff0000]} 
      />
    );
  };

  const renderGeometry = () => {
    switch (geometry.shape) {
      case 'sphere':
        return <sphereGeometry args={[geometry.dimensions.radius || 0.5, 32, 32]} />;
      case 'box':
      case 'cube':
        return <boxGeometry args={[
          geometry.dimensions.width || 1, 
          geometry.dimensions.height || 1, 
          geometry.dimensions.depth || 1
        ]} />;
      case 'plane':
        // Render as a thin box for better visibility from all angles
        // Use height or length for the Y-dimension (in local space)
        const pW = geometry.dimensions.width || 10;
        const pH = geometry.dimensions.height || geometry.dimensions.length || 10;
        return <boxGeometry args={[pW, pH, 0.05]} />;
      case 'cylinder':
        return <cylinderGeometry args={[
          geometry.dimensions.radius || 0.5, 
          geometry.dimensions.radius || 0.5, 
          geometry.dimensions.height || 1, 
          32
        ]} />;
      case 'cone':
        return <coneGeometry args={[geometry.dimensions.radius || 0.5, geometry.dimensions.height || 1, 32]} />;
      case 'wedge': {
          const w = geometry.dimensions.width || 2;
          const h = geometry.dimensions.height || 1;
          const d = geometry.dimensions.depth || 1;
          
          const shape = useMemo(() => {
              const s = new THREE.Shape();
              // Right triangle
              s.moveTo(-w/2, -h/2);
              s.lineTo(w/2, -h/2);
              s.lineTo(-w/2, h/2);
              s.lineTo(-w/2, -h/2);
              return s;
          }, [w, h]);

          const extrudeSettings = useMemo(() => ({
              depth: d,
              bevelEnabled: false
          }), [d]);

          // Extrude geometry centers on Z by default 0 to depth. We want to center it.
          return (
             <group position={[0, 0, -d/2]}>
                 <extrudeGeometry args={[shape, extrudeSettings]} />
             </group>
          );
      }
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  // Determine Rotation
  let rotation: [number, number, number] = [0, 0, 0];

  if (physics.rotation) {
      // Use explicit rotation from AI
      rotation = physics.rotation;
  } else {
      // Heuristic defaults if no rotation provided
      if (geometry.shape === 'plane' && physics.is_static) {
          // If it's a static plane (likely a floor), rotate it to be flat
          rotation = [-Math.PI / 2, 0, 0];
      } else if (geometry.shape === 'cylinder' && (name.toLowerCase().includes('wheel') || name.toLowerCase().includes('disk'))) {
          // Stand wheel up (rotate around X to face Z, or Z to face X?)
          // Defaulting to rotating around X to roll along Z
          rotation = [Math.PI / 2, 0, 0];
      }
  }

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} castShadow receiveShadow>
        {renderGeometry()}
        <meshStandardMaterial 
          color={color} 
          roughness={0.4} 
          metalness={0.2}
          transparent={geometry.shape === 'plane'}
          opacity={geometry.shape === 'plane' ? 0.6 : 1}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Label */}
      <Text
        position={[0, (geometry.dimensions.height || 1) / 2 + 0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {name}
      </Text>

      {/* Velocity Vector */}
      <VelocityArrow />
    </group>
  );
};

export const SceneViewer: React.FC<SceneViewerProps> = ({ sceneData }) => {
  return (
    <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      <Canvas shadows camera={{ position: [5, 5, 10], fov: 45 }}>
        <color attach="background" args={['#0f172a']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} castShadow />

        {/* Controls */}
        <OrbitControls makeDefault />

        {/* Environment */}
        <EnvironmentDrei preset="city" />
        
        {/* Render Entities */}
        <group>
            {sceneData.entities.map((entity, idx) => (
                <RenderEntity key={entity.id || idx} entity={entity} />
            ))}
        </group>

        {/* Floor/Grid Helper - slightly offset to avoid z-fighting with planes at 0 */}
        <Grid 
            position={[0, -0.01, 0]} 
            args={[20, 20]} 
            cellColor="#475569" 
            sectionColor="#94a3b8" 
            fadeDistance={25} 
            fadeStrength={1}
        />
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={20} blur={2} far={4.5} />
      </Canvas>
    </div>
  );
};
