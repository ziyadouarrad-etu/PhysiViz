
export interface SceneMetadata {
  problem_type: string;
  units: string;
}

export interface Dimensions {
  radius?: number;
  width?: number;
  height?: number;
  depth?: number;
  length?: number;
  [key: string]: number | undefined;
}

export interface Geometry {
  shape: 'sphere' | 'cube' | 'box' | 'plane' | 'cone' | 'cylinder' | 'wedge' | 'spring' | 'pulley' | 'unknown';
  dimensions: Dimensions;
  color?: string; // Optional aesthetic property
}

export interface PhysicsProperties {
  mass: number;
  position: [number, number, number]; // x, y, z
  rotation?: [number, number, number]; // x, y, z (Euler angles in radians)
  velocity: [number, number, number]; // x, y, z
  is_static?: boolean;
}

export interface Entity {
  id: string; // generated client-side if missing
  name: string;
  type: string;
  geometry: Geometry;
  physics: PhysicsProperties;
}

export interface Environment {
  gravity: [number, number, number];
  friction_coefficient: number;
}

export interface PhysicsScene {
  scene_metadata: SceneMetadata;
  entities: Entity[];
  environment: Environment;
}
