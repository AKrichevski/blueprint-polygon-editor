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
import { initialEditorState, MAX_SCALE, MIN_SCALE, POSITION_EPSILON, STORAGE_KEY } from './EditorContextTypes.ts';
import type { EditorAction, EditorContextType } from "./EditorContextTypes.ts";
import { safeLocalStorageSave } from "./EditorUtils.ts";
import { EditMode } from "../../types";

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

    const lastUpdateTimeRef = useRef(0);
    const autoSaveTimeoutRef = useRef<number | null>(null);
    const storageWarningShownRef = useRef(false);
    const isMovePointInProgressRef = useRef(false);
    const movePointUpdatesRef = useRef(0);

    const updateMode = useCallback((newMode: EditMode) => {
        if (newMode !== mode) setMode(newMode);
    }, [mode]);

    const updateSelectedEntitiesIds = useCallback(
        ({ entityId, shapeId, pointIndex }) => {
            if (selectedEntityId !== entityId) setSelectedEntityId(entityId);
            if (selectedShapeId !== shapeId) setSelectedShapeId(shapeId);
            if (selectedPointIndex !== pointIndex) setSelectedPointIndex(pointIndex);
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

    const updateScale = useCallback((action, scaleValue = 1, minZoom = 0.1, maxZoom = 10, step = 0.1) => {
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
        setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)));
    }, [scale]);

    const throttledDispatch = useCallback((action: EditorAction) => {
        const now = performance.now();

        if (action.type === 'MOVE_POINT') {
            if (!isMovePointInProgressRef.current) {
                isMovePointInProgressRef.current = true;
                movePointUpdatesRef.current = 0;
            }
            movePointUpdatesRef.current++;

            if (movePointUpdatesRef.current > 100) {
                console.warn('MOVE_POINT dispatch flood blocked.');
                return;
            }
        } else {
            isMovePointInProgressRef.current = false;
            movePointUpdatesRef.current = 0;
        }

        lastUpdateTimeRef.current = now;
        dispatch(action);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const timeoutId = setTimeout(() => {
            if (!isMounted) return;

            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return;

                const parsed = JSON.parse(raw);
                if (parsed.entities) dispatch({ type: 'SET_ENTITIES', payload: parsed.entities });
                if (parsed.svgBackground) dispatch({ type: 'SET_SVG_BACKGROUND', payload: parsed.svgBackground });
            } catch (e) {
                console.error("Failed to restore from localStorage:", e);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }, 200);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

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
