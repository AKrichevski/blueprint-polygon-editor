// src/features/editor/utils/polygonHelpers.ts
import type { Point } from "../../../types";

// Calculate the area of a polygon
export const calculatePolygonArea = (points): number => {
    if (points.length < 3) return 0;
//TODO: we need to use the new value for the real_area. or not allow to edit the area, just walls
    let area = 0;

    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }

    return Math.abs(area / 2);
};

// Calculate the perimeter of a polygon
export const calculatePolygonPerimeter = (points): number => {
    if (points.length < 2) return 0;

    let perimeter = 0;

    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        const dx = points[j].x - points[i].x;
        const dy = points[j].y - points[i].y;
        perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    return perimeter;
};

export const calculateLineLength = (points: { x: number; y: number }[]): number => {
    if (points.length < 2) return 0;

    let length = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
}


// Calculate the centroid of a polygon
export const calculatePolygonCentroid = (points): Point => {
    if (points.length === 0) return { x: 0, y: 0 };
    if (points.length === 1) return { ...points[0] };

    let sumX = 0;
    let sumY = 0;

    for (const point of points) {
        sumX += point.x;
        sumY += point.y;
    }

    return {
        x: sumX / points.length,
        y: sumY / points.length
    };
};
