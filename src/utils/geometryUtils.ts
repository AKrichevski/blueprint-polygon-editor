// src/utils/geometryUtils.ts
import type {
    Point,
    GeometricShape,
    PolygonShape,
    CircleShape,
    EllipseShape,
    LineShape,
    TextShape,
    ArcShape,
    PointShape
} from "../types";

/**
 * Represents a bounding box with min/max coordinates
 */
export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/**
 * Calculate the bounding box for any shape type
 */
export function calculateBoundingBox(shape: GeometricShape): BoundingBox {
    switch (shape.shapeType) {
        case 'polygon':
        case 'rectangle': {
            const polygonShape = shape as PolygonShape;
            return calculatePolygonBoundingBox(polygonShape.points);
        }

        case 'line': {
            const lineShape = shape as LineShape;
            return calculatePolygonBoundingBox(lineShape.points);
        }

        case 'circle': {
            const circleShape = shape as CircleShape;
            return {
                minX: circleShape.center.x - circleShape.radius,
                minY: circleShape.center.y - circleShape.radius,
                maxX: circleShape.center.x + circleShape.radius,
                maxY: circleShape.center.y + circleShape.radius
            };
        }

        case 'ellipse': {
            const ellipseShape = shape as EllipseShape;
            // For rotated ellipses, this is an approximation
            // A more accurate version would account for rotation
            return {
                minX: ellipseShape.center.x - ellipseShape.radiusX,
                minY: ellipseShape.center.y - ellipseShape.radiusY,
                maxX: ellipseShape.center.x + ellipseShape.radiusX,
                maxY: ellipseShape.center.y + ellipseShape.radiusY
            };
        }

        case 'arc': {
            const arcShape = shape as ArcShape;
            // This is a simplification - for precise arc bounds,
            // we would need to consider the start/end angles
            return {
                minX: arcShape.center.x - arcShape.radius,
                minY: arcShape.center.y - arcShape.radius,
                maxX: arcShape.center.x + arcShape.radius,
                maxY: arcShape.center.y + arcShape.radius
            };
        }

        case 'text': {
            const textShape = shape as TextShape;
            // For text, we use an estimated bounding box
            // A more precise calculation would consider font metrics
            const estimatedWidth = textShape.text.length * (textShape.style?.fontSize || 12) * 0.6;
            const estimatedHeight = (textShape.style?.fontSize || 12) * 1.2;

            return {
                minX: textShape.position.x,
                minY: textShape.position.y,
                maxX: textShape.position.x + estimatedWidth,
                maxY: textShape.position.y + estimatedHeight
            };
        }

        case 'point': {
            const pointShape = shape as PointShape;
            const radius = pointShape.style?.radius || 3;

            return {
                minX: pointShape.point.x - radius,
                minY: pointShape.point.y - radius,
                maxX: pointShape.point.x + radius,
                maxY: pointShape.point.y + radius
            };
        }

        default:
            console.warn(`Unknown shape type: ${(shape as GeometricShape).shapeType}`);
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
}

/**
 * Calculate the bounding box for a set of points
 */
export function calculatePolygonBoundingBox(points: Point[]): BoundingBox {
    if (!points || points.length === 0) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }

    return { minX, minY, maxX, maxY };
}

/**
 * Check if two bounding boxes intersect
 */
export function doBoxesIntersect(boxA: BoundingBox, boxB: BoundingBox): boolean {
    return !(
        boxA.maxX < boxB.minX ||
        boxA.minX > boxB.maxX ||
        boxA.maxY < boxB.minY ||
        boxA.minY > boxB.maxY
    );
}

/**
 * Check if a point is inside a bounding box
 */
export function isPointInBox(point: Point, box: BoundingBox, tolerance = 0): boolean {
    return (
        point.x >= box.minX - tolerance &&
        point.x <= box.maxX + tolerance &&
        point.y >= box.minY - tolerance &&
        point.y <= box.maxY + tolerance
    );
}

/**
 * Check if a bounding box is visible within the viewport
 */
