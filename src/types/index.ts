// src/types/index.ts

export interface Point {
    x: number;
    y: number;
}

// Bounding box interface
export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

// Base shape interface
export interface BaseShape {
    id: string;
    entity_type: string;
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
    name?: string;
    real_area?: number;
    entity_class?: string;
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
    shapes: Record<string, GeometricShape>;
    visible: boolean;
}

// State types
export interface EditorState {
    entities: Record<string, Entity>;
    svgBackground: string | null;
}

