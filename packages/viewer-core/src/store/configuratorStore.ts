import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ConfigSchemaItem {
  type: 'enum' | 'number_range';
  label: string;
  default?: any;
  options?: string[]; // Used if type === 'enum'
  min?: number; // Used if type === 'number_range'
  max?: number;
  step?: number;
}

export type ConfigSchema = Record<string, ConfigSchemaItem>;

export interface ConfiguratorState {
  config: Record<string, any>;
  schema: ConfigSchema;
  setConfigValue: (key: string, value: any) => void;
  setSchema: (schema: ConfigSchema) => void;
}

export const useConfiguratorStore = create<ConfiguratorState>()(
  persist(
    (set) => ({
      config: {},
      schema: {},
      setConfigValue: (key, value) => 
        set((state) => ({ config: { ...state.config, [key]: value } })),
      setSchema: (schema) => {
        set((state) => {
          const newConfig = { ...state.config };
          // Initialize defaults for missing keys
          Object.entries(schema).forEach(([key, item]) => {
            if (newConfig[key] === undefined && item.default !== undefined) {
              newConfig[key] = item.default;
            }
          });
          return { schema, config: newConfig };
        });
      }
    }),
    {
      name: 'viewer-config-storage', // Zustand will persist this in localStorage inherently
    }
  )
);
