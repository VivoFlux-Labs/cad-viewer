"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useViewerStore = void 0;
const zustand_1 = require("zustand");
exports.useViewerStore = (0, zustand_1.create)((set) => ({
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
    setWireframe: (wireframe) => { set({ wireframe }); if (wireframe)
        set({ xray: false }); },
    setXray: (xray) => { set({ xray }); if (xray)
        set({ wireframe: false }); },
    triggerReset: () => set((state) => ({ resetTrigger: state.resetTrigger + 1 })),
    setClipPlaneEnabled: (clipPlaneEnabled) => set({ clipPlaneEnabled }),
    setClipPlaneOffset: (clipPlaneOffset) => set({ clipPlaneOffset }),
    setExplodedOffset: (explodedOffset) => set({ explodedOffset }),
    setPlayingAnimation: (playingAnimation) => set({ playingAnimation }),
    setSelectedMeshId: (selectedMeshId) => set({ selectedMeshId }),
    setSceneMeshes: (sceneMeshes) => set({ sceneMeshes }),
    setShowScale: (showScale) => set({ showScale }),
}));
