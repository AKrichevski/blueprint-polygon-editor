// src/features/editor/components/canvas/shapes/CircleRenderer.tsx
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
    const { mode, selectedPointIndex, selectedShapeIds } = useEditor();
    const {
        handleShapeClick,
        handleShapeRightClick, // NEW: Right-click handler
        handleShapeDragEnd
    } = useShapeInteractions();

    // Enhanced styling for multi-selection
    const strokeColor = selectedShapeIds.size > 1 && selectedShapeIds.has(shapeId)
        ? '#ff6b35'
        : shape.style?.strokeColor || color;

    const strokeWidth = (() => {
        const baseWidth = shape.style?.strokeWidth || 1;
        if (selectedShapeIds.size > 1 && selectedShapeIds.has(shapeId)) {
            return baseWidth * 2; // Thicker for multi-selection
        }
        return baseWidth * (isSelected ? 1.5 : 1);
    })();

    const fillColor = selectedShapeIds.size > 1 && selectedShapeIds.has(shapeId)
        ? '#ff6b3520'
        : shape.style?.fillColor;

    // Handle shape drag end to save position changes
    const handleShapeDragEndCustom = useCallback((e: any) => {
        const group = e.target;
        const x = group.x();
        const y = group.y();

        // Only save if there was actual movement
        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
            handleShapeDragEnd(entityId, shapeId, e);
            group.position({ x: 0, y: 0 });
        }
    }, [entityId, shapeId, handleShapeDragEnd]);

    // Handle clicks with multi-select support
    const handleShapeClickCustom = useCallback((e: any) => {
        e.cancelBubble = true;
        e.evt.stopPropagation();
        handleShapeClick(entityId, shapeId, e);
    }, [entityId, shapeId, handleShapeClick]);

    // Handle right-click context menu
    const handleShapeRightClickCustom = useCallback((e: any) => {
        e.cancelBubble = true;
        e.evt.stopPropagation();
        // Important: Don't call handleShapeClick here!
        // Just handle the right-click directly
        handleShapeRightClick(entityId, shapeId, e);
    }, [entityId, shapeId, handleShapeRightClick]);

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
                onClick={handleShapeClickCustom}
                onContextMenu={handleShapeRightClickCustom} // NEW: Right-click handler
                hitStrokeWidth={10}
            />

            {/* Multi-selection indicator */}
            {selectedShapeIds.size > 1 && selectedShapeIds.has(shapeId) && (
                <Circle
                    x={shape.center.x}
                    y={shape.center.y}
                    radius={shape.radius + 3}
                    fill="transparent"
                    stroke="#ff6b35"
                    strokeWidth={2}
                    dash={[5, 5]}
                    listening={false}
                    opacity={0.8}
                />
            )}
        </Group>
    );
});

export default CircleRenderer;
