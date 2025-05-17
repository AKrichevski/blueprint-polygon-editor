// Individual shape renderers with context integration
import type {PointShape} from "../../../../../types";
import React, {memo} from "react";
import {useShapeInteractions} from "../../../hooks";
import {Circle} from "react-konva";

const PointRenderer: React.FC<{
    entityId: string; shapeId: string;
    shape: PointShape;
    isSelected: boolean;
    color: string;
}> = memo(({shape, isSelected, color, entityId, shapeId}) => {
    const {handleShapeClick} = useShapeInteractions();

    const radius = (shape.style?.radius || 3) * (isSelected ? 1.5 : 1);
    const fillColor = shape.style?.fillColor || color;
    const strokeColor = shape.style?.strokeColor || '#ffffff';

    return (
        <Circle
            x={shape.point.x}
            y={shape.point.y}
            radius={radius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={1}
            onClick={() => handleShapeClick(entityId, shapeId)}
            hitStrokeWidth={10}
        />
    );
});

export default PointRenderer
