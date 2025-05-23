// @ts-nocheck
// src/features/editor/components/canvas/OptimizedShapeRenderer.tsx
import React, { memo, useMemo, useCallback } from 'react';
import { Group } from 'react-konva';
import type { GeometricShape } from '../../../../types';
import { colors } from '../../../../styles/theme';
import { useEditor } from "../../../../contexts/editor";
import {
    ArcRenderer,
    CircleRenderer,
    EllipseRenderer,
    LineRenderer,
    PointRenderer,
    PolygonRenderer,
    TextRenderer,
} from "./shapes";
import { calculateViewportBounds, isBoxVisible } from '../../../../utils/geometryUtils';

interface OptimizedShapeRendererProps {
    width: number;
    height: number;
    shapes: Record<string, GeometricShape>;
    entityId: string;
    showMetrics: boolean;
    entityColor: string;
}

// Memoized individual shape wrapper
const MemoizedShapeWrapper = memo(({
                                       shapeId,
                                       shape,
                                       entityId,
                                       entityColor,
                                       showMetrics,
                                       isSelected
                                   }: {
    shapeId: string;
    shape: GeometricShape;
    entityId: string;
    entityColor: string;
    showMetrics: boolean;
    isSelected: boolean;
}) => {
    const color = isSelected ? colors.state.selected : entityColor;

    switch (shape.shapeType) {
        case 'point':
            return (
                <PointRenderer
                    entityId={entityId}
                    shapeId={shapeId}
                    shape={shape}
                    isSelected={isSelected}
                    color={color}
                />
            );

        case 'line':
            return (
                <LineRenderer
                    shapeId={shapeId}
                    shape={shape}
                    isSelected={isSelected}
                    color={color}
                    entityId={entityId}
                />
            );

        case 'arc':
            return (
                <ArcRenderer
                    entityId={entityId}
                    shapeId={shapeId}
                    shape={shape}
                    isSelected={isSelected}
                    color={color}
                />
            );

        case 'circle':
            return (
                <CircleRenderer
                    entityId={entityId}
                    shapeId={shapeId}
                    shape={shape}
                    isSelected={isSelected}
                    color={color}
                />
            );

        case 'ellipse':
            return (
                <EllipseRenderer
                    entityId={entityId}
                    shapeId={shapeId}
                    shape={shape}
                    isSelected={isSelected}
                    color={color}
                />
            );

        case 'polygon':
        case 'rectangle':
            return (
                <PolygonRenderer
                    shapeId={shapeId}
                    shape={shape}
                    isSelected={isSelected}
                    color={color}
                    showMetrics={showMetrics}
                    entityId={entityId}
                />
            );

        case 'text':
            return (
                <TextRenderer
                    shapeId={shapeId}
                    entityId={entityId}
                    shape={shape}
                    isSelected={isSelected}
                    color={color}
                />
            );

        default:
            console.warn(`Unknown shape type: ${shape.shapeType}`);
            return null;
    }
});

// Custom equality function - FIXED: More conservative comparison
function shapeWrapperEqual(prev: any, next: any) {
    // Only use reference equality for shape, be more specific about other props
    return (
        prev.shapeId === next.shapeId &&
        prev.shape === next.shape && // Reference equality check
        prev.isSelected === next.isSelected &&
        prev.entityColor === next.entityColor &&
        prev.showMetrics === next.showMetrics &&
        prev.entityId === next.entityId
    );
}

const MemoizedShape = memo(MemoizedShapeWrapper, shapeWrapperEqual);

const OptimizedShapeRenderer: React.FC<OptimizedShapeRendererProps> = ({
                                                                           width,
                                                                           height,
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

    // FIXED: More conservative viewport calculation with larger margins
    const viewport = useMemo(() => {
        return calculateViewportBounds(width, height, position, scale);
    }, [position, scale, width, height]);

    // FIXED: Less aggressive viewport culling
    const isShapeVisible = useCallback((shapeId: string, shape: GeometricShape): boolean => {
        // Always render the selected shape
        if (shapeId === selectedShapeId) return true;

        // For very high zoom levels, render everything to prevent missing shapes
        if (scale < 0.1) return true;

        try {
            // Get cached bounding box or calculate it
            let bbox = getBoundingBox(shapeId);
            if (!bbox) {
                bbox = calculateShapeBoundingBox(shape);
            }

            // FIXED: Much larger margin to prevent shapes disappearing
            const margin = Math.max(200, 500 / scale); // Minimum 200px margin, scales with zoom
            return isBoxVisible(bbox, viewport, margin);
        } catch (error) {
            console.warn('Error in viewport culling, rendering shape:', error);
            return true; // Render on error to be safe
        }
    }, [viewport, scale, selectedShapeId, getBoundingBox, calculateShapeBoundingBox]);

    // FIXED: Don't cache visible shape IDs - calculate directly to avoid stale data
    const visibleShapes = useMemo(() => {
        const result: Array<{ shapeId: string; shape: GeometricShape; isSelected: boolean }> = [];

        for (const [shapeId, shape] of Object.entries(shapes)) {
            if (isShapeVisible(shapeId, shape)) {
                result.push({
                    shapeId,
                    shape,
                    isSelected: shapeId === selectedShapeId
                });
            }
        }

        return result;
    }, [shapes, isShapeVisible, selectedShapeId]);

    // FIXED: Simplified rendering without over-optimization
    const shapeElements = useMemo(() => {
        return visibleShapes.map(({ shapeId, shape, isSelected }) => (
            <MemoizedShape
                key={shapeId}
                shapeId={shapeId}
                shape={shape}
                entityId={entityId}
                entityColor={entityColor}
                showMetrics={showMetrics}
                isSelected={isSelected}
            />
        ));
    }, [visibleShapes, entityId, entityColor, showMetrics]);

    return <Group>{shapeElements}</Group>;
};

// FIXED: Less aggressive props comparison
function arePropsEqual(prev: OptimizedShapeRendererProps, next: OptimizedShapeRendererProps) {
    // Only do reference equality on shapes - let other props update normally
    return (
        prev.shapes === next.shapes &&
        prev.entityId === next.entityId &&
        prev.entityColor === next.entityColor &&
        prev.showMetrics === next.showMetrics
        // Removed width/height from comparison as they should trigger re-renders
    );
}

export default memo(OptimizedShapeRenderer, arePropsEqual);
