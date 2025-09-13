// @ts-nocheck
// src/contexts/editor/EditorContextProvider.tsx - Enhanced multi-select section
import React, {
    createContext,
    useReducer,
    useContext,
    useCallback,
    useState,
    useEffect,
    useRef,
    useMemo,
} from 'react';
import { editorReducer, createOptimizedLookups } from './EditorReducer';
import { processImportData, formatExportData } from './EditorImportExport';
import type { EditorAction, EditorContextType, ContextMenuState } from "./EditorContextTypes";
import { safeLocalStorageSave, batchActions } from "./EditorUtils";
import { calculateBoundingBox } from "../../utils/geometryUtils";
import {
    EditMode,
    initialEditorState,
    defaultEntities,
    MAX_SCALE,
    MIN_SCALE,
    POSITION_EPSILON,
    STORAGE_KEY
} from "../../consts";
import type { BoundingBox, GeometricShape } from "../../types";

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Enhanced initial state with multi-selection support
    const [state, dispatch] = useReducer(editorReducer, {
        ...initialEditorState,
        boundingBoxCache: new Map<string, BoundingBox>(),
        selectedShapeIds: new Set<string>()
    });

    // Initialize lookup maps with default entities
    useEffect(() => {
        if (Object.keys(state.entities).length > 0 && state.entityLookup.size === 0) {
            const lookups = createOptimizedLookups(state.entities);
            dispatch({
                type: 'UPDATE_LOOKUP_MAPS',
                payload: {
                    entityLookup: lookups.entityLookup,
                    shapeLookup: lookups.shapeLookup
                }
            });
        }
    }, [state.entities, state.entityLookup.size]);

    const [isLoading, setIsLoading] = useState(true);
    const [scale, setScale] = useState(1);
    const [mode, setMode] = useState(EditMode.SELECT);
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const [selectedShapeIds, setSelectedShapeIds] = useState<Set<string>>(new Set());
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // NEW: Context menu state
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        isOpen: false,
        position: { x: 0, y: 0 },
        selectedShapeIds: new Set(),
        selectedEntityId: null
    });

    // Performance tracking
    const lastUpdateTimeRef = useRef(0);
    const autoSaveTimeoutRef = useRef<number | null>(null);
    const updateQueueRef = useRef<EditorAction[]>([]);
    const updateTimeoutRef = useRef<number | null>(null);

    // ENHANCED: Track CTRL key state for multi-select mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                setIsMultiSelectMode(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) {
                setIsMultiSelectMode(false);
            }
        };

        const handleWindowBlur = () => {
            setIsMultiSelectMode(false);
        };

        // Handle escape key to clear selection
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                dispatch({ type: 'CLEAR_SELECTION' });
                setSelectedEntityId(null);
                setSelectedShapeId(null);
                setSelectedPointIndex(null);
                setContextMenu(prev => ({ ...prev, isOpen: false }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('keydown', handleEscapeKey);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, []);

    // Sync selectedShapeIds state with reducer state
    useEffect(() => {
        setSelectedShapeIds(state.selectedShapeIds);
    }, [state.selectedShapeIds]);

    const updateMode = useCallback((newMode: EditMode) => {
        if (newMode !== mode) {
            setMode(newMode);
            // Clear multi-selection when changing modes (except SELECT mode)
            if (newMode !== EditMode.SELECT) {
                dispatch({ type: 'CLEAR_SELECTION' });
                setContextMenu(prev => ({ ...prev, isOpen: false }));
            }
        }
    }, [mode]);

    // ENHANCED: Multi-selection handler with better entity validation
    const updateSelectedEntitiesIds = useCallback(
        ({
             entityId,
             shapeId,
             pointIndex,
             multiSelect = false,
             clearSelection = false,
         }: {
            entityId?: string;
            shapeId?: string;
            pointIndex?: number;
            multiSelect?: boolean;
            clearSelection?: boolean;
        }): boolean => {
            let hasChanges = false;

            // Handle clear selection
            if (clearSelection) {
                dispatch({ type: 'CLEAR_SELECTION' });
                setSelectedEntityId(null);
                setSelectedShapeId(null);
                setSelectedPointIndex(null);
                setContextMenu(prev => ({ ...prev, isOpen: false }));
                return true;
            }

            // ENHANCED: Handle shape selection with multi-select support
            if (shapeId !== undefined) {
                // Get entity of the clicked shape using lookup map for O(1) performance
                const clickedShapeInfo = state.shapeLookup.get(shapeId);
                if (!clickedShapeInfo) {
                    console.warn(`Shape ${shapeId} not found in lookup`);
                    return false;
                }

                const clickedEntityId = clickedShapeInfo.entityId;

                // Check multi-select constraints
                if (multiSelect && isMultiSelectMode && selectedShapeIds.size > 0) {
                    // Ensure all selections are from the same entity
                    if (selectedEntityId && clickedEntityId !== selectedEntityId) {
                        // Show alert and don't proceed with selection
                        alert("You can only select shapes from the same entity!");
                        return false;
                    }

                    // Toggle selection
                    if (selectedShapeIds.has(shapeId)) {
                        dispatch({ type: 'REMOVE_FROM_SELECTION', payload: shapeId });
                    } else {
                        dispatch({ type: 'ADD_TO_SELECTION', payload: shapeId });
                    }

                    setSelectedShapeId(shapeId);
                    if (!selectedEntityId) {
                        setSelectedEntityId(clickedEntityId);
                    }
                    hasChanges = true;
                } else {
                    // Single select mode - clear previous selections
                    const newSelection = new Set([shapeId]);
                    dispatch({ type: 'SET_SELECTED_SHAPES', payload: newSelection });
                    setSelectedShapeId(shapeId);
                    setSelectedEntityId(clickedEntityId);
                    hasChanges = true;
                }

                // Clear point selection when selecting shapes
                if (pointIndex === undefined) {
                    setSelectedPointIndex(null);
                }
            }

            // Handle entity selection
            if (entityId !== undefined && selectedEntityId !== entityId) {
                setSelectedEntityId(entityId ?? null);
                hasChanges = true;
                if (entityId === null) {
                    setSelectedShapeId(null);
                    setSelectedPointIndex(null);
                    dispatch({ type: 'CLEAR_SELECTION' });
                }
            }

            // Handle point selection
            if (pointIndex !== undefined && selectedPointIndex !== pointIndex) {
                setSelectedPointIndex(pointIndex);
                hasChanges = true;
            }

            return hasChanges;
        },
        [
            selectedEntityId,
            selectedShapeId,
            selectedPointIndex,
            selectedShapeIds,
            isMultiSelectMode,
            state.shapeLookup,
            dispatch
        ]
    );

    const updatePosition = useCallback((x: number, y: number) => {
        setPosition(prev => {
            if (Math.abs(x - prev.x) > POSITION_EPSILON ||
                Math.abs(y - prev.y) > POSITION_EPSILON) {
                return { x, y };
            }
            return prev;
        });
    }, []);

    const updateScale = useCallback(
        (action: string, scaleValue: number = 1, minZoom: number = 0.1, maxZoom: number = 10, step: number = 0.1) => {
            setScale(prev => {
                let newScale = prev;

                if (action === "zoom-in" && prev < maxZoom) {
                    newScale = Math.min(MAX_SCALE, prev + step);
                } else if (action === "zoom-out" && prev > minZoom) {
                    newScale = Math.max(MIN_SCALE, prev - step);
                } else if (action === "reset") {
                    newScale = 1;
                } else {
                    newScale = scaleValue;
                }

                const finalScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
                return Math.abs(finalScale - prev) > 0.001 ? finalScale : prev;
            });
        },
        []
    );

    // Batched dispatch to reduce re-renders
    const batchedDispatch = useCallback((action: EditorAction) => {
        updateQueueRef.current.push(action);

        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Process batch after a short delay
        updateTimeoutRef.current = window.setTimeout(() => {
            const queue = updateQueueRef.current;
            updateQueueRef.current = [];

            // Process all queued actions
            if (queue.length === 1) {
                dispatch(queue[0]);
            } else if (queue.length > 1) {
                // Combine similar actions where possible
                const combinedActions = combineActions(queue);
                combinedActions.forEach(action => dispatch(action));
            }
        }, 16); // ~60fps
    }, []);

    // Helper to combine similar actions
    const combineActions = (actions: EditorAction[]): EditorAction[] => {
        return batchActions(actions);
    };

    // Optimized throttled dispatch
    const throttledDispatch = useCallback((action: EditorAction) => {
        const now = performance.now();

        // Special handling for high-frequency actions
        if (action.type === 'MOVE_POINT') {
            batchedDispatch(action);
        } else {
            // Direct dispatch for other actions
            dispatch(action);
        }

        lastUpdateTimeRef.current = now;
    }, [batchedDispatch]);

    // ENHANCED: Context menu functions with better state management
    const openContextMenu = useCallback((
        position: { x: number; y: number },
        shapeIds: Set<string>,
        entityId: string
    ) => {
        // Validate that all shapes belong to the same entity
        const validShapeIds = new Set<string>();
        for (const shapeId of shapeIds) {
            const shapeInfo = state.shapeLookup.get(shapeId);
            if (shapeInfo && shapeInfo.entityId === entityId) {
                validShapeIds.add(shapeId);
            }
        }

        if (validShapeIds.size === 0) {
            console.warn('No valid shapes for context menu');
            return;
        }

        setContextMenu({
            isOpen: true,
            position,
            selectedShapeIds: validShapeIds,
            selectedEntityId: entityId
        });
    }, [state.shapeLookup]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    }, []);

    const moveShapesToEntity = useCallback((
        fromEntityId: string,
        toEntityId: string,
        shapeIds: string[]
    ) => {
        // Validate entities exist
        const fromEntity = state.entityLookup.get(fromEntityId);
        const toEntity = state.entityLookup.get(toEntityId);

        if (!fromEntity || !toEntity) {
            console.error('Invalid entity IDs for move operation');
            return;
        }

        // Validate all shapes belong to the from entity
        const validShapeIds = shapeIds.filter(shapeId => {
            const shapeInfo = state.shapeLookup.get(shapeId);
            return shapeInfo && shapeInfo.entityId === fromEntityId;
        });

        if (validShapeIds.length === 0) {
            console.warn('No valid shapes to move');
            return;
        }

        dispatch({
            type: 'MOVE_SHAPES_TO_ENTITY',
            payload: {
                fromEntityId,
                toEntityId,
                shapeIds: validShapeIds
            }
        });

        closeContextMenu();

        // Update local selections to reflect the move
        setSelectedEntityId(toEntityId);
        dispatch({ type: 'CLEAR_SELECTION' });
    }, [dispatch, closeContextMenu, state.entityLookup, state.shapeLookup]);

    // Load from localStorage
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) {
                    // No saved data, but ensure default entities are present
                    if (isMounted) {
                        dispatch({ type: 'SET_ENTITIES', payload: defaultEntities });
                        setIsLoading(false);
                    }
                    return;
                }

                const parsed = JSON.parse(raw);
                if (parsed.entities && isMounted) {
                    // Merge with default entities to ensure recycle_bin is always present
                    const mergedEntities = {
                        ...defaultEntities, // Default entities (including recycle_bin)
                        ...parsed.entities // User's saved entities
                    };
                    dispatch({ type: 'SET_ENTITIES', payload: mergedEntities });
                }
                if (parsed.svgBackground && isMounted) {
                    dispatch({ type: 'SET_SVG_BACKGROUND', payload: parsed.svgBackground });
                }
            } catch (e) {
                console.error("Failed to restore from localStorage:", e);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, []);

    // Auto-save with debouncing
    useEffect(() => {
        if (isLoading) return;

        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = window.setTimeout(async () => {
            const toSave = {
                entities: state.entities,
                svgBackground: state.svgBackground,
            };

            try {
                await safeLocalStorageSave(STORAGE_KEY, toSave);
            } catch (e) {
                console.error("Auto-save failed:", e);
            }
        }, 2000);

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [state.entities, state.svgBackground, isLoading]);

    const saveToLocalStorage = useCallback(async () => {
        try {
            return await safeLocalStorageSave(STORAGE_KEY, {
                entities: state.entities,
                svgBackground: state.svgBackground
            });
        } catch (err) {
            console.error("Manual save failed:", err);
            return false;
        }
    }, [state.entities, state.svgBackground]);

    const exportData = useCallback(() => {
        return formatExportData(state.entities, state.svgBackground);
    }, [state.entities, state.svgBackground]);

    const importData = useCallback((jsonData: string) => {
        setIsLoading(true);
        const ok = processImportData(jsonData, dispatch, updateScale, updatePosition);
        setIsLoading(false);
        return ok;
    }, [updateScale, updatePosition]);

    // Direct access to bounding box cache
    const getBoundingBox = useCallback((shapeId: string): BoundingBox | undefined => {
        return state.boundingBoxCache?.get(shapeId);
    }, [state.boundingBoxCache]);

    // Calculate bounding box on demand
    const calculateShapeBoundingBox = useCallback((shape: GeometricShape): BoundingBox => {
        return calculateBoundingBox(shape);
    }, []);

    // ENHANCED: Handle context menu click outside detection
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenu.isOpen) {
                // Check if click was outside the context menu
                const target = e.target as Element;
                if (!target.closest('[role="menu"]') &&
                    !target.closest('[data-mui-context-menu]')) {
                    closeContextMenu();
                }
            }
        };

        // Handle escape key to close context menu
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && contextMenu.isOpen) {
                closeContextMenu();
            }
        };

        if (contextMenu.isOpen) {
            // Add slight delay to prevent immediate closure
            const timeoutId = setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
                document.addEventListener('keydown', handleEscapeKey);
            }, 100);

            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('click', handleClickOutside);
                document.removeEventListener('keydown', handleEscapeKey);
            };
        }
    }, [contextMenu.isOpen, closeContextMenu]);

    // ENHANCED: Auto-close context menu when selection changes
    useEffect(() => {
        if (contextMenu.isOpen) {
            // If the selected shapes change significantly, close context menu
            const contextShapeIds = Array.from(contextMenu.selectedShapeIds);
            const currentShapeIds = Array.from(selectedShapeIds);

            // Check if context menu shapes are still selected
            const stillSelected = contextShapeIds.every(id => currentShapeIds.includes(id));

            if (!stillSelected) {
                closeContextMenu();
            }
        }
    }, [selectedShapeIds, contextMenu, closeContextMenu]);

    // ENHANCED: Performance monitoring and debugging
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const logPerformance = () => {
                const entityCount = Object.keys(state.entities).length;
                const totalShapes = Object.values(state.entities).reduce(
                    (total, entity) => total + Object.keys(entity.shapes || {}).length,
                    0
                );
                const selectedCount = selectedShapeIds.size;

                console.debug('Editor Performance:', {
                    entities: entityCount,
                    totalShapes,
                    selectedShapes: selectedCount,
                    multiSelectMode: isMultiSelectMode,
                    boundingBoxCacheSize: state.boundingBoxCache.size,
                    shapeLookupSize: state.shapeLookup.size
                });
            };

            // Log performance every 10 seconds in development
            const interval = setInterval(logPerformance, 10000);
            return () => clearInterval(interval);
        }
    }, [state, selectedShapeIds, isMultiSelectMode]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, []);

    // ENHANCED: Memoized context value with comprehensive functionality
    const contextValue = useMemo(() => ({
        // Core state
        state,
        dispatch: throttledDispatch,

        // Data management
        saveToLocalStorage,
        exportData,
        importData,
        isLoading,

        // View state
        scale,
        mode,
        updateMode,
        updateScale,
        position,
        updatePosition,

        // Selection state - ENHANCED with multi-select
        selectedEntityId,
        selectedShapeId,
        selectedPointIndex,
        selectedShapeIds,
        isMultiSelectMode,
        updateSelectedEntitiesIds,

        // Performance optimization
        getBoundingBox,
        calculateShapeBoundingBox,
        boundingBoxCache: state.boundingBoxCache,

        // ENHANCED: Context menu functionality
        contextMenu,
        openContextMenu,
        closeContextMenu,
        moveShapesToEntity,

        // ENHANCED: Additional utility functions
        getSelectedShapeCount: () => selectedShapeIds.size,
        hasMultipleShapesSelected: () => selectedShapeIds.size > 1,
        isShapeSelected: (shapeId: string) => selectedShapeIds.has(shapeId),
        getSelectedEntityName: () => {
            if (selectedEntityId && state.entities[selectedEntityId]) {
                return state.entities[selectedEntityId].metaData.entityName;
            }
            return null;
        },

        // ENHANCED: Batch operations for multi-selection
        deleteSelectedShapes: () => {
            if (selectedShapeIds.size > 0 && selectedEntityId) {
                const shapeCount = selectedShapeIds.size;
                const confirmation = confirm(
                    `Are you sure you want to delete ${shapeCount} shape${shapeCount > 1 ? 's' : ''}?`
                );

                if (confirmation) {
                    selectedShapeIds.forEach(shapeId => {
                        throttledDispatch({
                            type: 'DELETE_SHAPE',
                            payload: {
                                entityId: selectedEntityId,
                                shapeId
                            }
                        });
                    });

                    // Clear selection after deletion
                    throttledDispatch({ type: 'CLEAR_SELECTION' });
                }
            }
        },

        duplicateSelectedShapes: () => {
            if (selectedShapeIds.size > 0 && selectedEntityId) {
                selectedShapeIds.forEach(shapeId => {
                    throttledDispatch({
                        type: 'DUPLICATE_SHAPE',
                        payload: {
                            entityId: selectedEntityId,
                            shapeId,
                            offset: { x: 20, y: 20 }
                        }
                    });
                });
            }
        }
    }), [
        // Dependencies for memoization
        state,
        throttledDispatch,
        saveToLocalStorage,
        exportData,
        importData,
        isLoading,
        scale,
        mode,
        updateMode,
        updateScale,
        position,
        updatePosition,
        selectedEntityId,
        selectedShapeId,
        selectedPointIndex,
        selectedShapeIds,
        isMultiSelectMode,
        updateSelectedEntitiesIds,
        getBoundingBox,
        calculateShapeBoundingBox,
        contextMenu,
        openContextMenu,
        closeContextMenu,
        moveShapesToEntity
    ]);

    return (
        <EditorContext.Provider value={contextValue}>
            {children}
        </EditorContext.Provider>
    );
};

export const useEditor = (): EditorContextType => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};
