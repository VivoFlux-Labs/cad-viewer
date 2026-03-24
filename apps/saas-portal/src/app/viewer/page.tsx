'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ConfigSchema } from '@cad-viewer/viewer-core';

// Disable SSR for WebGL Components inherently tied to the window object
const ViewerCanvas = dynamic(() => import('@cad-viewer/viewer-core').then(mod => mod.ViewerCanvas), { ssr: false });
const ViewerLoader = dynamic(() => import('@cad-viewer/viewer-core').then(mod => mod.ViewerLoader), { ssr: false });
const ConfiguratorPanel = dynamic(() => import('@cad-viewer/viewer-core').then(mod => mod.ConfiguratorPanel), { ssr: false });

const DEMO_SCHEMA: ConfigSchema = {
  width: { type: 'number_range', label: 'Width (cm)', min: 10, max: 200, step: 10, default: 50 },
  height: { type: 'number_range', label: 'Height (cm)', min: 10, max: 200, step: 10, default: 100 },
  material: { type: 'enum', label: 'Granite Finish', options: ['Polished', 'Matte', 'Raw'], default: 'Polished' }
};

export default function ViewerDemoPage() {
  const [lastConfig, setLastConfig] = useState<Record<string, any>>({});

  return (
    <div className="flex flex-col h-screen w-full bg-gray-950 text-white font-sans overflow-hidden">
      
      {/* Top Banner */}
      <div className="h-14 bg-indigo-950 border-b border-indigo-800 flex items-center px-6 justify-between shadow-md z-10">
        <h1 className="font-bold tracking-wider text-indigo-100 flex items-center gap-3">
          SAAS CONFIGURATOR <span className="text-indigo-400 font-normal px-3 py-0.5 bg-indigo-900 rounded-full text-xs">LIVE 3D DEMO</span>
        </h1>
        <div className="flex gap-4 items-center">
          <div className="text-xs bg-indigo-900 px-3 py-1 rounded text-indigo-200 border border-indigo-700 shadow-inner">
            React Three Fiber @viewer-core
          </div>
          <div className="text-xs bg-blue-900 px-3 py-1 rounded text-blue-200 border border-blue-700 shadow-inner">
            Zustand Store Active
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)] w-full relative">
        {/* Main 3D Canvas Area */}
        <div className="flex-1 relative cursor-grab active:cursor-grabbing">
          {/* The WebGL Render tree */}
          <ViewerCanvas cameraPosition={[3, 2, 3]} backgroundColor="#09090b">
            <ViewerLoader modelUrl="/demo.glb" />
          </ViewerCanvas>
          
          {/* Debug State Box for Stakeholders to see the Zustand store reacting instantaneously */}
          <div className="absolute bottom-6 left-6 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
              <p className="text-[10px] text-gray-400 mb-2 tracking-widest uppercase font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]"></span>
                Zustand Live State
              </p>
              <pre className="text-green-400 font-mono text-xs max-w-xs whitespace-pre-wrap">
                {JSON.stringify(lastConfig, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Configurator Overlay Sidebar */}
        <div className="w-96 min-w-[384px] bg-gray-900 border-l border-gray-800 overflow-y-auto z-10 shadow-2xl flex flex-col">
          <div className="p-6 pb-0">
            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Granite Configurator</h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">Customize your 3D asset below. The UI is dynamically parsed from the JSON schema layout.</p>
          </div>

          {/* Connect the parsed UI into our React state */}
          <ConfiguratorPanel 
            schema={DEMO_SCHEMA} 
            onConfigChange={(c) => setLastConfig(c)} 
            className="border-none shadow-none rounded-none w-full bg-transparent p-6 pt-0"
          />

          <div className="mt-auto p-6 bg-gray-950/50 border-t border-gray-800 text-xs text-gray-500 leading-relaxed space-y-3">
            <p className="uppercase font-bold text-gray-400 tracking-wider text-[10px]">Architecture Note</p>
            <p>The WebGL Canvas to the left is an entirely decoupled NPM package component (`@viewer-core`).</p>
            <p>The Sliders above are generated dynamically from an injected `ConfigSchema` JSON layout natively into the Next.js container.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
