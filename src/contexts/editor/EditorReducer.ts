// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import { updateNestedObject, validateCoordinates, roundCoordinates, arePointsEqual } from './EditorUtils';
import type { EditorAction, EditorState } from "./EditorContextTypes";
import type {Entity, EntityMetaData, GeometricShape, LineShape, PolygonShape, PointShape} from "../../types";

let lastRun = 0;
let lastResult: { entityLookup: Map<string, Entity>; shapeLookup: Map<string, { entityId: string; shape: GeometricShape }> } | null = null;

export function createLookupMaps(entities: {
    [p: string]: {
        metaData: EntityMetaData;
        visible: boolean;
        shapes: {
            [p: string]: {
                shapeType: "point" | "line" | "arc" | "circle" | "ellipse" | "polygon" | "rectangle" | "text";
                entityType: string;
                style?: { radius?: number; fillColor?: string; strokeColor?: string } | {
                    strokeColor?: string;
                    strokeWidth?: number;
                    dashPattern?: number[]
                } | { strokeColor?: string; strokeWidth?: number; fillColor?: string } | {
                    fontSize?: number;
                    fontFamily?: string;
                    color?: string;
                    align?: "left" | "center" | "right";
                    rotation?: number
                };
                subType: string;
                id: string
            }
        };
        id: string
    }
}): typeof lastResult {
    const now = performance.now();
    const THROTTLE_MS = 50; // adjust this to your needs

    if (lastResult && now - lastRun < THROTTLE_MS) {
        return lastResult;
    }

    const entityLookup = new Map<string, Entity>();
    const shapeLookup = new Map<string, { entityId: string; shape: GeometricShape }>();

    for (const entityId in entities) {
        const entity = entities[entityId];
        entityLookup.set(entityId, <Entity>entity);

        const shapes = entity.shapes;
        if (!shapes) continue;

        for (const shapeId in shapes) {
            shapeLookup.set(shapeId, {
                entityId,
                shape: shapes[shapeId],
            });
        }
    }

    lastRun = now;
    lastResult = { entityLookup, shapeLookup };

    return lastResult;
}

/**
 * Main reducer for editor state
 */
