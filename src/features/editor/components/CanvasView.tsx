// @ts-nocheck
import React, {
    useRef,
    useState,
    useCallback,
    useMemo,
    memo,
    JSX,
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
        if (now - lastRenderTimeRef.current < THROTTLE_MS) {
            return cachedRenderedEntitiesRef.current;
        }

        if (!state.entities || typeof state.entities !== 'object') return null;
        console.time(`xxx ShapeRender run`);
        const result: JSX.Element[] = [];
        // console.log(`xxx scale:${scale}`);

        for (const entityId in state.entities) {
            const entity = state.entities[entityId];

            if (!entity || !entity.visible || !entity.shapes || typeof entity.shapes !== 'object') {
                continue;
            }

            result.push(
                <Group
                    key={`entity-group-${entityId}`}
                    ref={(layer) => {
                        if (!layer) return;

                        setTimeout(() => {
                            const width = layer.width();
                            const height = layer.height();
                            const hasContent = layer.getChildren().length > 0;

                            if (width > 0 && height > 0 && hasContent && scale > 0.1 && !showShapeMetrics) {
                                try {
                                    layer.cache();
                                } catch (e) {
                                    console.warn(`Layer cache failed for entity ${entityId}`, e);
                                }
                            } else {
                                layer.clearCache();
                            }
                        }, 0); // Delay by 1 tick to guarantee layout is ready
                    }}
                >
                    <ShapeRenderer
                        width={width}
                        height={height}
                        shapes={entity.shapes}
                        entityId={entityId}
                        entityColor={entity.metaData?.fontColor || '#3357FF'}
                        showMetrics={showShapeMetrics}
                    />
                </Group>
            );
        }
        console.timeEnd("xxx ShapeRender run");

        lastRenderTimeRef.current = now;
        cachedRenderedEntitiesRef.current = result.length ? result : null;
        return cachedRenderedEntitiesRef.current;
    }, [state.entities, showShapeMetrics, scale, width, height]);

    return (
        <div
            className={`${classNames.container.canvas} ${getCursorClass}`}
            style={{ width, height, position: 'relative' }}
        >
            <Stage ref={stageRef} {...stageProps}>
                {/* Background layer */}
                <Layer>
                    <GridRenderer width={width} height={height} />
                    <BackgroundRenderer />
                    {/* Entity layers */}
                    {renderedEntities}
                </Layer>


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
