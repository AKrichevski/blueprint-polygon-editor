// @ts-nocheck
import React, {memo, useMemo, useCallback, JSX} from 'react';
import { Group } from 'react-konva';
import type {
    GeometricShape,
    BoundingBox,
    PointShape,
    LineShape,
    ArcShape,
    CircleShape,
    EllipseShape,
    PolygonShape,
    TextShape
} from '../../../../types';
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

interface ShapeRendererProps {
    width: number;
    height: number;
    shapes: Record<string, GeometricShape>;
    entityId: string;
    showMetrics: boolean;
    entityColor: string;
}

// Simple spatial grid for faster viewport culling
class SpatialGrid {
    private grid: Map<string, Set<string>> = new Map();
    private cellSize: number;

    constructor(cellSize: number = 100) {
        this.cellSize = cellSize;
    }

    private getGridKey(x: number, y: number): string {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        return `${gridX},${gridY}`;
    }

    private getGridKeysForBox(box: BoundingBox): string[] {
        const keys: string[] = [];
        const minGridX = Math.floor(box.minX / this.cellSize);
        const minGridY = Math.floor(box.minY / this.cellSize);
        const maxGridX = Math.floor(box.maxX / this.cellSize);
        const maxGridY = Math.floor(box.maxY / this.cellSize);

        for (let x = minGridX; x <= maxGridX; x++) {
            for (let y = minGridY; y <= maxGridY; y++) {
                keys.push(`${x},${y}`);
            }
        }
        return keys;
    }

    insert(shapeId: string, boundingBox: BoundingBox) {
        const keys = this.getGridKeysForBox(boundingBox);
        for (const key of keys) {
            if (!this.grid.has(key)) {
                this.grid.set(key, new Set());
            }
            this.grid.get(key)!.add(shapeId);
        }
    }

    query(viewport: BoundingBox): Set<string> {
        const result = new Set<string>();
        const keys = this.getGridKeysForBox(viewport);

        for (const key of keys) {
            const shapes = this.grid.get(key);
            if (shapes) {
                shapes.forEach(id => result.add(id));
            }
        }

        return result;
    }

    clear() {
        this.grid.clear();
    }
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
        boundingBoxCache
    } = useEditor();

    // Build spatial index for this entity's shapes
    const spatialGrid = useMemo(() => {
        const grid = new SpatialGrid(100 / scale); // Adjust cell size based on zoom

        // Single loop to build spatial index
        for (const [shapeId, shape] of Object.entries(shapes)) {
            const bbox = boundingBoxCache?.get(shapeId);
            if (bbox) {
                grid.insert(shapeId, bbox);
            }
        }

        return grid;
    }, [shapes, boundingBoxCache, scale]);

    // Calculate viewport
    const viewport = useMemo(() => {
        return calculateViewportBounds(width, height, position, scale);
    }, [position, scale, width, height]);

    // Get visible shapes using spatial index - much faster than checking all shapes
    const visibleShapeIds = useMemo(() => {
        // Always include selected shape
        const visible = new Set<string>();
        if (selectedShapeId && shapes[selectedShapeId]) {
            visible.add(selectedShapeId);
        }

        // Query spatial index for potentially visible shapes
        const candidates = spatialGrid.query({
            minX: viewport.minX - 100,
            minY: viewport.minY - 100,
            maxX: viewport.maxX + 100,
            maxY: viewport.maxY + 100
        });

        // Fine-grained check only on candidates
        for (const shapeId of candidates) {
            if (shapeId === selectedShapeId) continue; // Already added

            const bbox = boundingBoxCache?.get(shapeId);
            if (bbox && isBoxVisible(bbox, viewport, 50)) {
                visible.add(shapeId);
            }
        }

        return visible;
    }, [viewport, spatialGrid, selectedShapeId, shapes, boundingBoxCache]);

    // Render only visible shapes
    const renderedShapes = useMemo(() => {
        const elements: JSX.Element[] = [];

        // Single loop through visible shapes only
        for (const shapeId of visibleShapeIds) {
            const shape = shapes[shapeId];
            if (!shape) continue;

            const isSelected = shapeId === selectedShapeId;
            const color = isSelected ? colors.state.selected : entityColor;

            // Shape-specific renderer selection
            let element: JSX.Element | null = null;

            switch (shape.shapeType) {
                case 'point':
                    element = (
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
                    element = (
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
                    element = (
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
                    element = (
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
                    element = (
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
                    element = (
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
                    element = (
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
            }

            if (element) {
                elements.push(element);
            }
        }

        return elements;
    }, [visibleShapeIds, shapes, selectedShapeId, entityColor, showMetrics, entityId]);

    return <Group>{renderedShapes}</Group>;
};

// Optimized props comparison
const arePropsEqual = (prev: ShapeRendererProps, next: ShapeRendererProps) => {
    return (
        prev.shapes === next.shapes &&
        prev.entityId === next.entityId &&
        prev.entityColor === next.entityColor &&
        prev.showMetrics === next.showMetrics &&
        prev.width === next.width &&
        prev.height === next.height
    );
};

export default memo(ShapeRenderer, arePropsEqual);
