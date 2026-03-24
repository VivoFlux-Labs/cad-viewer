export type EnvironmentPreset = 'studio' | 'city' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'park' | 'lobby';
export interface ViewerState {
    environment: EnvironmentPreset;
    showGround: boolean;
    backgroundColor: string;
    wireframe: boolean;
    xray: boolean;
    resetTrigger: number;
    clipPlaneEnabled: boolean;
    clipPlaneOffset: number;
    explodedOffset: number;
    playingAnimation: boolean;
    selectedMeshId: string | null;
    sceneMeshes: {
        uuid: string;
        name: string;
    }[];
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
    setSceneMeshes: (meshes: {
        uuid: string;
        name: string;
    }[]) => void;
    setShowScale: (show: boolean) => void;
}
export declare const useViewerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ViewerState>>;
