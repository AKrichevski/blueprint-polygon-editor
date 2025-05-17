// src/types/index.ts

export interface Point {
    x: number;
    y: number;
}

// Base shape interface
export interface BaseShape {
    id: string;
    entityType: string;
    subType: string;
    shapeType: 'point' | 'line' | 'arc' | 'polygon' | 'rectangle' | 'circle' | 'ellipse' | 'text';
}

// Specific shape interfaces
export interface PointShape extends BaseShape {
    shapeType: 'point';
    point: Point;
    style?: {
        radius?: number;
        fillColor?: string;
        strokeColor?: string;
    };
}

export interface LineShape extends BaseShape {
    shapeType: 'line';
    points: [Point, Point]; // Start and end points
    style?: {
        strokeColor?: string;
        strokeWidth?: number;
        dashPattern?: number[];
    };
}

export interface ArcShape extends BaseShape {
    shapeType: 'arc';
    center: Point;
    radius: number;
    startAngle: number; // in degrees
    endAngle: number;   // in degrees
    style?: {
        strokeColor?: string;
        strokeWidth?: number;
        fillColor?: string;
    };
}

export interface CircleShape extends BaseShape {
    shapeType: 'circle';
    center: Point;
    radius: number;
    style?: {
        strokeColor?: string;
        strokeWidth?: number;
        fillColor?: string;
    };
}

export interface EllipseShape extends BaseShape {
    shapeType: 'ellipse';
    center: Point;
    radiusX: number;
    radiusY: number;
    rotation?: number; // in degrees
    style?: {
        strokeColor?: string;
        strokeWidth?: number;
        fillColor?: string;
    };
}

export interface PolygonShape extends BaseShape {
    shapeType: 'polygon' | 'rectangle'; // Rectangle is a special case of polygon
    points: Point[];
    style?: {
        strokeColor?: string;
        strokeWidth?: number;
        fillColor?: string;
    };
}

export interface TextShape extends BaseShape {
    shapeType: 'text';
    position: Point;
    text: string;
    style?: {
        fontSize?: number;
        fontFamily?: string;
        color?: string;
        align?: 'left' | 'center' | 'right';
        rotation?: number; // in degrees
    };
}

// Union type for all shapes
export type GeometricShape =
    | PointShape
    | LineShape
    | ArcShape
    | CircleShape
    | EllipseShape
    | PolygonShape
    | TextShape;

// Entity structure remains similar but uses shapes instead of polygons
export interface EntityMetaData {
    fontColor: string;
    altText: string;
    entityName: string;
}

export interface Entity {
    id: string;
    metaData: EntityMetaData;
    shapes: Record<string, GeometricShape>; // Changed from polygons to shapes
}

// State types
export interface EditorState {
    entities: Record<string, Entity>;
    selectedEntityId: string | null;
    selectedShapeId: string | null;  // Changed from selectedPolygonId
    selectedPointIndex: number | null; // Still used for polygons, lines, etc.
    scale: number;
    position: Point;
    mode: EditMode;
    svgBackground: string | null;
}

export enum EditMode {
    SELECT = 'select',
    ADD_POINT = 'add_point',
    DELETE_POINT = 'delete_point',
    ADD_SHAPE = 'add_shape', // Generic shape adding mode
    ADD_POLYGON = 'add_polygon',
    ADD_LINE = 'add_line',
    ADD_CIRCLE = 'add_circle',
    ADD_RECTANGLE = 'add_rectangle',
    ADD_ARC = 'add_arc',
    ADD_ELLIPSE = 'add_ellipse',
    ADD_TEXT = 'add_text'
}
