import React, {memo, useCallback} from "react";
import type {CircleShape} from "../../../../../types";
import {useShapeInteractions} from "../../../hooks";
import {Circle, Group} from "react-konva";
import { useEditor } from "../../../../../contexts/editor";

const CircleRenderer: React.FC<{
    entityId: string;
    shapeId: string;
    shape: CircleShape;
    isSelected: boolean;
    color: string;
}> = memo(({shape, isSelected, color, entityId, shapeId}) => {
    const { mode, selectedPointIndex } = useEditor();
    const {
        handleShapeClick,
        handleShapeDragEnd
    } = useShapeInteractions();

    const strokeColor = shape.style?.strokeColor || color;
    const strokeWidth = (shape.style?.strokeWidth || 1) * (isSelected ? 1.5 : 1);
    const fillColor = shape.style?.fillColor;

    // Handle shape drag end to save position changes
    const handleShapeDragEndCustom = useCallback((e: any) => {
        const group = e.target;
        const x = group.x();
        const y = group.y();

        // Only save if there was actual movement
        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
            // Save the offset and reset group position
            handleShapeDragEnd(entityId, shapeId, e);

            // Reset group position to 0,0 since we update the actual shape coordinates
            group.position({ x: 0, y: 0 });
        }
    }, [entityId, shapeId, handleShapeDragEnd]);

    // Determine if the group should be draggable
    const isGroupDraggable = mode === "select" && isSelected && selectedPointIndex === null;

    return (
        <Group
            draggable={isGroupDraggable}
            onDragEnd={handleShapeDragEndCustom}
        >
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
        </Group>
    );
});

export default CircleRenderer;
