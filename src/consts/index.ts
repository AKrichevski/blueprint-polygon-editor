// @ts-nocheck
// src/consts/index.ts
import type {EditorState} from "../contexts/editor";

// Local storage key
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
export const defaultEntities = {
    // Default recycle_bin entity
    'recycle_bin': {
        id: 'recycle_bin',
        metaData: {
            entityName: 'Recycle Bin',
            altText: 'Default entity for deleted shapes',
            fontColor: '#FF6B6B'
        },
        shapes: {},
        visible: true
    },
    // Furniture categories
    'furnitures-rooms': {
        id: 'furnitures-rooms',
        metaData: {
            entityName: 'Furnitures - Rooms',
            altText: 'Furniture items for general rooms',
            fontColor: '#8B4513'
        },
        shapes: {},
        visible: true
    },
    'furnitures-livingRoom': {
        id: 'furnitures-livingRoom',
        metaData: {
            entityName: 'Furnitures - Living Room',
            altText: 'Furniture items specifically for living room',
            fontColor: '#D2691E'
        },
        shapes: {},
        visible: true
    },
    // Electricity categories
    'electricity-kitchen': {
        id: 'electricity-kitchen',
        metaData: {
            entityName: 'Electricity - Kitchen',
            altText: 'Electrical components and outlets for kitchen',
            fontColor: '#FFD700'
        },
        shapes: {},
        visible: true
    },
    'electricity-other': {
        id: 'electricity-other',
        metaData: {
            entityName: 'Electricity - Other',
            altText: 'Electrical components for other areas',
            fontColor: '#FFA500'
        },
        shapes: {},
        visible: true
    }
};

export const initialEditorState: EditorState = {
    entities: defaultEntities,
    selectedEntityId: null,
    selectedShapeId: null,
    selectedPointIndex: null,
    scale: 1,
    position: { x: 0, y: 0 },
    mode: EditMode.SELECT,
    svgBackground: null,
    // Initialize empty lookup maps
    entityLookup: new Map(),
    shapeLookup: new Map(),
    // Initialize bounding box cache
    boundingBoxCache: new Map()
};

// Constants for state management
export const POSITION_EPSILON = 0.01;
export const MIN_SCALE = 0.05;
export const MAX_SCALE = 20;
