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
exports.ConfiguratorPanel = ConfiguratorPanel;
const react_1 = __importStar(require("react"));
const configuratorStore_1 = require("../store/configuratorStore");
function ConfiguratorPanel({ schema, onConfigChange, className }) {
    const { config, setSchema, setConfigValue } = (0, configuratorStore_1.useConfiguratorStore)();
    // Hydrate schema into store on mount
    (0, react_1.useEffect)(() => {
        setSchema(schema);
    }, [schema, setSchema]);
    // Bubble up configuration changes iteratively so the parent can post it to the Orchestrator
    (0, react_1.useEffect)(() => {
        if (onConfigChange && Object.keys(config).length > 0) {
            onConfigChange(config);
        }
    }, [config, onConfigChange]);
    if (Object.keys(schema).length === 0)
        return null;
    return (react_1.default.createElement("div", { className: `p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-white flex flex-col gap-5 min-w-[300px] ${className || ''}` },
        react_1.default.createElement("h3", { className: "text-xl font-bold tracking-tight" }, "Configuration"),
        react_1.default.createElement("div", { className: "flex flex-col gap-6" }, Object.entries(schema).map(([key, item]) => {
            var _a;
            const value = (_a = config[key]) !== null && _a !== void 0 ? _a : item.default;
            if (item.type === 'number_range') {
                return (react_1.default.createElement("div", { key: key, className: "flex flex-col gap-2" },
                    react_1.default.createElement("label", { className: "text-sm font-semibold flex justify-between items-center text-gray-200" },
                        react_1.default.createElement("span", null, item.label),
                        react_1.default.createElement("span", { className: "bg-blue-600/30 px-2 py-0.5 rounded text-blue-200" }, value)),
                    react_1.default.createElement("input", { type: "range", min: item.min, max: item.max, step: item.step || 1, value: value, onChange: (e) => setConfigValue(key, parseFloat(e.target.value)), className: "w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" })));
            }
            if (item.type === 'enum' && item.options) {
                return (react_1.default.createElement("div", { key: key, className: "flex flex-col gap-2" },
                    react_1.default.createElement("label", { className: "text-sm font-semibold text-gray-200" }, item.label),
                    react_1.default.createElement("select", { value: value, onChange: (e) => setConfigValue(key, e.target.value), className: "w-full bg-gray-800/80 border border-gray-600 hover:border-blue-500 rounded-lg p-2.5 text-sm outline-none transition-colors appearance-none cursor-pointer" }, item.options.map(opt => (react_1.default.createElement("option", { key: opt, value: opt }, opt))))));
            }
            return null;
        }))));
}
