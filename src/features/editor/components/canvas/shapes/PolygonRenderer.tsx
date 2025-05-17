import React, { memo, useMemo } from "react";
import type { PolygonShape } from "../../../../../types";
import { useEditor } from "../../../../../contexts/editor";
import { useShapeInteractions } from "../../../hooks";
import { Circle, Group, Line } from "react-konva";
import { canvas, colors } from "../../../../../styles/theme.ts";
import { ShapeMetrics } from "../ShapeMetrics.tsx";

const PolygonRenderer: React.FC<{
    shapeId: string;
    shape: PolygonShape;
    isSelected: boolean;
    color: string;
    showMetrics: boolean;
    entityId: string;
}> = memo(
    ({ shapeId, shape, isSelected, color, showMetrics, entityId }) => {
        const { mode, selectedPointIndex } = useEditor();
        // console.count("PolygonRenderer")
        const {
            handlePointClick,
            handlePointDrag,
            handlePointDragStart,
            handlePointDragEnd,
            handleLineClick,
            handleShapeClick,
        } = useShapeInteractions();

        // Memoize stroke/fill to avoid inline calculations on each render
        const strokeColor = shape.style?.strokeColor ?? color;
        const strokeWidth = useMemo(
            () => (shape.style?.strokeWidth ?? 1) * (isSelected ? 1.5 : 1),
            [shape.style?.strokeWidth, isSelected]
        );
        const fillColor = useMemo(
            () => shape.style?.fillColor ?? `${color}${colors.alpha[20]}`,
            [shape.style?.fillColor, color]
        );

        // Memoize flat point array
        const flatPoints = useMemo(() => {
            const pts = shape.points;
            const arr: number[] = new Array((pts.length + 1) * 2);
            for (let i = 0; i < pts.length; i++) {
                arr[i * 2] = pts[i].x;
                arr[i * 2 + 1] = pts[i].y;
            }
            // Close the shape
            arr[pts.length * 2] = pts[0].x;
            arr[pts.length * 2 + 1] = pts[0].y;
            return arr;
        }, [shape.points]);

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
                />

                {/* Control points */}
                {isSelected &&
                    shape.points.map((point, i) => {
                        const selected = i === selectedPointIndex;
                        return (
                            <Circle
                                key={i}
                                x={point.x}
                                y={point.y}
                                radius={selected ? canvas.selectedPointRadius : canvas.pointRadius}
                                fill={selected ? colors.danger[500] : color}
                                stroke="#fff"
                                strokeWidth={1}
                                draggable={mode === "select"}
                                onClick={() => handlePointClick(entityId, shape.id, i)}
                                onDragStart={(e) => handlePointDragStart(entityId, shape.id, i, e)}
                                onDragMove={(e) => handlePointDrag(entityId, shape.id, i, e)}
                                onDragEnd={(e) => handlePointDragEnd(entityId, shape.id, i, e)}
                            />
                        );
                    })}

                {/* Transparent lines for adding points */}
                {mode === "add_point" &&
                    shape.points.map((point, i) => {
                        const next = shape.points[(i + 1) % shape.points.length];
                        return (
                            <Line
                                key={`add-line-${i}`}
                                points={[point.x, point.y, next.x, next.y]}
                                stroke="transparent"
                                strokeWidth={canvas.clickableLineWidth}
                                onClick={(e) => handleLineClick(entityId, shape.id, i, e)}
                            />
                        );
                    })}

                {showMetrics && isSelected && console.log("shapeId", shapeId)}
                {showMetrics && isSelected && <ShapeMetrics shape={shape} />}
            </Group>
        );
    },
    (prev, next) =>
        prev.shape === next.shape &&
        prev.isSelected === next.isSelected &&
        prev.color === next.color &&
        prev.showMetrics === next.showMetrics &&
        prev.entityId === next.entityId &&
        prev.shapeId === next.shapeId
);

export default PolygonRenderer;
