// @ts-nocheck
// src/contexts/editor/EditorContextProvider.tsx
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
import type {EditorAction, EditorContextType} from "./EditorContextTypes";
import {safeLocalStorageSave, batchActions} from "./EditorUtils";
import {calculateBoundingBox} from "../../utils/geometryUtils.ts";
import {
    EditMode,
    initialEditorState,
    MAX_SCALE,
    MIN_SCALE,
    POSITION_EPSILON,
    STORAGE_KEY
} from "../../consts";
import type {BoundingBox, GeometricShape} from "../../types";

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Enhanced initial state with bounding box cache
    const [state, dispatch] = useReducer(editorReducer, {
        ...initialEditorState,
        boundingBoxCache: new Map<string, BoundingBox>()
    });

    const [isLoading, setIsLoading] = useState(true);
    const [scale, setScale] = useState(1);
    const [mode, setMode] = useState(EditMode.SELECT);
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Performance tracking
    const lastUpdateTimeRef = useRef(0);
    const autoSaveTimeoutRef = useRef<number | null>(null);
    const storageWarningShownRef = useRef(false);

    // Batch update queue for better performance
    const updateQueueRef = useRef<EditorAction[]>([]);
    const updateTimeoutRef = useRef<number | null>(null);

    // Update all lookups when entities change (already optimized in reducer)
    useEffect(() => {
        if (state.entities && Object.keys(state.entities).length > 0) {
            // Lookups are already updated in the reducer, no need to recalculate
            return;
        }
    }, [state.entities]);

    const updateMode = useCallback((newMode: EditMode) => {
        if (newMode !== mode) {
            setMode(newMode);
        }
    }, [mode]);

    const updateSelectedEntitiesIds = useCallback(
        ({
             entityId,
             shapeId,
             pointIndex,
             action = "update"
         }: {
            entityId?: string;
            shapeId?: string;
            pointIndex?: number;
            action?: string;
        }) => {
            // Batch selection updates to avoid multiple renders
            let hasChanges = false;

            if (entityId !== undefined && selectedEntityId !== entityId) {
                setSelectedEntityId(entityId ?? null);
                hasChanges = true;
                if (entityId === null) {
                    setSelectedShapeId(null);
                    setSelectedPointIndex(null);
                }
            }

            if (shapeId !== undefined && selectedShapeId !== shapeId) {
                setSelectedShapeId(shapeId);
                hasChanges = true;
                if (shapeId === null) {
                    setSelectedPointIndex(null);
                }
            }

            if (pointIndex !== undefined && selectedPointIndex !== pointIndex) {
                setSelectedPointIndex(pointIndex);
                hasChanges = true;
            }

            return hasChanges;
        },
        [selectedEntityId, selectedShapeId, selectedPointIndex]
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

    // Load from localStorage
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) {
                    if (isMounted) setIsLoading(false);
                    return;
                }

                const parsed = JSON.parse(raw);
                if (parsed.entities && isMounted) {
                    dispatch({ type: 'SET_ENTITIES', payload: parsed.entities });
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

    // Memoized context value
    const contextValue = useMemo(() => ({
        state,
        dispatch: throttledDispatch,
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
        updateSelectedEntitiesIds,
        getBoundingBox,
        calculateShapeBoundingBox,
        boundingBoxCache: state.boundingBoxCache
    }), [
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
        updateSelectedEntitiesIds,
        getBoundingBox,
        calculateShapeBoundingBox
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
