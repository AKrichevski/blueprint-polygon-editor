// src/utils/dataFormatFixer.ts
import type {Entity, EntityMetaData, Point, GeometricShape} from "../types";
import { parseShape, convertLegacyPolygonsToShapes } from "./geometryParser";

/**
 * Helper utility to fix and convert various data formats to the expected format
 * for the Blueprint Shape Editor. Now supports all shape types.
 */

/**
 * Attempt to parse and fix JSON data in various formats to match the expected format
 * @param jsonData Raw JSON string data
 * @returns Properly formatted entities data or null if conversion fails
 */
export const fixJsonFormat = (jsonData: string): Record<string, Entity> | null => {
    try {
        // Parse the JSON
        const parsedData = JSON.parse(jsonData);

        return convertToEntitiesFormat(parsedData);
    } catch (error) {
        console.error("JSON parsing failed:", error);
        return null;
    }
};

/**
 * Convert various data structures to the expected entities format
 * @param data The parsed data object in various possible formats
 * @returns Properly formatted entities data or null if conversion fails
 */
export const convertToEntitiesFormat = (data: any): Record<string, Entity> | null => {
    try {
        if (!data || typeof data !== 'object') {
            console.error("Data is not an object");
            return null;
        }

        // Case 1: Already in the expected format
        if (data.entities && typeof data.entities === 'object' && !Array.isArray(data.entities)) {
            return validateAndFixEntities(data.entities);
        }

        // Case 2: Entities are at the root level
        if (!data.entities && !Array.isArray(data)) {
            return validateAndFixEntities(data);
        }

        // Case 3: Array of entities
        if (Array.isArray(data)) {
            const entitiesMap: Record<string, any> = {};

            data.forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                    const id = item.id || `entity-${index}`;
                    entitiesMap[id] = item;
                }
            });

            return validateAndFixEntities(entitiesMap);
        }

        // Case 4: Nested inside a wrapper object
        for (const key of Object.keys(data)) {
            if (typeof data[key] === 'object' && !Array.isArray(data[key]) && Object.keys(data[key]).length > 0) {
                // This might be the entities object
                const possibleEntities = validateAndFixEntities(data[key]);
                if (possibleEntities && Object.keys(possibleEntities).length > 0) {
                    return possibleEntities;
                }
            }
        }

        console.error("Could not detect valid entities format", data);
        return null;
    } catch (error) {
        console.error("Format conversion failed:", error);
        return null;
    }
};

/**
 * Validate and fix entities data structure
 * @param entitiesData Entities data in various possible formats
 * @returns Validated and fixed entities data or null if validation fails
 */
export const validateAndFixEntities = (entitiesData: any): Record<string, Entity> | null => {
    try {
        if (!entitiesData || typeof entitiesData !== 'object' || Array.isArray(entitiesData)) {
            return null;
        }

        const validatedEntities: Record<string, Entity> = {};

        for (const [entityId, entityData] of Object.entries(entitiesData)) {
            if (!entityData || typeof entityData !== 'object') {
                console.warn(`Skipping invalid entity "${entityId}": Not an object`);
                continue;
            }

            const entity = entityData as any;

            // Fix metaData
            const metaData = fixMetaData(entity, entityId);

            // Fix shapes - now handles both shapes and legacy polygons
            const shapes = fixShapes(entity, entityId);

            validatedEntities[entityId] = {
                id: entityId,
                metaData,
                shapes
            };
        }

        if (Object.keys(validatedEntities).length === 0) {
            console.error("No valid entities found after validation");
            return null;
        }

        return validatedEntities;
    } catch (error) {
        console.error("Entity validation failed:", error);
        return null;
    }
};

/**
 * Fix entity metadata
 * @param entity The entity object in various possible formats
 * @param entityId The entity ID
 * @returns Fixed metadata object
 */
export const fixMetaData = (entity: any, entityId: string): EntityMetaData => {
    // Case 1: metaData exists and is valid
    if (entity.metaData && typeof entity.metaData === 'object') {
        return {
            entityName: entity.metaData.entityName || entity.metaData.name || entityId,
            altText: entity.metaData.altText || entity.metaData.description || "",
            fontColor: entity.metaData.fontColor || entity.metaData.color || "#3357FF"
        };
    }

    // Case 2: Metadata fields are at the entity root
    return {
        entityName: entity.entityName || entity.name || entityId,
        altText: entity.altText || entity.description || "",
        fontColor: entity.fontColor || entity.color || "#3357FF"
    };
};

