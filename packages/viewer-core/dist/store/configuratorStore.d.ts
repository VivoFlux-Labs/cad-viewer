export interface ConfigSchemaItem {
    type: 'enum' | 'number_range';
    label: string;
    default?: any;
    options?: string[];
    min?: number;
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
export declare const useConfiguratorStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ConfiguratorState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<ConfiguratorState, ConfiguratorState>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ConfiguratorState) => void) => () => void;
        onFinishHydration: (fn: (state: ConfiguratorState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<ConfiguratorState, ConfiguratorState>>;
    };
}>;
