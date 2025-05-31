// @ts-nocheck
// src/features/editor/hooks/useShapeInteractions.ts
import { useCallback, useRef } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEditor } from '../../../contexts/editor';
import type { Point } from "../../../types";
import Konva from "konva";
import { isPointInShape, viewportToWorld } from '../../../utils/geometryUtils';
import { EditMode } from "../../../consts";

export const useShapeInteractions = () => {
    const {
        state,
        dispatch,
        mode,
        selectedEntityId,
        selectedShapeId,
        selectedPointIndex,
        selectedShapeIds,
        isMultiSelectMode,
        updateSelectedEntitiesIds,
        position,
        scale,
        getBoundingBox,
        openContextMenu,
        closeContextMenu
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

    // Handle point drag with optimistic updates
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

    // ENHANCED: Handle shape selection with improved multi-select support
    const handleShapeClick = useCallback((
        entityId: string,
        shapeId: string,
        e?: Konva.KonvaEventObject<MouseEvent>
    ) => {
        // Close any open context menu first
        closeContextMenu();

        // Handle multi-select mode with CTRL key
        const isCtrlPressed = e?.evt.ctrlKey || e?.evt.metaKey || isMultiSelectMode;

        if (isCtrlPressed && selectedShapeIds.size > 0) {
            // Multi-select mode: check if shape is from same entity
            const clickedShapeInfo = state.shapeLookup.get(shapeId);
            if (clickedShapeInfo && selectedEntityId && clickedShapeInfo.entityId !== selectedEntityId) {
                alert("You can only select shapes from the same entity!");
                return;
            }

            // Add or remove from selection
            updateSelectedEntitiesIds({
                entityId,
                shapeId,
                multiSelect: true
            });
        } else {
            // Single select mode
            updateSelectedEntitiesIds({
                entityId,
                shapeId,
                clearSelection: false
            });
        }
    }, [
        selectedShapeIds,
        selectedEntityId,
        isMultiSelectMode,
        state.shapeLookup,
        updateSelectedEntitiesIds,
        closeContextMenu
    ]);

    // ENHANCED: Handle right-click context menu
    const handleShapeRightClick = useCallback((
        entityId: string,
        shapeId: string,
        e: Konva.KonvaEventObject<MouseEvent>
    ) => {
        e.evt.preventDefault(); // Prevent browser context menu

        // Get the stage and calculate menu position first
        const stage = e.target.getStage();
        if (!stage) return;

        const menuPosition = {
            x: e.evt.clientX,
            y: e.evt.clientY
        };

        let contextSelection: Set<string>;
        let contextEntityId: string;

        // If this shape is already selected (part of current selection)
        if (selectedShapeIds.has(shapeId)) {
            // Use the current selection - don't change it
            contextSelection = new Set(selectedShapeIds);
            contextEntityId = selectedEntityId || entityId;
        } else {
            // Shape is not selected - select it first, then show context menu
            const clickedShapeInfo = state.shapeLookup.get(shapeId);
            if (!clickedShapeInfo) return;

            const clickedEntityId = clickedShapeInfo.entityId;

            // Check if we can add this to multi-selection
            if (selectedShapeIds.size > 0 && selectedEntityId && clickedEntityId !== selectedEntityId) {
                // Different entity - show alert and don't open context menu
                alert("You can only select shapes from the same entity!");
                return;
            }

            // Select this shape and use it for context menu
            contextSelection = new Set([shapeId]);
            contextEntityId = clickedEntityId;

            // Update the actual selection
            updateSelectedEntitiesIds({
                entityId: clickedEntityId,
                shapeId,
                clearSelection: false
            });
        }

        // Open context menu with the appropriate selection
        openContextMenu(menuPosition, contextSelection, contextEntityId);
    }, [
        selectedShapeIds,
        selectedEntityId,
        state.shapeLookup,
        updateSelectedEntitiesIds,
        openContextMenu
    ]);

    // Optimized function to find a shape at a point
    const findShapeAtPoint = useCallback((x: number, y: number): { entityId: string, shapeId: string } | null => {
        // Convert viewport coordinates to world coordinates
        const worldPos = viewportToWorld(x, y, position, scale);

        // Check each entity/shape using lookup maps for O(1) performance
        for (const [shapeId, shapeInfo] of state.shapeLookup) {
            const { entityId, shape } = shapeInfo;

            // Skip if entity is not visible
            const entity = state.entityLookup.get(entityId);
            if (!entity || !entity.visible) continue;

            // Quick check with bounding box first
            const bbox = getBoundingBox(shapeId);
            if (!bbox) continue;

            // Use precise hit detection if in bounding box
            if (isPointInShape(shape, worldPos, 5 / scale)) {
                return { entityId, shapeId };
            }
        }

        return null;
    }, [state.shapeLookup, state.entityLookup, position, scale, getBoundingBox]);

    return {
        handlePointClick,
        handlePointDragStart,
        handlePointDrag,
        handlePointDragEnd,
        handleShapeDragEnd,
        handleLineClick,
        handleShapeClick,
        handleShapeRightClick, // NEW: Right-click handler
        findShapeAtPoint,
    };
};
