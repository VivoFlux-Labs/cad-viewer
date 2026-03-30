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
    <div className="relative w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-950 to-black overflow-hidden">
      {/* Universal Inspection Overlay UI */}
      <ViewerToolbar />
      <ViewerBOM />

      {/* WebGL Render Target restricted to the 'Safe UI Zone' */}
      <div
        style={{
          position: 'absolute',
          top: '120px',    /* Clears the ViewerToolbar */
          left: '0',       /* Full width — ViewerBOM overlays on the right via z-index */
          right: '0',
          bottom: '0',
          zIndex: 0
        }}
      >
        <Canvas
          shadows
          gl={{ localClippingEnabled: true, alpha: true, antialias: true }}
          camera={{ position: cameraPosition, fov: 45 }}
          style={{ width: '100%', height: '100%', display: 'block', background: 'transparent' }}
        >
          <Suspense fallback={null}>
            {/* Dynamic Lighting corresponding to selected environment preset */}
            <Environment preset={environment} background={false} />
            
            <ambientLight intensity={0.6} />
            <directionalLight 
              position={[10, 10, 10]} 
              intensity={1.2} 
              castShadow 
              shadow-mapSize={[2048, 2048]} 
              shadow-bias={-0.0001}
            />

            {/* Conditional Ground Plane with Photorealistic Contact Shadows (Loop 2) */}
            {showGround && (
              <group>
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
                  <planeGeometry args={[100, 100]} />
                  <meshStandardMaterial attach="material" color="#111111" depthWrite={false} transparent opacity={0.4} />
                </mesh>
                <ContactShadows resolution={1024} scale={20} blur={2.5} opacity={0.8} far={10} color="#000000" position={[0, 0, 0]} />
              </group>
            )}

            {/* Damped Bounds framing - Native behavior restores pure geometry centering within the restricted Canvas */}
            <Bounds fit clip observe margin={1.2}>
              <CameraResetter trigger={resetTrigger} />
              <HumanScale />
              <group>{children}</group>
            </Bounds>
            
            {/* Strict OrbitControls with Damping and Restrictive Panning Enabled */}
            <OrbitControls 
              makeDefault 
              enableDamping 
              enablePan={false}
              dampingFactor={0.05} 
              minDistance={0.1} 
              maxDistance={200} 
              maxPolarAngle={Math.PI / 1.8} 
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
