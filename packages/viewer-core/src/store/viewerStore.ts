import { create } from 'zustand';

export type EnvironmentPreset = 'studio' | 'city' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'park' | 'lobby';

export interface ViewerState {
  environment: EnvironmentPreset;
  showGround: boolean;
  backgroundColor: string;
  wireframe: boolean;
  xray: boolean;
  resetTrigger: number; // Increment to signal a Fit-To-Product event
  clipPlaneEnabled: boolean;
  clipPlaneOffset: number;
  explodedOffset: number;
  playingAnimation: boolean;
  selectedMeshId: string | null;
  sceneMeshes: { uuid: string; name: string }[];
  showScale: boolean;
  setEnvironment: (env: EnvironmentPreset) => void;
  setShowGround: (show: boolean) => void;
  setBackgroundColor: (color: string) => void;
  setWireframe: (wf: boolean) => void;
  setXray: (xr: boolean) => void;
  triggerReset: () => void;
  setClipPlaneEnabled: (enabled: boolean) => void;
  setClipPlaneOffset: (offset: number) => void;
  setExplodedOffset: (offset: number) => void;
  setPlayingAnimation: (playing: boolean) => void;
  setSelectedMeshId: (id: string | null) => void;
  setSceneMeshes: (meshes: { uuid: string; name: string }[]) => void;
  setShowScale: (show: boolean) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  environment: 'studio',
  showGround: true,
  backgroundColor: '#09090b', // Default premium dark
  wireframe: false,
  xray: false,
  resetTrigger: 0,
  clipPlaneEnabled: false,
  clipPlaneOffset: 0,
  explodedOffset: 0,
  playingAnimation: false,
  selectedMeshId: null,
  sceneMeshes: [],
  showScale: false,
  setEnvironment: (environment) => set({ environment }),
  setShowGround: (showGround) => set({ showGround }),
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setWireframe: (wireframe) => { set({ wireframe }); if (wireframe) set({ xray: false }); },
  setXray: (xray) => { set({ xray }); if (xray) set({ wireframe: false }); },
  triggerReset: () => set((state) => ({ resetTrigger: state.resetTrigger + 1 })),
  setClipPlaneEnabled: (clipPlaneEnabled) => set({ clipPlaneEnabled }),
  setClipPlaneOffset: (clipPlaneOffset) => set({ clipPlaneOffset }),
  setExplodedOffset: (explodedOffset) => set({ explodedOffset }),
  setPlayingAnimation: (playingAnimation) => set({ playingAnimation }),
  setSelectedMeshId: (selectedMeshId) => set({ selectedMeshId }),
  setSceneMeshes: (sceneMeshes) => set({ sceneMeshes }),
  setShowScale: (showScale) => set({ showScale }),
}));
