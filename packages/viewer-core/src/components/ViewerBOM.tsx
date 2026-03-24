import React from 'react';
import { useViewerStore } from '../store/viewerStore';

export function ViewerBOM() {
  const { sceneMeshes, selectedMeshId, setSelectedMeshId } = useViewerStore();

  if (sceneMeshes.length === 0) return null;

  return (
    <div className="absolute right-4 top-4 w-64 max-h-[60vh] bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col z-40 text-white font-sans shadow-2xl">
      <div className="bg-black/90 p-3 rounded-t-xl border-b border-white/10 flex justify-between items-center shadow-md">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Bill of Materials</h3>
        <span className="text-xs font-bold bg-indigo-900 px-2 py-0.5 rounded text-indigo-200">{sceneMeshes.length}</span>
      </div>
      <div className="flex flex-col p-2 gap-1 overflow-y-auto">
        {sceneMeshes.map((mesh) => (
          <button
            key={mesh.uuid}
            onClick={() => setSelectedMeshId(mesh.uuid === selectedMeshId ? null : mesh.uuid)}
            className={`text-left px-3 py-2 text-xs rounded transition-all truncate border font-medium ${
              selectedMeshId === mesh.uuid 
              ? 'bg-indigo-600 border-indigo-500 shadow-md text-white' 
              : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            {mesh.name || `Asset-${mesh.uuid.split('-')[0]}`}
          </button>
        ))}
      </div>
      <div className="p-2 border-t border-gray-800 text-[9px] text-gray-500 uppercase tracking-widest text-center">
        Select part to highlight
      </div>
    </div>
  );
}
