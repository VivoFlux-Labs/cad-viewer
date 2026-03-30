"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewerLoader = ViewerLoader;
const react_1 = __importStar(require("react"));
const drei_1 = require("@react-three/drei");
const THREE = __importStar(require("three"));
const viewerStore_1 = require("../store/viewerStore");
function ViewerLoader({ modelUrl, onLoad }) {
    const { scene, animations } = (0, drei_1.useGLTF)(modelUrl, true, true);
    // Clone the scene graph so we can deeply alter it without corrupting shared global references
    const clonedScene = (0, react_1.useMemo)(() => scene.clone(), [scene]);
    const { actions } = (0, drei_1.useAnimations)(animations, clonedScene);
    const { wireframe, xray, clipPlaneEnabled, clipPlaneOffset, explodedOffset, setExplodedOffset, playingAnimation, setPlayingAnimation, selectedMeshId, setSelectedMeshId, setSceneMeshes, triggerReset // Extracted for Iteration 2
     } = (0, viewerStore_1.useViewerStore)();
    // Handle Auto-framing on new model load (Architect Optimization 2)
    (0, react_1.useEffect)(() => {
        if (clonedScene) {
            if (onLoad)
                onLoad();
            triggerReset(); // Forces the R3F `<Bounds>` to compute the bounding box of the newly injected model instead of trapping the camera.
        }
    }, [clonedScene, onLoad, triggerReset]);
    // Extract Bill of Materials hierarchy and reset selection state when model swaps
    (0, react_1.useEffect)(() => {
        if (!clonedScene)
            return;
        // Clear out stale UI selections
        setSelectedMeshId(null);
        setExplodedOffset(0);
        setPlayingAnimation(false);
        const meshes = [];
        clonedScene.traverse((node) => {
            if (node.isMesh) {
                meshes.push({ uuid: node.uuid, name: node.name });
            }
        });
        // Performance Loop 4: Deep equality heuristic to intercept useless Zustand re-renders
        viewerStore_1.useViewerStore.setState((prev) => {
            if (prev.sceneMeshes.length === meshes.length)
                return {};
            return { sceneMeshes: meshes };
        });
    }, [clonedScene]);
    // Handle Animation Playback Sequences
    (0, react_1.useEffect)(() => {
        if (!actions)
            return;
        const actionNames = Object.keys(actions);
        if (actionNames.length === 0)
            return;
        // Play first animation by default if toggled on
        const action = actions[actionNames[0]];
        if (playingAnimation) {
            action === null || action === void 0 ? void 0 : action.play();
        }
        else {
            action === null || action === void 0 ? void 0 : action.stop(); // Complete halt instead of pause for predictable reset behavior
        }
    }, [actions, playingAnimation]);
    // Setup dynamic X-Axis WebGL Clipping Plane
    const [clipPlane] = (0, react_1.useState)(() => new THREE.Plane(new THREE.Vector3(1, 0, 0), 0));
    (0, react_1.useEffect)(() => {
        clipPlane.constant = clipPlaneOffset;
    }, [clipPlaneOffset, clipPlane]);
    // Handle advanced material overriding (X-Ray, Wireframe), Clipping, and BOM Highlights
    (0, react_1.useEffect)(() => {
        if (!clonedScene)
            return;
        clonedScene.traverse((node) => {
            if (node.isMesh) {
                const mesh = node;
                // Material can be an array or single. Protect against both.
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((m) => {
                    const mat = m;
                    // Cache original properties explicitly internally
                    if (!mat._original) {
                        mat._original = {
                            wireframe: mat.wireframe,
                            transparent: mat.transparent,
                            opacity: mat.opacity,
                            depthWrite: mat.depthWrite,
                            emissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000),
                            emissiveIntensity: mat.emissiveIntensity || 0
                        };
                    }
                    const orig = mat._original;
                    if (wireframe) {
                        mat.wireframe = true;
                        mat.transparent = orig.transparent;
                        mat.opacity = 1;
                        mat.depthWrite = true;
                    }
                    else if (xray) {
                        mat.wireframe = false;
                        mat.transparent = true;
                        mat.opacity = 0.15;
                        mat.depthWrite = false;
                    }
                    else {
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
                        }
                        else {
                            if (mat.emissive) {
                                if (orig.emissive) {
                                    mat.emissive.copy(orig.emissive);
                                }
                                else {
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
    const [explosionState] = (0, react_1.useState)(() => ({
        originalPositions: new Map(),
        explosionVectors: new Map()
    }));
    // Automatic Memory Cleanup on Model Swap (Architect Optimization 1)
    (0, react_1.useEffect)(() => {
        explosionState.originalPositions.clear();
        explosionState.explosionVectors.clear();
    }, [clonedScene, explosionState]);
    (0, react_1.useEffect)(() => {
        if (!clonedScene)
            return;
        clonedScene.traverse((node) => {
            var _a;
            if (node.isMesh) {
                const mesh = node;
                // First pass: Cache original matrix and calculate center outward vector
                if (!explosionState.originalPositions.has(mesh.uuid)) {
                    explosionState.originalPositions.set(mesh.uuid, mesh.position.clone());
                    if (!mesh.geometry.boundingBox) {
                        mesh.geometry.computeBoundingBox();
                    }
                    const center = new THREE.Vector3();
                    (_a = mesh.geometry.boundingBox) === null || _a === void 0 ? void 0 : _a.getCenter(center);
                    // Apply world matrix to establish absolute push direction
                    center.applyMatrix4(mesh.matrixWorld);
                    const expVec = center.clone().normalize();
                    // Fallback outward vector if part is dead center (e.g., core chassis)
                    if (expVec.lengthSq() === 0)
                        expVec.set(0, 1, 0);
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
    const selectedMesh = (0, react_1.useMemo)(() => {
        if (!selectedMeshId || !clonedScene)
            return null;
        let found = null;
        clonedScene.traverse((n) => {
            if (n.uuid === selectedMeshId)
                found = n;
        });
        return found;
    }, [clonedScene, selectedMeshId]);
    const hotspotPos = (0, react_1.useMemo)(() => {
        if (!selectedMesh)
            return new THREE.Vector3();
        if (!selectedMesh.geometry.boundingBox)
            selectedMesh.geometry.computeBoundingBox();
        const box = selectedMesh.geometry.boundingBox;
        const pos = new THREE.Vector3();
        box.getCenter(pos);
        pos.y = box.max.y; // Pin to top
        return pos.applyMatrix4(selectedMesh.matrixWorld);
    }, [selectedMesh]);
    if (!clonedScene)
        return null;
    return (react_1.default.createElement("group", { onPointerDown: (e) => {
            // Prevent click events from firing on elements behind this one
            e.stopPropagation();
            setSelectedMeshId(e.object.uuid);
        }, onPointerMissed: () => setSelectedMeshId(null) },
        react_1.default.createElement("primitive", { object: clonedScene }),
        selectedMesh && (react_1.default.createElement(drei_1.Html, { position: hotspotPos, center: true, zIndexRange: [100, 0] },
            react_1.default.createElement("div", { className: "bg-indigo-600 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded shadow-[0_0_15px_rgba(79,70,229,0.5)] whitespace-nowrap pointer-events-none transform -translate-y-6" },
                react_1.default.createElement("span", { className: "opacity-70 mr-2" }, "PART:"),
                selectedMesh.name || `Asset-${selectedMesh.uuid.split('-')[0]}`)))));
}
