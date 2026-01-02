import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment as EnvironmentDrei, ContactShadows, Text, Center, Float } from '@react-three/drei';
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
      tubeGeometry: any;
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

const SpringMesh = ({ radius, height, color }: { radius: number, height: number, color: string }) => {
    // Generate spiral curve
    const curve = useMemo(() => {
        const points = [];
        const loops = 8;
        const heightPerLoop = height / loops;
        for (let i = 0; i <= loops * 10; i++) {
            const t = i / (loops * 10);
            const angle = t * loops * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (t - 0.5) * height; // Center vertically
            points.push(new THREE.Vector3(x, y, z));
        }
        return new THREE.CatmullRomCurve3(points);
    }, [radius, height]);

    return (
        <mesh>
            <tubeGeometry args={[curve, 100, radius * 0.15, 8, false]} />
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
    );
};

const RenderEntity: React.FC<{ entity: Entity }> = ({ entity }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { geometry, physics, name } = entity;
  const position = new THREE.Vector3(...physics.position);

  // Helper to determine color (deterministic hash from name)
  const getColor = (str: string) => {
    if (geometry.color) return geometry.color;
    // Specific defaults for types
    if (geometry.shape === 'plane') return '#64748b'; // Slate 500
    if (geometry.shape === 'wedge') return '#475569'; // Slate 600
    if (geometry.shape === 'spring') return '#94a3b8'; // Slate 400
    
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
        // Render as a flat surface (XZ plane) by default
        // Interpretation: Width is X, Height (from JSON) is Z (depth/length on ground), Thickness is fixed small Y
        const pW = geometry.dimensions.width || 10;
        const pD = geometry.dimensions.height || geometry.dimensions.length || 10; // "Height" in 2D often means length of the plane
        return <boxGeometry args={[pW, 0.1, pD]} />;
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

          return (
             <group position={[0, 0, -d/2]}>
                 <extrudeGeometry args={[shape, extrudeSettings]} />
             </group>
          );
      }
      case 'spring':
          return (
            <group>
                <SpringMesh 
                    radius={geometry.dimensions.radius || 0.3} 
                    height={geometry.dimensions.height || 2} 
                    color={color} 
                />
            </group>
          );
      case 'pulley':
          // Render as a flattened cylinder (disk)
          const r = geometry.dimensions.radius || 0.5;
          const thickness = geometry.dimensions.height || 0.2;
          return (
            <cylinderGeometry args={[r, r, thickness, 32]} />
          );
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  // Determine Rotation
  let rotation: [number, number, number] = [0, 0, 0];

  if (physics.rotation) {
      rotation = physics.rotation;
  } else {
      // Heuristic defaults only when rotation is missing
      if (geometry.shape === 'pulley') {
          // Pulleys usually stand up, rotate 90 deg around X
          rotation = [Math.PI / 2, 0, 0];
      } else if (geometry.shape === 'cylinder' && (name.toLowerCase().includes('wheel') || name.toLowerCase().includes('disk'))) {
          rotation = [Math.PI / 2, 0, 0];
      }
  }

  // Determine if we need to wrap in custom geometry logic (like SpringMesh) which handles its own mesh
  const isCustomMesh = geometry.shape === 'spring';

  return (
    <group position={position} rotation={rotation}>
      {isCustomMesh ? (
          renderGeometry()
      ) : (
          <mesh ref={meshRef} castShadow receiveShadow>
            {renderGeometry()}
            <meshStandardMaterial 
              color={color} 
              roughness={0.4} 
              metalness={geometry.shape === 'pulley' ? 0.6 : 0.2}
              transparent={geometry.shape === 'plane'}
              opacity={geometry.shape === 'plane' ? 0.8 : 1}
              side={THREE.DoubleSide}
            />
          </mesh>
      )}
      
      {/* Label */}
      {!isCustomMesh && (
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
      )}

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
        
        {/* Render Entities with auto-centering */}
        <Center top>
            <group>
                {sceneData.entities.map((entity, idx) => (
                    <RenderEntity key={entity.id || idx} entity={entity} />
                ))}
            </group>
        </Center>

        {/* Floor/Grid Helper - slightly offset to avoid z-fighting */}
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
