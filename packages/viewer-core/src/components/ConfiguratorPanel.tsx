import React, { useEffect } from 'react';
import { useConfiguratorStore, ConfigSchema } from '../store/configuratorStore';

export interface ConfiguratorPanelProps {
  schema: ConfigSchema;
  onConfigChange?: (config: Record<string, any>) => void;
  className?: string; // Support for injected tailwind styles
}

export function ConfiguratorPanel({ schema, onConfigChange, className }: ConfiguratorPanelProps) {
  const { config, setSchema, setConfigValue } = useConfiguratorStore();

  // Hydrate schema into store on mount
  useEffect(() => {
    setSchema(schema);
  }, [schema, setSchema]);

  // Bubble up configuration changes iteratively so the parent can post it to the Orchestrator
  useEffect(() => {
    if (onConfigChange && Object.keys(config).length > 0) {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);

  if (Object.keys(schema).length === 0) return null;

  return (
    <div className={`p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-white flex flex-col gap-5 min-w-[300px] ${className || ''}`}>
      <h3 className="text-xl font-bold tracking-tight">Configuration</h3>
      
      <div className="flex flex-col gap-6">
        {Object.entries(schema).map(([key, item]) => {
          const value = config[key] ?? item.default;
          
          if (item.type === 'number_range') {
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-sm font-semibold flex justify-between items-center text-gray-200">
                  <span>{item.label}</span>
                  <span className="bg-blue-600/30 px-2 py-0.5 rounded text-blue-200">{value}</span>
                </label>
                <input 
                  type="range" 
                  min={item.min} 
                  max={item.max} 
                  step={item.step || 1}
                  value={value}
                  onChange={(e) => setConfigValue(key, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            );
          }
          
          if (item.type === 'enum' && item.options) {
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-200">{item.label}</label>
                <select 
                  value={value}
                  onChange={(e) => setConfigValue(key, e.target.value)}
                  className="w-full bg-gray-800/80 border border-gray-600 hover:border-blue-500 rounded-lg p-2.5 text-sm outline-none transition-colors appearance-none cursor-pointer"
                >
                  {item.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
}
