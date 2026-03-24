"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useConfiguratorStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
exports.useConfiguratorStore = (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
    config: {},
    schema: {},
    setConfigValue: (key, value) => set((state) => ({ config: Object.assign(Object.assign({}, state.config), { [key]: value }) })),
    setSchema: (schema) => {
        set((state) => {
            const newConfig = Object.assign({}, state.config);
            // Initialize defaults for missing keys
            Object.entries(schema).forEach(([key, item]) => {
                if (newConfig[key] === undefined && item.default !== undefined) {
                    newConfig[key] = item.default;
                }
            });
            return { schema, config: newConfig };
        });
    }
}), {
    name: 'viewer-config-storage', // Zustand will persist this in localStorage inherently
}));