export const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
    // let updatedState: EditorState;

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
            const lookup = createLookupMaps(newEntities);
            if (!lookup) return state; // or handle gracefully
            const { entityLookup, shapeLookup } = lookup;


            return {
                ...state,
                entities: newEntities,
                entityLookup,
                shapeLookup
            };
        }

        case 'SET_SVG_BACKGROUND':
            // Skip if background hasn't changed
            if (state.svgBackground === action.payload) {
                return state;
            }

            return {
                ...state,
                svgBackground: action.payload,
            };

        case 'TOGGLE_ENTITY_VISIBILITY': {
            const { entityId } = action.payload;
            const entity = state.entities[entityId];

            if (!entity) return state;

            const newEntities = {
                ...state.entities,
                [entityId]: {
                    ...entity,
                    visible: !entity.visible
                }
            };

            // Update lookup maps
            const lookup = createLookupMaps(newEntities);
            if (!lookup) return state; // or handle gracefully
            const { entityLookup, shapeLookup } = lookup;


            return {
                ...state,
                entities: newEntities,
                entityLookup,
                shapeLookup
            };
        }

        case 'ADD_ENTITY': {
            const { id, name, description, color } = action.payload;

            // Create the new entity structure
            const newEntity = {
                id,
                metaData: {
                    entityName: name,
                    altText: description,
                    fontColor: color
                },
                shapes: {},  // Initialize with empty shapes object
                visible: true, // Ensure visibility is set
            };

            // Create new entities object with the new entity added
            const newEntities = {
                ...state.entities,
                [id]: newEntity
            };

            // Update lookup maps
            const lookup = createLookupMaps(newEntities);
            if (!lookup) return state; // or handle gracefully
            const { entityLookup, shapeLookup } = lookup;


            return {
                ...state,
                entities: newEntities,
                entityLookup,
                shapeLookup
            };
        }

        case 'DELETE_ENTITY': {
            // Check if this entity actually exists
            if (!state.entities[action.payload]) {
                return state;
            }

            // Use destructuring to create a new object without the deleted entity
            const { [action.payload]: deletedEntity, ...remainingEntities } = { ...state.entities };

            // Update lookup maps
            const { entityLookup, shapeLookup } = createLookupMaps(remainingEntities);

            return {
                ...state,
                entities: remainingEntities,
                entityLookup,
                shapeLookup
            };
        }

        case 'ADD_SHAPE': {
            const { entityId, shape } = action.payload;
            const entity = state.entities[entityId];

            if (!entity) return state;

            // Create the new shape object with a unique ID if not provided
            const shapeId = shape.id || uuidv4();
            const newShape: GeometricShape = {
                ...shape,
                id: shapeId,
            };

            // Update entity with the new shape
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

            // Update lookup maps
            const lookup = createLookupMaps(newEntities);
            if (!lookup) return state; // or handle gracefully
            const { entityLookup, shapeLookup } = lookup;


            return {
                ...state,
                entities: newEntities,
                entityLookup,
                shapeLookup
            };
        }

        case 'DELETE_SHAPE': {
            const { entityId, shapeId } = action.payload;
            const entity = state.entities[entityId];

            if (!entity || !entity.shapes[shapeId]) return state;

            // Create a new shapes object without the deleted shape
            const { [shapeId]: deletedShape, ...remainingShapes } = { ...entity.shapes };

            const newEntities = {
                ...state.entities,
                [entityId]: {
                    ...entity,
                    shapes: remainingShapes
                }
            };

            // Update lookup maps
            const lookup = createLookupMaps(newEntities);
            if (!lookup) return state; // or handle gracefully
            const { entityLookup, shapeLookup } = lookup;


            return {
                ...state,
                entities: newEntities,
                entityLookup,
                shapeLookup
            };
        }

        case 'ADD_POINT': {
            const { entityId, shapeId, point, index } = action.payload;
            const entity = state.entities[entityId];

            if (!entity) return state;

            const shape = entity.shapes[shapeId];

            if (!shape) return state;

            // Only polygons and lines can have points added
            if (shape.shapeType !== 'polygon' && shape.shapeType !== 'line') {
                return state;
            }

            // Validate point
            if (!validateCoordinates(point)) {
                return state;
            }

            let newPoints;
            if (shape.shapeType === 'polygon') {
                const polygonShape = shape as PolygonShape;

                // Validate index
                if (index < 0 || index > polygonShape.points.length) {
                    return state;
                }

                // Create new points array with the new point inserted
                newPoints = [...polygonShape.points];
                newPoints.splice(index, 0, point);

                // Use the helper function to only update the changed parts
                const newEntities = updateNestedObject(
                    state.entities,
                    [entityId, 'shapes', shapeId, 'points'],
                    () => newPoints
                );

                // Update lookup maps
                const lookup = createLookupMaps(newEntities);
                if (!lookup) return state; // or handle gracefully
                const { entityLookup, shapeLookup } = lookup;


                return {
                    ...state,
                    entities: newEntities,
                    entityLookup,
                    shapeLookup
                };
            } else if (shape.shapeType === 'line') {
                const lineShape = shape as LineShape;

                // For lines, we can only add points at the beginning or end
                if (index < 0 || index > lineShape.points.length) {
                    return state;
                }

                newPoints = [...lineShape.points];
                newPoints.splice(index, 0, point);

                // Update to keep it as a line with 2 points
                if (newPoints.length > 2) {
                    // If adding to a line, we need to decide if we're extending the line
                    // or converting it to a polyline
                    // For now, let's keep it simple and just update the endpoints
                    newPoints = index === 0 ? [point, lineShape.points[1]] : [lineShape.points[0], point];
                }

                const newEntities = updateNestedObject(
                    state.entities,
                    [entityId, 'shapes', shapeId, 'points'],
                    () => newPoints
                );

                // Update lookup maps
                const lookup = createLookupMaps(newEntities);
                if (!lookup) return state; // or handle gracefully
                const { entityLookup, shapeLookup } = lookup;


                return {
                    ...state,
                    entities: newEntities,
                    entityLookup,
                    shapeLookup
                };
            }

            return state;
        }

        case 'DELETE_POINT': {
            const { entityId, shapeId, pointIndex } = action.payload;
            const entity = state.entities[entityId];

            if (!entity) return state;

            const shape = entity.shapes[shapeId];

            if (!shape) return state;

            // Only polygons and lines can have points deleted
            if (shape.shapeType !== 'polygon' && shape.shapeType !== 'line') {
                return state;
            }

            if (shape.shapeType === 'polygon') {
                const polygonShape = shape as PolygonShape;

                // Ensure polygon maintains at least 3 points
                if (polygonShape.points.length <= 3) return state;

                // Validate index
                if (pointIndex < 0 || pointIndex >= polygonShape.points.length) {
                    return state;
                }

                // Create new points array without the deleted point
                const newPoints = [...polygonShape.points];
                newPoints.splice(pointIndex, 1);

                // Use the helper function to only update the changed parts
                const newEntities = updateNestedObject(
                    state.entities,
                    [entityId, 'shapes', shapeId, 'points'],
                    () => newPoints
                );

                // Update lookup maps
                const lookup = createLookupMaps(newEntities);
                if (!lookup) return state; // or handle gracefully
                const { entityLookup, shapeLookup } = lookup;


                return {
                    ...state,
                    entities: newEntities,
                    entityLookup,
                    shapeLookup
                };
            } else if (shape.shapeType === 'line') {
                // Lines need at least 2 points
                const lineShape = shape as LineShape;
                if (lineShape.points.length <= 2) return state;

                // For lines, deleting a point might convert it to a simple 2-point line
                // This is a design decision - you could also delete the entire line
                return state;  // For now, don't allow deleting points from lines
            }

            return state;
        }

        case 'MOVE_POINT': {
            const { entityId, shapeId, pointIndex, newPosition } = action.payload;
            const entity = state.entities[entityId];

            if (!entity) return state;

            const shape = entity.shapes[shapeId];

            if (!shape) return state;

            // Only polygons and lines can have points moved
            if (shape.shapeType !== 'polygon' && shape.shapeType !== 'line') {
                return state;
            }

            // Validate coordinates
            if (!validateCoordinates(newPosition)) {
                return state;
            }

            let currentPoints;
            if (shape.shapeType === 'polygon') {
                currentPoints = (shape as PolygonShape).points;
            } else if (shape.shapeType === 'line') {
                currentPoints = (shape as LineShape).points;
            } else {
                return state;
            }

            // Validate index
            if (pointIndex < 0 || pointIndex >= currentPoints.length) {
                return state;
            }

            // Skip update if position didn't change significantly
            const currentPoint = currentPoints[pointIndex];
            if (arePointsEqual(currentPoint, newPosition)) {
                return state;
            }

            // Round coordinates to prevent floating point errors causing jumpiness
            const roundedPosition = roundCoordinates(newPosition);

            // Create new points array with the updated point
            const newPoints = [...currentPoints];
            newPoints[pointIndex] = roundedPosition;

            // Use the helper function to only update the changed parts
            const newEntities = updateNestedObject(
                state.entities,
                [entityId, 'shapes', shapeId, 'points'],
                () => newPoints
            );

            // Update lookup maps
            const lookup = createLookupMaps(newEntities);
            if (!lookup) return state; // or handle gracefully
            const { entityLookup, shapeLookup } = lookup;


            return {
                ...state,
                entities: newEntities,
                entityLookup,
                shapeLookup
            };
        }

        case 'BATCH_IMPORT_ENTITIES': {
            const newEntities = action.payload;

            // Skip if empty
            if (Object.keys(newEntities).length === 0) {
                return state;
            }

            const mergedEntities = {
                ...state.entities,
                ...newEntities
            };

            // Update lookup maps
            const { entityLookup, shapeLookup } = createLookupMaps(mergedEntities);

            return {
                ...state,
                entities: mergedEntities,
                entityLookup,
                shapeLookup
            };
        }

        case 'BATCH_UPDATE_SHAPES': {
            const { entityId, shapes } = action.payload;
            const entity = state.entities[entityId];

            if (!entity) return state;

            // Skip if no new shapes
            if (Object.keys(shapes).length === 0) {
                return state;
            }

            const newEntities = {
                ...state.entities,
                [entityId]: {
                    ...entity,
                    shapes: {
                        ...entity.shapes,
                        ...shapes
                    }
                }
            };

            // Update lookup maps
            const lookup = createLookupMaps(newEntities);
            if (!lookup) return state; // or handle gracefully
            const { entityLookup, shapeLookup } = lookup;


            return {
                ...state,
                entities: newEntities,
                entityLookup,
                shapeLookup
            };
        }

        case 'DUPLICATE_SHAPE': {
            const { entityId, shapeId, offset = { x: 20, y: 20 } } = action.payload;
            const entity = state.entities[entityId];

            if (!entity) return state;

            const shape = entity.shapes[shapeId];

            if (!shape) return state;

            // Create a new shape ID
            const newShapeId = uuidv4();

            // Create a deep copy of the shape with offset applied based on shape type
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
                        }))
                    };
                    break;
                }

                case 'point': {
                    newShape = {
                        ...shape,
                        id: newShapeId,
                        point: {
                            x: shape.point.x + offset.x,
                            y: shape.point.y + offset.y
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
                    };
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
                    };
                    break;
                }

                default:
                    return state;
            }

            const newEntities = {
                ...state.entities,
                [entityId]: {
                    ...entity,
                    shapes: {
                        ...entity.shapes,
                        [newShapeId]: newShape
                    }
                }
            };

            // Update lookup maps
            const lookup = createLookupMaps(newEntities);
            if (!lookup) return state; // or handle gracefully
            const { entityLookup, shapeLookup } = lookup;


            return {
                ...state,
                entities: newEntities,
                entityLookup,
                shapeLookup
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

            const newEntities = {
                ...state.entities,
                [entityId]: {
                    ...entity,
                    metaData: {
                        ...entity.metaData,
                        ...metaData
                    }
                }
            };

            // Update lookup maps
            const lookup = createLookupMaps(newEntities);
            if (!lookup) return state; // or handle gracefully
            const { entityLookup, shapeLookup } = lookup;


            return {
                ...state,
                entities: newEntities,
                entityLookup,
                shapeLookup
            };
        }

        case 'UPDATE_SHAPE_PROPERTIES': {
            const { entityId, shapeId, properties } = action.payload;
            const entity = state.entities[entityId];

            if (!entity) return state;

            const shape = entity.shapes[shapeId];

            if (!shape) return state;

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

            const newEntities = {
                ...state.entities,
                [entityId]: {
                    ...entity,
                    shapes: {
                        ...entity.shapes,
                        [shapeId]: {
                            ...shape,
                            ...properties
                        }
                    }
                }
            };

            // Update lookup maps
            const lookup = createLookupMaps(newEntities);
            if (!lookup) return state; // or handle gracefully
            const { entityLookup, shapeLookup } = lookup;

            return {
                ...state,
                entities: newEntities,
                entityLookup,
                shapeLookup
            };
        }

        default:
            return state;
    }
};
