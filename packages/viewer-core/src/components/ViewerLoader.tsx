import React, { useEffect, useMemo, useState } from 'react';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useViewerStore } from '../store/viewerStore';

export interface ViewerLoaderProps {
  modelUrl: string;
  onLoad?: () => void;
}

export function ViewerLoader({ modelUrl, onLoad }: ViewerLoaderProps) {
  const { scene, animations } = useGLTF(modelUrl, true, true);
  
  // Clone the scene graph so we can deeply alter it without corrupting shared global references
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  const { actions } = useAnimations(animations, clonedScene);

  const { 
    wireframe, xray, 
    clipPlaneEnabled, clipPlaneOffset, 
    explodedOffset, 
    playingAnimation,
    selectedMeshId, setSelectedMeshId, setSceneMeshes
  } = useViewerStore();

  useEffect(() => {
    if (clonedScene && onLoad) onLoad();
  }, [clonedScene, onLoad]);

  // Extract Bill of Materials hierarchy
  useEffect(() => {
    if (!clonedScene) return;
    const meshes: { uuid: string; name: string }[] = [];
    clonedScene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        meshes.push({ uuid: node.uuid, name: node.name });
      }
    });
    setSceneMeshes(meshes);
  }, [clonedScene, setSceneMeshes]);

  // Handle Animation Playback Sequences
  useEffect(() => {
    if (!actions) return;
    const actionNames = Object.keys(actions);
    if (actionNames.length === 0) return;
    
    // Play first animation by default if toggled on
    const action = actions[actionNames[0]];
    if (playingAnimation) {
      action?.play();
    } else {
      action?.stop(); // Complete halt instead of pause for predictable reset behavior
    }
  }, [actions, playingAnimation]);

  // Setup dynamic X-Axis WebGL Clipping Plane
  const [clipPlane] = useState(() => new THREE.Plane(new THREE.Vector3(1, 0, 0), 0));
  useEffect(() => {
    clipPlane.constant = clipPlaneOffset;
  }, [clipPlaneOffset, clipPlane]);

  // Handle advanced material overriding (X-Ray, Wireframe), Clipping, and BOM Highlights
  useEffect(() => {
    if (!clonedScene) return;

    clonedScene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        
        // Material can be an array or single. Protect against both.
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        
        materials.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial;
          
          // Cache original properties explicitly internally
          if (!(mat as any)._original) {
            (mat as any)._original = {
              wireframe: mat.wireframe,
              transparent: mat.transparent,
              opacity: mat.opacity,
              depthWrite: mat.depthWrite,
              emissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000),
              emissiveIntensity: mat.emissiveIntensity || 0
            };
          }

          const orig = (mat as any)._original;

          if (wireframe) {
            mat.wireframe = true;
            mat.transparent = orig.transparent;
            mat.opacity = 1;
            mat.depthWrite = true;
          } else if (xray) {
            mat.wireframe = false;
            mat.transparent = true;
            mat.opacity = 0.15; 
            mat.depthWrite = false; 
          } else {
            // Restore exact original presentation limits
            mat.wireframe = orig.wireframe;
            mat.transparent = orig.transparent;
            mat.opacity = orig.opacity;
            mat.depthWrite = orig.depthWrite;
            
            // Apply Selection Highlight Emissive Glow
            if (mesh.uuid === selectedMeshId) {
              if (mat.emissive) {
                mat.emissive.copy(new THREE.Color(0x4f46e5)); // Indigo glow
                mat.emissiveIntensity = 0.6;
              }
            } else {
              if (mat.emissive) {
                if (orig.emissive) {
                  mat.emissive.copy(orig.emissive);
                } else {
                  mat.emissive.setHex(0x000000); // Fallback for HMR unpatched caches
                }
                mat.emissiveIntensity = orig.emissiveIntensity || 0;
              }
            }
          }
          
          // Inject generic clipping logic
          mat.clippingPlanes = clipPlaneEnabled ? [clipPlane] : [];
          mat.needsUpdate = true;
        });
      }
    });
  }, [clonedScene, wireframe, xray, clipPlaneEnabled, clipPlane, selectedMeshId]);

  // Handle Exploded Views via Spatial Vector Calculation caching
  const [explosionState] = useState(() => ({
    originalPositions: new Map<string, THREE.Vector3>(),
    explosionVectors: new Map<string, THREE.Vector3>()
  }));

  useEffect(() => {
    if (!clonedScene) return;
    
    clonedScene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        
        // First pass: Cache original matrix and calculate center outward vector
        if (!explosionState.originalPositions.has(mesh.uuid)) {
          explosionState.originalPositions.set(mesh.uuid, mesh.position.clone());
          
          if (!mesh.geometry.boundingBox) {
            mesh.geometry.computeBoundingBox();
          }
          const center = new THREE.Vector3();
          mesh.geometry.boundingBox?.getCenter(center);
          
          // Apply world matrix to establish absolute push direction
          center.applyMatrix4(mesh.matrixWorld);
          
          const expVec = center.clone().normalize();
          // Fallback outward vector if part is dead center (e.g., core chassis)
          if (expVec.lengthSq() === 0) expVec.set(0, 1, 0);
          
          explosionState.explosionVectors.set(mesh.uuid, expVec);
        }

        const orig = explosionState.originalPositions.get(mesh.uuid);
        const vec = explosionState.explosionVectors.get(mesh.uuid);
        if (orig && vec) {
          // Push children outwards from origin based on global offset slider scalar
          mesh.position.copy(orig).addScaledVector(vec, explodedOffset);
        }
      }
    });
  }, [clonedScene, explodedOffset, explosionState]);

  // Compute Hotspot Position
  const selectedMesh = useMemo<THREE.Mesh | null>(() => {
    if (!selectedMeshId || !clonedScene) return null;
    let found: THREE.Mesh | null = null;
    clonedScene.traverse((n) => {
      if (n.uuid === selectedMeshId) found = n as THREE.Mesh;
    });
    return found;
  }, [clonedScene, selectedMeshId]);

  const hotspotPos = useMemo(() => {
    if (!selectedMesh) return new THREE.Vector3();
    if (!selectedMesh.geometry.boundingBox) selectedMesh.geometry.computeBoundingBox();
    const box = selectedMesh.geometry.boundingBox!;
    const pos = new THREE.Vector3();
    box.getCenter(pos);
    pos.y = box.max.y; // Pin to top
    return pos.applyMatrix4(selectedMesh.matrixWorld);
  }, [selectedMesh]);

  if (!clonedScene) return null;

  return (
    <group 
      onPointerDown={(e) => {
        // Prevent click events from firing on elements behind this one
        e.stopPropagation();
        setSelectedMeshId(e.object.uuid);
      }}
      onPointerMissed={() => setSelectedMeshId(null)}
    >
      <primitive object={clonedScene} />
      
      {/* Dynamic Annotative Intercepts */}
      {selectedMesh && (
        <Html position={hotspotPos} center zIndexRange={[100, 0]}>
          <div className="bg-indigo-600 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded shadow-[0_0_15px_rgba(79,70,229,0.5)] whitespace-nowrap pointer-events-none transform -translate-y-6">
            <span className="opacity-70 mr-2">PART:</span>{selectedMesh.name || `Asset-${selectedMesh.uuid.split('-')[0]}`}
          </div>
        </Html>
      )}
    </group>
  );
}
