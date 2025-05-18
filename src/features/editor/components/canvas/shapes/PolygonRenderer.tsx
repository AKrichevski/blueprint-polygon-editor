import React, { memo, useMemo } from "react";
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
    const { mode, selectedPointIndex } = useEditor();

    const {
        handlePointClick,
        handlePointDrag,
        handlePointDragStart,
        handlePointDragEnd,
        handleLineClick,
        handleShapeClick,
    } = useShapeInteractions();

    // Memoize stroke/fill to avoid inline calculations on each render
    const strokeColor = useMemo(() =>
            shape.style?.strokeColor ?? color,
        [shape.style?.strokeColor, color]
    );

    const strokeWidth = useMemo(() =>
            (shape.style?.strokeWidth ?? 1) * (isSelected ? 1.5 : 1),
        [shape.style?.strokeWidth, isSelected]
    );

    const fillColor = useMemo(() =>
            shape.style?.fillColor ?? `${color}${colors.alpha[20]}`,
        [shape.style?.fillColor, color]
    );

    // Memoize flat point array for Konva
    const flatPoints = useMemo(() => {
        const pts = shape.points;
        const arr: number[] = new Array(pts.length * 2);
        for (let i = 0; i < pts.length; i++) {
            arr[i * 2] = pts[i].x;
            arr[i * 2 + 1] = pts[i].y;
        }
        return arr;
    }, [shape.points]);

    // Memoize control points rendering
    const controlPoints = useMemo(() => {
        if (!isSelected) return null;

        return shape.points.map((point, i) => {
            const selected = i === selectedPointIndex;
            return (
                <Circle
                    key={i}
                    x={point.x}
                    y={point.y}
                    radius={selected ? canvas.selectedPointRadius : canvas.pointRadius}
                    fill={selected ? colors.danger[500] : color}
                    stroke="#fff"
                    strokeWidth={0.5}
                    draggable={mode === "select"}
                    onClick={() => handlePointClick(entityId, shape.id, i)}
                    onDragStart={(e) => handlePointDragStart(entityId, shape.id, i, e)}
                    onDragMove={(e) => handlePointDrag(entityId, shape.id, i, e)}
                    onDragEnd={(e) => handlePointDragEnd(entityId, shape.id, i, e)}
                    perfectDrawEnabled={false} // Performance optimization
                />
            );
        });
    }, [
        isSelected,
        shape.points,
        shape.id,
        selectedPointIndex,
        mode,
        entityId,
        color,
        handlePointClick,
        handlePointDrag,
        handlePointDragStart,
        handlePointDragEnd
    ]);

    // Memoize transparent line segments for adding points
    const addPointLines = useMemo(() => {
        if (mode !== "add_point") return null;

        return shape.points.map((point, i) => {
            const next = shape.points[(i + 1) % shape.points.length];
            return (
                <Line
                    key={`add-line-${i}`}
                    points={[point.x, point.y, next.x, next.y]}
                    stroke="transparent"
                    strokeWidth={canvas.clickableLineWidth}
                    onClick={(e) => handleLineClick(entityId, shape.id, i, e)}
                    perfectDrawEnabled={false} // Performance optimization
                />
            );
        });
    }, [mode, shape.points, shape.id, entityId, handleLineClick]);

    // Render metrics only when needed
    const metrics = useMemo(() => {
        if (!showMetrics || !isSelected) return null;
        return <ShapeMetrics shape={shape} />;
    }, [showMetrics, isSelected, shape]);

    return (
        <Group>
            {/* Polygon outline */}
            <Line
                points={flatPoints}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={fillColor}
                closed
                onClick={() => handleShapeClick(entityId, shapeId)}
                listening={mode !== "add_polygon"}
                hitStrokeWidth={8}
                perfectDrawEnabled={false} // Performance optimization
                // Store custom data for event handlers
                attrs={{
                    entityId,
                    shapeId,
                    type: 'polygon'
                }}
            />

            {/* Control points */}
            {controlPoints}

            {/* Transparent lines for adding points */}
            {addPointLines}

            {/* Metrics display */}
            {metrics}
        </Group>
    );
};

// Custom comparison function
function arePropsEqual(prevProps: PolygonRendererProps, nextProps: PolygonRendererProps) {
    return (
        prevProps.shape === nextProps.shape &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.color === nextProps.color &&
        prevProps.showMetrics === nextProps.showMetrics &&
        prevProps.entityId === nextProps.entityId &&
        prevProps.shapeId === nextProps.shapeId
    );
}

export default memo(PolygonRenderer, arePropsEqual);
