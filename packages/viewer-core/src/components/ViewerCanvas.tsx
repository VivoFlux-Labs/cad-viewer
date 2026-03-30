import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Bounds, ContactShadows, useBounds, Billboard, Text } from '@react-three/drei';
import { useViewerStore } from '../store/viewerStore';
import { ViewerToolbar } from './ViewerToolbar';
import { ViewerBOM } from './ViewerBOM';

// ─── Error Boundary ───────────────────────────────────────────────────────────
interface ErrorBoundaryState { error: Error | null }

class ViewerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950/80 z-10">
          <div className="w-10 h-10 rounded-full bg-red-900/60 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-red-400 text-xs font-semibold uppercase tracking-widest">Failed to load model</p>
          <p className="text-gray-500 text-[11px] max-w-xs text-center">{this.state.error.message}</p>
          <button
            className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Loading Fallback ─────────────────────────────────────────────────────────
function CanvasLoadingFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
      <p className="text-indigo-300/60 text-[11px] uppercase tracking-widest font-semibold">Loading model…</p>
    </div>
  );
}

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
      <ViewerErrorBoundary>
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
          <Suspense fallback={<CanvasLoadingFallback />}>
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
      </ViewerErrorBoundary>
    </div>
  );
}
