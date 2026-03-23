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
function ViewerCanvas({ children, cameraPosition = [15, 15, 15], backgroundColor = '#1a1a2e' // Dark premium aesthetic
 }) {
    return (react_1.default.createElement(fiber_1.Canvas, { shadows: true, camera: { position: cameraPosition, fov: 45 }, style: { width: '100%', height: '100%', display: 'block', background: backgroundColor } },
        react_1.default.createElement(react_1.Suspense, { fallback: null },
            react_1.default.createElement(drei_1.Environment, { preset: "city", background: false }),
            react_1.default.createElement("ambientLight", { intensity: 0.5 }),
            react_1.default.createElement("directionalLight", { position: [10, 10, 10], intensity: 1, castShadow: true }),
            react_1.default.createElement(drei_1.Bounds, { fit: true, clip: true, observe: true, margin: 1.2 },
                react_1.default.createElement("group", null, children)),
            react_1.default.createElement(drei_1.OrbitControls, { makeDefault: true, minDistance: 2, maxDistance: 100, maxPolarAngle: Math.PI / 2 + 0.1 }))));
}
