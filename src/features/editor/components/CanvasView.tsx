// @ts-nocheck
import React, {
    useRef,
    useState,
    useCallback,
    useMemo,
    memo,
} from 'react';
import {Stage, Layer, Group} from 'react-konva';
import Konva from 'konva';
import { classNames } from '../../../styles/theme';
import {
    GridRenderer,
    BackgroundRenderer,
    CoordinateDisplay
} from './canvas';
import ShapeRenderer from './canvas/ShapeRenderer';
import MetricsToggleButton from './MetricsToggleButton';
import { useCanvasEvents } from '../hooks';
import { useEditor } from "../../../contexts/editor";
import { EditMode } from "../../../consts";

interface CanvasViewProps {
    width: number;
    height: number;
}

// Memoized entity renderer to prevent unnecessary re-renders
const EntityRenderer = memo(({
                                 entityId,
                                 entity,
                                 showMetrics,
                                 width,
                                 height
                             }: {
    entityId: string;
    entity: any;
    showMetrics: boolean;
    width: number;
    height: number;
}) => {
    const { selectedShapeId, boundingBoxCache } = useEditor();

    if (!entity.visible || !entity.shapes || Object.keys(entity.shapes).length === 0) {
        return null;
    }

    // Check if this entity has the selected shape for optimization
    const hasSelectedShape = selectedShapeId && entity.shapes[selectedShapeId];

    return (
        <Group
            key={entityId}
            // Cache non-selected entities
            ref={(node) => {
                if (node && !hasSelectedShape && !showMetrics) {
                    // Delay caching to avoid blocking render
                    requestAnimationFrame(() => {
                        try {
                            node.cache();
                        } catch (e) {
                            console.warn(`Failed to cache entity ${entityId}`, e);
                        }
                    });
                } else if (node) {
                    node.clearCache();
                }
            }}
        >
            <ShapeRenderer
                width={width}
                height={height}
                shapes={entity.shapes}
                entityId={entityId}
                entityColor={entity.metaData?.fontColor || '#3357FF'}
                showMetrics={showMetrics}
            />
        </Group>
    );
});

const CanvasView: React.FC<CanvasViewProps> = memo(({ width, height }) => {
    const {
        state,
        scale,
        mode,
        position,
        selectedEntityId,
        selectedShapeId,
        selectedPointIndex
    } = useEditor();

    const stageRef = useRef<Konva.Stage | null>(null);
    const [showShapeMetrics, setShowShapeMetrics] = useState(false);
    const [newPolygonPoints, setNewPolygonPoints] = useState<{ x: number; y: number }[]>([]);

    const {
        handleWheel,
        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleCanvasClick,
        handleMouseLeave,
    } = useCanvasEvents(stageRef, width, height, newPolygonPoints, setNewPolygonPoints);

    const toggleShapeMetrics = useCallback(() => {
        setShowShapeMetrics(prev => !prev);
    }, []);

    const getCursorClass = useMemo(() => {
        switch (mode) {
            case EditMode.SELECT:
                return selectedPointIndex !== null ? 'cursor-move' : 'cursor-select';
            case EditMode.ADD_POLYGON:
            case EditMode.ADD_RECTANGLE:
            case EditMode.ADD_CIRCLE:
            case EditMode.ADD_LINE:
            case EditMode.ADD_ARC:
            case EditMode.ADD_ELLIPSE:
            case EditMode.ADD_TEXT:
                return 'cursor-drawing';
            case EditMode.ADD_POINT:
                return 'cursor-add-point';
            case EditMode.DELETE_POINT:
                return 'cursor-delete-point';
            default:
                return 'cursor-select';
        }
    }, [mode, selectedPointIndex]);

    const stageProps = useMemo(() => ({
        width,
        height,
        scaleX: scale,
        scaleY: scale,
        x: position.x,
        y: position.y,
        draggable: false,
        onWheel: handleWheel,
        onMouseDown: handleCanvasMouseDown,
        onMouseMove: handleCanvasMouseMove,
        onMouseUp: handleCanvasMouseUp,
        onClick: handleCanvasClick,
        onMouseLeave: handleMouseLeave,
        perfectDrawEnabled: false,
    }), [
        width, height, scale, position.x, position.y,
        handleWheel, handleCanvasMouseDown, handleCanvasMouseMove,
        handleCanvasMouseUp, handleCanvasClick, handleMouseLeave,
    ]);

    // Optimized entity rendering with single loop
    const renderedEntities = useMemo(() => {
        if (!state.entities || typeof state.entities !== 'object') {
            return null;
        }

        // Single pass to render all entities
        const entityElements: JSX.Element[] = [];

        // Sort entities to render selected one last (on top)
        const sortedEntries = Object.entries(state.entities).sort(([idA], [idB]) => {
            if (idA === selectedEntityId) return 1;
            if (idB === selectedEntityId) return -1;
            return 0;
        });

        for (const [entityId, entity] of sortedEntries) {
            entityElements.push(
                <EntityRenderer
                    key={entityId}
                    entityId={entityId}
                    entity={entity}
                    showMetrics={showShapeMetrics}
                    width={width}
                    height={height}
                />
            );
        }

        return entityElements;
    }, [state.entities, selectedEntityId, showShapeMetrics, width, height]);

    return (
        <div
            className={`${classNames.container.canvas} ${getCursorClass}`}
            style={{ width, height, position: 'relative' }}
        >
            <Stage ref={stageRef} {...stageProps}>
                <Layer>
                    <GridRenderer width={width} height={height} />
                    <BackgroundRenderer />
                    {renderedEntities}
                </Layer>
            </Stage>

            <MetricsToggleButton
                showMetrics={showShapeMetrics}
                onToggle={toggleShapeMetrics}
            />

            <CoordinateDisplay pointerPos={stageRef.current?.pointerPos} />
        </div>
    );
});

export default CanvasView;
