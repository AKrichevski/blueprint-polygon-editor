// src/features/editor/components/canvas/PolygonCreationPreview.tsx
import React, { useCallback, useMemo } from 'react';
import { Group, Line, Circle } from 'react-konva';
import { useEditor } from '../../../../contexts/editor';
import type { Point } from '../../../../types';
import { colors } from '../../../../styles/theme';

interface PolygonCreationPreviewProps {
    points: Point[];
    onFinish: (points: Point[]) => void;
}

const PolygonCreationPreview: React.FC<PolygonCreationPreviewProps> = ({ points, onFinish }) => {
    const { selectedEntityId, dispatch } = useEditor();

    // Convert points to flat array for Konva Line
    const flatPoints = useMemo(() => {
        return points.flatMap(p => [p.x, p.y]);
    }, [points]);

    // Handle double-click to finish polygon
    const handleDoubleClick = useCallback(() => {
        if (points.length >= 3 && selectedEntityId) {
            // Create the polygon shape with entity_type set to 'new_object_entity_type'
            const polygonShape = {
                id: `polygon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                shapeType: 'polygon' as const,
                entity_type: 'new_object_entity_type', // Set the required entity_type
                subType: '',
                points: points,
                style: {
                    strokeColor: '#3357FF',
                    strokeWidth: 1,
                    fillColor: 'rgba(51, 87, 255, 0.1)'
                }
            };

            // Dispatch ADD_SHAPE action
            dispatch({
                type: 'ADD_SHAPE',
                payload: {
                    entityId: selectedEntityId,
                    shape: polygonShape
                }
            });

            // Call the onFinish callback to clear the points
            onFinish([]);
        }
    }, [points, selectedEntityId, dispatch, onFinish]);

    if (points.length === 0) {
        return null;
    }

    return (
        <Group onDblClick={handleDoubleClick}>
            {/* Render the polygon line */}
            {points.length > 1 && (
                <Line
                    points={flatPoints}
                    stroke="#3357FF"
                    strokeWidth={2}
                    fill="rgba(51, 87, 255, 0.1)"
                    closed={points.length >= 3}
                    dash={[5, 5]}
                    listening={false}
                />
            )}
            
            {/* Render the points */}
            {points.map((point, index) => (
                <Circle
                    key={`preview-point-${index}`}
                    x={point.x}
                    y={point.y}
                    radius={4}
                    fill={colors.primary[500]}
                    stroke="#fff"
                    strokeWidth={1}
                    listening={false}
                />
            ))}
        </Group>
    );
};

export default PolygonCreationPreview; 