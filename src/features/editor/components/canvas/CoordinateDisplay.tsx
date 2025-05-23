// @ts-nocheck
// src/features/editor/components/canvas/CoordinateDisplay.tsx
import React, {RefObject} from 'react';
import {useCoordinates} from "../../hooks";
import Konva from "konva";
import {useEditor} from "../../../../contexts/editor";


interface CoordinateDisplayProps {
    stageRef: RefObject<Konva.Stage | null>;
}

const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ stageRef }) => {
    const { mousePosition } = useCoordinates(stageRef);
    const { position } = useEditor();

    if (!mousePosition) return null;

    return (
        <div className="top-10 left-2 bg-white bg-opacity-70 px-2 py-1 rounded text-xs absolute">
            x: {position.x}, y: {position.y}
        </div>
    );
};

export default CoordinateDisplay;
