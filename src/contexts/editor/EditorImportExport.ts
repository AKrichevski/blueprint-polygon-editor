// src/contexts/editor/EditorImportExport.ts
import type { Entity, EntityMetaData, GeometricShape } from "../../types";
import { parseShape, convertLegacyPolygonsToShapes } from "../../utils/geometryParser";
import type { EditorAction } from "./EditorContextTypes";
import React from "react";

/**
 * Process JSON import data and return validated entities
 */
export function processImportData(
    jsonData: string,
    dispatch: React.Dispatch<EditorAction>,
    updateScale: (action: string, scaleValue?: number, minZoom?: number, maxZoom?: number, step?: number) => void,
    updatePosition: (x: number, y: number) => void
): boolean {
    try {
        let parsedData: any;
        try {
            parsedData = JSON.parse(jsonData);
        } catch (err) {
            throw new Error(`Invalid JSON format: ${err instanceof Error ? err.message : 'Unknown parsing error'}`);
        }

        if (!parsedData || typeof parsedData !== 'object') {
            throw new Error('Invalid data format: root must be an object or array');
        }

        let entitiesData: Record<string, any>;

        // Determine the format of the input data
        if (!parsedData.entities && !Array.isArray(parsedData)) {
            // Check if this looks like direct entity objects at root level
            let looksLikeEntities = true;
            for (const key in parsedData) {
                const val = parsedData[key];
                if (!val || typeof val !== 'object' || (!val.metaData && !val.polygons && !val.shapes)) {
                    looksLikeEntities = false;
                    break;
                }
            }
            if (looksLikeEntities) {
                entitiesData = parsedData;
            } else {
                throw new Error('Invalid root structure: expected entity-like objects');
            }
        } else if (parsedData.entities && typeof parsedData.entities === 'object') {
            // Modern format with entities property
            entitiesData = parsedData.entities;
        } else if (Array.isArray(parsedData)) {
            // Array format, convert to object with entity IDs as keys
            entitiesData = {};
            for (let i = 0; i < parsedData.length; i++) {
                const item = parsedData[i];
                if (item && typeof item === 'object') {
                    const id = item.id || `entity-${i}`;
                    entitiesData[id] = item;
                }
            }
            if (Object.keys(entitiesData).length === 0) {
                throw new Error('No valid entities in array format');
            }
        } else {
            throw new Error('Unsupported JSON structure for import');
        }

        const validatedEntities: Record<string, Entity> = {};

        // Process each entity
        for (const entityId in entitiesData) {
            const entityRaw = entitiesData[entityId];

            // Extract or create metadata
            const metaData = entityRaw.metaData && typeof entityRaw.metaData === 'object'
                ? entityRaw.metaData
                : {
                    entityName: entityRaw.entityName || entityRaw.name || entityId,
                    altText: entityRaw.altText || entityRaw.description || '',
                    fontColor: entityRaw.fontColor || entityRaw.color || '#3357FF',
                };

            const validatedMetaData: EntityMetaData = {
                entityName: metaData.entityName || entityId,
                altText: metaData.altText || '',
                fontColor: metaData.fontColor || '#3357FF',
            };

            // Process shapes or polygons
            let shapesData: Record<string, any> = {};

            if (entityRaw.shapes && typeof entityRaw.shapes === 'object' && !Array.isArray(entityRaw.shapes)) {
                shapesData = entityRaw.shapes;
            } else if (entityRaw.polygons && typeof entityRaw.polygons === 'object' && !Array.isArray(entityRaw.polygons)) {
                shapesData = convertLegacyPolygonsToShapes(entityRaw.polygons);
            } else if (Array.isArray(entityRaw.shapes)) {
                for (let i = 0; i < entityRaw.shapes.length; i++) {
                    const shape = entityRaw.shapes[i];
                    const id = shape.id || `shape-${i}`;
                    shapesData[id] = shape;
                }
            } else if (Array.isArray(entityRaw.polygons)) {
                for (let i = 0; i < entityRaw.polygons.length; i++) {
                    const poly = entityRaw.polygons[i];
                    const id = poly.id || `polygon-${i}`;
                    shapesData[id] = {
                        ...poly,
                        id,
                        shapeType: 'polygon',
                        entityType: entityId,
                    };
                }
            } else if (Array.isArray(entityRaw.points)) {
                shapesData["shape-0"] = {
                    id: "shape-0",
                    shapeType: 'polygon',
                    points: entityRaw.points,
                    subType: entityRaw.subType || '',
                    entityType: entityId,
                };
            } else if (entityRaw.shapeType || entityRaw.type) {
                const id = entityRaw.id || 'shape-0';
                shapesData[id] = {
                    ...entityRaw,
                    id,
                    shapeType: entityRaw.shapeType || entityRaw.type,
                    entityType: entityId,
                };
            } else {
                // Try to detect shapes from primitive properties
                const center = entityRaw.center || (entityRaw.cx !== undefined && entityRaw.cy !== undefined
                    ? { x: entityRaw.cx, y: entityRaw.cy }
                    : null);
                if (center && (entityRaw.radius !== undefined || entityRaw.r !== undefined)) {
                    shapesData['circle-0'] = {
                        id: 'circle-0',
                        shapeType: 'circle',
                        center,
                        radius: entityRaw.radius || entityRaw.r,
                        entityType: entityId,
                        subType: entityRaw.subType || '',
                    };
                } else if (entityRaw.text && (entityRaw.position || (entityRaw.x !== undefined && entityRaw.y !== undefined))) {
                    shapesData['text-0'] = {
                        id: 'text-0',
                        shapeType: 'text',
                        text: entityRaw.text,
                        position: entityRaw.position || { x: entityRaw.x, y: entityRaw.y },
                        entityType: entityId,
                        subType: entityRaw.subType || '',
                    };
                } else if (Array.isArray(entityRaw.points) && entityRaw.points.length === 2) {
                    shapesData['line-0'] = {
                        id: 'line-0',
                        shapeType: 'line',
                        points: entityRaw.points,
                        entityType: entityId,
                        subType: entityRaw.subType || '',
                    };
                }
            }

            // Validate shapes
            const validatedShapes: Record<string, GeometricShape> = {};
            for (const shapeId in shapesData) {
                const rawShape = shapesData[shapeId];
                rawShape.id = rawShape.id || shapeId;
                rawShape.entityType = rawShape.entityType || entityId;

                const parsed = parseShape(rawShape, entityId);
                if (parsed) {
                    validatedShapes[shapeId] = parsed;
                }
            }

            // Create the final entity with explicit visibility handling
            validatedEntities[entityId] = {
                id: entityId,
                metaData: validatedMetaData,
                shapes: validatedShapes,
                // IMPORTANT: Set visibility to true by default, unless explicitly false
                visible: entityRaw.visible !== false
            };
        }

        if (Object.keys(validatedEntities).length > 0) {
            dispatch({ type: 'SET_ENTITIES', payload: validatedEntities });
        }

        // Reset view
        updateScale("reset");
        updatePosition(0,0);

        // Set background if any
        dispatch({
            type: 'SET_SVG_BACKGROUND',
            payload: parsedData.svgBackground ?? null,
        });

        return true;
    } catch (err) {
        console.error('Failed to import data:', err);
        const msg = err instanceof Error ? err.message : 'Unknown error during import';
        alert(`Failed to import data: ${msg}`);
        return false;
    }
}


