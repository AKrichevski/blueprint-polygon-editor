import React, { memo, useMemo } from 'react';
import { Group } from 'react-konva';
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

interface ShapeRendererProps {
    shapes: Record<string, GeometricShape>;
    entityId: string;
    showMetrics: boolean;
    entityColor: string;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({
                                                         shapes,
                                                         entityColor,
                                                         entityId,
                                                         showMetrics,
                                                     }) => {
    const { selectedShapeId } = useEditor(); // Only selectedShapeId is needed

    const elements = useMemo(() => {
        const items = [];

        for (const [shapeId, shape] of Object.entries(shapes)) {
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
    }, [shapes, entityId, entityColor, showMetrics, selectedShapeId]);

    return <Group>{elements}</Group>;
};

// Optional: use custom comparison if props are large or change often
function areEqual(prev: ShapeRendererProps, next: ShapeRendererProps) {
    return (
        prev.entityId === next.entityId &&
        prev.entityColor === next.entityColor &&
        prev.showMetrics === next.showMetrics &&
        prev.shapes === next.shapes
    );
}

export default memo(ShapeRenderer, areEqual);
