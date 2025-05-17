// src/features/editor/hooks/useShapeInteractions.ts
import {useCallback, useRef} from 'react';
import {KonvaEventObject} from 'konva/lib/Node';
import {useEditor} from '../../../contexts/editor';
import type {Point} from "../../../types";
import {EditMode} from "../../../types";
import Konva from "konva";

// Constants to stabilize movements
// const CLICK_TIMEOUT = 150;  // Timeout between clicks to prevent double processing

export const useShapeInteractions = () => {
    const {state, dispatch, mode, selectedEntityId, selectedShapeId, selectedPointIndex, updateSelectedEntitiesIds} = useEditor();

    // Use refs to track interaction state without triggering renders
    // const lastInteractionTimeRef = useRef(0);
    const isDraggingPointRef = useRef(false);
    const dragStartPositionRef = useRef<Point | null>(null);
    const dragUpdateCountRef = useRef(0);
    const lastDragTimeRef = useRef(0);

    // Handle point click - when user clicks on a point
    const handlePointClick = useCallback((
        entityId: string,
        shapeId: string,
        pointIndex: number
    ) => {
        // Prevent processing the same click multiple times or clicking while dragging
        // const now = Date.now();
        // if (now - lastInteractionTimeRef.current < CLICK_TIMEOUT || isDraggingPointRef.current) {
        //     return;
        // }
        // lastInteractionTimeRef.current = now;

        if (mode === EditMode.SELECT) {
            updateSelectedEntitiesIds({
                entityId,
                shapeId,
                pointIndex
            });
        } else if (mode === EditMode.DELETE_POINT) {
            // Ensure shape maintains minimum points before deletion
            const entity = state.entities[entityId];
            const shape = entity?.shapes[shapeId];

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
    }, [mode, state.entities, updateSelectedEntitiesIds, dispatch]);

    // Handle point drag start
    const handlePointDragStart = useCallback((
        entityId: string,
        shapeId: string,
        pointIndex: number,
        e: KonvaEventObject<DragEvent>
    ) => {
        // Mark as dragging to prevent click handlers from firing
        isDraggingPointRef.current = true;
        dragUpdateCountRef.current = 0;
        lastDragTimeRef.current = Date.now();

        // Store the initial position of the point in stage coordinates
        const shape = e.target;
        if (shape && shape.getStage()) {
            // const stage = shape.getStage();

            // Get the initial absolute position
            const initialPos = shape.absolutePosition();
            dragStartPositionRef.current = {
                x: initialPos.x,
                y: initialPos.y
            };
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
    }, [selectedEntityId, selectedShapeId, selectedPointIndex, updateSelectedEntitiesIds]);

    // Handle point drag with protection against infinite updates
    const handlePointDrag = useCallback((
        entityId: string,
        shapeId: string,
        pointIndex: number,
        e: Konva.KonvaEventObject<DragEvent>
    ) => {
        // Skip if we don't have necessary objects
        if (!e.target || !e.target.getStage()) return;

        // Throttle updates to prevent excessive re-renders
        const now = Date.now();
        if (now - lastDragTimeRef.current < 16) { // ~60fps
            return;
        }
        lastDragTimeRef.current = now;

        // Count updates to detect potential infinite loops
        dragUpdateCountRef.current++;
        if (dragUpdateCountRef.current > 100) {
            console.warn('Too many drag updates in a single operation - stopping to prevent infinite loop');
            return;
        }

        // Get the stage
        const stage = e.target.getStage();

        // Get point position in stage coordinates
        const pointPos = e.target.absolutePosition();

        // Convert to world coordinates using the current transform
        const stageAttrs = stage.attrs;
        const scaleX = stageAttrs.scaleX || 1;
        const scaleY = stageAttrs.scaleY || 1;
        const stageX = stageAttrs.x || 0;
        const stageY = stageAttrs.y || 0;

        const worldX = (pointPos.x - stageX) / scaleX;
        const worldY = (pointPos.y - stageY) / scaleY;

        // Round to prevent floating point errors
        const roundedPos = {
            x: Math.round(worldX * 100) / 100,
            y: Math.round(worldY * 100) / 100
        };

        // Only update if the position has changed significantly
        if (dragStartPositionRef.current) {
            const dx = Math.abs(roundedPos.x - dragStartPositionRef.current.x);
            const dy = Math.abs(roundedPos.y - dragStartPositionRef.current.y);

            if (dx < 0.5 && dy < 0.5) {
                return; // Too small a movement
            }
        }

        // Update state
        dispatch({
            type: 'MOVE_POINT',
            payload: {
                entityId,
                shapeId,
                pointIndex,
                newPosition: roundedPos,
            },
        });

        // Update the drag start position
        dragStartPositionRef.current = roundedPos;
    }, [dispatch]);

    // Handle point drag end
    const handlePointDragEnd = useCallback((
        entityId: string,
        shapeId: string,
        pointIndex: number,
        e: Konva.KonvaEventObject<DragEvent>
    ) => {
        // Reset dragging state after a brief delay to prevent click handlers from firing
        // setTimeout(() => {
        isDraggingPointRef.current = false;
        dragStartPositionRef.current = null;
        dragUpdateCountRef.current = 0;
        // }, 50);

        // Get final position to ensure state is updated with the final position
        if (e.target && e.target.getStage()) {
            const stage = e.target.getStage();
            const stagePoint = e.target.absolutePosition();

            // Convert stage coordinates to world coordinates
            const stageAttrs = stage.attrs;
            const scaleX = stageAttrs.scaleX || 1;
            const scaleY = stageAttrs.scaleY || 1;
            const stageX = stageAttrs.x || 0;
            const stageY = stageAttrs.y || 0;

            const worldX = (stagePoint.x - stageX) / scaleX;
            const worldY = (stagePoint.y - stageY) / scaleY;

            // Round to prevent floating point errors
            const roundedPos = {
                x: Math.round(worldX * 100) / 100,
                y: Math.round(worldY * 100) / 100
            };

            // Final update to state
            dispatch({
                type: 'MOVE_POINT',
                payload: {
                    entityId,
                    shapeId,
                    pointIndex,
                    newPosition: roundedPos,
                },
            });
        }
    }, [dispatch]);

    // Handle shape line click for adding new points - with better coordinate handling
    const handleLineClick = useCallback((
        entityId: string,
        shapeId: string,
        startPointIndex: number,
        e: KonvaEventObject<MouseEvent>
    ) => {
        if (mode !== EditMode.ADD_POINT) return;

        // // Prevent clicking too rapidly
        // const now = Date.now();
        // if (now - lastInteractionTimeRef.current < CLICK_TIMEOUT) {
        //     return;
        // }
        // lastInteractionTimeRef.current = now;

        const stage = e.target.getStage();
        if (!stage) return;

        // Get pointer position in stage coordinates
        const stagePos = stage.getPointerPosition();
        if (!stagePos) return;

        // Convert to world coordinates
        const stageAttrs = stage.attrs;
        const scaleX = stageAttrs.scaleX || 1;
        const scaleY = stageAttrs.scaleY || 1;
        const stageX = stageAttrs.x || 0;
        const stageY = stageAttrs.y || 0;

        const worldPos = {
            x: (stagePos.x - stageX) / scaleX,
            y: (stagePos.y - stageY) / scaleY,
        };

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
    }, [mode, dispatch]);

    // Handle shape selection with debounce
    const handleShapeClick = useCallback((
        entityId: string,
        shapeId: string
    ) => {
        // Prevent double clicks or clicks while dragging
        // const now = Date.now();
        // if (now - lastInteractionTimeRef.current < CLICK_TIMEOUT || isDraggingPointRef.current) {
        //     return;
        // }
        // lastInteractionTimeRef.current = now;

        // Use batch selection to improve performance
        updateSelectedEntitiesIds({
            entityId,
            shapeId,
        });
    }, [updateSelectedEntitiesIds]);

    return {
        handlePointClick,
        handlePointDragStart,
        handlePointDrag,
        handlePointDragEnd,
        handleLineClick,
        handleShapeClick
    };
};
