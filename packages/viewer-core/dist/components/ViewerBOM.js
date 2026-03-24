"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewerBOM = ViewerBOM;
const react_1 = __importDefault(require("react"));
const viewerStore_1 = require("../store/viewerStore");
function ViewerBOM() {
    const { sceneMeshes, selectedMeshId, setSelectedMeshId } = (0, viewerStore_1.useViewerStore)();
    if (sceneMeshes.length === 0)
        return null;
    return (react_1.default.createElement("div", { className: "absolute right-4 top-4 w-64 max-h-[60vh] bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col z-40 text-white font-sans shadow-2xl" },
        react_1.default.createElement("div", { className: "bg-black/90 p-3 rounded-t-xl border-b border-white/10 flex justify-between items-center shadow-md" },
            react_1.default.createElement("h3", { className: "text-[10px] font-bold uppercase tracking-widest text-indigo-400" }, "Bill of Materials"),
            react_1.default.createElement("span", { className: "text-xs font-bold bg-indigo-900 px-2 py-0.5 rounded text-indigo-200" }, sceneMeshes.length)),
        react_1.default.createElement("div", { className: "flex flex-col p-2 gap-1 overflow-y-auto" }, sceneMeshes.map((mesh) => (react_1.default.createElement("button", { key: mesh.uuid, onClick: () => setSelectedMeshId(mesh.uuid === selectedMeshId ? null : mesh.uuid), className: `text-left px-3 py-2 text-xs rounded transition-all truncate border font-medium ${selectedMeshId === mesh.uuid
                ? 'bg-indigo-600 border-indigo-500 shadow-md text-white'
                : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'}` }, mesh.name || `Asset-${mesh.uuid.split('-')[0]}`)))),
        react_1.default.createElement("div", { className: "p-2 border-t border-gray-800 text-[9px] text-gray-500 uppercase tracking-widest text-center" }, "Select part to highlight")));
}