export function isBoxVisible(box: BoundingBox, viewport: BoundingBox, margin = 0): boolean {
    return !(
        box.maxX < viewport.minX - margin ||
        box.minX > viewport.maxX + margin ||
        box.maxY < viewport.minY - margin ||
        box.minY > viewport.maxY + margin
    );
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    if (polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Check if a point is near a line segment within a certain tolerance
 */
export function isPointNearLine(point: Point, lineStart: Point, lineEnd: Point, tolerance: number): boolean {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return false;

    // Calculate perpendicular distance from point to line
    const distance = Math.abs((dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / length);

    // Also check if the point is within the line segment bounds (not just near the infinite line)
    // Project the point onto the line
    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);

    if (t < 0 || t > 1) {
        // Point's projection is outside the line segment
        // Calculate distance to the closest endpoint
        const distToStart = Math.sqrt(
            Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
        );
        const distToEnd = Math.sqrt(
            Math.pow(point.x - lineEnd.x, 2) + Math.pow(point.y - lineEnd.y, 2)
        );
        return Math.min(distToStart, distToEnd) <= tolerance;
    }

    return distance <= tolerance;
}

/**
 * Check if a point is within or near a shape for hit detection
 */
export function isPointInShape(shape: GeometricShape, point: Point, tolerance = 5): boolean {
    // First, do a quick check with the bounding box
    const bbox = calculateBoundingBox(shape);
    if (!isPointInBox(point, bbox, tolerance)) {
        return false;
    }

    // If point is in bounding box, do more precise check based on shape type
    switch (shape.shapeType) {
        case 'polygon':
        case 'rectangle': {
            const polygonShape = shape as PolygonShape;
            return isPointInPolygon(point, polygonShape.points);
        }

        case 'line': {
            const lineShape = shape as LineShape;
            if (lineShape.points.length < 2) return false;

            for (let i = 0; i < lineShape.points.length - 1; i++) {
                if (isPointNearLine(point, lineShape.points[i], lineShape.points[i + 1], tolerance)) {
                    return true;
                }
            }
            return false;
        }

        case 'circle': {
            const circleShape = shape as CircleShape;
            const distance = Math.sqrt(
                Math.pow(point.x - circleShape.center.x, 2) +
                Math.pow(point.y - circleShape.center.y, 2)
            );
            return distance <= circleShape.radius + tolerance;
        }

        case 'ellipse': {
            const ellipseShape = shape as EllipseShape;
            // Simplified check - not accounting for rotation
            const normalizedX = (point.x - ellipseShape.center.x) / (ellipseShape.radiusX + tolerance);
            const normalizedY = (point.y - ellipseShape.center.y) / (ellipseShape.radiusY + tolerance);
            return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
        }

        case 'point': {
            const pointShape = shape as PointShape;
            const distance = Math.sqrt(
                Math.pow(point.x - pointShape.point.x, 2) +
                Math.pow(point.y - pointShape.point.y, 2)
            );
            const hitRadius = pointShape.style?.radius || 3;
            return distance <= hitRadius + tolerance;
        }

        case 'text': {
            const textShape = shape as TextShape;
            // Simple rectangular hit area for text
            const estimatedWidth = textShape.text.length * (textShape.style?.fontSize || 12) * 0.6;
            const estimatedHeight = (textShape.style?.fontSize || 12) * 1.2;

            return (
                point.x >= textShape.position.x - tolerance &&
                point.x <= textShape.position.x + estimatedWidth + tolerance &&
                point.y >= textShape.position.y - tolerance &&
                point.y <= textShape.position.y + estimatedHeight + tolerance
            );
        }

        case 'arc': {
            const arcShape = shape as ArcShape;
            // First, check if within radius distance
            const distance = Math.sqrt(
                Math.pow(point.x - arcShape.center.x, 2) +
                Math.pow(point.y - arcShape.center.y, 2)
            );

            if (Math.abs(distance - arcShape.radius) > tolerance) {
                return false;
            }

            // Then check if point is within arc angle range
            const angle = Math.atan2(
                point.y - arcShape.center.y,
                point.x - arcShape.center.x
            ) * 180 / Math.PI;

            // Normalize angle to 0-360 range
            const normalizedAngle = (angle < 0) ? angle + 360 : angle;

            // Convert arc angles to 0-360 range
            const startAngle = (arcShape.startAngle % 360 + 360) % 360;
            const endAngle = (arcShape.endAngle % 360 + 360) % 360;

            // Check if the point's angle is between start and end angles
            if (startAngle <= endAngle) {
                return normalizedAngle >= startAngle && normalizedAngle <= endAngle;
            } else {
                // Arc crosses 0 degrees
                return normalizedAngle >= startAngle || normalizedAngle <= endAngle;
            }
        }

        default:
            return false;
    }
}

/**
 * Convert viewport coordinates to world coordinates
 */
export function viewportToWorld(viewportX: number, viewportY: number, position: Point, scale: number): Point {
    return {
        x: (viewportX - position.x) / scale,
        y: (viewportY - position.y) / scale
    };
}

/**
 * Convert world coordinates to viewport coordinates
 */
export function worldToViewport(worldX: number, worldY: number, position: Point, scale: number): Point {
    return {
        x: worldX * scale + position.x,
        y: worldY * scale + position.y
    };
}

/**
 * Calculate viewport bounds in world coordinates
 */
export function calculateViewportBounds(
    width: number,
    height: number,
    position: Point,
    scale: number
): BoundingBox {
    return {
        minX: -position.x / scale,
        minY: -position.y / scale,
        maxX: (width - position.x) / scale,
        maxY: (height - position.y) / scale
    };
}
