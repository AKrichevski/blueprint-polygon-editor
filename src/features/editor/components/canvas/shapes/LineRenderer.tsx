// src/features/editor/components/canvas/shapes/LineRenderer.tsx
import React, { memo, useMemo, useRef, useCallback } from "react";
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
    const { mode, selectedPointIndex, selectedShapeIds } = useEditor();
    const shapeGroupRef = useRef<any>(null);

    const {
        handlePointClick,
        handlePointDragStart,
        handlePointDrag,
        handlePointDragEnd,
        handleShapeClick,
        handleShapeRightClick, // NEW: Right-click handler
        handleShapeDragEnd
    } = useShapeInteractions();

    // Enhanced styling for multi-selection
    const strokeColor = useMemo(() => {
        if (selectedShapeIds.size > 1 && selectedShapeIds.has(shapeId)) {
            return '#ff6b35'; // Orange for multi-selection
        }
        return shape.style?.strokeColor || color;
    }, [shape.style?.strokeColor, color, selectedShapeIds, shapeId]);

    const strokeWidth = useMemo(() => {
        const baseWidth = shape.style?.strokeWidth || 1;
        if (selectedShapeIds.size > 1 && selectedShapeIds.has(shapeId)) {
            return baseWidth * 2; // Thicker for multi-selection
        }
        return baseWidth * (isSelected ? 1.5 : 1);
    }, [shape.style?.strokeWidth, isSelected, selectedShapeIds, shapeId]);

    const dashPattern = useMemo(
        () => shape.style?.dashPattern,
        [shape.style?.dashPattern]
    );

    const points = useMemo(
        () => shape.points.flatMap(p => [p.x, p.y]),
        [shape.points]
    );

    // Helper to reset the Group origin
    const resetGroupOrigin = useCallback(() => {
        if (shapeGroupRef.current) {
            shapeGroupRef.current.position({ x: 0, y: 0 });
        }
    }, []);

    // Point-drag handlers
    const handlePointDragStartCustom = useCallback((i: number) => (e: any) => {
        e.cancelBubble = true;
        e.evt.stopPropagation();
        resetGroupOrigin();
        handlePointDragStart(entityId, shapeId, i, e);
    }, [entityId, shapeId, handlePointDragStart, resetGroupOrigin]);

    const handlePointDragCustom = useCallback((i: number) => (e: any) => {
        e.cancelBubble = true;
        e.evt.stopPropagation();
        handlePointDrag(entityId, shapeId, i, e);
    }, [entityId, shapeId, handlePointDrag]);

    const handlePointDragEndCustom = useCallback((i: number) => (e: any) => {
        e.cancelBubble = true;
        e.evt.stopPropagation();
        resetGroupOrigin();
        handlePointDragEnd(entityId, shapeId, i, e);
    }, [entityId, shapeId, handlePointDragEnd, resetGroupOrigin]);

    // Shape-drag end handler
    const handleShapeDragEndCustom = useCallback((e: any) => {
        const grp = e.target;
        const x = grp.x(), y = grp.y();
        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
            handleShapeDragEnd(entityId, shapeId, e);
            grp.position({ x: 0, y: 0 });
        }
    }, [entityId, shapeId, handleShapeDragEnd]);

    // Handle clicks with multi-select support
    const handleShapeClickCustom = useCallback((e: any) => {
        if (e.evt?.button === 2) {
            return;
        }
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

    // Render the draggable endpoints when selected
    const endpoints = useMemo(() => {
        if (!isSelected) return null;
        return shape.points.map((pt, i) => (
            <Circle
                key={`endpoint-${i}-${pt.x}-${pt.y}`}
                x={pt.x}
                y={pt.y}
                radius={ selectedPointIndex === i
                    ? canvas.selectedPointRadius
                    : canvas.pointRadius
                }
                fill={ selectedPointIndex === i
                    ? colors.danger[500]
                    : color
                }
                stroke="#fff"
                strokeWidth={1}
                draggable={mode === "select" && selectedPointIndex !== null}
                onClick={() => handlePointClick(entityId, shapeId, i)}
                onDragStart={handlePointDragStartCustom(i)}
                onDragMove={handlePointDragCustom(i)}
                onDragEnd={handlePointDragEndCustom(i)}
                perfectDrawEnabled={false}
                listening={true}
            />
        ));
    }, [
        isSelected, shape.points, selectedPointIndex,
        mode, color, entityId, shapeId,
        handlePointClick,
        handlePointDragStartCustom,
        handlePointDragCustom,
        handlePointDragEndCustom
    ]);

    const isGroupDraggable = mode === "select" && isSelected;

    return (
        <Group
            ref={shapeGroupRef}
            draggable={isGroupDraggable}
            onDragStart={resetGroupOrigin}
            onDragEnd={handleShapeDragEndCustom}
        >
            {/* Main line */}
            <Line
                x={0}
                y={0}
                points={points}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                dash={dashPattern}
                onClick={handleShapeClickCustom}
                onContextMenu={handleShapeRightClickCustom} // NEW: Right-click handler
                hitStrokeWidth={10}
                perfectDrawEnabled={false}
            />

            {/* Multi-selection indicator */}
            {selectedShapeIds.size > 1 && selectedShapeIds.has(shapeId) && (
                <Line
                    x={0}
                    y={0}
                    points={points}
                    stroke="#ff6b35"
                    strokeWidth={3}
                    dash={[5, 5]}
                    listening={false}
                    perfectDrawEnabled={false}
                    opacity={0.8}
                />
            )}

            {/* Endpoints */}
            {endpoints}
        </Group>
    );
});

function arePropsEqual(a: LineRendererProps, b: LineRendererProps) {
    return (
        a.shape === b.shape &&
        a.isSelected === b.isSelected &&
        a.color === b.color &&
        a.entityId === b.entityId &&
        a.shapeId === b.shapeId
    );
}

export default memo(LineRenderer, arePropsEqual);
