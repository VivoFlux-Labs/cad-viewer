import React from 'react';
import { useViewerStore } from '../store/viewerStore';

export function ViewerBOM() {
  const { sceneMeshes, selectedMeshId, setSelectedMeshId } = useViewerStore();

  if (sceneMeshes.length === 0) return null;

  return (
    <div className="absolute right-6 top-6 w-80 max-h-[70vh] bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl flex flex-col z-40 text-white font-sans shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 transform translate-x-0 outline outline-1 outline-white/5">
      <div className="bg-gradient-to-r from-indigo-900/40 to-transparent p-4 rounded-t-2xl border-b border-white/10 flex justify-between items-center shadow-lg">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-300 drop-shadow-md">Bill of Materials</h3>
        <span className="text-xs font-bold bg-indigo-600/80 px-2 py-0.5 rounded shadow-sm text-white">{sceneMeshes.length}</span>
      </div>
      <div className="flex flex-col p-3 gap-2 overflow-y-auto custom-scrollbar">
        {sceneMeshes.map((mesh) => (
          <button
            key={mesh.uuid}
            onClick={() => setSelectedMeshId(mesh.uuid === selectedMeshId ? null : mesh.uuid)}
            className={`text-left px-4 py-3 text-xs rounded-xl transition-all duration-300 truncate border font-medium flex items-center gap-3 ${
              selectedMeshId === mesh.uuid 
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.5)] text-white scale-[1.02]' 
              : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${selectedMeshId === mesh.uuid ? 'bg-white shadow-[0_0_8px_#fff]' : 'bg-gray-600'}`} />
            {mesh.name || `Asset-${mesh.uuid.split('-')[0]}`}
          </button>
        ))}
      </div>
      <div className="p-3 bg-black/20 rounded-b-2xl border-t border-white/5 text-[10px] text-gray-400 uppercase tracking-widest text-center shadow-inner">
        Select part to highlight
      </div>
    </div>
  );
}
