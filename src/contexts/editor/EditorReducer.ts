// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import { updateNestedObject, validateCoordinates, roundCoordinates, arePointsEqual } from './EditorUtils';
import type { EditorAction, EditorState } from "./EditorContextTypes";
import type {Entity, EntityMetaData, GeometricShape, LineShape, PolygonShape, PointShape, BoundingBox} from "../../types";
import { calculateBoundingBox } from "../../utils/geometryUtils";

// Enhanced cache with WeakMap for memory efficiency
const lookupCacheWeakMap = new WeakMap<Record<string, Entity>, {
    entityLookup: Map<string, Entity>;
    shapeLookup: Map<string, { entityId: string; shape: GeometricShape }>;
    boundingBoxCache: Map<string, BoundingBox>;
    timestamp: number;
}>();

const CACHE_DURATION = 100; // ms

/**
 * Optimized function that creates all lookup maps and bounding boxes in a single pass
 */
export function createOptimizedLookups(entities: Record<string, Entity>) {
    const now = performance.now();

    // Check cache first
    const cached = lookupCacheWeakMap.get(entities);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached;
    }

    const entityLookup = new Map<string, Entity>();
    const shapeLookup = new Map<string, { entityId: string; shape: GeometricShape }>();
    const boundingBoxCache = new Map<string, BoundingBox>();

    // Single pass through all entities and shapes
    for (const entityId in entities) {
        const entity = entities[entityId];
        entityLookup.set(entityId, entity);

        const shapes = entity.shapes;
        if (!shapes) continue;

        // Process all shapes for this entity in one go
        for (const shapeId in shapes) {
            const shape = shapes[shapeId];

            // Add to shape lookup
            shapeLookup.set(shapeId, {
                entityId,
                shape,
            });

            // Calculate and cache bounding box
            const bbox = calculateBoundingBox(shape);
            boundingBoxCache.set(shapeId, bbox);
        }
    }

    const result = {
        entityLookup,
        shapeLookup,
        boundingBoxCache,
        timestamp: now
    };

    // Cache the result
    lookupCacheWeakMap.set(entities, result);

    return result;
}

/**
 * Optimized reducer with better performance characteristics
 */
