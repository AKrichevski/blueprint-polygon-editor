import React, {memo, useCallback} from "react";
import type {TextShape} from "../../../../../types";
import {useShapeInteractions} from "../../../hooks";
import {Text, Group} from "react-konva";
import {colors} from "../../../../../styles/theme.ts";
import { useEditor } from "../../../../../contexts/editor";

const TextRenderer: React.FC<{
    entityId: string;
    shapeId: string;
    shape: TextShape;
    isSelected: boolean;
    color: string;
}> = memo(({shape, isSelected, color, entityId, shapeId}) => {
    const { mode, selectedPointIndex } = useEditor();
    const {
        handleShapeClick,
        handleShapeDragEnd
    } = useShapeInteractions();

    const fontSize = shape.style?.fontSize || 12;
    const fontFamily = shape.style?.fontFamily || 'Arial';
    const textColor = shape.style?.color || color;
    const align = shape.style?.align || 'left';
    const rotation = shape.style?.rotation || 0;

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
            <Text
                x={shape.position.x}
                y={shape.position.y}
                text={shape.text}
                fontSize={fontSize}
                fontFamily={fontFamily}
                fill={textColor}
                align={align}
                rotation={rotation}
                stroke={isSelected ? colors.state.selected : undefined}
                strokeWidth={isSelected ? 1 : 0}
                onClick={()=> handleShapeClick(entityId, shapeId)}
                hitStrokeWidth={10}
            />
        </Group>
    );
});

export default TextRenderer;
