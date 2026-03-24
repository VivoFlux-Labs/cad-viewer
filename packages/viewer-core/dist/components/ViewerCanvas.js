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
    return (react_1.default.createElement("div", { className: "relative w-full h-full" },
        react_1.default.createElement(ViewerToolbar_1.ViewerToolbar, null),
        react_1.default.createElement(ViewerBOM_1.ViewerBOM, null),
        react_1.default.createElement(fiber_1.Canvas, { shadows: true, gl: { localClippingEnabled: true }, camera: { position: cameraPosition, fov: 45 }, style: { width: '100%', height: '100%', display: 'block', background: backgroundColor } },
            react_1.default.createElement(react_1.Suspense, { fallback: null },
                react_1.default.createElement(drei_1.Environment, { preset: environment, background: false }),
                react_1.default.createElement("ambientLight", { intensity: 0.5 }),
                react_1.default.createElement("directionalLight", { position: [10, 10, 10], intensity: 1, castShadow: true }),
                showGround && (react_1.default.createElement(drei_1.ContactShadows, { position: [0, -0.01, 0], opacity: 0.5, scale: 20, blur: 2.5, far: 4, color: "#000000" })),
                react_1.default.createElement(drei_1.Bounds, { fit: true, clip: true, observe: true, margin: 1.2 },
                    react_1.default.createElement(CameraResetter, { trigger: resetTrigger }),
                    react_1.default.createElement(HumanScale, null),
                    react_1.default.createElement("group", null, children)),
                react_1.default.createElement(drei_1.OrbitControls, { makeDefault: true, minDistance: 1, maxDistance: 200, maxPolarAngle: Math.PI / 2 + 0.1 })))));
}
