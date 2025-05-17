// src/features/editor/components/ZoomControls.tsx
import React from 'react';
import {useEditor} from "../../../contexts/editor";

const ZoomControls: React.FC = () => {
    const { scale, updateScale,  updatePosition} = useEditor();
    const zoomPercentage = Math.round(scale * 100);

    const handleZoomIn = () => {
        updateScale("zoom-in")
    };

    const handleZoomOut = () => {
        updateScale("zoom-out")
    };

    const handleResetZoom = () => {
        updateScale("reset")
        updatePosition(0,0)
    };

    return (
        // Positioned in the bottom-right corner as requested
        <div className="absolute bottom-4 right-4 flex items-center bg-white rounded-lg shadow px-2 py-1 z-10">
            <button
                className="w-8 h-8 flex items-center justify-center text-xl"
                onClick={handleZoomOut}
                disabled={scale <= 0.1}
                title="Zoom Out"
            >
                −
            </button>

            <div className="px-2 min-w-16 text-center">
                {zoomPercentage}%
            </div>

            <button
                className="w-8 h-8 flex items-center justify-center text-xl"
                onClick={handleZoomIn}
                disabled={scale >= 10}
                title="Zoom In"
            >
                +
            </button>

            <button
                className="ml-2 px-2 text-sm"
                onClick={handleResetZoom}
                title="Reset Zoom"
            >
                Reset
            </button>
        </div>
    );
};

export default React.memo(ZoomControls);
