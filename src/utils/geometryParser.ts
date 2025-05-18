// src/utils/geometryParser.ts


import type {
    ArcShape,
    CircleShape,
    EllipseShape,
    GeometricShape,
    LineShape,
    Point,
    PointShape,
    PolygonShape, TextShape
} from "../types";

interface RawShape {
    id?: string;
    entityType?: string;
    subType?: string;
    type?: string; // The geometry type from JSON
    shapeType?: string; // Alternative field name
    geomType?: string; // Another alternative field name
    [key: string]: any; // Allow other properties
}

/**
 * Parse a raw shape object from JSON into a typed GeometricShape
 * Enhanced with better shape detection based on coordinates and properties
 */
export function parseShape(rawShape: RawShape, entityId: string): GeometricShape | null {
    try {
        // Extract the shape type from various possible fields
        let shapeType = rawShape.type || rawShape.shapeType || rawShape.geomType;
            if (rawShape.points.length === 1) {
                shapeType = 'point';
            }
            if (rawShape.points.length === 2) {
                shapeType = 'line';
            }

        // If no explicit type, try to infer from properties
        if (!shapeType) {
            shapeType = inferShapeType(rawShape);
        }

        if (!shapeType) {
            console.warn('Shape missing type information:', rawShape);
            return null;
        }

        // Generate ID if not provided
        const id = rawShape.id || `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Common properties
        const baseShape = {
            id,
            entityType: rawShape.entityType || entityId,
            subType: rawShape.subType || "",
        };

        // Parse based on shape type
        switch (shapeType.toLowerCase()) {
            case 'point':
                return parsePoint(rawShape, baseShape);

            case 'line':
            case 'linestring':
            case 'polyline':
                return parseLine(rawShape, baseShape);

            case 'arc':
                return parseArc(rawShape, baseShape);

            case 'circle':
                return parseCircle(rawShape, baseShape);

            case 'ellipse':
                return parseEllipse(rawShape, baseShape);

            case 'polygon':
                return parsePolygon(rawShape, baseShape);

            case 'rectangle':
            case 'rect':
                return parseRectangle(rawShape, baseShape);

            case 'text':
                return parseText(rawShape, baseShape);

            default:
                console.warn(`Unknown shape type: ${shapeType}`);
                // Try to infer from coordinates if type is unknown
                const inferredShape = inferAndParseShape(rawShape, baseShape);
                if (inferredShape) {
                    return inferredShape;
                }
                return null;
        }
    } catch (error) {
        console.error('Error parsing shape:', error, rawShape);
        return null;
    }
}

/**
 * Infer shape type from available properties and coordinates
 */
function inferShapeType(rawShape: RawShape): string | null {
    // Check for point (single coordinate)
    if ((rawShape.x !== undefined && rawShape.y !== undefined) ||
        (rawShape.point && typeof rawShape.point === 'object') ||
        (rawShape.coordinates && Array.isArray(rawShape.coordinates) && rawShape.coordinates.length === 2 &&
            typeof rawShape.coordinates[0] === 'number')) {
        return 'point';
    }

    // Check for circle (center + radius)
    if ((rawShape.center || (rawShape.cx !== undefined && rawShape.cy !== undefined)) &&
        (rawShape.radius !== undefined || rawShape.r !== undefined)) {
        return 'circle';
    }

    // Check for ellipse (center + two radii)
    if ((rawShape.center || (rawShape.cx !== undefined && rawShape.cy !== undefined)) &&
        ((rawShape.radiusX !== undefined && rawShape.radiusY !== undefined) ||
            (rawShape.rx !== undefined && rawShape.ry !== undefined))) {
        return 'ellipse';
    }

    // Check for arc (center + radius + angles)
    if ((rawShape.center || (rawShape.cx !== undefined && rawShape.cy !== undefined)) &&
        (rawShape.radius !== undefined || rawShape.r !== undefined) &&
        (rawShape.startAngle !== undefined || rawShape.endAngle !== undefined)) {
        return 'arc';
    }

    // Check for text (text content + position)
    if (rawShape.text && (rawShape.position || (rawShape.x !== undefined && rawShape.y !== undefined))) {
        return 'text';
    }

    // Check for line (exactly 2 points)
    if (rawShape.points && Array.isArray(rawShape.points) && rawShape.points.length === 2) {
        return 'line';
    }

    // Check for rectangle (4 points in rectangular arrangement)
    if (rawShape.points && Array.isArray(rawShape.points) && rawShape.points.length === 4) {
        const points = parsePointArray(rawShape.points);
        if (points.length === 4 && isRectangle(points)) {
            return 'rectangle';
        }
    }

    // Check for polygon (3+ points)
    if (rawShape.points && Array.isArray(rawShape.points) && rawShape.points.length >= 3) {
        return 'polygon';
    }

    // Check for rectangle defined by position and dimensions
    if ((rawShape.x !== undefined && rawShape.y !== undefined &&
            rawShape.width !== undefined && rawShape.height !== undefined) ||
        (rawShape.topLeft && rawShape.bottomRight)) {
        return 'rectangle';
    }

    return null;
}

/**
 * Check if 4 points form a rectangle
 */
function isRectangle(points: Point[]): boolean {
    if (points.length !== 4) return false;

    // Check if points form right angles
    const dx1 = points[1].x - points[0].x;
    const dy1 = points[1].y - points[0].y;
    const dx2 = points[2].x - points[1].x;
    const dy2 = points[2].y - points[1].y;

    // Check if adjacent sides are perpendicular
    const dot1 = dx1 * dx2 + dy1 * dy2;

    const dx3 = points[3].x - points[2].x;
    const dy3 = points[3].y - points[2].y;
    const dot2 = dx2 * dx3 + dy2 * dy3;

    const dx4 = points[0].x - points[3].x;
    const dy4 = points[0].y - points[3].y;
    const dot3 = dx3 * dx4 + dy3 * dy4;

    // Allow small tolerance for floating point errors
    const tolerance = 0.01;
    return Math.abs(dot1) < tolerance && Math.abs(dot2) < tolerance && Math.abs(dot3) < tolerance;
}

/**
 * Try to infer and parse shape when type is unknown
 */
function inferAndParseShape(rawShape: RawShape, baseShape: any): GeometricShape | null {
    const inferredType = inferShapeType(rawShape);
    if (!inferredType) return null;

    // Create a new shape with the inferred type
    const shapeWithType = {
        ...rawShape,
        shapeType: inferredType
    };

    // Parse it again with the inferred type
    return parseShape(shapeWithType, baseShape.entityType);
}

/**
 * Parse a point from raw data
 */
function parsePoint(rawShape: RawShape, baseShape: any): PointShape | null {
    const point = parseCoordinates(rawShape.point || rawShape.coordinates || {x: rawShape.x, y: rawShape.y});
    if (!point || Array.isArray(point)) return null;

    return {
        ...baseShape,
        shapeType: 'point' as const,
        point,
        style: parseShapeStyle(rawShape.style)
    };
}

/**
 * Parse a line from raw data
 */
function parseLine(rawShape: RawShape, baseShape: any): LineShape | null {
    let points: Point[] = [];

    // Handle different line formats
    if (rawShape.points) {
        points = parsePointArray(rawShape.points);
    } else if (rawShape.coordinates) {
        const coords = parseCoordinates(rawShape.coordinates);
        if (Array.isArray(coords)) {
            points = coords;
        }
    } else if (rawShape.startPoint && rawShape.endPoint) {
        const start = parseCoordinates(rawShape.startPoint);
        const end = parseCoordinates(rawShape.endPoint);
        if (start && end && !Array.isArray(start) && !Array.isArray(end)) {
            points = [start, end];
        }
    }

    if (points.length < 2) {
        console.warn('Line requires at least 2 points');
        return null;
    }

    // For a simple line, we just need start and end points
    return {
        ...baseShape,
        shapeType: 'line' as const,
        points: [points[0], points[points.length - 1]] as [Point, Point],
        style: parseShapeStyle(rawShape.style)
    };
}

/**
 * Parse an arc from raw data
 */
function parseArc(rawShape: RawShape, baseShape: any): ArcShape | null {
    let center: Point | null = null;
    let radius: number;
    let startAngle: number;
    let endAngle: number;

    // Handle different arc formats
    if (rawShape.center) {
        center = parseCoordinates(rawShape.center) as Point;
    } else if (rawShape.cx !== undefined && rawShape.cy !== undefined) {
        center = { x: rawShape.cx, y: rawShape.cy };
    }

    radius = parseFloat(rawShape.radius || rawShape.r);
    startAngle = parseFloat(rawShape.startAngle || 0);
    endAngle = parseFloat(rawShape.endAngle || 360);

    if (!center || isNaN(radius)) {
        console.warn('Arc requires center and radius');
        return null;
    }

    return {
        ...baseShape,
        shapeType: 'arc' as const,
        center,
        radius,
        startAngle,
        endAngle,
        style: parseShapeStyle(rawShape.style)
    };
}

/**
 * Parse a circle from raw data
 */
function parseCircle(rawShape: RawShape, baseShape: any): CircleShape | null {
    let center: Point | null = null;
    let radius: number;

    // Handle different circle formats
    if (rawShape.center) {
        center = parseCoordinates(rawShape.center) as Point;
    } else if (rawShape.cx !== undefined && rawShape.cy !== undefined) {
        center = { x: parseFloat(rawShape.cx), y: parseFloat(rawShape.cy) };
    }

    radius = parseFloat(rawShape.radius || rawShape.r);

    if (!center || isNaN(radius)) {
        console.warn('Circle requires center and radius');
        return null;
    }

    return {
        ...baseShape,
        shapeType: 'circle' as const,
        center,
        radius,
        style: parseShapeStyle(rawShape.style)
    };
}

/**
 * Parse an ellipse from raw data
 */
function parseEllipse(rawShape: RawShape, baseShape: any): EllipseShape | null {
    let center: Point | null = null;
    let radiusX: number;
    let radiusY: number;
    let rotation: number = 0;

    // Handle different ellipse formats
    if (rawShape.center) {
        center = parseCoordinates(rawShape.center) as Point;
    } else if (rawShape.cx !== undefined && rawShape.cy !== undefined) {
        center = { x: parseFloat(rawShape.cx), y: parseFloat(rawShape.cy) };
    }

    radiusX = parseFloat(rawShape.radiusX || rawShape.rx);
    radiusY = parseFloat(rawShape.radiusY || rawShape.ry);
    rotation = parseFloat(rawShape.rotation || 0);

    if (!center || isNaN(radiusX) || isNaN(radiusY)) {
        console.warn('Ellipse requires center and radii');
        return null;
    }

    return {
        ...baseShape,
        shapeType: 'ellipse' as const,
        center,
        radiusX,
        radiusY,
        rotation,
        style: parseShapeStyle(rawShape.style)
    };
}

/**
 * Parse a polygon from raw data
 */
function parsePolygon(rawShape: RawShape, baseShape: any): PolygonShape | null {
    let points: Point[] = [];

    // Handle different polygon formats
    if (rawShape.points) {
        points = parsePointArray(rawShape.points);
    } else if (rawShape.coordinates) {
        const coords = parseCoordinates(rawShape.coordinates);
        if (Array.isArray(coords)) {
            points = coords;
        }
    }

    if (points.length < 3) {
        console.warn('Polygon requires at least 3 points');
        return null;
    }

    return {
        ...baseShape,
        shapeType: 'polygon' as const,
        points,
        style: parseShapeStyle(rawShape.style)
    };
}

/**
 * Parse a rectangle from raw data
 */
function parseRectangle(rawShape: RawShape, baseShape: any): PolygonShape | null {
    let x: number, y: number, width: number, height: number;

    // Handle different rectangle formats
    if (rawShape.x !== undefined && rawShape.y !== undefined &&
        rawShape.width !== undefined && rawShape.height !== undefined) {
        x = parseFloat(rawShape.x);
        y = parseFloat(rawShape.y);
        width = parseFloat(rawShape.width);
        height = parseFloat(rawShape.height);
    } else if (rawShape.topLeft && rawShape.bottomRight) {
        const topLeft = parseCoordinates(rawShape.topLeft) as Point;
        const bottomRight = parseCoordinates(rawShape.bottomRight) as Point;
        if (!topLeft || !bottomRight) return null;

        x = topLeft.x;
        y = topLeft.y;
        width = bottomRight.x - topLeft.x;
        height = bottomRight.y - topLeft.y;
    } else if (rawShape.points && Array.isArray(rawShape.points) && rawShape.points.length === 4) {
        // If we have 4 points, use them directly
        const points = parsePointArray(rawShape.points);
        if (points.length === 4) {
            return {
                ...baseShape,
                shapeType: 'rectangle' as const,
                points,
                style: parseShapeStyle(rawShape.style)
            };
        }
        return null;
    } else {
        console.warn('Rectangle requires position and dimensions');
        return null;
    }

    // Convert rectangle to polygon points
    const points: Point[] = [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height }
    ];

    return {
        ...baseShape,
        shapeType: 'rectangle' as const,
        points,
        style: parseShapeStyle(rawShape.style)
    };
}

/**
 * Parse text from raw data
 */
function parseText(rawShape: RawShape, baseShape: any): TextShape | null {
    let position: Point | null = null;
    const text = rawShape.text || rawShape.content || "";

    // Handle different position formats
    if (rawShape.position) {
        position = parseCoordinates(rawShape.position) as Point;
    } else if (rawShape.coordinates) {
        position = parseCoordinates(rawShape.coordinates) as Point;
    } else if (rawShape.x !== undefined && rawShape.y !== undefined) {
        position = { x: parseFloat(rawShape.x), y: parseFloat(rawShape.y) };
    }

    if (!position || !text) {
        console.warn('Text requires position and content');
        return null;
    }

    return {
        ...baseShape,
        shapeType: 'text' as const,
        position,
        text,
        style: parseTextStyle(rawShape.style)
    };
}

/**
 * Parse style information for shapes
 */
function parseShapeStyle(rawStyle: any): any {
    if (!rawStyle) return undefined;

    return {
        strokeColor: rawStyle.strokeColor || rawStyle.stroke || rawStyle.lineColor,
        strokeWidth: parseFloat(rawStyle.strokeWidth || rawStyle.lineWidth || 1),
        fillColor: rawStyle.fillColor || rawStyle.fill,
        dashPattern: rawStyle.dashPattern || rawStyle.lineDash,
        radius: parseFloat(rawStyle.radius || rawStyle.pointRadius || 3),
    };
}

/**
 * Parse style information for text
 */
function parseTextStyle(rawStyle: any): any {
    if (!rawStyle) return undefined;

    return {
        fontSize: parseFloat(rawStyle.fontSize || 12),
        fontFamily: rawStyle.fontFamily || rawStyle.font || 'Arial',
        color: rawStyle.color || rawStyle.textColor || '#000000',
        align: rawStyle.align || rawStyle.textAlign || 'left',
        rotation: parseFloat(rawStyle.rotation || 0),
    };
}

/**
 * Parse coordinates from various formats
 */
function parseCoordinates(coords: any): Point | Point[] | null {
    if (!coords) return null;

    // Single point object
    if (typeof coords === 'object' && 'x' in coords && 'y' in coords) {
        return { x: parseFloat(coords.x), y: parseFloat(coords.y) };
    }

    // Array of coordinates [x, y]
    if (Array.isArray(coords) && coords.length === 2 &&
        typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        return { x: coords[0], y: coords[1] };
    }

    // Array of points
    if (Array.isArray(coords)) {
        return parsePointArray(coords);
    }

    return null;
}

/**
 * Parse an array of points from various formats
 */
function parsePointArray(points: any[]): Point[] {
    const result: Point[] = [];

    for (const point of points) {
        const parsed = parseCoordinates(point);
        if (parsed && !Array.isArray(parsed)) {
            result.push(parsed);
        }
    }

    return result;
}

/**
 * Convert legacy polygon-only format to the new shape format
 */
export function convertLegacyPolygonsToShapes(polygons: any): Record<string, GeometricShape> {
    const shapes: Record<string, GeometricShape> = {};

    for (const [id, polygon] of Object.entries(polygons)) {
        const rawPolygon = polygon as any;
        if (rawPolygon.points && Array.isArray(rawPolygon.points)) {
            const shape: PolygonShape = {
                id,
                entityType: rawPolygon.entityType || '',
                subType: rawPolygon.subType || '',
                shapeType: 'polygon',
                points: rawPolygon.points,
                style: parseShapeStyle(rawPolygon.style)
            };
            shapes[id] = shape;
        }
    }

    return shapes;
}
