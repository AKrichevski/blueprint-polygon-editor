// @ts-nocheck
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
        state, scale, mode, updateMode, updatePosition, updateScale, selectedEntityId, selectedShapeIds,
        selectedShapeId,
        selectedPointIndex, updateSelectedEntitiesIds, dispatch
    } = useEditor();

    const entities = (state.entities || []) as Array<any>
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
                ctrl: true,
                description: 'Select all shapes in current entity',
                action: () => {
                    if (selectedEntityId && state.entities[selectedEntityId]) {
                        const entity = state.entities[selectedEntityId];
                        const allShapeIds = new Set(Object.keys(entity.shapes));

                        if (allShapeIds.size > 0) {
                            dispatch({ type: 'SET_SELECTED_SHAPES', payload: allShapeIds });
                        }
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
                key: '+',
                description: 'Zoom in',
                action: () => {
                    updateScale("zoom-in")
                },
            },
            {
                key: '-',
                description: 'Zoom out',
                action: () => {
                    updateScale("zoom-out")
                },
            },
            {
                key: '0',
                description: 'Reset zoom and position',
                action: () => {
                    updateScale("reset")
                    updatePosition(0, 0)
                },
            },

            // Delete shortcuts
            {
                key: 'Delete',
                description: 'Delete selected shapes or point',
                action: () => {
                    if (selectedShapeIds.size > 1) {
                        // Delete multiple shapes
                        const shapeCount = selectedShapeIds.size;
                        if (confirm(`Are you sure you want to delete ${shapeCount} shapes?`)) {
                            selectedShapeIds.forEach(shapeId => {
                                const shapeInfo = state.shapeLookup.get(shapeId);
                                if (shapeInfo) {
                                    dispatch({
                                        type: 'DELETE_SHAPE',
                                        payload: {
                                            entityId: shapeInfo.entityId,
                                            shapeId
                                        }
                                    });
                                }
                            });
                        }
                    } else if (selectedShapeId && selectedPointIndex !== null) {
                        // Delete selected point
                        dispatch({
                            type: 'DELETE_POINT',
                            payload: {
                                entityId: selectedEntityId,
                                shapeId: selectedShapeId,
                                pointIndex: selectedPointIndex,
                            },
                        });
                    } else if (selectedShapeId) {
                        // Delete single shape
                        if (confirm('Are you sure you want to delete this shape?')) {
                            dispatch({
                                type: 'DELETE_SHAPE',
                                payload: {
                                    entityId: selectedEntityId,
                                    shapeId: selectedShapeId
                                }
                            });
                        }
                    }
                },
            },

            // New shortcuts for faster workflow
            {
                key: 'Escape',
                description: 'Clear selection or cancel current operation',
                action: () => {
                    if (mode !== EditMode.SELECT) {
                        // First switch back to select mode
                        updateMode(EditMode.SELECT);
                    } else if (selectedShapeIds && selectedShapeIds.size > 0) {
                        // Clear multi-selection
                        updateSelectedEntitiesIds({ clearSelection: true });
                    } else if (selectedPointIndex !== null) {
                        // Then deselect point
                        updateSelectedEntitiesIds({ pointIndex: null });
                    } else if (selectedShapeId) {
                        // Then deselect shape
                        updateSelectedEntitiesIds({ shapeId: null });
                    }
                },
            },
            {
                key: 'f',
                description: 'Focus on selected polygon',
                action: () => {
                    // Focus on selected polygon by centering it in the view
                    if (selectedEntityId && selectedShapeId) {
                        const entity = entities.find(e => e.id === selectedEntityId);
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
                description: 'Duplicate selected shapes',
                action: () => {
                    if (selectedShapeIds && selectedEntityId && selectedShapeIds.size > 0) {
                        selectedShapeIds.forEach(shapeId => {
                            dispatch({
                                type: 'DUPLICATE_SHAPE',
                                payload: {
                                    entityId: selectedEntityId,
                                    shapeId,
                                    offset: { x: 20, y: 20 }
                                }
                            });
                        });
                    }
                },
            },
            {
                key: 'ArrowLeft',
                ctrl: true,
                description: 'Move selected point left',
                action: () => {
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const newPos = (point) => ({y: point.y, x: point.x - 1});

                        dispatch({
                            type: 'MOVE_POINT',
                            payload: {
                                entityId: selectedEntityId,
                                shapeId: selectedShapeId,
                                pointIndex: selectedPointIndex,
                                newPosition: newPos,
                            },
                        });
                    }
                },
            },
            {
                key: 'ArrowRight',
                ctrl: true,
                description: 'Move selected point right',
                action: () => {
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const newPos = (point) => ({y: point.y, x: point.x + 1});
                        dispatch({
                            type: 'MOVE_POINT',
                            payload: {
                                entityId: selectedEntityId,
                                shapeId: selectedShapeId,
                                pointIndex: selectedPointIndex,
                                newPosition: newPos,
                            },
                        });
                    }
                },
            },
            {
                key: 'ArrowUp',
                ctrl: true,
                description: 'Move selected point up by 10px',
                action: () => {
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const newPos = (point) => ({y: point.y - 1, x: point.x});
                        dispatch({
                            type: 'MOVE_POINT',
                            payload: {
                                entityId: selectedEntityId,
                                shapeId: selectedShapeId,
                                pointIndex: selectedPointIndex,
                                newPosition: newPos,
                            },
                        });
                    }
                },
            },
            {
                key: 'ArrowDown',
                ctrl: true,
                description: 'Move selected point down by 10px',
                action: () => {
                    if (
                        selectedEntityId &&
                        selectedShapeId &&
                        selectedPointIndex !== null
                    ) {
                        const newPos = (point) => ({y: point.y + 1, x: point.x});
                        dispatch({
                            type: 'MOVE_POINT',
                            payload: {
                                entityId: selectedEntityId,
                                shapeId: selectedShapeId,
                                pointIndex: selectedPointIndex,
                                newPosition: newPos,
                            },
                        });
                    }
                },
            },
        ];
    }, [state, dispatch, selectedEntityId, selectedShapeId, selectedPointIndex, scale, mode]);

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
