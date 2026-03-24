import React from 'react';
import { ConfigSchema } from '../store/configuratorStore';
export interface ConfiguratorPanelProps {
    schema: ConfigSchema;
    onConfigChange?: (config: Record<string, any>) => void;
    className?: string;
}
export declare function ConfiguratorPanel({ schema, onConfigChange, className }: ConfiguratorPanelProps): React.JSX.Element | null;
