import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Bounds, ContactShadows, useBounds, Billboard, Text } from '@react-three/drei';
import { useViewerStore } from '../store/viewerStore';
import { ViewerToolbar } from './ViewerToolbar';
import { ViewerBOM } from './ViewerBOM';

export interface ViewerCanvasProps {
  children?: React.ReactNode;
  cameraPosition?: [number, number, number];
}

// Intercepts the global Zustand string trigger mapped down into the Bounds React Component constraint limit boundaries.
function CameraResetter({ trigger }: { trigger: number }) {
  const bounds = useBounds();
  React.useEffect(() => {
    if (trigger > 0) {
      bounds.refresh().clip().fit();
    }
  }, [trigger, bounds]);
  return null;
}

// Renders a scaled 1.8m Context element
function HumanScale() {
  const showScale = useViewerStore(state => state.showScale);
  if (!showScale) return null;
  return (
    <Billboard position={[1.5, 0.9, 0]}>
      <mesh>
        <planeGeometry args={[0.5, 1.8]} />
        <meshBasicMaterial color="#4f46e5" transparent opacity={0.3} depthTest={false} />
      </mesh>
      <Text position={[0, -1, 0]} fontSize={0.1} color="white">1.8m (6ft)</Text>
    </Billboard>
  );
}

export function ViewerCanvas({ 
  children, 
  cameraPosition = [15, 15, 15],
}: ViewerCanvasProps) {
  // Bind directly to global viewer state
  const { environment, showGround, backgroundColor, resetTrigger } = useViewerStore();

  return (
    <div className="relative w-full h-full">
      {/* Universal Inspection Overlay UI */}
      <ViewerToolbar />
      <ViewerBOM />

      {/* WebGL Render Target */}
      <Canvas
        shadows
        gl={{ localClippingEnabled: true }}
        camera={{ position: cameraPosition, fov: 45 }}
        style={{ width: '100%', height: '100%', display: 'block', background: backgroundColor }}
      >
        <Suspense fallback={null}>
          {/* Dynamic Lighting corresponding to selected environment preset */}
          <Environment preset={environment} background={false} />
          
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} castShadow />

          {/* Conditional Ground Plane for realistic shadow grounding */}
          {showGround && (
            <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={20} blur={2.5} far={4} color="#000000" />
          )}

          {/* Bounds automatically frames the injected 3D model */}
          <Bounds fit clip observe margin={1.2}>
            <CameraResetter trigger={resetTrigger} />
            <HumanScale />
            <group>{children}</group>
          </Bounds>
          
          {/* Strict OrbitControls with Deep Zoom capability Enabled (minDistance=1) */}
          <OrbitControls 
            makeDefault 
            minDistance={1} 
            maxDistance={200} 
            maxPolarAngle={Math.PI / 2 + 0.1} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
