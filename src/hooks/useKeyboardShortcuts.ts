// src/hooks/useKeyboardShortcuts.ts
import {useEffect, useCallback} from 'react';
import {useEditor} from "../contexts/editor";
import {EditMode} from "../consts";

interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    action: () => void;
}

export function useKeyboardShortcuts() {
    const {
        state, scale, mode, updateMode, updatePosition, updateScale, selectedEntityId,
        selectedShapeId,
        selectedPointIndex, updateSelectedEntitiesIds, dispatch
    } = useEditor();

    // Get all available shortcuts
    const getShortcuts = useCallback((): ShortcutConfig[] => {
        return [
            // Mode shortcuts
            {
                key: 's',
                description: 'Switch to Select mode',
                action: () => updateMode(EditMode.SELECT),
            },
            {
                key: 'a',
                description: 'Switch to Add Polygon mode (when entity is selected)',
                action: () => {
                    if (selectedEntityId) {
                        updateMode(EditMode.ADD_POLYGON);
                    }
                },
            },
            {
                key: 'p',
                description: 'Switch to Add Point mode (when polygon is selected)',
                action: () => {
                    if (selectedShapeId) {
                        updateMode(EditMode.ADD_POINT)
                    }
                },
            },
            {
                key: 'd',
                description: 'Switch to Delete Point mode (when polygon is selected)',
                action: () => {
                    if (selectedShapeId) {
                        updateMode(EditMode.DELETE_POINT)
                    }
                },
            },

            // Zoom shortcuts
            {
                key: '=',
                ctrl: true,
                description: 'Zoom in',
                action: () => {
                    updateScale("zoom-in")
                },
            },
            {
                key: '-',
                ctrl: true,
                description: 'Zoom out',
                action: () => {
                    updateScale("zoom-out")
                },
            },
            {
                key: '0',
                ctrl: true,
                description: 'Reset zoom and position',
                action: () => {
                    updateScale("reset")
                    updatePosition(0, 0)
                },
            },

            // Delete shortcuts
            {
                key: 'Delete',
                description: 'Delete selected point (if polygon has >3 points)',
                action: () => {
                    // If a point is selected and we have enough points
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const entity = state.entities.find(e => e.id === selectedEntityId);
                        const polygon = entity?.polygons.find(p => p.id === selectedShapeId);

                        if (polygon && polygon.points.length > 3) {
                            dispatch({
                                type: 'DELETE_POINT',
                                payload: {
                                    entityId: selectedEntityId,
                                    polygonId: selectedShapeId,
                                    pointIndex: selectedPointIndex,
                                },
                            });
                        }
                    }
                },
            },

            // New shortcuts for faster workflow
            {
                key: 'Escape',
                description: 'Cancel current operation or deselect',
                action: () => {
                    if (mode !== EditMode.SELECT) {
                        // First switch back to select mode
                        updateMode(EditMode.SELECT)
                    } else if (selectedPointIndex !== null) {
                        // Then deselect point
                        updateSelectedEntitiesIds({pointIndex: selectedPointIndex})
                    } else if (selectedShapeId) {
                        updateSelectedEntitiesIds({shapeId: selectedPointIndex})
                        // Then deselect polygon
                    }
                },
            },
            {
                key: 'f',
                description: 'Focus on selected polygon',
                action: () => {
                    // Focus on selected polygon by centering it in the view
                    if (selectedEntityId && selectedShapeId) {
                        const entity = state.entities.find(e => e.id === selectedEntityId);
                        const polygon = entity?.polygons.find(p => p.id === selectedShapeId);

                        if (polygon && polygon.points.length > 0) {
                            // Calculate center of polygon
                            let sumX = 0;
                            let sumY = 0;

                            for (const point of polygon.points) {
                                sumX += point.x;
                                sumY += point.y;
                            }

                            const centerX = sumX / polygon.points.length;
                            const centerY = sumY / polygon.points.length;

                            // Set position to center the polygon
                            const windowWidth = window.innerWidth;
                            const windowHeight = window.innerHeight;

                            const x = windowWidth / 2 - centerX * scale
                            const y = windowHeight / 2 - centerY * scale

                            updatePosition(x, y)
                        }
                    }
                },
            },
            {
                key: 'c',
                ctrl: true,
                description: 'Copy selected polygon',
                action: () => {
                    // Copy the selected polygon to a new polygon with a slight offset
                    if (selectedEntityId && selectedShapeId) {
                        const entity = state.entities.find(e => e.id === selectedEntityId);
                        const polygon = entity?.polygons.find(p => p.id === selectedShapeId);

                        if (polygon) {
                            // Create a copy of points with a slight offset
                            const offsetPoints = polygon.points.map(point => ({
                                x: point.x + 20,
                                y: point.y + 20,
                            }));

                            dispatch({
                                type: 'ADD_POLYGON',
                                payload: {
                                    entityId: selectedEntityId,
                                    points: offsetPoints,
                                },
                            });
                        }
                    }
                },
            },
            {
                key: 'ArrowUp',
                description: 'Move selected point up',
                action: () => {
                    // Move the selected point
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const entity = state.entities.find(e => e.id === selectedEntityId);
                        const polygon = entity?.polygons.find(p => p.id === selectedPolygonId);

                        if (polygon) {
                            const point = polygon.points[selectedPointIndex];
                            const newPos = {...point, y: point.y - 1};

                            dispatch({
                                type: 'MOVE_POINT',
                                payload: {
                                    entityId: selectedEntityId,
                                    polygonId: selectedShapeId,
                                    pointIndex: selectedPointIndex,
                                    newPosition: newPos,
                                },
                            });
                        }
                    }
                },
            },
            {
                key: 'ArrowDown',
                description: 'Move selected point down',
                action: () => {
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const entity = state.entities.find(e => e.id === selectedEntityId);
                        const polygon = entity?.polygons.find(p => p.id === selectedShapeId);

                        if (polygon) {
                            const point = polygon.points[selectedPointIndex];
                            const newPos = {...point, y: point.y + 1};

                            dispatch({
                                type: 'MOVE_POINT',
                                payload: {
                                    entityId: selectedEntityId,
                                    polygonId: selectedShapeId,
                                    pointIndex: selectedPointIndex,
                                    newPosition: newPos,
                                },
                            });
                        }
                    }
                },
            },
            {
                key: 'ArrowLeft',
                description: 'Move selected point left',
                action: () => {
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const entity = state.entities.find(e => e.id === selectedEntityId);
                        const polygon = entity?.polygons.find(p => p.id === selectedShapeId);

                        if (polygon) {
                            const point = polygon.points[selectedPointIndex];
                            const newPos = {...point, x: point.x - 1};

                            dispatch({
                                type: 'MOVE_POINT',
                                payload: {
                                    entityId: selectedEntityId,
                                    polygonId: selectedShapeId,
                                    pointIndex: selectedPointIndex,
                                    newPosition: newPos,
                                },
                            });
                        }
                    }
                },
            },
            {
                key: 'ArrowRight',
                description: 'Move selected point right',
                action: () => {
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const entity = state.entities.find(e => e.id === selectedEntityId);
                        const polygon = entity?.polygons.find(p => p.id === selectedShapeId);

                        if (polygon) {
                            const point = polygon.points[selectedPointIndex];
                            const newPos = {...point, x: point.x + 1};

                            dispatch({
                                type: 'MOVE_POINT',
                                payload: {
                                    entityId: selectedEntityId,
                                    polygonId: selectedShapeId,
                                    pointIndex: selectedPointIndex,
                                    newPosition: newPos,
                                },
                            });
                        }
                    }
                },
            },
            {
                key: 'ArrowUp',
                shift: true,
                description: 'Move selected point up by 10px',
                action: () => {
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const entity = state.entities.find(e => e.id === selectedEntityId);
                        const polygon = entity?.polygons.find(p => p.id === selectedShapeId);

                        if (polygon) {
                            const point = polygon.points[selectedPointIndex];
                            const newPos = {...point, y: point.y - 10};

                            dispatch({
                                type: 'MOVE_POINT',
                                payload: {
                                    entityId: selectedEntityId,
                                    polygonId: selectedShapeId,
                                    pointIndex: selectedPointIndex,
                                    newPosition: newPos,
                                },
                            });
                        }
                    }
                },
            },
            {
                key: 'ArrowDown',
                shift: true,
                description: 'Move selected point down by 10px',
                action: () => {
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const entity = state.entities.find(e => e.id === selectedEntityId);
                        const polygon = entity?.polygons.find(p => p.id === selectedShapeId);

                        if (polygon) {
                            const point = polygon.points[selectedPointIndex];
                            const newPos = {...point, y: point.y + 10};

                            dispatch({
                                type: 'MOVE_POINT',
                                payload: {
                                    entityId: selectedEntityId,
                                    polygonId: selectedShapeId,
                                    pointIndex: selectedPointIndex,
                                    newPosition: newPos,
                                },
                            });
                        }
                    }
                },
            },
            {
                key: 'ArrowLeft',
                shift: true,
                description: 'Move selected point left by 10px',
                action: () => {
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const entity = state.entities.find(e => e.id === selectedEntityId);
                        const polygon = entity?.polygons.find(p => p.id === selectedShapeId);

                        if (polygon) {
                            const point = polygon.points[selectedPointIndex];
                            const newPos = {...point, x: point.x - 10};

                            dispatch({
                                type: 'MOVE_POINT',
                                payload: {
                                    entityId: selectedEntityId,
                                    polygonId: selectedShapeId,
                                    pointIndex: selectedPointIndex,
                                    newPosition: newPos,
                                },
                            });
                        }
                    }
                },
            },
            {
                key: 'ArrowRight',
                shift: true,
                description: 'Move selected point right by 10px',
                action: () => {
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const entity = state.entities.find(e => e.id === selectedEntityId);
                        const polygon = entity?.polygons.find(p => p.id === selectedShapeId);

                        if (polygon) {
                            const point = polygon.points[selectedPointIndex];
                            const newPos = {...point, x: point.x + 10};

                            dispatch({
                                type: 'MOVE_POINT',
                                payload: {
                                    entityId: selectedEntityId,
                                    polygonId: selectedShapeId,
                                    pointIndex: selectedPointIndex,
                                    newPosition: newPos,
                                },
                            });
                        }
                    }
                },
            },
        ];
    }, [state, dispatch]);

    // Register keyboard shortcuts
    useEffect(() => {
        const shortcuts = getShortcuts();

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const matchingShortcut = shortcuts.find(shortcut => {
                const keyMatch = e.key === shortcut.key;
                const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
                const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
                const altMatch = shortcut.alt ? e.altKey : !e.altKey;

                return keyMatch && ctrlMatch && shiftMatch && altMatch;
            });

            if (matchingShortcut) {
                e.preventDefault();
                matchingShortcut.action();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [getShortcuts]);

    // Export all shortcuts for the help modal
    return {
        shortcuts: getShortcuts(),
    };
}
