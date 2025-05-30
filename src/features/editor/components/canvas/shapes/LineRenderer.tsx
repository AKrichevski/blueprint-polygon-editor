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
    const { mode, selectedPointIndex } = useEditor();
    const shapeGroupRef = useRef<any>(null);

    const {
        handlePointClick,
        handlePointDragStart,
        handlePointDrag,
        handlePointDragEnd,
        handleShapeClick,
        handleShapeDragEnd
    } = useShapeInteractions();

    // ---- memoized style + geometry ----
    const strokeColor = useMemo(
        () => shape.style?.strokeColor || color,
        [shape.style?.strokeColor, color]
    );
    const strokeWidth = useMemo(
        () => ((shape.style?.strokeWidth || 1) * (isSelected ? 1.5 : 1)),
        [shape.style?.strokeWidth, isSelected]
    );
    const dashPattern = useMemo(
        () => shape.style?.dashPattern,
        [shape.style?.dashPattern]
    );
    const points = useMemo(
        () => shape.points.flatMap(p => [p.x, p.y]),
        [shape.points]
    );

    // ---- helper to reset the Group origin ----
    const resetGroupOrigin = useCallback(() => {
        if (shapeGroupRef.current) {
            shapeGroupRef.current.position({ x: 0, y: 0 });
        }
    }, []);

    // ---- point‐drag handlers ----
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

    // ---- shape‐drag end handler (unchanged) ----
    const handleShapeDragEndCustom = useCallback((e: any) => {
        const grp = e.target;
        const x = grp.x(), y = grp.y();
        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
            handleShapeDragEnd(entityId, shapeId, e);
            grp.position({ x: 0, y: 0 });
        }
    }, [entityId, shapeId, handleShapeDragEnd]);

    // ---- render the draggable endpoints when selected ----
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
            {/* main line, pinned at origin */}
            <Line
                x={0}
                y={0}
                points={points}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                dash={dashPattern}
                onClick={() => handleShapeClick(entityId, shapeId)}
                hitStrokeWidth={10}
                perfectDrawEnabled={false}
            />

            {/* endpoints */}
            {endpoints}
        </Group>
    );
}, arePropsEqual);

// same shallow compare as before
function arePropsEqual(a: LineRendererProps, b: LineRendererProps) {
    return (
        a.shape === b.shape &&
        a.isSelected === b.isSelected &&
        a.color === b.color &&
        a.entityId === b.entityId &&
        a.shapeId === b.shapeId
    );
}

export default LineRenderer;
