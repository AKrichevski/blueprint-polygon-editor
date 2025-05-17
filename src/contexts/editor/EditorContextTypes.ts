// src/contexts/editor/EditorContextTypes.ts
import type { Entity, Point, GeometricShape, EntityMetaData } from "../../types";
import { EditMode } from "../../types";
import React from "react";

// Define action types
export type EditorAction =
    | { type: 'SET_ENTITIES'; payload: Record<string, Entity> }
    | { type: 'SET_SVG_BACKGROUND'; payload: string | null }
    | { type: 'ADD_ENTITY'; payload: { id: string; name: string; description: string; color: string } }
    | { type: 'DELETE_ENTITY'; payload: string }
    | { type: 'ADD_SHAPE'; payload: { entityId: string; shape: GeometricShape } }
    | { type: 'DELETE_SHAPE'; payload: { entityId: string; shapeId: string } }
    | { type: 'ADD_POINT'; payload: { entityId: string; shapeId: string; point: Point; index: number } }
    | { type: 'DELETE_POINT'; payload: { entityId: string; shapeId: string; pointIndex: number } }
    | { type: 'MOVE_POINT'; payload: { entityId: string; shapeId: string; pointIndex: number; newPosition: Point } }
    | { type: 'BATCH_IMPORT_ENTITIES'; payload: Record<string, Entity> }
    | { type: 'BATCH_UPDATE_SHAPES'; payload: { entityId: string; shapes: Record<string, GeometricShape> } }
    | { type: 'DUPLICATE_SHAPE'; payload: { entityId: string; shapeId: string; offset?: Point } }
    | { type: 'UPDATE_ENTITY_METADATA'; payload: { entityId: string; metaData: Partial<EntityMetaData> } }
    | { type: 'UPDATE_SHAPE_PROPERTIES'; payload: { entityId: string; shapeId: string; properties: Partial<GeometricShape> } };

// EditorState interface
export interface EditorState {
    entities: Record<string, Entity>;
    selectedEntityId: string | null;
    selectedShapeId: string | null;
    selectedPointIndex: number | null;
    scale: number;
    position: Point;
    mode: EditMode;
    svgBackground: string | null;
}

// Initial state - ensure entities is always an empty object
export const initialEditorState: EditorState = {
    entities: {},  // Always initialize as empty object
    selectedEntityId: null,
    selectedShapeId: null,
    selectedPointIndex: null,
    scale: 1,
    position: { x: 0, y: 0 },
    mode: EditMode.SELECT,
    svgBackground: null,
};

// Constants for state management
export const POSITION_EPSILON = 0.01;
export const MIN_SCALE = 0.05;
export const MAX_SCALE = 20;

// EditorContext interface
export interface EditorContextType {
    state: EditorState;
    dispatch: React.Dispatch<EditorAction>;
    saveToLocalStorage: () => boolean;
    exportData: () => string;
    importData: (jsonData: string) => boolean;
    isLoading: boolean;
}

// Local storage key
export const STORAGE_KEY = 'blueprint-polygon-editor-state';
