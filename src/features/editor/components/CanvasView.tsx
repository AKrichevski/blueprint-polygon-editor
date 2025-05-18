// src/features/editor/components/CanvasView.tsx
import React, {
    useRef,
    useState,
    useCallback,
    useMemo,
    memo, JSX,
} from 'react';
import { Stage, Layer } from 'react-konva';
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
import {EditMode} from "../../../consts";

interface CanvasViewProps {
    width: number;
    height: number;
}

const CanvasView: React.FC<CanvasViewProps> = memo(({ width, height }) => {
    const { state, scale, mode, position, selectedPointIndex } = useEditor();
    const stageRef = useRef<Konva.Stage | null>(null);
    const [showShapeMetrics, setShowShapeMetrics] = useState(false);
    const [newPolygonPoints, setNewPolygonPoints] = useState<{ x: number; y: number }[]>([]);

    const THROTTLE_MS = 50;
    const lastRenderTimeRef = useRef(0);
    const cachedRenderedEntitiesRef = useRef<JSX.Element[] | null>(null);

    const {
        handleWheel,
        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleCanvasClick,
        handleMouseLeave,
        stageToWorld,
        worldToStage
    } = useCanvasEvents(stageRef, width, height, newPolygonPoints, setNewPolygonPoints);

    const toggleShapeMetrics = useCallback(() => {
        setShowShapeMetrics(prev => !prev);
    }, []);

    // Get cursor class based on mode and selection
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

    // Memoize stage props
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
        // Add performance optimizations
        imageSmoothingEnabled: true,
        perfectDrawEnabled: false,
    }), [
        width,
        height,
        scale,
        position.x,
        position.y,
        handleWheel,
        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleCanvasClick,
        handleMouseLeave,
    ]);

    const renderedEntities = useMemo(() => {
        const now = performance.now();

        // Check if we're within throttle window
        if (now - lastRenderTimeRef.current < THROTTLE_MS) {
            return cachedRenderedEntitiesRef.current;
        }

        const result: JSX.Element[] = [];

        if (!state.entities || typeof state.entities !== 'object') return null;

        for (const entityId in state.entities) {
            const entity = state.entities[entityId];

            if (!entity || !entity.visible || !entity.shapes || typeof entity.shapes !== 'object') {
                continue;
            }

            result.push(
                <Layer key={`entity-layer-${entityId}`}>
                    <ShapeRenderer
                        shapes={entity.shapes}
                        entityId={entityId}
                        entityColor={entity.metaData?.fontColor || '#3357FF'}
                        showMetrics={showShapeMetrics}
                    />
                </Layer>
            );
        }

        lastRenderTimeRef.current = now;
        cachedRenderedEntitiesRef.current = result.length ? result : null;

        return cachedRenderedEntitiesRef.current;
    }, [state.entities, showShapeMetrics]);


    return (
        <div
            className={`${classNames.container.canvas} ${getCursorClass}`}
            style={{ width, height, position: 'relative' }}
        >
            <Stage ref={stageRef} {...stageProps}>
                {/* Background layer - always visible */}
                <Layer>
                    <GridRenderer width={width} height={height} />
                    <BackgroundRenderer />
                </Layer>

                {/* Entity layers - one per entity */}
                {renderedEntities}
            </Stage>

            <MetricsToggleButton
                showMetrics={showShapeMetrics}
                onToggle={toggleShapeMetrics}
            />
            <CoordinateDisplay stageRef={stageRef} />
        </div>
    );
});

export default CanvasView;
