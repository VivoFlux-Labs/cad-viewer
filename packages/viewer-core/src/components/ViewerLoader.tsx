import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

export interface ViewerLoaderProps {
  modelUrl: string;
  onLoad?: () => void;
}

export function ViewerLoader({ modelUrl, onLoad }: ViewerLoaderProps) {
  // useGLTF inherently integrates with React Suspense for progressive streaming.
  // The 'true' flags enable draco and meshopt decoding automatically if the model requires it.
  const { scene } = useGLTF(modelUrl, true, true);

  useEffect(() => {
    if (scene && onLoad) {
      onLoad();
    }
  }, [scene, onLoad]);

  if (!scene) return null;

  return <primitive object={scene} />;
}

// Global preloader to cache the initial tenant-0000 model aggressively
useGLTF.preload('/storage/models/tenant-0000/models/test.glb');
