// @ts-nocheck
// src/contexts/editor/EditorContextTypes.ts
import type {Entity, Point, GeometricShape, EntityMetaData, BoundingBox} from "../../types";
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
    | { type: 'MOVE_POINT'; payload: { entityId: string; shapeId: string; pointIndex: number; newPosition: (point: Point) => Point } | {x: number, y: number }}
    | { type: 'MOVE_SHAPE'; payload: { entityId: string; shapeId: string; offset: Point } }
    | { type: 'BATCH_IMPORT_ENTITIES'; payload: Record<string, Entity> }
    | { type: 'BATCH_UPDATE_SHAPES'; payload: { entityId: string; shapes: Record<string, GeometricShape> } }
    | { type: 'DUPLICATE_SHAPE'; payload: { entityId: string; shapeId: string; offset?: Point } }
    | { type: 'UPDATE_ENTITY_METADATA'; payload: { entityId: string; metaData: Partial<EntityMetaData> } }
    | {
    type: 'UPDATE_SHAPE_PROPERTIES';
    payload: { entityId: string; shapeId: string; properties: Partial<GeometricShape> }
}
    | { type: 'TOGGLE_ENTITY_VISIBILITY'; payload: { entityId: string } }
    | {
    type: 'UPDATE_LOOKUP_MAPS';
    payload: {
        entityLookup: Map<string, Entity>;
        shapeLookup: Map<string, { entityId: string; shape: GeometricShape }>
    }
}
    | {
    type: 'MOVE_EDGE'; payload: {
        entityId: string;
        shapeId: string;
        startIndex: number;
        endIndex: number;
        newStartPosition: Point;
        newEndPosition: Point
    }
}
    // NEW: Actions for multi-selection
    | { type: 'SET_SELECTED_SHAPES'; payload: Set<string> }
    | { type: 'CLEAR_SELECTION'; payload: void }
    | { type: 'ADD_TO_SELECTION'; payload: string }
    | { type: 'REMOVE_FROM_SELECTION'; payload: string }

    // NEW: Action for moving shapes between entities
    | {
    type: 'MOVE_SHAPES_TO_ENTITY';
    payload: {
        fromEntityId: string;
        toEntityId: string;
        shapeIds: string[];
    }
};

// EditorState interface with performance optimizations
export interface EditorState {
    entities: Record<string, Entity>;
    selectedEntityId: string | null;
    selectedShapeId: string | null;
    selectedPointIndex: number | null;
    // NEW: Support for multi-selection
    selectedShapeIds: Set<string>;
    scale: number;
    position: Point;
    mode: EditMode;
    svgBackground: string | null;

    // Performance optimization: lookup maps for O(1) access
    entityLookup: Map<string, Entity>;
    shapeLookup: Map<string, {
        entityId: string;
        shape: GeometricShape;
    }>;

    // Bounding box cache for fast hit detection and culling
    boundingBoxCache: Map<string, BoundingBox>;
}

// NEW: Context menu types
export interface ContextMenuState {
    isOpen: boolean;
    position: { x: number; y: number };
    selectedShapeIds: Set<string>;
    selectedEntityId: string | null;
}

export interface ContextMenuAction {
    label: string;
    icon?: string;
    action: () => void;
    disabled?: boolean;
    submenu?: ContextMenuAction[];
}

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
    // NEW: Multi-selection support
    selectedShapeIds: Set<string>;
    isMultiSelectMode: boolean;
    updateSelectedEntitiesIds: (params: {
        pointIndex?: number;
        shapeId?: string;
        entityId?: string;
        multiSelect?: boolean;
        clearSelection?: boolean;
    }) => boolean;
    getBoundingBox: (shapeId: string) => BoundingBox | undefined;
    calculateShapeBoundingBox: (shape: GeometricShape) => BoundingBox;
    boundingBoxCache: Map<string, BoundingBox>;
    // NEW: Context menu state and actions
    contextMenu: ContextMenuState;
    openContextMenu: (position: { x: number; y: number }, shapeIds: Set<string>, entityId: string) => void;
    closeContextMenu: () => void;
    moveShapesToEntity: (fromEntityId: string, toEntityId: string, shapeIds: string[]) => void;
}

// Performance monitoring types
export interface PerformanceMetrics {
    renderTime: number;
    frameRate: number;
    memoryUsage: number;
    shapeCount: number;
    visibleShapeCount: number;
}

// Viewport culling types
export interface ViewportBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    scale: number;
    center: Point;
}

// Cache types for performance
export interface ShapeCache {
    boundingBox: BoundingBox;
    lastModified: number;
    isVisible: boolean;
}

export interface EntityCache {
    shapeCount: number;
    totalBounds: BoundingBox;
    lastModified: number;
    isVisible: boolean;
}
