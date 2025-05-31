// src/features/editor/components/SelectionIndicator.tsx
import React from 'react';
import { useEditor } from '../../../contexts/editor';

const SelectionIndicator: React.FC = React.memo(() => {
    const { selectedShapeIds, selectedEntityId } = useEditor();

    // Don’t render anything if no shapes are selected
    if (selectedShapeIds.size === 0) {
        return null;
    }

    return (
        <div
            className="
        absolute top-2 right-2
        bg-orange-500/70       /* 80% opacity */
        text-white
        text-xs               /* smaller main font */
        px-1 py-1            /* slightly tighter padding */
        rounded-lg
        shadow-md
        z-20
      "
        >
            <div className="font-small">
                Layer: <span className="font-semibold">{selectedEntityId}</span> {' '}
            </div>
            <div className="text-small opacity-90 mt-0.5">
                {selectedShapeIds.size}{' '}
                {selectedShapeIds.size > 1 ? 'shapes' : 'shape'} selected
            </div>
            <div className="text-xs opacity-90 mt-0.5">
                Right‐click for actions
            </div>
        </div>
    );
});

export default SelectionIndicator;
