import React, {memo} from "react";
import type {ArcShape} from "../../../../../types";
import {useShapeInteractions} from "../../../hooks";
import {Arc} from "react-konva";

const ArcRenderer: React.FC<{
    entityId: string;
    shapeId: string;
    shape: ArcShape;
    isSelected: boolean;
    color: string;
}> = memo(({shape, isSelected, color, entityId, shapeId}) => {
    const {handleShapeClick} = useShapeInteractions();

    const strokeColor = shape.style?.strokeColor || color;
    const strokeWidth = (shape.style?.strokeWidth || 1) * (isSelected ? 1.5 : 1);
    const fillColor = shape.style?.fillColor;

    // Convert angles from degrees to radians for Konva
    const startAngle = (shape.startAngle * Math.PI) / 180;
    const endAngle = (shape.endAngle * Math.PI) / 180;
    const angle = endAngle - startAngle;

    return (
        <Arc
            x={shape.center.x}
            y={shape.center.y}
            innerRadius={0}
            outerRadius={shape.radius}
            angle={angle}
            rotation={shape.startAngle}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            onClick={() => handleShapeClick(entityId, shapeId)}
            hitStrokeWidth={10}
        />
    );
});

export default ArcRenderer
