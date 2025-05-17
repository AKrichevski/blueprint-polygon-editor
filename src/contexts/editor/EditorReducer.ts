// src/contexts/editor/EditorReducer.ts
import { v4 as uuidv4 } from 'uuid';
import { updateNestedObject, validateCoordinates, roundCoordinates, arePointsEqual } from './EditorUtils';
import type { EditorAction } from "./EditorContextTypes";
import type {EditorState, GeometricShape, LineShape, PolygonShape} from "../../types";

/**
 * Main reducer for editor state
 */
export const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
    switch (action.type) {
        case 'SET_ENTITIES':
            return {
                ...state,
                entities: action.payload,
            };

        case 'SET_SVG_BACKGROUND':
            // Skip if background hasn't changed
            if (state.svgBackground === action.payload) {
                return state;
            }

            return {
                ...state,
                svgBackground: action.payload,
            };

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
            };

            // Create new entities object with the new entity added
            const newEntities = {
                ...state.entities,
                [id]: newEntity
            };

            return {
                ...state,
                entities: newEntities,
                selectedEntityId: id,
            };
        }

        case 'DELETE_ENTITY': {
            // Check if this entity actually exists
            if (!state.entities[action.payload]) {
                return state;
            }

            // Use destructuring to create a new object without the deleted entity
            const { [action.payload]: deletedEntity, ...remainingEntities } = { ...state.entities };

            return {
                ...state,
                entities: remainingEntities,
                selectedEntityId: state.selectedEntityId === action.payload ? null : state.selectedEntityId,
                selectedShapeId: null,
                selectedPointIndex: null,
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

            return {
                ...state,
                entities: {
                    ...state.entities,
                    [entityId]: updatedEntity
                },
                selectedShapeId: shapeId,
            };
        }

        case 'DELETE_SHAPE': {
            const { entityId, shapeId } = action.payload;
            const entity = state.entities[entityId];

            if (!entity || !entity.shapes[shapeId]) return state;

            // Create a new shapes object without the deleted shape
            const { [shapeId]: deletedShape, ...remainingShapes } = { ...entity.shapes };

            return {
                ...state,
                entities: {
                    ...state.entities,
                    [entityId]: {
                        ...entity,
                        shapes: remainingShapes
                    }
                },
                selectedShapeId: state.selectedShapeId === shapeId ? null : state.selectedShapeId,
                selectedPointIndex: null,
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

                return {
                    ...state,
                    entities: newEntities
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

                return {
                    ...state,
                    entities: newEntities
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

                return {
                    ...state,
                    entities: newEntities,
                    selectedPointIndex: null,
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

            return {
                ...state,
                entities: newEntities
            };
        }

        case 'BATCH_IMPORT_ENTITIES': {
            const newEntities = action.payload;

            // Skip if empty
            if (Object.keys(newEntities).length === 0) {
                return state;
            }

            return {
                ...state,
                entities: {
                    ...state.entities,
                    ...newEntities
                }
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

            return {
                ...state,
                entities: {
                    ...state.entities,
                    [entityId]: {
                        ...entity,
                        shapes: {
                            ...entity.shapes,
                            ...shapes
                        }
                    }
                }
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
                        })) as [typeof point, typeof point]
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

            return {
                ...state,
                entities: {
                    ...state.entities,
                    [entityId]: {
                        ...entity,
                        shapes: {
                            ...entity.shapes,
                            [newShapeId]: newShape
                        }
                    }
                },
                selectedShapeId: newShapeId
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

            return {
                ...state,
                entities: {
                    ...state.entities,
                    [entityId]: {
                        ...entity,
                        metaData: {
                            ...entity.metaData,
                            ...metaData
                        }
                    }
                }
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

            return {
                ...state,
                entities: {
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
                }
            };
        }

        default:
            return state;
    }
};
