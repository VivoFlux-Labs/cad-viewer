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
exports.ViewerCanvas = ViewerCanvas;
const react_1 = __importStar(require("react"));
const fiber_1 = require("@react-three/fiber");
const drei_1 = require("@react-three/drei");
const viewerStore_1 = require("../store/viewerStore");
const ViewerToolbar_1 = require("./ViewerToolbar");
const ViewerBOM_1 = require("./ViewerBOM");
// Intercepts the global Zustand string trigger mapped down into the Bounds React Component constraint limit boundaries.
function CameraResetter({ trigger }) {
    const bounds = (0, drei_1.useBounds)();
    react_1.default.useEffect(() => {
        if (trigger > 0) {
            bounds.refresh().clip().fit();
        }
    }, [trigger, bounds]);
    return null;
}
// Renders a scaled 1.8m Context element
function HumanScale() {
    const showScale = (0, viewerStore_1.useViewerStore)(state => state.showScale);
    if (!showScale)
        return null;
    return (react_1.default.createElement(drei_1.Billboard, { position: [1.5, 0.9, 0] },
        react_1.default.createElement("mesh", null,
            react_1.default.createElement("planeGeometry", { args: [0.5, 1.8] }),
            react_1.default.createElement("meshBasicMaterial", { color: "#4f46e5", transparent: true, opacity: 0.3, depthTest: false })),
        react_1.default.createElement(drei_1.Text, { position: [0, -1, 0], fontSize: 0.1, color: "white" }, "1.8m (6ft)")));
}
function ViewerCanvas({ children, cameraPosition = [15, 15, 15], }) {
    // Bind directly to global viewer state
    const { environment, showGround, backgroundColor, resetTrigger } = (0, viewerStore_1.useViewerStore)();
    return (react_1.default.createElement("div", { className: "relative w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-950 to-black overflow-hidden" },
        react_1.default.createElement(ViewerToolbar_1.ViewerToolbar, null),
        react_1.default.createElement(ViewerBOM_1.ViewerBOM, null),
        react_1.default.createElement("div", { style: {
                position: 'absolute',
                top: '120px', /* Clears the ViewerToolbar */
                left: '0', /* Full width — ViewerBOM overlays on the right via z-index */
                right: '0',
                bottom: '0',
                zIndex: 0
            } },
            react_1.default.createElement(fiber_1.Canvas, { shadows: true, gl: { localClippingEnabled: true, alpha: true, antialias: true }, camera: { position: cameraPosition, fov: 45 }, style: { width: '100%', height: '100%', display: 'block', background: 'transparent' } },
                react_1.default.createElement(react_1.Suspense, { fallback: null },
                    react_1.default.createElement(drei_1.Environment, { preset: environment, background: false }),
                    react_1.default.createElement("ambientLight", { intensity: 0.6 }),
                    react_1.default.createElement("directionalLight", { position: [10, 10, 10], intensity: 1.2, castShadow: true, "shadow-mapSize": [2048, 2048], "shadow-bias": -0.0001 }),
                    showGround && (react_1.default.createElement("group", null,
                        react_1.default.createElement("mesh", { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true, position: [0, -0.01, 0] },
                            react_1.default.createElement("planeGeometry", { args: [100, 100] }),
                            react_1.default.createElement("meshStandardMaterial", { attach: "material", color: "#111111", depthWrite: false, transparent: true, opacity: 0.4 })),
                        react_1.default.createElement(drei_1.ContactShadows, { resolution: 1024, scale: 20, blur: 2.5, opacity: 0.8, far: 10, color: "#000000", position: [0, 0, 0] }))),
                    react_1.default.createElement(drei_1.Bounds, { fit: true, clip: true, observe: true, margin: 1.2 },
                        react_1.default.createElement(CameraResetter, { trigger: resetTrigger }),
                        react_1.default.createElement(HumanScale, null),
                        react_1.default.createElement("group", null, children)),
                    react_1.default.createElement(drei_1.OrbitControls, { makeDefault: true, enableDamping: true, enablePan: false, dampingFactor: 0.05, minDistance: 0.1, maxDistance: 200, maxPolarAngle: Math.PI / 1.8 }))))));
}
