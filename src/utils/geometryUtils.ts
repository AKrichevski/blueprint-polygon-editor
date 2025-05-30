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

export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

// Cache for expensive calculations
const boundingBoxCache = new WeakMap<GeometricShape, BoundingBox>();

/**
 * Optimized bounding box calculation with caching
 */
export function calculateBoundingBox(shape: GeometricShape): BoundingBox {
    // Check cache first
    const cached = boundingBoxCache.get(shape);
    if (cached) return cached;

    let result: BoundingBox;

    switch (shape.shapeType) {
        case 'polygon':
        case 'rectangle': {
            const polygonShape = shape as PolygonShape;
            result = calculatePolygonBoundingBox(polygonShape.points);
            break;
        }

        case 'line': {
            const lineShape = shape as LineShape;
            result = calculatePolygonBoundingBox(lineShape.points);
            break;
        }

        case 'circle': {
            const circleShape = shape as CircleShape;
            result = {
                minX: circleShape.center.x - circleShape.radius,
                minY: circleShape.center.y - circleShape.radius,
                maxX: circleShape.center.x + circleShape.radius,
                maxY: circleShape.center.y + circleShape.radius
            };
            break;
        }

        case 'ellipse': {
            const ellipseShape = shape as EllipseShape;
            // For rotated ellipses, calculate the actual bounding box
            if (ellipseShape.rotation && ellipseShape.rotation !== 0) {
                const angle = (ellipseShape.rotation * Math.PI) / 180;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const rx = ellipseShape.radiusX;
                const ry = ellipseShape.radiusY;

                // Calculate rotated bounding box
                const halfWidth = Math.sqrt(rx * rx * cos * cos + ry * ry * sin * sin);
                const halfHeight = Math.sqrt(rx * rx * sin * sin + ry * ry * cos * cos);

                result = {
                    minX: ellipseShape.center.x - halfWidth,
                    minY: ellipseShape.center.y - halfHeight,
                    maxX: ellipseShape.center.x + halfWidth,
                    maxY: ellipseShape.center.y + halfHeight
                };
            } else {
                result = {
                    minX: ellipseShape.center.x - ellipseShape.radiusX,
                    minY: ellipseShape.center.y - ellipseShape.radiusY,
                    maxX: ellipseShape.center.x + ellipseShape.radiusX,
                    maxY: ellipseShape.center.y + ellipseShape.radiusY
                };
            }
            break;
        }

        case 'arc': {
            const arcShape = shape as ArcShape;
            // Simplified - for precise bounds, consider the actual arc segment
            result = {
                minX: arcShape.center.x - arcShape.radius,
                minY: arcShape.center.y - arcShape.radius,
                maxX: arcShape.center.x + arcShape.radius,
                maxY: arcShape.center.y + arcShape.radius
            };
            break;
        }

        case 'text': {
            const textShape = shape as TextShape;
            const fontSize = textShape.style?.fontSize || 12;
            const estimatedWidth = textShape.text.length * fontSize * 0.6;
            const estimatedHeight = fontSize * 1.2;

            result = {
                minX: textShape.position.x,
                minY: textShape.position.y,
                maxX: textShape.position.x + estimatedWidth,
                maxY: textShape.position.y + estimatedHeight
            };
            break;
        }

        case 'point': {
            const pointShape = shape as PointShape;
            const radius = pointShape.style?.radius || 3;

            result = {
                minX: pointShape.point.x - radius,
                minY: pointShape.point.y - radius,
                maxX: pointShape.point.x + radius,
                maxY: pointShape.point.y + radius
            };
            break;
        }

        default:
            console.warn(`Unknown shape type: ${(shape as GeometricShape).shapeType}`);
            result = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    // Cache the result
    boundingBoxCache.set(shape, result);
    return result;
}

/**
 * Optimized polygon bounding box calculation
 */
export function calculatePolygonBoundingBox(points: Point[]): BoundingBox {
    if (!points || points.length === 0) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    // Use a single loop with direct property access
    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;

    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
    }

    return { minX, minY, maxX, maxY };
}

/**
 * Optimized box intersection check
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
 * Optimized point in box check
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
 * Optimized visibility check
 */
export function isBoxVisible(box: BoundingBox, viewport: BoundingBox, margin = 0): boolean {
    return !(
        box.maxX + margin < viewport.minX ||
        box.minX - margin > viewport.maxX ||
        box.maxY + margin < viewport.minY ||
        box.minY - margin > viewport.maxY
    );
}

/**
 * Optimized point in polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    if (polygon.length < 3) return false;

    let inside = false;
    const px = point.x;
    const py = point.y;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;

        // Use optimized comparison
        if (((yi > py) !== (yj > py)) &&
            (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * Optimized point near line check
 */
