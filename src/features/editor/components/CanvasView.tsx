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

    // Performance optimization refs
    const THROTTLE_MS = 50;
    const lastRenderTimeRef = useRef(0);
    const lastSelectedRenderTimeRef = useRef(0);
    const cachedEntitiesRef = useRef<JSX.Element[] | null>(null);
    const cachedSelectedGroupRef = useRef<JSX.Element | null>(null);

    // Track what was last rendered to detect changes
    const lastRenderedStateRef = useRef({
        selectedEntityId: null as string | null,
        selectedShapeId: null as string | null,
        scale: 1,
        entitiesHash: '',
        showMetrics: false
    });

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

    // Generate a simple hash for entities to detect changes
    const getEntitiesHash = useCallback((entities: typeof state.entities) => {
        if (!entities) return '';
        return Object.keys(entities)
            .sort()
            .map(entityId => {
                const entity = entities[entityId];
                return `${entityId}:${entity.visible}:${Object.keys(entity.shapes || {}).length}`;
            })
            .join('|');
    }, []);

    // Render non-selected entities (cached heavily)
    const renderedEntities = useMemo(() => {
        const now = performance.now();
        const currentHash = getEntitiesHash(state.entities);
        const lastState = lastRenderedStateRef.current;

        // Check if we can use cache
        const canUseCache = (
            now - lastRenderTimeRef.current < THROTTLE_MS ||
            (
                lastState.entitiesHash === currentHash &&
                lastState.scale === scale &&
                lastState.showMetrics === showShapeMetrics &&
                lastState.selectedEntityId === selectedEntityId &&
                lastState.selectedShapeId === selectedShapeId
            )
        );

        if (canUseCache && cachedEntitiesRef.current) {
            return cachedEntitiesRef.current;
        }

        if (!state.entities || typeof state.entities !== 'object') {
            cachedEntitiesRef.current = null;
            return null;
        }

        console.time(`Entities Render (excluding selected)`);
        const result: JSX.Element[] = [];

        for (const entityId in state.entities) {
            console.log("xxx renderedEntities:",entityId)
            const entity = state.entities[entityId];

            if (!entity || !entity.visible || !entity.shapes || typeof entity.shapes !== 'object') {
                continue;
            }

            // Filter out the selected shape from this entity
            const filteredShapes = { ...entity.shapes };
            if (selectedEntityId === entityId && selectedShapeId) {
                delete filteredShapes[selectedShapeId];
            }

            // Only render if there are shapes left after filtering
            if (Object.keys(filteredShapes).length > 0) {
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
                            }, 0);
                        }}
                    >
                        <ShapeRenderer
                            width={width}
                            height={height}
                            shapes={filteredShapes}
                            entityId={entityId}
                            entityColor={entity.metaData?.fontColor || '#3357FF'}
                            showMetrics={showShapeMetrics}
                        />
                    </Group>
                );
            }
        }

        console.timeEnd("Entities Render (excluding selected)");

        // Update cache and tracking
        lastRenderTimeRef.current = now;
        lastRenderedStateRef.current = {
            selectedEntityId,
            selectedShapeId,
            scale,
            entitiesHash: currentHash,
            showMetrics: showShapeMetrics
        };

        cachedEntitiesRef.current = result.length ? result : null;
        return cachedEntitiesRef.current;
    }, [
        state.entities,
        showShapeMetrics,
        scale,
        width,
        height,
        selectedEntityId,
        selectedShapeId,
        getEntitiesHash
    ]);

    // Render only the selected shape in a separate group (updated frequently)
    const selectedShapeGroup = useMemo(() => {
        const now = performance.now();

        // If no shape is selected, clear cache and return null
        if (!selectedEntityId || !selectedShapeId) {
            cachedSelectedGroupRef.current = null;
            return null;
        }

        const selectedEntity = state.entities[selectedEntityId];
        if (!selectedEntity || !selectedEntity.visible || !selectedEntity.shapes) {
            cachedSelectedGroupRef.current = null;
            return null;
        }

        const selectedShape = selectedEntity.shapes[selectedShapeId];
        if (!selectedShape) {
            cachedSelectedGroupRef.current = null;
            return null;
        }

        // For selected shapes, we update more frequently but still throttle a bit
        const selectedThrottle = 16; // ~60fps for selected shape updates
        if (now - lastSelectedRenderTimeRef.current < selectedThrottle && cachedSelectedGroupRef.current) {
            return cachedSelectedGroupRef.current;
        }

        console.time("Selected Shape Render");

        const selectedShapeOnly = {
            [selectedShapeId]: selectedShape
        };

        const result = (
            <Group
                key={`selected-shape-group-${selectedEntityId}-${selectedShapeId}`}
                // Don't cache the selected group as it updates frequently
            >
                <ShapeRenderer
                    width={width}
                    height={height}
                    shapes={selectedShapeOnly}
                    entityId={selectedEntityId}
                    entityColor={selectedEntity.metaData?.fontColor || '#3357FF'}
                    showMetrics={showShapeMetrics}
                />
            </Group>
        );

        console.timeEnd("Selected Shape Render");

        lastSelectedRenderTimeRef.current = now;
        cachedSelectedGroupRef.current = result;
        return result;
    }, [selectedEntityId, selectedShapeId, state.entities, showShapeMetrics, width, height]);

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

                    {/* Non-selected entities (heavily cached) */}
                    {renderedEntities}

                    {/* Selected shape in separate group (updates frequently) */}
                    {selectedShapeGroup}
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
