// @ts-nocheck
// src/features/editor/components/CanvasView.tsx
import React, {
    useRef,
    useState,
    useCallback,
    useMemo,
    memo,
} from 'react';
import { Stage, Layer, Group } from 'react-konva';
import Konva from 'konva';
import { classNames } from '../../../styles/theme';
import {
    GridRenderer,
    BackgroundRenderer,
    CoordinateDisplay
} from './canvas';
import ShapeRenderer from './canvas/ShapeRenderer';
import MetricsToggleButton from './MetricsToggleButton';
import SelectionIndicator from './SelectionIndicator';
import { useCanvasEvents } from '../hooks';
import { useEditor } from "../../../contexts/editor";
import { EditMode } from "../../../consts";
import ShapeContextMenuWithSubmenu from "./ShapeContextMenu";
import { colors } from '../../../styles/theme'; // to style the “pulled‐out” shape

interface CanvasViewProps {
    width: number;
    height: number;
}

//-------------------------------------------------------------------------------------------------
// “EntityRenderer” remains unchanged: it simply wraps a full entity’s shapes in a Group and
// caches it unless it contains the selected shape(s). We leave this alone.
//-------------------------------------------------------------------------------------------------
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
    const { selectedShapeId, selectedShapeIds } = useEditor();

    if (!entity.visible || !entity.shapes || Object.keys(entity.shapes).length === 0) {
        return null;
    }

    // If this entity has the single selected shape, or multiple selected shapes,
    // we do NOT cache it—otherwise we do cache for performance.
    const hasSelectedShape = Boolean(
        selectedShapeId && entity.shapes[selectedShapeId]
    );
    const hasMultiSelectedShapes = Array.from(selectedShapeIds).some(
        id => !!entity.shapes[id]
    );

    return (
        <Group
            key={entityId}
            ref={(node) => {
                if (
                    node &&
                    !hasSelectedShape &&
                    !hasMultiSelectedShapes &&
                    !showMetrics
                ) {
                    // cache non-selected entities
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
        selectedShapeIds,
        selectedPointIndex
    } = useEditor();

    const stageRef = useRef<Konva.Stage | null>(null);
    const [showShapeMetrics, setShowShapeMetrics] = useState(false);
    const [newPolygonPoints, setNewPolygonPoints] = useState<
        { x: number; y: number }[]
    >([]);

    const {
        handleWheel,
        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleCanvasClick,
        handleCanvasRightClick, // Right-click handler
        handleMouseLeave,
    } = useCanvasEvents(
        stageRef,
        width,
        height,
        newPolygonPoints,
        setNewPolygonPoints
    );

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
        draggable: false, // we handle drag in each shape
        onWheel: handleWheel,
        onMouseDown: handleCanvasMouseDown,
        onMouseMove: handleCanvasMouseMove,
        onMouseUp: handleCanvasMouseUp,
        onClick: handleCanvasClick,
        onContextMenu: handleCanvasRightClick, // capture right‐click for context menu
        onMouseLeave: handleMouseLeave,
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
        handleCanvasRightClick,
        handleMouseLeave,
    ]);

    // Build the list of entity‐elements in two phases:
    const renderedEntities = useMemo(() => {
        if (!state.entities || typeof state.entities !== 'object') {
            return null;
        }

        const elements: JSX.Element[] = [];

        // 1) Sort entities so that the selectedEntity (if any) is last
        const sortedEntries = Object.entries(state.entities).sort(
            ([idA], [idB]) => {
                if (idA === selectedEntityId) return 1;
                if (idB === selectedEntityId) return -1;
                return 0;
            }
        );

        // 2) Loop through each entity
        for (const [entityId, entity] of sortedEntries) {
            // If this entity is NOT the one containing the selectedShape, render it normally:
            if (entityId !== selectedEntityId) {
                elements.push(
                    <EntityRenderer
                        key={entityId}
                        entityId={entityId}
                        entity={entity}
                        showMetrics={showShapeMetrics}
                        width={width}
                        height={height}
                    />
                );
            } else {
                // This entity *does* contain the selected shape. We want to draw *all of its shapes EXCEPT*
                // the selected one, so that we can pull the selected shape out into its own temp‐Group later.
                const originalShapes = entity.shapes || {};
                // Make a shallow copy and delete the selectedShapeId
                const shapesMinusSelected = { ...originalShapes };
                if (selectedShapeId && shapesMinusSelected[selectedShapeId]) {
                    delete shapesMinusSelected[selectedShapeId];
                }

                // If there are still some shapes left in this entity, render them now:
                if (Object.keys(shapesMinusSelected).length > 0) {
                    elements.push(
                        <EntityRenderer
                            key={entityId + '-minus-selected'}
                            entityId={entityId}
                            entity={{
                                ...entity,
                                shapes: shapesMinusSelected
                            }}
                            showMetrics={showShapeMetrics}
                            width={width}
                            height={height}
                        />
                    );
                }
                // (If this entity only had the selected shape, then we skip rendering it entirely here.)
            }
        }

        // 3) Finally, if a shape is selected, render *just that one shape* on top
        if (
            selectedEntityId &&
            selectedShapeId &&
            state.entities[selectedEntityId] &&
            state.entities[selectedEntityId].shapes
        ) {
            const selEntity = state.entities[selectedEntityId];
            const selShape = selEntity.shapes[selectedShapeId];
            if (selShape) {
                // We wrap the single‐shape in its own Group so it draws last:
                elements.push(
                    <Group key="selected‐shape‐on‐top">
                        <ShapeRenderer
                            width={width}
                            height={height}
                            shapes={{ [selectedShapeId]: selShape }}
                            entityId={selectedEntityId}
                            // You can choose any “highlight” color for a selected shape on top:
                            entityColor={colors.state.selected}
                            showMetrics={showShapeMetrics}
                        />
                    </Group>
                );
            }
        }

        return elements;
    }, [
        state.entities,
        selectedEntityId,
        selectedShapeId,
        selectedShapeIds,
        showShapeMetrics,
        width,
        height
    ]);

    return (
        <div
            className={`${classNames.container.canvas} ${getCursorClass}`}
            style={{ width, height, position: 'relative' }}
        >
            <Stage ref={stageRef} {...stageProps}>
                <Layer>
                     {/*<GridRenderer width={width} height={height} />*/}
                    <BackgroundRenderer />
                    {renderedEntities}
                </Layer>
            </Stage>

            <MetricsToggleButton
                showMetrics={showShapeMetrics}
                onToggle={toggleShapeMetrics}
            />

            <SelectionIndicator />

            <CoordinateDisplay pointerPos={stageRef.current?.pointerPos} />

            <ShapeContextMenuWithSubmenu />
        </div>
    );
});

export default CanvasView;