/**
 * Create a JSON string for exporting data, including visibility
 */
export function formatExportData(entities: Record<string, Entity>, svgBackground: string | null): string {
    // Count total shapes across all entities
    const totalShapes = Object.values(entities).reduce(
        (total, entity) => total + Object.keys(entity.shapes).length,
        0
    );

    // Count shapes by type
    const shapeTypeCount: Record<string, number> = {};
    Object.values(entities).forEach(entity => {
        Object.values(entity.shapes).forEach(shape => {
            shapeTypeCount[shape.shapeType] = (shapeTypeCount[shape.shapeType] || 0) + 1;
        });
    });

    // Count visible/hidden entities
    const visibleEntities = Object.values(entities).filter(entity => entity.visible).length;
    const hiddenEntities = Object.values(entities).length - visibleEntities;

    const exportData = {
        entities,
        svgBackground,
        metadata: {
            version: '2.1', // Updated version to indicate shape & visibility support
            exportDate: new Date().toISOString(),
            totalEntities: Object.keys(entities).length,
            visibleEntities,
            hiddenEntities,
            totalShapes,
            shapeTypeCounts: shapeTypeCount,
            schemaVersion: 'shapes-v1', // Indicates we're using the new shape format
            supportedShapeTypes: [
                'point', 'line', 'arc', 'circle', 'ellipse',
                'polygon', 'rectangle', 'text'
            ],
            supportedFeatures: [
                'entity_visibility', 'shape_types', 'svg_background'
            ]
        }
    };

    return JSON.stringify(exportData, null, 2);
}
