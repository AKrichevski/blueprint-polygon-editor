import React, {memo, useMemo} from "react";
import type {LineShape} from "../../../../../types";
import {useEditor} from "../../../../../contexts/editor";
import {useShapeInteractions} from "../../../hooks";
import {Circle, Group, Line} from "react-konva";
import {canvas, colors} from "../../../../../styles/theme.ts";

const LineRenderer: React.FC<{
    shapeId: string;
    shape: LineShape;
    isSelected: boolean;
    color: string;
    entityId: string;
}> = memo(({
               shapeId,
               shape,
               isSelected,
               color,
               entityId,
           }) => {
    const { mode, selectedPointIndex } = useEditor();
    const {handlePointClick, handlePointDragEnd, handlePointDrag, handlePointDragStart, handleShapeClick} = useShapeInteractions();

    const strokeColor = shape.style?.strokeColor || color;
    const strokeWidth = (shape.style?.strokeWidth || 1) * (isSelected ? 1.5 : 1);
    const dashPattern = shape.style?.dashPattern;

    const points = useMemo(() =>
            shape.points.flatMap(p => [p.x, p.y]),
        [shape.points]
    );

    return (
        <Group>
            <Line
                points={points}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                dash={dashPattern}
                onClick={() => handleShapeClick(entityId, shapeId)}
                hitStrokeWidth={10}
            />

            {/* Render endpoints when selected */}
            {isSelected && shape.points.map((point, index) => (
                <Circle
                    key={`endpoint-${index}`}
                    x={point.x}
                    y={point.y}
                    radius={selectedPointIndex === index ? canvas.selectedPointRadius : canvas.pointRadius}
                    fill={selectedPointIndex === index ? colors.danger[500] : color}
                    stroke="#ffffff"
                    strokeWidth={1}
                    draggable={mode === 'select'}
                    onClick={() => handlePointClick(entityId, shape.id, index)}
                    onDragStart={(e) => handlePointDragStart(entityId, shape.id, index, e)}
                    onDragMove={(e) => handlePointDrag(entityId, shape.id, index, e)}
                    onDragEnd={(e) => handlePointDragEnd(entityId, shape.id, index, e)}
                />
            ))}
        </Group>
    );
});

export default LineRenderer
