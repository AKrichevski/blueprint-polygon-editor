// src/contexts/editor/EditorStorageUtils.ts

import type {Entity} from "../../types";

/**
 * Estimate the size of a JavaScript object in bytes.
 * This is an approximation - actual serialized size may vary.
 */
export function estimateObjectSize(obj: any): number {
    // For null or undefined
    if (obj === null || obj === undefined) return 0;

    // For primitive types
    if (typeof obj === 'boolean') return 4;
    if (typeof obj === 'number') return 8;
    if (typeof obj === 'string') return obj.length * 2; // Unicode chars take ~2 bytes

    // For arrays
    if (Array.isArray(obj)) {
        return obj.reduce((acc, item) => acc + estimateObjectSize(item), 0);
    }

    // For objects
    if (typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            return acc + estimateObjectSize(key) + estimateObjectSize(obj[key]);
        }, 0);
    }

    // Default for other types
    return 0;
}

/**
 * Calculate exact size of serialized JSON string
 */
export function getSerializedSize(obj: any): number {
    try {
        const jsonString = JSON.stringify(obj);
        return jsonString ? jsonString.length : 0;
    } catch (error) {
        console.error('Failed to calculate serialized size:', error);
        return 0;
    }
}

/**
 * Format size in bytes to a human-readable string
 */
export function formatByteSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Check if localStorage is available and has space
 * Returns available space in bytes or -1 if storage is not available
 */
export function getAvailableStorageSpace(): number {
    try {
        // Check if localStorage is available
        if (!window.localStorage) {
            return -1;
        }

        // Most browsers have a 5MB limit
        const estimatedLimit = 5 * 1024 * 1024;

        // Calculate used space
        let usedSpace = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                if (value) {
                    usedSpace += key.length + value.length;
                }
            }
        }

        // Calculate available space
        return Math.max(0, estimatedLimit - usedSpace);
    } catch (error) {
        // In case of security exceptions or other issues
        console.error("Could not determine available storage space:", error);
        return -1;
    }
}

/**
 * Reduce the size of entities data to fit within the available space
 * Returns a new copy with reduced data if needed
 */
export function reduceEntityDataSize(
    entities: Record<string, Entity>,
    svgBackground: string | null,
    maxSize: number
): { entities: Record<string, Entity>, svgBackground: string | null } {
    // Make a copy to work with
    const result = {
        entities: { ...entities },
        svgBackground
    };

    // Get current size
    const currentSize = getSerializedSize(result);

    // If already small enough, return as is
    if (currentSize <= maxSize) {
        return result;
    }

    // First try to remove SVG background if present
    if (result.svgBackground) {
        result.svgBackground = null;

        // Check if removal was enough
        const newSize = getSerializedSize(result);
        if (newSize <= maxSize) {
            return result;
        }
    }

    // Next, identify largest entities and reduce them
    const entityEntries = Object.entries(result.entities);

    // Sort by size (largest first)
    entityEntries.sort((a, b) => {
        const sizeA = getSerializedSize(a[1]);
        const sizeB = getSerializedSize(b[1]);
        return sizeB - sizeA;
    });

    // Create new entities object with limited entities
    const reducedEntities: Record<string, Entity> = {};
    let totalSize = 0;

    // Keep adding entities until we're about to exceed the limit
    for (const [key, entity] of entityEntries) {
        const entitySize = getSerializedSize(entity);

        // Skip very large entities entirely
        if (entitySize > maxSize / 2) {
            continue;
        }

        // If we would exceed the max size by adding this entity, stop
        if (totalSize + entitySize > maxSize * 0.9) { // Leave 10% buffer
            break;
        }

        // Add this entity
        reducedEntities[key] = entity;
        totalSize += entitySize;
    }

    // Return the reduced data
    return {
        entities: reducedEntities,
        svgBackground: null
    };
}
