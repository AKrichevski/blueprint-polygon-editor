import React, { memo, useMemo, useRef, useCallback } from "react";
import type { PolygonShape } from "../../../../../types";
import { useEditor } from "../../../../../contexts/editor";
import { useShapeInteractions } from "../../../hooks";
import { Circle, Group, Line } from "react-konva";
import { canvas, colors } from "../../../../../styles/theme";
import { ShapeMetrics } from "../ShapeMetrics";

interface PolygonRendererProps {
    shapeId: string;
    shape: PolygonShape;
    isSelected: boolean;
    color: string;
    showMetrics: boolean;
    entityId: string;
}

const PolygonRenderer: React.FC<PolygonRendererProps> = ({
                                                             shapeId,
                                                             shape,
                                                             isSelected,
                                                             color,
                                                             showMetrics,
                                                             entityId
                                                         }) => {
    const { mode, selectedPointIndex, position, scale, dispatch } = useEditor();
    const shapeGroupRef = useRef<any>(null);
    const edgeDragStartRef = useRef<{ startIndex: number; endIndex: number; startOffset: { x: number; y: number } } | null>(null);

    const {
        handlePointClick,
        handlePointDrag,
        handlePointDragStart,
        handlePointDragEnd,
        handleLineClick,
        handleShapeClick,
        handleShapeDragEnd
    } = useShapeInteractions();

    const strokeColor = useMemo(
        () => shape.style?.strokeColor ?? color,
        [shape.style?.strokeColor, color]
    );

    const strokeWidth = useMemo(
        () => (shape.style?.strokeWidth ?? 1) * (isSelected ? 1.5 : 1),
        [shape.style?.strokeWidth, isSelected]
    );

    const fillColor = useMemo(
        () => shape.style?.fillColor ?? `${color}${colors.alpha[20]}`,
        [shape.style?.fillColor, color]
    );

    const flatPoints = useMemo(() => {
        return shape.points.flatMap(p => [p.x, p.y]);
    }, [shape.points]);

    const stageToWorld = useCallback((stageX: number, stageY: number) => {
        return {
            x: (stageX - position.x) / scale,
            y: (stageY - position.y) / scale
        };
    }, [position, scale]);

    const handleEdgeDragStart = useCallback(
        (startIndex: number, endIndex: number) => (e: any) => {
            e.cancelBubble = true;
            e.evt.stopPropagation();
            if (shapeGroupRef.current) {
                shapeGroupRef.current.position({ x: 0, y: 0 });
            }
            const stage = e.target.getStage();
            if (!stage) return;
            const pointerPos = stage.getPointerPosition();
            if (!pointerPos) return;
            const worldPos = stageToWorld(pointerPos.x, pointerPos.y);
            const startPoint = shape.points[startIndex];
            edgeDragStartRef.current = {
                startIndex,
                endIndex,
                startOffset: {
                    x: worldPos.x - startPoint.x,
                    y: worldPos.y - startPoint.y
                }
            };
        },
        [shape.points, stageToWorld]
    );

    const handleEdgeDragMove = useCallback((e: any) => {
        if (!edgeDragStartRef.current) return;
        e.cancelBubble = true;
        e.evt.stopPropagation();
        const stage = e.target.getStage();
        if (!stage) return;
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;
        const worldPos = stageToWorld(pointerPos.x, pointerPos.y);
        const { startIndex, endIndex, startOffset } = edgeDragStartRef.current!;

        const newStartPoint = {
            x: worldPos.x - startOffset.x,
            y: worldPos.y - startOffset.y
        };

        const originalStartPoint = shape.points[startIndex];
        const offset = {
            x: newStartPoint.x - originalStartPoint.x,
            y: newStartPoint.y - originalStartPoint.y
        };

        const newPoints = [...shape.points];
        newPoints[startIndex] = newStartPoint;
        newPoints[endIndex] = {
            x: shape.points[endIndex].x + offset.x,
            y: shape.points[endIndex].y + offset.y
        };

        const polygonLine = e.target.getParent().findOne('Line');
        if (polygonLine) {
            polygonLine.setAttrs({ points: newPoints.flatMap(p => [p.x, p.y]) });
        }

        const group = e.target.getParent();
        group.find('Circle').forEach((circle: any, idx: number) => {
            if (idx < newPoints.length) {
                circle.setAttrs({ x: newPoints[idx].x, y: newPoints[idx].y });
            }
        });

        const layer = e.target.getLayer();
        if (layer) layer.batchDraw();
    }, [shape.points, stageToWorld]);

    const handleEdgeDragEnd = useCallback((e: any) => {
        if (!edgeDragStartRef.current) return;
        e.cancelBubble = true;
        e.evt.stopPropagation();
        const stage = e.target.getStage();
        if (!stage) return;
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;
        const worldPos = stageToWorld(pointerPos.x, pointerPos.y);
        const { startIndex, endIndex, startOffset } = edgeDragStartRef.current;

        const newStart = {
            x: Math.round((worldPos.x - startOffset.x) * 100) / 100,
            y: Math.round((worldPos.y - startOffset.y) * 100) / 100
        };
        const originalStart = shape.points[startIndex];
        const offset = { x: newStart.x - originalStart.x, y: newStart.y - originalStart.y };

        if (Math.abs(offset.x) > 0.01 || Math.abs(offset.y) > 0.01) {
            const originalEnd = shape.points[endIndex];
            const newEnd = {
                x: Math.round((originalEnd.x + offset.x) * 100) / 100,
                y: Math.round((originalEnd.y + offset.y) * 100) / 100
            };
            dispatch({
                type: 'MOVE_EDGE',
                payload: { entityId, shapeId, startIndex, endIndex, newStartPosition: newStart, newEndPosition: newEnd }
            });
        }

        if (shapeGroupRef.current) {
            shapeGroupRef.current.position({ x: 0, y: 0 });
        }
        // Reset this edge line’s own transform
        e.target.position({ x: 0, y: 0 });
        const layer = e.target.getLayer();
        if (layer) layer.batchDraw();

        edgeDragStartRef.current = null;
    }, [entityId, shapeId, shape.points, stageToWorld, dispatch]);

    const handleShapeDragEndCustom = useCallback((e: any) => {
        const group = e.target;
        const x = group.x();
        const y = group.y();
        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
            handleShapeDragEnd(entityId, shapeId, e);
            group.position({ x: 0, y: 0 });
        }
    }, [entityId, shapeId, handleShapeDragEnd]);

    const handleShapeDragStartCustom = useCallback((e: any) => {
        e.target.position({ x: 0, y: 0 });
    }, []);

    const handlePointDragStartCustom = useCallback((idx: number) => (e: any) => {
        e.cancelBubble = true;
        e.evt.stopPropagation();
        if (shapeGroupRef.current) shapeGroupRef.current.position({ x: 0, y: 0 });
        handlePointDragStart(entityId, shape.id, idx, e);
    }, [entityId, shape.id, handlePointDragStart]);

    const handlePointDragCustom = useCallback((idx: number) => (e: any) => {
        e.cancelBubble = true;
        e.evt.stopPropagation();
        handlePointDrag(entityId, shape.id, idx, e);
    }, [entityId, shape.id, handlePointDrag]);

    const handlePointDragEndCustom = useCallback((idx: number) => (e: any) => {
        e.cancelBubble = true;
        e.evt.stopPropagation();
        if (shapeGroupRef.current) shapeGroupRef.current.position({ x: 0, y: 0 });
        handlePointDragEnd(entityId, shape.id, idx, e);
    }, [entityId, shape.id, handlePointDragEnd]);

    const controlPoints = useMemo(() => {
        if (!isSelected) return null;
        return shape.points.map((pt, i) => {
            const selected = i === selectedPointIndex;
            return (
                <Circle
                    key={`point-${i}-${pt.x}-${pt.y}`}
                    x={pt.x}
                    y={pt.y}
                    radius={selected ? canvas.selectedPointRadius : canvas.pointRadius}
                    fill={selected ? colors.danger[500] : color}
                    stroke="#fff"
                    strokeWidth={0.5}
                    draggable={mode === "select"}
                    onClick={() => handlePointClick(entityId, shape.id, i)}
                    onDragStart={handlePointDragStartCustom(i)}
                    onDragMove={handlePointDragCustom(i)}
                    onDragEnd={handlePointDragEndCustom(i)}
                    perfectDrawEnabled={false}
                    listening
                />
            );
        });
    }, [isSelected, shape.points, selectedPointIndex, mode, entityId, color, handlePointClick, handlePointDragStartCustom, handlePointDragCustom, handlePointDragEndCustom]);

    const draggableEdges = useMemo(() => {
        if (!isSelected || mode !== "select") return null;
        return shape.points.map((pt, i) => {
            const nextIdx = (i + 1) % shape.points.length;
            const next = shape.points[nextIdx];
            return (
                <Line
                    key={`edge-${i}`}
                    x={0}
                    y={0}
                    points={[pt.x, pt.y, next.x, next.y]}
                    stroke="transparent"
                    strokeWidth={12}
                    draggable
                    onDragStart={handleEdgeDragStart(i, nextIdx)}
                    onDragMove={handleEdgeDragMove}
                    onDragEnd={handleEdgeDragEnd}
                    perfectDrawEnabled={false}
                    listening
                />
            );
        });
    }, [isSelected, mode, shape.points, handleEdgeDragStart, handleEdgeDragMove, handleEdgeDragEnd]);

    const addPointLines = useMemo(() => {
        if (mode !== "add_point") return null;
        return shape.points.map((pt, i) => {
            const nextPt = shape.points[(i + 1) % shape.points.length];
            return (
                <Line
                    key={`add-line-${i}`}
                    points={[pt.x, pt.y, nextPt.x, nextPt.y]}
                    stroke="transparent"
                    strokeWidth={canvas.clickableLineWidth}
                    onClick={e => handleLineClick(entityId, shape.id, i, e)}
                    perfectDrawEnabled={false}
                    listening
                />
            );
        });
    }, [mode, shape.points, shape.id, entityId, handleLineClick]);

    const metrics = useMemo(() => {
        if (!showMetrics || !isSelected) return null;
        return <ShapeMetrics shape={shape} />;
    }, [showMetrics, isSelected, shape]);

    const isGroupDraggable = mode === "select" && isSelected;

    return (
        <Group
            ref={shapeGroupRef}
            draggable={isGroupDraggable}
            onDragStart={handleShapeDragStartCustom}
            onDragEnd={handleShapeDragEndCustom}
        >
            <Line
                points={flatPoints}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={fillColor}
                closed
                onClick={() => handleShapeClick(entityId, shapeId)}
                listening={mode !== "add_polygon"}
                hitStrokeWidth={8}
                perfectDrawEnabled={false}
            />

            {draggableEdges}
            {controlPoints}
            {addPointLines}
            {metrics}
        </Group>
    );
};

function arePropsEqual(prev: PolygonRendererProps, next: PolygonRendererProps) {
    return (
        prev.shape === next.shape &&
        prev.isSelected === next.isSelected &&
        prev.color === next.color &&
        prev.showMetrics === next.showMetrics &&
        prev.entityId === next.entityId &&
        prev.shapeId === next.shapeId
    );
}

export default memo(PolygonRenderer, arePropsEqual);
