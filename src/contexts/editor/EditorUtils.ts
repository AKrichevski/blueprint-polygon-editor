// @ts-nocheck
// src/contexts/editor/EditorUtils.ts
import type {Point} from "../../types"
import {POSITION_EPSILON} from "../../consts";

// Constants for storage handling
const MAX_STORAGE_ATTEMPTS = 3;
const STORAGE_RETRY_DELAY = 100; // ms

/**
 * Try to safely save to localStorage with size reduction if needed
 */
export async function safeLocalStorageSave(key: string, data: any): Promise<boolean> {
    let currentAttempt = 0;
    let jsonData = JSON.stringify(data);

    while (currentAttempt < MAX_STORAGE_ATTEMPTS) {
        try {
            localStorage.setItem(key, jsonData);
            console.log('State saved to localStorage');
            return true;
        } catch (error) {
            currentAttempt++;

            // Check if we're hitting storage quota
            if (error instanceof DOMException &&
                (error.name === 'QuotaExceededError' ||
                    error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {

                console.warn(`Storage quota exceeded on attempt ${currentAttempt}. Current data size: ${jsonData.length} bytes`);

                // Data is too large, try to reduce it
                if (currentAttempt < MAX_STORAGE_ATTEMPTS) {
                    // Try different reduction strategies based on attempt number
                    if (currentAttempt === 1) {
                        // First attempt: Remove SVG background if present
                        if (data.svgBackground) {
                            console.info("Removing SVG background to reduce storage size");
                            const reducedData = { ...data, svgBackground: null };
                            jsonData = JSON.stringify(reducedData);
                        } else {
                            // Skip to next reduction strategy
                            currentAttempt++;
                        }
                    }

                    if (currentAttempt === 2) {
                        // Second attempt: Limit number of entities if there are many
                        const entities = data.entities;
                        const entityKeys = Object.keys(entities);

                        if (entityKeys.length > 5) {
                            console.info(`Reducing number of entities from ${entityKeys.length} to 5`);
                            const reducedEntities: Record<string, any> = {};

                            // Keep only the first 5 entities
                            entityKeys.slice(0, 5).forEach(key => {
                                reducedEntities[key] = entities[key];
                            });

                            const reducedData = {
                                ...data,
                                entities: reducedEntities
                            };
                            jsonData = JSON.stringify(reducedData);
                        }
                    }

                    // Wait a short time before retry
                    await new Promise(resolve => setTimeout(resolve, STORAGE_RETRY_DELAY));
                }
            } else {
                // Not a quota error, just log and continue
                console.error('Error saving to localStorage:', error);
                return false;
            }
        }
    }

    // If we get here, all attempts failed
    console.error(`Failed to save to localStorage after ${MAX_STORAGE_ATTEMPTS} attempts`);
    return false;
}

/**
 * Helper to create an immutable copy of a nested object with one path changed
 */
export function updateNestedObject<T>(
    obj: T,
    pathParts: string[],
    updater: (val: any) => any
): T {
    // Base case: no more parts, return updated value
    if (pathParts.length === 0) {
        return updater(obj);
    }

    // Create a shallow copy of the current object
    let result: any;
    if (Array.isArray(obj)) {
        result = [...obj];
    } else if (obj && typeof obj === 'object') {
        result = { ...obj };
    } else {
        // If not an object or array, the path is invalid
        return obj;
    }

    // Get the current part of the path
    const [key, ...remainingParts] = pathParts;

    // Update the value at the current key with the result of a recursive call
    result[key] = updateNestedObject(result[key], remainingParts, updater);

    return result;
}

/**
 * Validate that coordinates are finite numbers
 */
export function validateCoordinates(point: Point): boolean {
    return isFinite(point.x) && isFinite(point.y);
}

/**
 * Round coordinates to prevent floating point errors
 */
export function roundCoordinates(point: Point, precision = 2): Point {
    const factor = Math.pow(10, precision);
    return {
        x: Math.round(point.x * factor) / factor,
        y: Math.round(point.y * factor) / factor
    };
}

/**
 * Check if two points are close enough to be considered the same position
 */
export function arePointsEqual(point1: Point, point2: Point, epsilon = POSITION_EPSILON): boolean {
    return (
        Math.abs(point1.x - point2.x) < epsilon &&
        Math.abs(point1.y - point2.y) < epsilon
    );
}

/**
 * Batch similar actions together for better performance
 */
export function batchActions(actions: any[]): any[] {
    const batched: any[] = [];
    const movePointMap = new Map<string, any>();

    for (const action of actions) {
        if (action.type === 'MOVE_POINT') {
            // Key by entity-shape-point
            const key = `${action.payload.entityId}-${action.payload.shapeId}-${action.payload.pointIndex}`;
            movePointMap.set(key, action); // Keep only the last move for each point
        } else {
            batched.push(action);
        }
    }

    // Add the final move point actions
    movePointMap.forEach(action => batched.push(action));

    return batched;
}

/**
 * Deep freeze an object to ensure immutability in development
 */
export function deepFreeze<T>(obj: T): T {
    if (process.env.NODE_ENV === 'production') {
        return obj; // Skip in production for performance
    }

    Object.freeze(obj);

    if (obj !== null && typeof obj === 'object') {
        Object.getOwnPropertyNames(obj).forEach(prop => {
            if (obj[prop as keyof T] !== null &&
                (typeof obj[prop as keyof T] === 'object' ||
                    typeof obj[prop as keyof T] === 'function') &&
                !Object.isFrozen(obj[prop as keyof T])) {
                deepFreeze(obj[prop as keyof T]);
            }
        });
    }

    return obj;
}
