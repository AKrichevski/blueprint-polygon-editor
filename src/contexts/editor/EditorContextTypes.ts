// src/contexts/editor/EditorContextTypes.ts
import type { Entity, Point, GeometricShape, EntityMetaData, BoundingBox } from "../../types";
import React from "react";
import {EditMode} from "../../consts";

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
    | { type: 'UPDATE_SHAPE_PROPERTIES'; payload: { entityId: string; shapeId: string; properties: Partial<GeometricShape> } }
    | { type: 'TOGGLE_ENTITY_VISIBILITY'; payload: { entityId: string } }
    | { type: 'UPDATE_LOOKUP_MAPS'; payload: { entityLookup: Map<string, Entity>; shapeLookup: Map<string, { entityId: string; shape: GeometricShape }> } };

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
    // New lookup maps for performance optimization
    entityLookup: Map<string, Entity>;
    shapeLookup: Map<string, {
        entityId: string;
        shape: GeometricShape;
    }>;
    // In Phase 2, we'll add:
    // spatialIndex?: RBush<SpatialItem>;
}





// EditorContext interface
export interface EditorContextType {
    state: EditorState;
    dispatch: React.Dispatch<EditorAction>;
    saveToLocalStorage: () => Promise<boolean>;
    exportData: () => string;
    importData: (jsonData: string) => boolean;
    isLoading: boolean;
    scale: number;
    mode: EditMode;
    updateMode: (newMode: EditMode) => void;
    updateScale: (action: string, scaleValue?: number, minZoom?: number, maxZoom?: number, step?: number) => void;
    position: Point;
    updatePosition: (x: number, y: number) => void;
    selectedEntityId: string | null;
    selectedShapeId: string | null;
    selectedPointIndex: number | null;
    updateSelectedEntitiesIds: (params: {
        entityId?: string | null;
        shapeId?: string | null;
        pointIndex?: number | null;
        action?: string;
    }) => void;
}


