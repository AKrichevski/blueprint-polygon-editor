// @ts-nocheck
// src/features/editor/hooks/useCanvasEvents.ts
import React, {useCallback, useState, useRef} from 'react';
import {KonvaEventObject} from 'konva/lib/Node';
import Konva from 'konva';
import {useEditor} from "../../../contexts/editor";
import type {Point} from "../../../types";
import {viewportToWorld, worldToViewport} from "../../../utils/geometryUtils";
import {EditMode} from "../../../consts";

// Constants for smoother interactions
const MIN_SCALE = 0.05;
const MAX_SCALE = 20;
const ZOOM_RATE = 0.001;
const ZOOM_THRESHOLD = 0.0001;

export const useCanvasEvents = (
    stageRef: React.RefObject<Konva.Stage | null>,
    width?: number,
    height?: number,
    newPolygonPoints?: Point[],
    setNewPolygonPoints?: React.Dispatch<React.SetStateAction<Point[]>>
) => {
    const {
        mode,
        scale,
        position,
        selectedEntityId,
        selectedShapeIds,
        updateScale,
        updatePosition,
        updateSelectedEntitiesIds,
        closeContextMenu
    } = useEditor();

    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number, y: number } | null>(null);
    const lastMousePositionRef = useRef<{ x: number, y: number } | null>(null);
    const lastUpdateTimeRef = useRef(0);

    // Enhanced wheel handler for smooth zooming
    const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();

        if (!stageRef.current) return;

        // Get current time for throttling
        const now = performance.now();
        // Skip if updating too frequently (except first event)
        if (now - lastUpdateTimeRef.current < 16 && lastUpdateTimeRef.current !== 0) {
            return;
        }
        lastUpdateTimeRef.current = now;

        // Get mouse position in stage coordinates
        const stage = stageRef.current;
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        // Store precise mouse position in world coordinates before zoom
        const mouseWorldPos = viewportToWorld(pointerPos.x, pointerPos.y, position, scale);

        // Calculate new scale - using deltaY for direction
        const delta = -e.evt.deltaY;
        const scaleBy = 1 + (Math.sign(delta) * Math.min(Math.abs(delta * ZOOM_RATE), 0.1));

        // Calculate new scale with limits
        let newScale = scale * scaleBy;
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

        // Skip tiny changes that won't be visible
        if (Math.abs(newScale - scale) < ZOOM_THRESHOLD) {
            return;
        }

        // Calculate new position to maintain the mouse world position
        const mousePos = pointerPos;
        const x = mousePos.x - mouseWorldPos.x * newScale;
        const y = mousePos.y - mouseWorldPos.y * newScale;

        updateScale("other", newScale)
        updatePosition(x, y)
    }, [stageRef, position, scale, updateScale, updatePosition]);

    // Canvas drag handling without interfering with shape dragging
    const handleCanvasMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
        // Close context menu on any click
        closeContextMenu();

        // Only handle canvas drag in select mode and when no shape is targeted
        if (mode !== EditMode.SELECT || e.target !== e.target.getStage()) {
            return;
        }

        // Check if we're clicking on a draggable element
        const target = e.target;
        if (target.isDragging && target.isDragging()) {
            return;
        }

        // Check if target has draggable ancestors
        let currentTarget = target;
        while (currentTarget) {
            if (currentTarget.draggable && currentTarget.draggable()) {
                return;
            }
            currentTarget = currentTarget.getParent();
        }

        setIsDragging(true);
        dragStartRef.current = {
            x: e.evt.clientX - position.x,
            y: e.evt.clientY - position.y
        };
    }, [mode, position, closeContextMenu]);

    const handleCanvasMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
        if (!isDragging || !dragStartRef.current) {
            return;
        }

        const x = e.evt.clientX - dragStartRef.current?.x;
        const y = e.evt.clientY - dragStartRef.current?.y

        updatePosition(x, y)
    }, [isDragging, updatePosition]);

    const handleCanvasMouseUp = useCallback((e: KonvaEventObject<MouseEvent>) => {
        setIsDragging(false);
        dragStartRef.current = null;
    }, []);

    // ENHANCED: Canvas click with multi-selection support
    const handleCanvasClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
        // Ignore clicks during drag
        if (isDragging || !stageRef.current) return;

        // Skip if clicking on a shape
        if (e.target !== e.target.getStage()) return;

        // ENHANCED: Clear selection when clicking on empty canvas
        // But only if CTRL is not pressed (to allow multi-select to persist)
        const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;

        if (!isCtrlPressed && selectedShapeIds.size > 0) {
            // Clear all selections when clicking on empty canvas
            updateSelectedEntitiesIds({ clearSelection: true });
        }

        // Get click position for polygon creation
        const clickPos = stageRef.current.getPointerPosition();
        if (!clickPos) return;

        // Only add points in ADD_POLYGON mode and when an entity is selected
        if (mode === EditMode.ADD_POLYGON && selectedEntityId) {
            // Get precise world coordinates
            const worldPos = viewportToWorld(clickPos.x, clickPos.y, position, scale);

            // Add point with fixed precision to avoid floating point issues
            if (setNewPolygonPoints) {
                setNewPolygonPoints(prev => [
                    ...prev,
                    {
                        x: Math.round(worldPos.x * 100) / 100,
                        y: Math.round(worldPos.y * 100) / 100
                    }
                ]);
            }
        }
    }, [
        isDragging,
        stageRef,
        mode,
        selectedEntityId,
        selectedShapeIds,
        position,
        scale,
        setNewPolygonPoints,
        updateSelectedEntitiesIds
    ]);

    // Track mouse position for coordinate display
    const handleMouseMove = useCallback(() => {
        if (!stageRef.current) return;

        const pos = stageRef.current.getPointerPosition();
        if (pos) {
            lastMousePositionRef.current = {x: pos.x, y: pos.y};
        }
    }, [stageRef]);

    const handleMouseLeave = useCallback(() => {
        lastMousePositionRef.current = null;
        setIsDragging(false);
        dragStartRef.current = null;
    }, []);

    // ENHANCED: Handle right-click context menu
    const handleCanvasRightClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
        e.evt.preventDefault(); // Prevent browser context menu

        // Close any existing context menu
        closeContextMenu();

        // Don't show context menu on empty canvas - only on shapes
    }, [closeContextMenu]);

    return {
        handleWheel,
        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleCanvasClick,
        handleCanvasRightClick, // NEW: Right-click handler
        handleMouseMove,
        handleMouseLeave,
        isDragging,
        stageToWorld: (x: number, y: number) => viewportToWorld(x, y, position, scale),
        worldToStage: (x: number, y: number) => worldToViewport(x, y, position, scale)
    };
};
