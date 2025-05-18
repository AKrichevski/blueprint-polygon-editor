import React, { memo, useMemo } from "react";
import type { LineShape } from "../../../../../types";
import { useEditor } from "../../../../../contexts/editor";
import { useShapeInteractions } from "../../../hooks";
import { Circle, Group, Line } from "react-konva";
import { canvas, colors } from "../../../../../styles/theme";

interface LineRendererProps {
    shapeId: string;
    shape: LineShape;
    isSelected: boolean;
    color: string;
    entityId: string;
}

const LineRenderer: React.FC<LineRendererProps> = memo(({
                                                            shapeId,
                                                            shape,
                                                            isSelected,
                                                            color,
                                                            entityId,
                                                        }) => {
    const { mode, selectedPointIndex } = useEditor();
    const {
        handlePointClick,
        handlePointDragEnd,
        handlePointDrag,
        handlePointDragStart,
        handleShapeClick
    } = useShapeInteractions();

    // Memoize line properties
    const strokeColor = useMemo(() =>
            shape.style?.strokeColor || color,
        [shape.style?.strokeColor, color]
    );

    const strokeWidth = useMemo(() =>
            (shape.style?.strokeWidth || 1) * (isSelected ? 1.5 : 1),
        [shape.style?.strokeWidth, isSelected]
    );

    const dashPattern = useMemo(() =>
            shape.style?.dashPattern,
        [shape.style?.dashPattern]
    );

    // Memoize flat points array for Konva
    const points = useMemo(() =>
            shape.points.flatMap(p => [p.x, p.y]),
        [shape.points]
    );

    // Memoize endpoints rendering for selected state
    const endpoints = useMemo(() => {
        if (!isSelected) return null;

        return shape.points.map((point, index) => (
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
                perfectDrawEnabled={false} // Performance optimization
            />
        ));
    }, [
        isSelected,
        shape.points,
        shape.id,
        selectedPointIndex,
        mode,
        color,
        entityId,
        handlePointClick,
        handlePointDrag,
        handlePointDragStart,
        handlePointDragEnd
    ]);

    return (
        <Group>
            <Line
                points={points}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                dash={dashPattern}
                onClick={() => handleShapeClick(entityId, shapeId)}
                hitStrokeWidth={10}
                perfectDrawEnabled={false} // Performance optimization
                attrs={{
                    entityId,
                    shapeId,
                    type: 'line'
                }}
            />

            {/* Render endpoints when selected */}
            {endpoints}
        </Group>
    );
});

// Custom equality function for props comparison
function arePropsEqual(prev: LineRendererProps, next: LineRendererProps) {
    return (
        prev.shape === next.shape &&
        prev.isSelected === next.isSelected &&
        prev.color === next.color &&
        prev.entityId === next.entityId &&
        prev.shapeId === next.shapeId
    );
}

export default memo(LineRenderer, arePropsEqual);
