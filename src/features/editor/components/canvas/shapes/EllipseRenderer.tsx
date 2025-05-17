import React, {memo} from "react";
import type {EllipseShape} from "../../../../../types";
import {useShapeInteractions} from "../../../hooks";
import {Ellipse} from "react-konva";

const EllipseRenderer: React.FC<{
    entityId: string;
    shapeId: string;
    shape: EllipseShape;
    isSelected: boolean;
    color: string;
}> = memo(({shape, isSelected, color, entityId, shapeId}) => {
    const {handleShapeClick} = useShapeInteractions();

    const strokeColor = shape.style?.strokeColor || color;
    const strokeWidth = (shape.style?.strokeWidth || 1) * (isSelected ? 1.5 : 1);
    const fillColor = shape.style?.fillColor;

    return (
        <Ellipse
            x={shape.center.x}
            y={shape.center.y}
            radiusX={shape.radiusX}
            radiusY={shape.radiusY}
            rotation={shape.rotation || 0}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            onClick={() => handleShapeClick(entityId, shapeId)}
            hitStrokeWidth={10}
        />
    );
});

export default EllipseRenderer;
