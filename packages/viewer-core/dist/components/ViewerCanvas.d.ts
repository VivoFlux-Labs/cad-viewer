import React from 'react';
export interface ViewerCanvasProps {
    children?: React.ReactNode;
    cameraPosition?: [number, number, number];
}
export declare function ViewerCanvas({ children, cameraPosition, }: ViewerCanvasProps): React.JSX.Element;
