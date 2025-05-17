// src/features/editor/components/CanvasView.tsx
import React, {
    useRef,
    useState,
    useCallback,
    useMemo,
    memo,
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
import { EditMode } from "../../../types";
import { useEditor } from "../../../contexts/editor";

interface CanvasViewProps {
    width: number;
    height: number;
}

const CanvasView: React.FC<CanvasViewProps> = memo(({ width, height }) => {
    const { state, scale, mode, position, selectedPointIndex } = useEditor();
    const stageRef = useRef<Konva.Stage | null>(null);
    const [showShapeMetrics, setShowShapeMetrics] = useState(false);

    const {
        handleWheel,
        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleCanvasClick,
        handleMouseLeave,
        stageToWorld,
        worldToStage
    } = useCanvasEvents(stageRef, width, height, [], () => {});

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

    // Render entities in separate layers, respecting visibility
    const renderedEntities = useMemo(() => {
        if (!state.entities || typeof state.entities !== 'object') return null;

        return Object.entries(state.entities).map(([entityId, entity]) => {
            // Skip rendering if the entity is not visible
            if (!entity.visible) return null;

            if (!entity || !entity.shapes || typeof entity.shapes !== 'object') return null;

            return (
                <Layer key={`entity-layer-${entityId}`}>
                    <ShapeRenderer
                        shapes={entity.shapes}
                        entityId={entityId}
                        entityColor={entity.metaData?.fontColor || '#3357FF'}
                        showMetrics={showShapeMetrics}
                    />
                </Layer>
            );
        });
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
