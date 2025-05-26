// @ts-nocheck
import React from 'react';


interface CoordinateDisplayProps {
    pointerPos: {
        x: number;
        y: number;
    };
}

const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ pointerPos }) => {

    if (!pointerPos) return null;
    return (
        <div className="top-10 left-2 bg-white bg-opacity-70 px-2 py-1 rounded text-xs absolute">
            x: {pointerPos.x}, y: {pointerPos.y}
        </div>
    );
};

export default CoordinateDisplay;
