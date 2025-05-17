import React, {memo} from "react";
import type {CircleShape} from "../../../../../types";
import {useShapeInteractions} from "../../../hooks";
import {Circle} from "react-konva";

const CircleRenderer: React.FC<{
    entityId: string;
    shapeId: string;
    shape: CircleShape;
    isSelected: boolean;
    color: string;
}> = memo(({shape, isSelected, color, entityId, shapeId}) => {
    const {handleShapeClick} = useShapeInteractions();

    const strokeColor = shape.style?.strokeColor || color;
    const strokeWidth = (shape.style?.strokeWidth || 1) * (isSelected ? 1.5 : 1);
    const fillColor = shape.style?.fillColor;

    return (
        <Circle
            x={shape.center.x}
            y={shape.center.y}
            radius={shape.radius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            onClick={() => handleShapeClick(entityId, shapeId)}
            hitStrokeWidth={10}
        />
    );
});

export default CircleRenderer;