export function isPointNearLine(point: Point, lineStart: Point, lineEnd: Point, tolerance: number): boolean {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) return false;

    // Project point onto line
    const t = Math.max(0, Math.min(1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared
    ));

    // Find nearest point on line segment
    const nearestX = lineStart.x + t * dx;
    const nearestY = lineStart.y + t * dy;

    // Check distance
    const distSquared = (point.x - nearestX) * (point.x - nearestX) +
        (point.y - nearestY) * (point.y - nearestY);

    return distSquared <= tolerance * tolerance;
}

/**
 * Optimized point in shape check with early exit
 */
export function isPointInShape(shape: GeometricShape, point: Point, tolerance = 5): boolean {
    // Quick bounding box check first
    const bbox = calculateBoundingBox(shape);
    if (!isPointInBox(point, bbox, tolerance)) {
        return false;
    }

    // Shape-specific checks
    switch (shape.shapeType) {
        case 'polygon':
        case 'rectangle': {
            const polygonShape = shape as PolygonShape;
            return isPointInPolygon(point, polygonShape.points);
        }

        case 'line': {
            const lineShape = shape as LineShape;
            if (lineShape.points.length < 2) return false;

            // Optimized: check only consecutive pairs
            for (let i = 0; i < lineShape.points.length - 1; i++) {
                if (isPointNearLine(point, lineShape.points[i], lineShape.points[i + 1], tolerance)) {
                    return true;
                }
            }
            return false;
        }

        case 'circle': {
            const circleShape = shape as CircleShape;
            const dx = point.x - circleShape.center.x;
            const dy = point.y - circleShape.center.y;
            const distSquared = dx * dx + dy * dy;
            const radiusWithTolerance = circleShape.radius + tolerance;
            return distSquared <= radiusWithTolerance * radiusWithTolerance;
        }

        case 'ellipse': {
            const ellipseShape = shape as EllipseShape;
            const rx = ellipseShape.radiusX + tolerance;
            const ry = ellipseShape.radiusY + tolerance;

            if (ellipseShape.rotation && ellipseShape.rotation !== 0) {
                // Handle rotated ellipse
                const angle = -(ellipseShape.rotation * Math.PI) / 180;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                const dx = point.x - ellipseShape.center.x;
                const dy = point.y - ellipseShape.center.y;

                const x = dx * cos - dy * sin;
                const y = dx * sin + dy * cos;

                return (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1;
            } else {
                const normalizedX = (point.x - ellipseShape.center.x) / rx;
                const normalizedY = (point.y - ellipseShape.center.y) / ry;
                return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
            }
        }

        case 'point': {
            const pointShape = shape as PointShape;
            const dx = point.x - pointShape.point.x;
            const dy = point.y - pointShape.point.y;
            const hitRadius = (pointShape.style?.radius || 3) + tolerance;
            return dx * dx + dy * dy <= hitRadius * hitRadius;
        }

        case 'text': {
            const textShape = shape as TextShape;
            const fontSize = textShape.style?.fontSize || 12;
            const estimatedWidth = textShape.text.length * fontSize * 0.6;
            const estimatedHeight = fontSize * 1.2;

            return (
                point.x >= textShape.position.x - tolerance &&
                point.x <= textShape.position.x + estimatedWidth + tolerance &&
                point.y >= textShape.position.y - tolerance &&
                point.y <= textShape.position.y + estimatedHeight + tolerance
            );
        }

        case 'arc': {
            const arcShape = shape as ArcShape;
            const dx = point.x - arcShape.center.x;
            const dy = point.y - arcShape.center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (Math.abs(distance - arcShape.radius) > tolerance) {
                return false;
            }

            // Check angle
            let angle = Math.atan2(dy, dx) * 180 / Math.PI;
            if (angle < 0) angle += 360;

            const startAngle = (arcShape.startAngle % 360 + 360) % 360;
            const endAngle = (arcShape.endAngle % 360 + 360) % 360;

            if (startAngle <= endAngle) {
                return angle >= startAngle && angle <= endAngle;
            } else {
                return angle >= startAngle || angle <= endAngle;
            }
        }

        default:
            return false;
    }
}

/**
 * Improved coordinate transformations with proper precision handling
 */
export function viewportToWorld(viewportX: number, viewportY: number, position: Point, scale: number): Point {
    return {
        x: (viewportX - position.x) / scale,
        y: (viewportY - position.y) / scale
    };
}

export function worldToViewport(worldX: number, worldY: number, position: Point, scale: number): Point {
    return {
        x: worldX * scale + position.x,
        y: worldY * scale + position.y
    };
}

export function calculateViewportBounds(
    width: number,
    height: number,
    position: Point,
    scale: number
): BoundingBox {
    const invScale = 1 / scale;
    return {
        minX: -position.x * invScale,
        minY: -position.y * invScale,
        maxX: (width - position.x) * invScale,
        maxY: (height - position.y) * invScale
    };
}
