"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewerToolbar = ViewerToolbar;
const react_1 = __importDefault(require("react"));
const viewerStore_1 = require("../store/viewerStore");
function ViewerToolbar() {
    const { environment, setEnvironment, showGround, setShowGround, wireframe, setWireframe, xray, setXray, triggerReset, clipPlaneEnabled, setClipPlaneEnabled, clipPlaneOffset, setClipPlaneOffset, explodedOffset, setExplodedOffset, playingAnimation, setPlayingAnimation } = (0, viewerStore_1.useViewerStore)();
    const presets = [
        { label: 'Studio', value: 'studio' },
        { label: 'Workshop', value: 'warehouse' },
        { label: 'Daylight', value: 'sunset' },
        { label: 'Outdoor', value: 'park' }
    ];
    return (react_1.default.createElement("div", { className: "absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 flex gap-6 z-50 text-white shadow-2xl font-sans divide-x divide-gray-800" },
        react_1.default.createElement("div", { className: "flex flex-col gap-3 pr-2" },
            react_1.default.createElement("div", { className: "flex items-center gap-3" },
                react_1.default.createElement("span", { className: "text-[10px] font-bold uppercase tracking-widest text-gray-400 w-24" }, "Environment"),
                react_1.default.createElement("div", { className: "flex gap-1 bg-black/40 p-1 rounded-lg border border-gray-800" }, presets.map(p => (react_1.default.createElement("button", { key: p.value, onClick: () => setEnvironment(p.value), className: `px-3 py-1.5 text-xs rounded-md transition-all font-medium ${environment === p.value
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'}` }, p.label))))),
            react_1.default.createElement("div", { className: "flex items-center gap-3" },
                react_1.default.createElement("span", { className: "text-[10px] font-bold uppercase tracking-widest text-gray-400 w-24" }, "Ground Plane"),
                react_1.default.createElement("button", { onClick: () => setShowGround(!showGround), className: `px-4 py-1.5 text-xs rounded-lg transition-all border font-bold ${showGround
                        ? 'bg-green-900/40 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}` }, showGround ? 'ENABLED' : 'DISABLED'))),
        react_1.default.createElement("div", { className: "flex flex-col gap-3 pl-6" },
            react_1.default.createElement("div", { className: "flex items-center gap-3" },
                react_1.default.createElement("span", { className: "text-[10px] font-bold uppercase tracking-widest text-indigo-300 w-24" }, "Render Mode"),
                react_1.default.createElement("div", { className: "flex gap-1 bg-black/40 p-1 rounded-lg border border-gray-800" },
                    react_1.default.createElement("button", { onClick: () => { setWireframe(false); setXray(false); }, className: `px-3 py-1.5 text-xs rounded-md transition-all font-medium ${!wireframe && !xray ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}` }, "Shaded"),
                    react_1.default.createElement("button", { onClick: () => setWireframe(true), className: `px-3 py-1.5 text-xs rounded-md transition-all font-medium ${wireframe ? 'bg-orange-600 text-white shadow' : 'text-gray-400 hover:text-white'}` }, "Wireframe"),
                    react_1.default.createElement("button", { onClick: () => setXray(true), className: `px-3 py-1.5 text-xs rounded-md transition-all font-medium ${xray ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'}` }, "X-Ray Ghost"))),
            react_1.default.createElement("div", { className: "flex items-center gap-3" },
                react_1.default.createElement("span", { className: "text-[10px] font-bold uppercase tracking-widest text-indigo-300 w-24" }, "Camera"),
                react_1.default.createElement("div", { className: "flex gap-2" },
                    react_1.default.createElement("button", { onClick: () => triggerReset(), className: "px-4 py-1.5 text-xs rounded-lg transition-all border border-indigo-700 bg-indigo-900/40 text-indigo-100 hover:bg-indigo-600 font-bold" }, "\u26F6 FIT TO PRODUCT"),
                    react_1.default.createElement("button", { onClick: () => viewerStore_1.useViewerStore.getState().setShowScale(!viewerStore_1.useViewerStore.getState().showScale), className: `px-4 py-1.5 text-xs rounded-lg transition-all border font-bold ${viewerStore_1.useViewerStore.getState().showScale
                            ? 'bg-blue-900/40 border-blue-500 text-blue-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}` }, "\uD83E\uDDCD SCALE REF")))),
        react_1.default.createElement("div", { className: "flex flex-col gap-3 pl-6 w-72" },
            react_1.default.createElement("div", { className: "flex items-center gap-3 justify-between" },
                react_1.default.createElement("span", { className: "text-[10px] font-bold uppercase tracking-widest text-orange-400" }, "Exploded View"),
                react_1.default.createElement("input", { type: "range", min: "0", max: "100", step: "1", value: explodedOffset, onChange: (e) => setExplodedOffset(parseFloat(e.target.value)), className: "w-32 accent-orange-500" })),
            react_1.default.createElement("div", { className: "flex items-center gap-3 justify-between" },
                react_1.default.createElement("label", { className: "flex items-center gap-2 cursor-pointer" },
                    react_1.default.createElement("input", { type: "checkbox", checked: clipPlaneEnabled, onChange: (e) => setClipPlaneEnabled(e.target.checked), className: "accent-red-500 w-3 h-3" }),
                    react_1.default.createElement("span", { className: "text-[10px] font-bold uppercase tracking-widest text-red-500" }, "X-Axis Slice")),
                react_1.default.createElement("input", { type: "range", min: "-50", max: "50", step: "1", value: clipPlaneOffset, onChange: (e) => setClipPlaneOffset(parseFloat(e.target.value)), disabled: !clipPlaneEnabled, className: `w-32 accent-red-500 ${!clipPlaneEnabled && 'opacity-30'}` })),
            react_1.default.createElement("div", { className: "flex items-center gap-3 justify-between pt-1 border-t border-gray-800" },
                react_1.default.createElement("span", { className: "text-[10px] font-bold uppercase tracking-widest text-yellow-500" }, "Sequences"),
                react_1.default.createElement("button", { onClick: () => setPlayingAnimation(!playingAnimation), className: `px-4 py-1.5 text-xs rounded-lg transition-all border font-bold ${playingAnimation
                        ? 'bg-yellow-900/40 border-yellow-500/50 text-yellow-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}` }, playingAnimation ? '⏸ PAUSE' : '▶ PLAY')))));
}
