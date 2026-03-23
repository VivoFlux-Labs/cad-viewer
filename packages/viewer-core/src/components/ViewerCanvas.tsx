import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Bounds } from '@react-three/drei';

export interface ViewerCanvasProps {
  children?: React.ReactNode;
  cameraPosition?: [number, number, number];
  backgroundColor?: string;
}

export function ViewerCanvas({ 
  children, 
  cameraPosition = [15, 15, 15],
  backgroundColor = '#1a1a2e' // Dark premium aesthetic
}: ViewerCanvasProps) {
  return (
    <Canvas
      shadows
      camera={{ position: cameraPosition, fov: 45 }}
      style={{ width: '100%', height: '100%', display: 'block', background: backgroundColor }}
    >
      <Suspense fallback={null}>
        {/* Soft HDRI Lighting */}
        <Environment preset="city" background={false} />
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />

        {/* Bounds automatically frames the injected 3D model */}
        <Bounds fit clip observe margin={1.2}>
          <group>{children}</group>
        </Bounds>
        
        {/* Strict OrbitControls to prevent clipping under the floor */}
        <OrbitControls 
          makeDefault 
          minDistance={2} 
          maxDistance={100} 
          maxPolarAngle={Math.PI / 2 + 0.1} 
        />
      </Suspense>
    </Canvas>
  );
}
