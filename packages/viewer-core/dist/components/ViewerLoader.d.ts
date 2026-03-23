import React from 'react';
export interface ViewerLoaderProps {
    modelUrl: string;
    onLoad?: () => void;
}
export declare function ViewerLoader({ modelUrl, onLoad }: ViewerLoaderProps): React.JSX.Element | null;
