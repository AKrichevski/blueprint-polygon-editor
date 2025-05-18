// Local storage key
import type {EditorState} from "../contexts/editor";

export const STORAGE_KEY = 'blueprint-polygon-editor-state';

export enum EditMode {
    SELECT = 'select',
    ADD_POINT = 'add_point',
    DELETE_POINT = 'delete_point',
    ADD_SHAPE = 'add_shape', // Generic shape adding mode
    ADD_POLYGON = 'add_polygon',
    ADD_LINE = 'add_line',
    ADD_CIRCLE = 'add_circle',
    ADD_RECTANGLE = 'add_rectangle',
    ADD_ARC = 'add_arc',
    ADD_ELLIPSE = 'add_ellipse',
    ADD_TEXT = 'add_text'
}

// Initial state - ensure entities is always an empty object
export const initialEditorState: EditorState = {
    entities: {},  // Always initialize as empty object
    selectedEntityId: null,
    selectedShapeId: null,
    selectedPointIndex: null,
    scale: 1,
    position: { x: 0, y: 0 },
    mode: EditMode.SELECT,
    svgBackground: null,
    // Initialize empty lookup maps
    entityLookup: new Map(),
    shapeLookup: new Map()
};

// Constants for state management
export const POSITION_EPSILON = 0.01;
export const MIN_SCALE = 0.05;
export const MAX_SCALE = 20;