export const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
    switch (action.type) {
        case 'UPDATE_LOOKUP_MAPS': {
            return {
                ...state,
                entityLookup: action.payload.entityLookup,
                shapeLookup: action.payload.shapeLookup
            };
        }

        case 'SET_ENTITIES': {
            const newEntities = action.payload;
            const lookups = createOptimizedLookups(newEntities);

            return {
                ...state,
                entities: newEntities,
                entityLookup: lookups.entityLookup,
                shapeLookup: lookups.shapeLookup,
                boundingBoxCache: lookups.boundingBoxCache
            };
        }

        case 'SET_SVG_BACKGROUND': {
            if (state.svgBackground === action.payload) {
                return state;
            }
            return {
                ...state,
                svgBackground: action.payload,
            };
        }

        case 'TOGGLE_ENTITY_VISIBILITY': {
            const { entityId } = action.payload;
            const entity = state.entities[entityId];
            if (!entity) return state;

            const newEntity = {
                ...entity,
                visible: !entity.visible
            };

            const newEntities = {
                ...state.entities,
                [entityId]: newEntity
            };

            // Update only the affected entity in lookup
            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.set(entityId, newEntity);

            return {
                ...state,
                entities: newEntities,
                entityLookup: newEntityLookup,
                shapeLookup: state.shapeLookup,
                boundingBoxCache: state.boundingBoxCache
            };
        }

        case 'ADD_ENTITY': {
            const { id, name, description, color } = action.payload;
            const newEntity: Entity = {
                id,
                metaData: {
                    entityName: name,
                    altText: description,
                    fontColor: color
                },
                shapes: {},
                visible: true,
            };

            const newEntities = {
                ...state.entities,
                [id]: newEntity
            };

            // Optimized: just add to existing lookups
            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.set(id, newEntity);

            return {
                ...state,
                entities: newEntities,
                entityLookup: newEntityLookup,
                shapeLookup: state.shapeLookup,
                boundingBoxCache: state.boundingBoxCache
            };
        }

        case 'DELETE_ENTITY': {
            if (!state.entities[action.payload]) {
                return state;
            }

            const { [action.payload]: deletedEntity, ...remainingEntities } = state.entities;

            // Optimized: remove from lookups without full recreation
            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.delete(action.payload);

            const newShapeLookup = new Map(state.shapeLookup);
            const newBoundingBoxCache = new Map(state.boundingBoxCache);

            // Remove all shapes for this entity
            if (deletedEntity.shapes) {
                for (const shapeId in deletedEntity.shapes) {
                    newShapeLookup.delete(shapeId);
                    newBoundingBoxCache.delete(shapeId);
                }
            }

            return {
                ...state,
                entities: remainingEntities,
                entityLookup: newEntityLookup,
                shapeLookup: newShapeLookup,
                boundingBoxCache: newBoundingBoxCache
            };
        }

        case 'ADD_SHAPE': {
            const { entityId, shape } = action.payload;
            const entity = state.entities[entityId];
            if (!entity) return state;

            const shapeId = shape.id || uuidv4();
            const newShape: GeometricShape = {
                ...shape,
                id: shapeId,
            };

            const updatedEntity = {
                ...entity,
                shapes: {
                    ...entity.shapes,
                    [shapeId]: newShape
                }
            };

            const newEntities = {
                ...state.entities,
                [entityId]: updatedEntity
            };

            // Optimized: just add to lookups
            const newShapeLookup = new Map(state.shapeLookup);
            newShapeLookup.set(shapeId, { entityId, shape: newShape });

            const newBoundingBoxCache = new Map(state.boundingBoxCache);
            newBoundingBoxCache.set(shapeId, calculateBoundingBox(newShape));

            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.set(entityId, updatedEntity);

            return {
                ...state,
                entities: newEntities,
                entityLookup: newEntityLookup,
                shapeLookup: newShapeLookup,
                boundingBoxCache: newBoundingBoxCache
            };
        }

        case 'DELETE_SHAPE': {
            const { entityId, shapeId } = action.payload;
            const entity = state.entities[entityId];

            if (!entity || !entity.shapes[shapeId]) return state;

            const { [shapeId]: deletedShape, ...remainingShapes } = entity.shapes;

            const updatedEntity = {
                ...entity,
                shapes: remainingShapes
            };

            const newEntities = {
                ...state.entities,
                [entityId]: updatedEntity
            };

            // Update lookups
            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.set(entityId, updatedEntity);

            const newShapeLookup = new Map(state.shapeLookup);
            newShapeLookup.delete(shapeId);

            const newBoundingBoxCache = new Map(state.boundingBoxCache);
            newBoundingBoxCache.delete(shapeId);

            return {
                ...state,
                entities: newEntities,
                entityLookup: newEntityLookup,
                shapeLookup: newShapeLookup,
                boundingBoxCache: newBoundingBoxCache
            };
        }

        case 'ADD_POINT': {
            const { entityId, shapeId, point, index } = action.payload;
            const shapeInfo = state.shapeLookup.get(shapeId);

            if (!shapeInfo || shapeInfo.entityId !== entityId) return state;

            const shape = shapeInfo.shape;
            if (shape.shapeType !== 'polygon' && shape.shapeType !== 'line') {
                return state;
            }

            if (!validateCoordinates(point)) {
                return state;
            }

            let newPoints;
            if (shape.shapeType === 'polygon') {
                const polygonShape = shape as PolygonShape;
                if (index < 0 || index > polygonShape.points.length) {
                    return state;
                }
                newPoints = [...polygonShape.points];
                newPoints.splice(index, 0, point);
            } else if (shape.shapeType === 'line') {
                const lineShape = shape as LineShape;
                if (index < 0 || index > lineShape.points.length) {
                    return state;
                }
                newPoints = [...lineShape.points];
                newPoints.splice(index, 0, point);
                // Keep only 2 points for a line
                if (newPoints.length > 2) {
                    newPoints = index === 0 ? [point, lineShape.points[1]] : [lineShape.points[0], point];
                }
            } else {
                return state;
            }

            const newShape = {
                ...shape,
                points: newPoints
            };

            const newEntities = updateNestedObject(
                state.entities,
                [entityId, 'shapes', shapeId],
                () => newShape
            );

            // Update lookups
            const newShapeLookup = new Map(state.shapeLookup);
            newShapeLookup.set(shapeId, { entityId, shape: newShape });

            const newBoundingBoxCache = new Map(state.boundingBoxCache);
            newBoundingBoxCache.set(shapeId, calculateBoundingBox(newShape));

            return {
                ...state,
                entities: newEntities,
                shapeLookup: newShapeLookup,
                boundingBoxCache: newBoundingBoxCache
            };
        }

        case 'DELETE_POINT': {
            const { entityId, shapeId, pointIndex } = action.payload;
            const shapeInfo = state.shapeLookup.get(shapeId);

            if (!shapeInfo || shapeInfo.entityId !== entityId) return state;

            const shape = shapeInfo.shape;
            if (shape.shapeType !== 'polygon' && shape.shapeType !== 'line') {
                return state;
            }

            if (shape.shapeType === 'polygon') {
                const polygonShape = shape as PolygonShape;
                if (polygonShape.points.length <= 3) return state;
                if (pointIndex < 0 || pointIndex >= polygonShape.points.length) {
                    return state;
                }

                const newPoints = [...polygonShape.points];
                newPoints.splice(pointIndex, 1);

                const newShape = {
                    ...shape,
                    points: newPoints
                };

                const newEntities = updateNestedObject(
                    state.entities,
                    [entityId, 'shapes', shapeId],
                    () => newShape
                );

                // Update lookups
                const newShapeLookup = new Map(state.shapeLookup);
                newShapeLookup.set(shapeId, { entityId, shape: newShape });

                const newBoundingBoxCache = new Map(state.boundingBoxCache);
                newBoundingBoxCache.set(shapeId, calculateBoundingBox(newShape));

                return {
                    ...state,
                    entities: newEntities,
                    shapeLookup: newShapeLookup,
                    boundingBoxCache: newBoundingBoxCache
                };
            } else if (shape.shapeType === 'line') {
                // Lines need at least 2 points
                const lineShape = shape as LineShape;
                if (lineShape.points.length <= 2) return state;
                return state; // Don't allow deleting points from lines
            }

            return state;
        }

        case 'MOVE_POINT': {
            const { entityId, shapeId, pointIndex, newPosition } = action.payload;

            const shapeInfo = state.shapeLookup.get(shapeId);
            if (!shapeInfo || shapeInfo.entityId !== entityId) return state;

            const shape = shapeInfo.shape;
            if (shape.shapeType !== 'polygon' && shape.shapeType !== 'line') {
                return state;
            }

            if (!validateCoordinates(newPosition)) {
                return state;
            }

            let currentPoints;
            if (shape.shapeType === 'polygon') {
                currentPoints = (shape as PolygonShape).points;
            } else {
                currentPoints = (shape as LineShape).points;
            }

            if (pointIndex < 0 || pointIndex >= currentPoints.length) {
                return state;
            }

            const currentPoint = currentPoints[pointIndex];
            if (arePointsEqual(currentPoint, newPosition)) {
                return state;
            }

            // Create new points array with the updated point
            const newPoints = [...currentPoints];
            newPoints[pointIndex] = roundCoordinates(newPosition);

            // Create new shape object
            const newShape = {
                ...shape,
                points: newPoints
            } as GeometricShape;

            // Create new entity with updated shape
            const entity = state.entities[entityId];
            const updatedEntity = {
                ...entity,
                shapes: {
                    ...entity.shapes,
                    [shapeId]: newShape
                }
            };

            const newEntities = {
                ...state.entities,
                [entityId]: updatedEntity
            };

            // Update lookups efficiently
            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.set(entityId, updatedEntity);

            const newShapeLookup = new Map(state.shapeLookup);
            newShapeLookup.set(shapeId, { entityId, shape: newShape });

            const newBoundingBoxCache = new Map(state.boundingBoxCache);
            newBoundingBoxCache.set(shapeId, calculateBoundingBox(newShape));

            return {
                ...state,
                entities: newEntities,
                entityLookup: newEntityLookup,
                shapeLookup: newShapeLookup,
                boundingBoxCache: newBoundingBoxCache
            };
        }

        case 'BATCH_IMPORT_ENTITIES': {
            const newEntities = action.payload;

            if (Object.keys(newEntities).length === 0) {
                return state;
            }

            const mergedEntities = {
                ...state.entities,
                ...newEntities
            };

            // Update all lookups
            const lookups = createOptimizedLookups(mergedEntities);

            return {
                ...state,
                entities: mergedEntities,
                entityLookup: lookups.entityLookup,
                shapeLookup: lookups.shapeLookup,
                boundingBoxCache: lookups.boundingBoxCache
            };
        }

        case 'BATCH_UPDATE_SHAPES': {
            const { entityId, shapes } = action.payload;
            const entity = state.entities[entityId];

            if (!entity) return state;

            if (Object.keys(shapes).length === 0) {
                return state;
            }

            const updatedEntity = {
                ...entity,
                shapes: {
                    ...entity.shapes,
                    ...shapes
                }
            };

            const newEntities = {
                ...state.entities,
                [entityId]: updatedEntity
            };

            // Update lookups for new shapes
            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.set(entityId, updatedEntity);

            const newShapeLookup = new Map(state.shapeLookup);
            const newBoundingBoxCache = new Map(state.boundingBoxCache);

            for (const [shapeId, shape] of Object.entries(shapes)) {
                newShapeLookup.set(shapeId, { entityId, shape });
                newBoundingBoxCache.set(shapeId, calculateBoundingBox(shape));
            }

            return {
                ...state,
                entities: newEntities,
                entityLookup: newEntityLookup,
                shapeLookup: newShapeLookup,
                boundingBoxCache: newBoundingBoxCache
            };
        }

        case 'DUPLICATE_SHAPE': {
            const { entityId, shapeId, offset = { x: 20, y: 20 } } = action.payload;
            const shapeInfo = state.shapeLookup.get(shapeId);

            if (!shapeInfo || shapeInfo.entityId !== entityId) return state;

            const shape = shapeInfo.shape;
            const newShapeId = uuidv4();

            // Create a deep copy of the shape with offset applied
            let newShape: GeometricShape;

            switch (shape.shapeType) {
                case 'polygon':
                case 'rectangle': {
                    const polygonShape = shape as PolygonShape;
                    newShape = {
                        ...polygonShape,
                        id: newShapeId,
                        points: polygonShape.points.map(point => ({
                            x: point.x + offset.x,
                            y: point.y + offset.y
                        }))
                    };
                    break;
                }

                case 'line': {
                    const lineShape = shape as LineShape;
                    newShape = {
                        ...lineShape,
                        id: newShapeId,
                        points: lineShape.points.map(point => ({
                            x: point.x + offset.x,
                            y: point.y + offset.y
                        })) as [Point, Point]
                    };
                    break;
                }

                case 'point': {
                    const pointShape = shape as PointShape;
                    newShape = {
                        ...pointShape,
                        id: newShapeId,
                        point: {
                            x: pointShape.point.x + offset.x,
                            y: pointShape.point.y + offset.y
                        }
                    };
                    break;
                }

                case 'circle':
                case 'ellipse':
                case 'arc': {
                    newShape = {
                        ...shape,
                        id: newShapeId,
                        center: {
                            x: shape.center.x + offset.x,
                            y: shape.center.y + offset.y
                        }
                    } as GeometricShape;
                    break;
                }

                case 'text': {
                    newShape = {
                        ...shape,
                        id: newShapeId,
                        position: {
                            x: shape.position.x + offset.x,
                            y: shape.position.y + offset.y
                        }
                    } as GeometricShape;
                    break;
                }

                default:
                    return state;
            }

            const entity = state.entities[entityId];
            const updatedEntity = {
                ...entity,
                shapes: {
                    ...entity.shapes,
                    [newShapeId]: newShape
                }
            };

            const newEntities = {
                ...state.entities,
                [entityId]: updatedEntity
            };

            // Update lookups
            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.set(entityId, updatedEntity);

            const newShapeLookup = new Map(state.shapeLookup);
            newShapeLookup.set(newShapeId, { entityId, shape: newShape });

            const newBoundingBoxCache = new Map(state.boundingBoxCache);
            newBoundingBoxCache.set(newShapeId, calculateBoundingBox(newShape));

            return {
                ...state,
                entities: newEntities,
                entityLookup: newEntityLookup,
                shapeLookup: newShapeLookup,
                boundingBoxCache: newBoundingBoxCache
            };
        }

        case 'UPDATE_ENTITY_METADATA': {
            const { entityId, metaData } = action.payload;
            const entity = state.entities[entityId];

            if (!entity) return state;

            // Skip if no changes
            if (
                (!metaData.entityName || metaData.entityName === entity.metaData.entityName) &&
                (!metaData.altText || metaData.altText === entity.metaData.altText) &&
                (!metaData.fontColor || metaData.fontColor === entity.metaData.fontColor)
            ) {
                return state;
            }

            const updatedEntity = {
                ...entity,
                metaData: {
                    ...entity.metaData,
                    ...metaData
                }
            };

            const newEntities = {
                ...state.entities,
                [entityId]: updatedEntity
            };

            // Update lookup
            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.set(entityId, updatedEntity);

            return {
                ...state,
                entities: newEntities,
                entityLookup: newEntityLookup,
                shapeLookup: state.shapeLookup,
                boundingBoxCache: state.boundingBoxCache
            };
        }

        case 'UPDATE_SHAPE_PROPERTIES': {
            const { entityId, shapeId, properties } = action.payload;
            const shapeInfo = state.shapeLookup.get(shapeId);

            if (!shapeInfo || shapeInfo.entityId !== entityId) return state;

            const shape = shapeInfo.shape;

            // Skip if no changes
            let hasChanges = false;
            for (const [key, value] of Object.entries(properties)) {
                if (key in shape && shape[key] !== value) {
                    hasChanges = true;
                    break;
                }
            }

            if (!hasChanges) {
                return state;
            }

            const newShape = {
                ...shape,
                ...properties
            } as GeometricShape;

            const entity = state.entities[entityId];
            const updatedEntity = {
                ...entity,
                shapes: {
                    ...entity.shapes,
                    [shapeId]: newShape
                }
            };

            const newEntities = {
                ...state.entities,
                [entityId]: updatedEntity
            };

            // Update lookups
            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.set(entityId, updatedEntity);

            const newShapeLookup = new Map(state.shapeLookup);
            newShapeLookup.set(shapeId, { entityId, shape: newShape });

            const newBoundingBoxCache = new Map(state.boundingBoxCache);
            newBoundingBoxCache.set(shapeId, calculateBoundingBox(newShape));

            return {
                ...state,
                entities: newEntities,
                entityLookup: newEntityLookup,
                shapeLookup: newShapeLookup,
                boundingBoxCache: newBoundingBoxCache
            };
        }

        // Add this case to the editorReducer function in EditorReducer.ts
        // Add this case to the editorReducer function in EditorReducer.ts
// This should be inserted in the switch statement after the 'MOVE_POINT' case

        case 'MOVE_SHAPE': {
            const { entityId, shapeId, offset } = action.payload;
            const shapeInfo = state.shapeLookup.get(shapeId);

            if (!shapeInfo || shapeInfo.entityId !== entityId) return state;

            const shape = shapeInfo.shape;
            let newShape: GeometricShape;

            // Apply offset based on shape type
            switch (shape.shapeType) {
                case 'polygon':
                case 'rectangle': {
                    const polygonShape = shape as PolygonShape;
                    newShape = {
                        ...polygonShape,
                        points: polygonShape.points.map(point => ({
                            x: point.x + offset.x,
                            y: point.y + offset.y
                        }))
                    };
                    break;
                }

                case 'line': {
                    const lineShape = shape as LineShape;
                    newShape = {
                        ...lineShape,
                        points: lineShape.points.map(point => ({
                            x: point.x + offset.x,
                            y: point.y + offset.y
                        })) as [Point, Point]
                    };
                    break;
                }

                case 'point': {
                    const pointShape = shape as PointShape;
                    newShape = {
                        ...pointShape,
                        point: {
                            x: pointShape.point.x + offset.x,
                            y: pointShape.point.y + offset.y
                        }
                    };
                    break;
                }

                case 'circle':
                case 'ellipse':
                case 'arc': {
                    newShape = {
                        ...shape,
                        center: {
                            x: shape.center.x + offset.x,
                            y: shape.center.y + offset.y
                        }
                    } as GeometricShape;
                    break;
                }

                case 'text': {
                    newShape = {
                        ...shape,
                        position: {
                            x: shape.position.x + offset.x,
                            y: shape.position.y + offset.y
                        }
                    } as GeometricShape;
                    break;
                }

                default:
                    return state;
            }

            // Create new entity with updated shape
            const entity = state.entities[entityId];
            const updatedEntity = {
                ...entity,
                shapes: {
                    ...entity.shapes,
                    [shapeId]: newShape
                }
            };

            const newEntities = {
                ...state.entities,
                [entityId]: updatedEntity
            };

            // Update lookups efficiently
            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.set(entityId, updatedEntity);

            const newShapeLookup = new Map(state.shapeLookup);
            newShapeLookup.set(shapeId, { entityId, shape: newShape });

            const newBoundingBoxCache = new Map(state.boundingBoxCache);
            newBoundingBoxCache.set(shapeId, calculateBoundingBox(newShape));

            return {
                ...state,
                entities: newEntities,
                entityLookup: newEntityLookup,
                shapeLookup: newShapeLookup,
                boundingBoxCache: newBoundingBoxCache
            };
        }
        case 'MOVE_EDGE': {
            const { entityId, shapeId, startIndex, endIndex, newStartPosition, newEndPosition } = action.payload;
            const shapeInfo = state.shapeLookup.get(shapeId);

            if (!shapeInfo || shapeInfo.entityId !== entityId) return state;

            const shape = shapeInfo.shape;
            if (shape.shapeType !== 'polygon' && shape.shapeType !== 'rectangle') {
                return state;
            }

            const polygonShape = shape as PolygonShape;

            // Validate indices
            if (startIndex < 0 || startIndex >= polygonShape.points.length ||
                endIndex < 0 || endIndex >= polygonShape.points.length) {
                return state;
            }

            // Validate coordinates
            if (!validateCoordinates(newStartPosition) || !validateCoordinates(newEndPosition)) {
                return state;
            }

            // Check if positions actually changed
            const currentStartPoint = polygonShape.points[startIndex];
            const currentEndPoint = polygonShape.points[endIndex];

            if (arePointsEqual(currentStartPoint, newStartPosition) &&
                arePointsEqual(currentEndPoint, newEndPosition)) {
                return state;
            }

            // Create new points array with updated edge
            const newPoints = [...polygonShape.points];
            newPoints[startIndex] = roundCoordinates(newStartPosition);
            newPoints[endIndex] = roundCoordinates(newEndPosition);

            // Create new shape object
            const newShape = {
                ...shape,
                points: newPoints
            } as GeometricShape;

            // Create new entity with updated shape
            const entity = state.entities[entityId];
            const updatedEntity = {
                ...entity,
                shapes: {
                    ...entity.shapes,
                    [shapeId]: newShape
                }
            };

            const newEntities = {
                ...state.entities,
                [entityId]: updatedEntity
            };

            // Update lookups efficiently
            const newEntityLookup = new Map(state.entityLookup);
            newEntityLookup.set(entityId, updatedEntity);

            const newShapeLookup = new Map(state.shapeLookup);
            newShapeLookup.set(shapeId, { entityId, shape: newShape });

            const newBoundingBoxCache = new Map(state.boundingBoxCache);
            newBoundingBoxCache.set(shapeId, calculateBoundingBox(newShape));

            return {
                ...state,
                entities: newEntities,
                entityLookup: newEntityLookup,
                shapeLookup: newShapeLookup,
                boundingBoxCache: newBoundingBoxCache
            };
        }

        default:
            return state;
    }
};
