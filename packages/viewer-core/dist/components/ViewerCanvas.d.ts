import React from 'react';
export interface ViewerCanvasProps {
    children?: React.ReactNode;
    cameraPosition?: [number, number, number];
    backgroundColor?: string;
}
export declare function ViewerCanvas({ children, cameraPosition, backgroundColor }: ViewerCanvasProps): React.JSX.Element;
