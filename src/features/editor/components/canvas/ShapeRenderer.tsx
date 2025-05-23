// @ts-nocheck
import React, {memo, useMemo, useCallback} from 'react';
import {Group} from 'react-konva';
import type {
    GeometricShape,
    PointShape,
    LineShape,
    ArcShape,
    CircleShape,
    EllipseShape,
    PolygonShape,
    TextShape,
} from '../../../../types';
import {colors} from '../../../../styles/theme';
import {useEditor} from "../../../../contexts/editor";
import {
    ArcRenderer,
    CircleRenderer,
    EllipseRenderer,
    LineRenderer,
    PointRenderer,
    PolygonRenderer,
    TextRenderer,
} from "./shapes";
import {calculateViewportBounds, isBoxVisible} from '../../../../utils/geometryUtils';

interface ShapeRendererProps {
    width: number;
    height: number;
    shapes: Record<string, GeometricShape>;
    entityId: string;
    showMetrics: boolean;
    entityColor: string;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({
                                                         width, height,
                                                         shapes,
                                                         entityColor,
                                                         entityId,
                                                         showMetrics,
                                                     }) => {

    const {
        selectedShapeId,
        scale,
        position,
        getBoundingBox,
        calculateShapeBoundingBox
    } = useEditor();




    // Calculate current viewport bounds in world coordinates
    const viewport = useMemo(() => {
        return calculateViewportBounds(
            width,
            height,
            position,
            scale
        );
    }, [position, scale, width, height]);

    // Check if a shape is visible in the viewport
    const isShapeVisible = useCallback((shapeId: string, shape: GeometricShape): boolean => {
        // Always render the selected shape
        if (shapeId === selectedShapeId) return true;

        // Get cached bounding box or calculate it
        let bbox = getBoundingBox(shapeId);
        if (!bbox) {
            bbox = calculateShapeBoundingBox(shape);
        }

        // Check if bbox overlaps viewport (with margin)
        const margin = 100 / scale; // 100px screen margin
        return isBoxVisible(bbox, viewport, margin);
    }, [viewport, scale, selectedShapeId, getBoundingBox, calculateShapeBoundingBox]);

    const elements = useMemo(() => {
        const items = [];

        for (const [shapeId, shape] of Object.entries(shapes)) {
            // Skip rendering invisible shapes (unless selected)
            if (!isShapeVisible(shapeId, shape)) {
                continue;
            }

            const isSelected = shapeId === selectedShapeId;
            const color = isSelected ? colors.state.selected : entityColor;

            switch (shape.shapeType) {
                case 'point':
                    items.push(
                        <PointRenderer
                            key={shapeId}
                            entityId={entityId}
                            shapeId={shapeId}
                            shape={shape as PointShape}
                            isSelected={isSelected}
                            color={color}
                        />
                    );
                    break;

                case 'line':
                    items.push(
                        <LineRenderer
                            key={shapeId}
                            shapeId={shapeId}
                            shape={shape as LineShape}
                            isSelected={isSelected}
                            color={color}
                            entityId={entityId}
                        />
                    );
                    break;

                case 'arc':
                    items.push(
                        <ArcRenderer
                            key={shapeId}
                            entityId={entityId}
                            shapeId={shapeId}
                            shape={shape as ArcShape}
                            isSelected={isSelected}
                            color={color}
                        />
                    );
                    break;

                case 'circle':
                    items.push(
                        <CircleRenderer
                            key={shapeId}
                            entityId={entityId}
                            shapeId={shapeId}
                            shape={shape as CircleShape}
                            isSelected={isSelected}
                            color={color}
                        />
                    );
                    break;

                case 'ellipse':
                    items.push(
                        <EllipseRenderer
                            key={shapeId}
                            entityId={entityId}
                            shapeId={shapeId}
                            shape={shape as EllipseShape}
                            isSelected={isSelected}
                            color={color}
                        />
                    );
                    break;

                case 'polygon':
                case 'rectangle':
                    items.push(
                        <PolygonRenderer
                            key={shapeId}
                            shapeId={shapeId}
                            shape={shape as PolygonShape}
                            isSelected={isSelected}
                            color={color}
                            showMetrics={showMetrics}
                            entityId={entityId}
                        />
                    );
                    break;

                case 'text':
                    items.push(
                        <TextRenderer
                            key={shapeId}
                            shapeId={shapeId}
                            entityId={entityId}
                            shape={shape as TextShape}
                            isSelected={isSelected}
                            color={color}
                        />
                    );
                    break;

                default:
                    console.warn(`Unknown shape type: ${shape.shapeType}`);
                    break;
            }
        }

        return items;
    }, [shapes, entityId, entityColor, showMetrics, selectedShapeId, isShapeVisible]);

    return <Group key={entityId}>{elements}</Group>;
};

// Custom equality function for props comparison
function arePropsEqual(prev: ShapeRendererProps, next: ShapeRendererProps) {
    return (
        prev.entityId === next.entityId &&
        prev.entityColor === next.entityColor &&
        prev.showMetrics === next.showMetrics &&
        prev.shapes === next.shapes  // Reference equality check for shapes object
    );
}

export default memo(ShapeRenderer, arePropsEqual);
