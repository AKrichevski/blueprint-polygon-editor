// @ts-nocheck
// src/features/editor/hooks/useShapeInteractions.ts
import { useCallback, useRef } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEditor } from '../../../contexts/editor';
import type { Point } from "../../../types";
import Konva from "konva";
import { isPointInShape, viewportToWorld } from '../../../utils/geometryUtils';
import {EditMode} from "../../../consts";

export const useShapeInteractions = () => {
    const {
        state,
        dispatch,
        mode,
        selectedEntityId,
        selectedShapeId,
        selectedPointIndex,
        updateSelectedEntitiesIds,
        position,
        scale,
        getBoundingBox
    } = useEditor();

    // Use refs to track interaction state without triggering renders
    const isDraggingPointRef = useRef(false);
    const dragStartWorldPositionRef = useRef<Point | null>(null);
    const draggedPointRef = useRef<Konva.Circle | null>(null);
    const draggedShapeRef = useRef<Konva.Line | null>(null);
    const originalPointsRef = useRef<Point[] | null>(null);
    const currentDragPositionRef = useRef<Point | null>(null);

    // Handle point click - when user clicks on a point
    const handlePointClick = useCallback((
        entityId: string,
        shapeId: string,
        pointIndex: number
    ) => {
        // Prevent clicking while dragging
        if (isDraggingPointRef.current) {
            return;
        }

        if (mode === EditMode.SELECT) {
            updateSelectedEntitiesIds({
                entityId,
                shapeId,
                pointIndex
            });
        } else if (mode === EditMode.DELETE_POINT) {
            // Use lookup maps instead of deep traversal
            const shape = state.shapeLookup.get(shapeId)?.shape;

            if (shape && 'points' in shape && Array.isArray(shape.points)) {
                // Polygons need at least 3 points, lines need at least 2
                const minPoints = shape.shapeType === 'polygon' ? 3 : 2;

                if (shape.points.length > minPoints) {
                    dispatch({
                        type: 'DELETE_POINT',
                        payload: {entityId, shapeId, pointIndex},
                    });
                }
            }
        }
    }, [mode, dispatch, updateSelectedEntitiesIds, state.shapeLookup]);

    // Handle point drag start
    const handlePointDragStart = useCallback((
        entityId: string,
        shapeId: string,
        pointIndex: number,
        e: KonvaEventObject<DragEvent>
    ) => {
        // Mark as dragging to prevent click handlers from firing
        isDraggingPointRef.current = true;

        // Store references to the dragged elements
        draggedPointRef.current = e.target as Konva.Circle;

        // Find the parent shape (Line) - need to look through Group now
        const parent = e.target.getParent();
        if (parent) {
            // Find the shape line in the parent group
            const children = parent.getChildren();
            for (const child of children) {
                if (child instanceof Konva.Line) {
                    draggedShapeRef.current = child as Konva.Line;
                    break;
                }
            }
        }

        // Get the current shape data and store original points
        const shape = state.shapeLookup.get(shapeId)?.shape;
        if (shape && 'points' in shape && Array.isArray(shape.points)) {
            originalPointsRef.current = [...shape.points];
            dragStartWorldPositionRef.current = { ...shape.points[pointIndex] };
        }

        // Make sure this point is selected
        if (
            selectedEntityId !== entityId ||
            selectedShapeId !== shapeId ||
            selectedPointIndex !== pointIndex
        ) {
            updateSelectedEntitiesIds({
                entityId,
                shapeId,
                pointIndex
            });
        }

        // Prevent default Konva dragging behavior
        e.evt.preventDefault();
    }, [selectedEntityId, selectedShapeId, selectedPointIndex, updateSelectedEntitiesIds, state.shapeLookup]);

    // Handle point drag with optimistic updates (no Redux dispatching during drag)
    const handlePointDrag = useCallback((
        entityId: string,
        shapeId: string,
        pointIndex: number,
        e: Konva.KonvaEventObject<DragEvent>
    ) => {
        // Skip if we don't have necessary objects
        if (!e.target || !e.target.getStage() || !originalPointsRef.current) return;

        // Get the stage and pointer position
        const stage = e.target.getStage();
        const pointerPos = stage.getPointerPosition();

        if (!pointerPos) return;

        // Convert stage coordinates to world coordinates
        const worldPos = viewportToWorld(pointerPos.x, pointerPos.y, position, scale);

        // Round to prevent floating point errors
        const roundedPos = {
            x: Math.round(worldPos.x * 100) / 100,
            y: Math.round(worldPos.y * 100) / 100
        };

        // Store current drag position
        currentDragPositionRef.current = roundedPos;

        // **OPTIMISTIC UPDATE**: Update the canvas directly without Redux
        // This gives us immediate, smooth visual feedback

        // Update the dragged point position immediately
        if (draggedPointRef.current) {
            draggedPointRef.current.setAttrs({
                x: roundedPos.x,
                y: roundedPos.y
            });
        }

        // Update the shape lines immediately
        if (draggedShapeRef.current && originalPointsRef.current) {
            const newPoints = [...originalPointsRef.current];
            newPoints[pointIndex] = roundedPos;

            // Convert points to flat array for Konva
            const flatPoints = newPoints.flatMap(p => [p.x, p.y]);
            draggedShapeRef.current.setAttrs({
                points: flatPoints
            });
        }

        // Force immediate redraw of the layer
        const layer = e.target.getLayer();
        if (layer) {
            layer.batchDraw();
        }

    }, [position, scale]);

    // Handle point drag end - sync with Redux state
    const handlePointDragEnd = useCallback((
        entityId: string,
        shapeId: string,
        pointIndex: number,
        e: Konva.KonvaEventObject<DragEvent>
    ) => {
        // Reset dragging state
        isDraggingPointRef.current = false;

        // Get final position
        const finalPosition = currentDragPositionRef.current || dragStartWorldPositionRef.current;

        if (finalPosition) {
            // **SYNC WITH REDUX**: Now update the actual state
            dispatch({
                type: 'MOVE_POINT',
                payload: {
                    entityId,
                    shapeId,
                    pointIndex,
                    newPosition: finalPosition,
                },
            });
        }

        // Clean up refs
        draggedPointRef.current = null;
        draggedShapeRef.current = null;
        originalPointsRef.current = null;
        dragStartWorldPositionRef.current = null;
        currentDragPositionRef.current = null;
    }, [dispatch]);

    // Handle shape drag end (for Group-based dragging)
    const handleShapeDragEnd = useCallback((
        entityId: string,
        shapeId: string,
        e: KonvaEventObject<DragEvent>
    ) => {
        const group = e.target;
        const offset = {
            x: group.x(),
            y: group.y()
        };

        // Only dispatch if there was actual movement
        if (Math.abs(offset.x) > 0.01 || Math.abs(offset.y) > 0.01) {
            dispatch({
                type: 'MOVE_SHAPE',
                payload: {
                    entityId,
                    shapeId,
                    offset,
                },
            });
        }
    }, [dispatch]);

    // Handle shape line click for adding new points
    const handleLineClick = useCallback((
        entityId: string,
        shapeId: string,
        startPointIndex: number,
        e: Konva.KonvaEventObject<MouseEvent>
    ) => {
        if (mode !== EditMode.ADD_POINT) return;

        const stage = e.target.getStage();
        if (!stage) return;

        // Get pointer position in stage coordinates
        const stagePos = stage?.getPointerPosition();
        if (!stagePos) return;

        // Convert to world coordinates
        const worldPos = viewportToWorld(stagePos.x, stagePos.y, position, scale);

        // Round to prevent floating point errors
        const roundedPos = {
            x: Math.round(worldPos.x * 100) / 100,
            y: Math.round(worldPos.y * 100) / 100
        };

        // Ensure the world position is valid
        if (!isFinite(roundedPos.x) || !isFinite(roundedPos.y)) {
            console.warn('Invalid point coordinates, skipping add point operation');
            return;
        }

        dispatch({
            type: 'ADD_POINT',
            payload: {
                entityId,
                shapeId,
                point: roundedPos,
                index: startPointIndex + 1,
            },
        });
    }, [mode, dispatch, position, scale]);

    // Handle shape selection with improved hit detection
    const handleShapeClick = useCallback((
        entityId: string,
        shapeId: string
    ) => {
        // Prevent clicks while dragging
        if (isDraggingPointRef.current) {
            return;
        }

        // Use O(1) lookup instead of traversal
        updateSelectedEntitiesIds({
            entityId,
            shapeId,
        });
    }, [updateSelectedEntitiesIds]);

    // Optimized function to find a shape at a point
    const findShapeAtPoint = useCallback((x: number, y: number): { entityId: string, shapeId: string } | null => {
        // Convert viewport coordinates to world coordinates
        const worldPos = viewportToWorld(x, y, position, scale);

        // Check each entity/shape
        for (const [entityId, entity] of Object.entries(state.entities)) {
            if (!entity.visible) continue;

            for (const [shapeId, shape] of Object.entries(entity.shapes)) {
                // Quick check with bounding box first
                const bbox = getBoundingBox(shapeId);
                if (!bbox) continue;

                // Use precise hit detection if in bounding box
                if (isPointInShape(shape, worldPos, 5 / scale)) {
                    return { entityId, shapeId };
                }
            }
        }

        return null;
    }, [state.entities, position, scale, getBoundingBox]);

    return {
        handlePointClick,
        handlePointDragStart,
        handlePointDrag,
        handlePointDragEnd,
        handleShapeDragEnd,
        handleLineClick,
        handleShapeClick,
        findShapeAtPoint,
    };
};
