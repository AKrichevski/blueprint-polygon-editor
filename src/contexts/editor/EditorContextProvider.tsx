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
import { editorReducer } from './EditorReducer';
import { processImportData, formatExportData } from './EditorImportExport';
import type {EditorAction, EditorContextType} from "./EditorContextTypes";
import {safeLocalStorageSave, updateBoundingBoxCache} from "./EditorUtils";
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
    const [state, dispatch] = useReducer(editorReducer, initialEditorState);

    const [isLoading, setIsLoading] = useState(true);
    const [scale, setScale] = useState(1);
    const [mode, setMode] = useState(EditMode.SELECT);
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(initialEditorState.selectedEntityId);
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(initialEditorState.selectedShapeId);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(initialEditorState.selectedPointIndex);
    const [position, setPosition] = useState(initialEditorState.position);

    // Bounding box cache for viewport culling and hit detection
    const boundingBoxCache = useRef<Map<string, BoundingBox>>(new Map());

    const lastUpdateTimeRef = useRef(0);
    const autoSaveTimeoutRef = useRef<number | null>(null);
    const storageWarningShownRef = useRef(false);

    // FIXED: Simplified move point tracking without excessive flooding protection
    // const isMovePointInProgressRef = useRef(false);
    const movePointUpdatesRef = useRef(0);
    const lastMovePointTimeRef = useRef(0);

    // Update bounding box cache when entities/shapes change
    useEffect(() => {
        // FIXED: Don't show timing warnings for normal operations
        boundingBoxCache.current = updateBoundingBoxCache(state.entities);
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
            if (action === "update-entity") {
                if (selectedEntityId !== entityId) setSelectedEntityId(entityId ?? null);
                if (entityId === null) {
                    setSelectedShapeId(null);
                    setSelectedPointIndex(null);
                }
                return;
            }

            if (entityId !== undefined && selectedEntityId !== entityId) {
                setSelectedEntityId(entityId ?? null);
                if (entityId === null) {
                    setSelectedShapeId(null);
                    setSelectedPointIndex(null);
                }
            }

            if (shapeId !== undefined && selectedShapeId !== shapeId) {
                setSelectedShapeId(shapeId);
                if (shapeId === null) {
                    setSelectedPointIndex(null);
                }
            }

            if (pointIndex !== undefined && selectedPointIndex !== pointIndex) {
                setSelectedPointIndex(pointIndex);
            }
        },
        [selectedEntityId, selectedShapeId, selectedPointIndex]
    );

    const updatePosition = useCallback((x: number, y: number) => {
        if (
            Math.abs(x - position.x) > POSITION_EPSILON ||
            Math.abs(y - position.y) > POSITION_EPSILON
        ) {
            setPosition({ x, y });
        }
    }, [position.x, position.y]);

    const updateScale = useCallback(
        (action: string, scaleValue: number = 1, minZoom: number = 0.1, maxZoom: number = 10, step: number = 0.1) => {
        let newScale = scale;
        if (action === "zoom-in" && scale < maxZoom) {
            newScale = Math.min(MAX_SCALE, scale + step);
        } else if (action === "zoom-out" && scale > minZoom) {
            newScale = Math.max(MIN_SCALE, scale - step);
        } else if (action === "reset") {
            newScale = 1;
        } else {
            newScale = scaleValue;
        }

        const finalScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        if (Math.abs(finalScale - scale) > 0.001) {
            setScale(finalScale);
        }
    }, [scale]);

    // FIXED: Simplified dispatch with basic flooding protection only for MOVE_POINT
    const throttledDispatch = useCallback((action: EditorAction) => {
        const now = performance.now();

        // Special handling ONLY for MOVE_POINT to prevent excessive updates
        if (action.type === 'MOVE_POINT') {
            // Basic throttling for move point operations
            if (now - lastMovePointTimeRef.current < 16) { // ~60fps max
                return;
            }
            lastMovePointTimeRef.current = now;

            movePointUpdatesRef.current++;
            if (movePointUpdatesRef.current > 200) {
                // Reset counter instead of blocking
                movePointUpdatesRef.current = 0;
            }
        }

        lastUpdateTimeRef.current = now;
        dispatch(action);
    }, []);

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
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        const timeoutId = setTimeout(loadData, 100);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    // Auto-save with debouncing
    useEffect(() => {
        if (isLoading) return;

        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
            autoSaveTimeoutRef.current = null;
        }

        autoSaveTimeoutRef.current = window.setTimeout(async () => {
            const toSave = {
                entities: state.entities,
                svgBackground: state.svgBackground,
            };

            try {
                const ok = await safeLocalStorageSave(STORAGE_KEY, toSave);
                if (!ok && !storageWarningShownRef.current) {
                    storageWarningShownRef.current = true;
                    console.warn("Auto-save failed: storage quota likely exceeded.");
                }
            } catch (e) {
                console.error("Auto-save failed:", e);
            }
        }, 2000);

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
                autoSaveTimeoutRef.current = null;
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

    // Expose boundingBoxCache through context
    const getBoundingBox = useCallback((shapeId: string): BoundingBox | undefined => {
        return boundingBoxCache.current.get(shapeId);
    }, []);

    // Calculate bounding box for any shape on demand
    const calculateShapeBoundingBox = useCallback((shape: GeometricShape): BoundingBox => {
        return calculateBoundingBox(shape);
    }, []);

    // FIXED: Ensure context value stability
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
        calculateShapeBoundingBox
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