/**
 * Fix shapes data - handles both new shape format and legacy polygons
 * @param entity The entity object in various possible formats
 * @param entityId The entity ID
 * @returns Fixed shapes object
 */
export const fixShapes = (entity: any, entityId: string): Record<string, GeometricShape> => {
    const validatedShapes: Record<string, GeometricShape> = {};

    // Case 1: New shapes format
    if (entity.shapes && typeof entity.shapes === 'object' && !Array.isArray(entity.shapes)) {
        Object.entries(entity.shapes).forEach(([shapeId, shapeData]) => {
            const fixedShape = fixShape(shapeData, shapeId, entityId);
            if (fixedShape) {
                validatedShapes[shapeId] = fixedShape;
            }
        });
    }
    // Case 2: Array of shapes
    else if (entity.shapes && Array.isArray(entity.shapes)) {
        entity.shapes.forEach((shapeData: any, index: number) => {
            const shapeId = shapeData.id || `shape-${index}`;
            const fixedShape = fixShape(shapeData, shapeId, entityId);
            if (fixedShape) {
                validatedShapes[shapeId] = fixedShape;
            }
        });
    }
    // Case 3: Legacy polygons format - convert using the geometry parser
    else if (entity.polygons && (typeof entity.polygons === 'object' || Array.isArray(entity.polygons))) {
        const convertedShapes = convertLegacyPolygonsToShapes(entity.polygons);
        Object.assign(validatedShapes, convertedShapes);
    }
    // Case 4: Direct shape properties at entity level
    else if (entity.shapeType || entity.type) {
        const shapeId = entity.id || 'shape-0';
        const fixedShape = fixShape(entity, shapeId, entityId);
        if (fixedShape) {
            validatedShapes[shapeId] = fixedShape;
        }
    }
    // Case 5: Direct points array (single implicit polygon)
    else if (entity.points && Array.isArray(entity.points)) {
        const shapeId = "shape-0";
        const implicitShape = {
            id: shapeId,
            shapeType: "polygon",
            points: entity.points,
            subType: entity.subType || "",
            entityType: entityId
        };

        const fixedShape = fixShape(implicitShape, shapeId, entityId);
        if (fixedShape) {
            validatedShapes[shapeId] = fixedShape;
        }
    }
    // Case 6: Check for individual shape type properties
    else {
        // Try to detect if this entity itself represents a shape
        const potentialShape = detectAndConvertShape(entity, entityId);
        if (potentialShape) {
            validatedShapes[potentialShape.id] = potentialShape;
        }
    }

    return validatedShapes;
};

/**
 * Fix individual shape data using the geometry parser
 * @param shapeData The shape data in various possible formats
 * @param shapeId The shape ID
 * @param entityId The entity ID
 * @returns Fixed shape object or null if invalid
 */
export const fixShape = (shapeData: any, shapeId: string, entityId: string): GeometricShape | null => {
    try {
        if (!shapeData || typeof shapeData !== 'object') {
            return null;
        }

        // Ensure the shape has proper IDs
        const rawShape = {
            ...shapeData,
            id: shapeId,
            entityType: shapeData.entityType || entityId
        };

        // Use the geometry parser to handle all shape types
        return parseShape(rawShape, entityId);
    } catch (error) {
        console.error(`Error fixing shape ${shapeId}:`, error);
        return null;
    }
};

/**
 * Attempt to detect and convert entity properties to a shape
 * @param entity The entity object
 * @param entityId The entity ID
 * @returns A shape if detected, null otherwise
 */
export const detectAndConvertShape = (entity: any, entityId: string): GeometricShape | null => {
    // Check for circle properties
    if ((entity.center || (entity.cx !== undefined && entity.cy !== undefined)) &&
        (entity.radius !== undefined || entity.r !== undefined)) {
        const shapeId = entity.id || 'circle-0';
        return fixShape({
            id: shapeId,
            shapeType: 'circle',
            center: entity.center || { x: entity.cx, y: entity.cy },
            radius: entity.radius || entity.r,
            style: entity.style,
            subType: entity.subType || ''
        }, shapeId, entityId);
    }

    // Check for ellipse properties
    if ((entity.center || (entity.cx !== undefined && entity.cy !== undefined)) &&
        ((entity.radiusX !== undefined && entity.radiusY !== undefined) ||
            (entity.rx !== undefined && entity.ry !== undefined))) {
        const shapeId = entity.id || 'ellipse-0';
        return fixShape({
            id: shapeId,
            shapeType: 'ellipse',
            center: entity.center || { x: entity.cx, y: entity.cy },
            radiusX: entity.radiusX || entity.rx,
            radiusY: entity.radiusY || entity.ry,
            rotation: entity.rotation || 0,
            style: entity.style,
            subType: entity.subType || ''
        }, shapeId, entityId);
    }

    // Check for line properties
    if (entity.points && Array.isArray(entity.points) && entity.points.length === 2) {
        const shapeId = entity.id || 'line-0';
        return fixShape({
            id: shapeId,
            shapeType: 'line',
            points: entity.points,
            style: entity.style,
            subType: entity.subType || ''
        }, shapeId, entityId);
    }

    // Check for text properties
    if (entity.text && (entity.position || (entity.x !== undefined && entity.y !== undefined))) {
        const shapeId = entity.id || 'text-0';
        return fixShape({
            id: shapeId,
            shapeType: 'text',
            text: entity.text,
            position: entity.position || { x: entity.x, y: entity.y },
            style: entity.style,
            subType: entity.subType || ''
        }, shapeId, entityId);
    }

    // Check for arc properties
    if ((entity.center || (entity.cx !== undefined && entity.cy !== undefined)) &&
        entity.radius !== undefined &&
        (entity.startAngle !== undefined || entity.endAngle !== undefined)) {
        const shapeId = entity.id || 'arc-0';
        return fixShape({
            id: shapeId,
            shapeType: 'arc',
            center: entity.center || { x: entity.cx, y: entity.cy },
            radius: entity.radius,
            startAngle: entity.startAngle || 0,
            endAngle: entity.endAngle || 360,
            style: entity.style,
            subType: entity.subType || ''
        }, shapeId, entityId);
    }

    // No recognizable shape found
    return null;
};

/**
 * Create a sample entity if no valid entities are found
 * @returns A sample entity object with various shape types
 */
export const createSampleEntity = (): Record<string, Entity> => {
    const entityId = "sample-entity";

    return {
        [entityId]: {
            id: entityId,
            metaData: {
                entityName: "Sample Shapes",
                altText: "This is a sample entity created with various shape types to demonstrate the enhanced shape support.",
                fontColor: "#3357FF"
            },
            shapes: {
                "polygon-1": {
                    id: "polygon-1",
                    entityType: entityId,
                    subType: "room",
                    shapeType: "polygon",
                    points: [
                        { x: 100, y: 100 },
                        { x: 200, y: 100 },
                        { x: 200, y: 200 },
                        { x: 100, y: 200 }
                    ],
                    style: {
                        strokeColor: "#FF0000",
                        strokeWidth: 2,
                        fillColor: "#FF000033"
                    }
                },
                "circle-1": {
                    id: "circle-1",
                    entityType: entityId,
                    subType: "area",
                    shapeType: "circle",
                    center: { x: 300, y: 150 },
                    radius: 50,
                    style: {
                        strokeColor: "#00FF00",
                        strokeWidth: 2,
                        fillColor: "#00FF0033"
                    }
                },
                "line-1": {
                    id: "line-1",
                    entityType: entityId,
                    subType: "connector",
                    shapeType: "line",
                    points: [
                        { x: 400, y: 100 },
                        { x: 500, y: 200 }
                    ],
                    style: {
                        strokeColor: "#0000FF",
                        strokeWidth: 3,
                        dashPattern: [5, 5]
                    }
                },
                "text-1": {
                    id: "text-1",
                    entityType: entityId,
                    subType: "label",
                    shapeType: "text",
                    position: { x: 600, y: 150 },
                    text: "Sample Text",
                    style: {
                        fontSize: 16,
                        fontFamily: "Arial",
                        color: "#000000"
                    }
                }
            }
        }
    };
};

/**
 * Fix the entire data structure
 * @returns Fixed data in the expected format
 * @param jsonData
 */
export const fixDataStructure = (jsonData: string): Record<string, Entity> => {
    try {
        const fixedData = fixJsonFormat(jsonData);

        if (fixedData && Object.keys(fixedData).length > 0) {
            return fixedData;
        }

        // If no valid entities were found, create a sample entity
        return createSampleEntity();
    } catch (error) {
        console.error("Failed to fix data structure:", error);
        return createSampleEntity();
    }
};
