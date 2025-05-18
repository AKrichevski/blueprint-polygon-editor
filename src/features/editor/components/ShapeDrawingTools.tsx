// src/features/editor/components/ShapeDrawingTools.tsx
import React, { useState } from 'react';
import { useEditor } from "../../../contexts/editor";
import {EditMode} from "../../../consts";

const ShapeDrawingTools: React.FC = () => {
    const { state, mode, updateMode, selectedEntityId, selectedShapeId, dispatch } = useEditor();
    const [selectedTool, setSelectedTool] = useState<string | null>(null);

    const isEntitySelected = !!selectedEntityId;
    const isShapeSelected = !!selectedShapeId;

    // Set edit mode
    const setMode = (mode: EditMode) => {
        updateMode(mode)
        setSelectedTool(mode);
    };

    // Shape tools configuration
    const shapeTools = [
        {
            id: 'select',
            mode: EditMode.SELECT,
            icon: '🖱️',
            label: 'Select',
            description: 'Select and manipulate shapes',
            enabled: true,
        },
        {
            id: 'add_polygon',
            mode: EditMode.ADD_POLYGON,
            icon: '⬜',
            label: 'Polygon',
            description: 'Draw custom polygon',
            enabled: isEntitySelected,
        },
        {
            id: 'add_rectangle',
            mode: EditMode.ADD_RECTANGLE,
            icon: '▭',
            label: 'Rectangle',
            description: 'Draw rectangle',
            enabled: isEntitySelected,
        },
        {
            id: 'add_circle',
            mode: EditMode.ADD_CIRCLE,
            icon: '○',
            label: 'Circle',
            description: 'Draw circle',
            enabled: isEntitySelected,
        },
        {
            id: 'add_line',
            mode: EditMode.ADD_LINE,
            icon: '📏',
            label: 'Line',
            description: 'Draw straight line',
            enabled: isEntitySelected,
        },
        {
            id: 'add_arc',
            mode: EditMode.ADD_ARC,
            icon: '◜',
            label: 'Arc',
            description: 'Draw arc',
            enabled: isEntitySelected,
        },
        {
            id: 'add_ellipse',
            mode: EditMode.ADD_ELLIPSE,
            icon: '◯',
            label: 'Ellipse',
            description: 'Draw ellipse',
            enabled: isEntitySelected,
        },
        {
            id: 'add_text',
            mode: EditMode.ADD_TEXT,
            icon: '🗛',
            label: 'Text',
            description: 'Add text',
            enabled: isEntitySelected,
        },
    ];

    // Point editing tools
    const pointTools = [
        {
            id: 'add_point',
            mode: EditMode.ADD_POINT,
            icon: '📍',
            label: 'Add Point',
            description: 'Add point to shape',
            enabled: isShapeSelected && selectedShapeId &&
                ['polygon', 'line'].includes(state.entities[selectedEntityId!]?.shapes[selectedShapeId]?.shapeType || ''),
        },
        {
            id: 'delete_point',
            mode: EditMode.DELETE_POINT,
            icon: '✂️',
            label: 'Delete Point',
            description: 'Remove point from shape',
            enabled: isShapeSelected && selectedShapeId &&
                ['polygon', 'line'].includes(state.entities[selectedEntityId!]?.shapes[selectedShapeId]?.shapeType || ''),
        },
    ];

    // Get selected entity and shape
    const selectedEntity = selectedEntityId ? state.entities[selectedEntityId] : null;
    const selectedShape = selectedEntity && selectedShapeId ?
        selectedEntity.shapes[selectedShapeId] : null;

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Shape Tools</h2>

            {/* Shape drawing tools */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Drawing Tools</h3>
                <div className="grid grid-cols-3 gap-2">
                    {shapeTools.map((tool) => (
                        <button
                            key={tool.id}
                            className={`p-2 rounded text-sm transition-colors ${
                                mode === tool.mode
                                    ? 'bg-blue-100 border-blue-300 border'
                                    : 'bg-gray-100 border-gray-200 border hover:bg-gray-200'
                            } ${!tool.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => tool.enabled && setMode(tool.mode)}
                            disabled={!tool.enabled}
                            title={tool.enabled ? tool.description : 'Select an entity first'}
                        >
                            <span className="block text-center mb-1">{tool.icon}</span>
                            <span className="text-xs">{tool.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Point editing tools */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Point Editing</h3>
                <div className="grid grid-cols-2 gap-2">
                    {pointTools.map((tool) => (
                        <button
                            key={tool.id}
                            className={`p-2 rounded text-sm transition-colors ${
                                mode === tool.mode
                                    ? 'bg-blue-100 border-blue-300 border'
                                    : 'bg-gray-100 border-gray-200 border hover:bg-gray-200'
                            } ${!tool.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => tool.enabled && setMode(tool.mode)}
                            disabled={!tool.enabled}
                            title={tool.enabled ? tool.description : 'Select a polygon or line first'}
                        >
                            <span className="block text-center mb-1">{tool.icon}</span>
                            <span className="text-xs">{tool.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Shape-specific actions */}
            {isShapeSelected && selectedShape && (
                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Shape Actions</h3>
                    <div className="space-y-2">
                        <button
                            className="w-full py-2 px-3 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            onClick={() => {
                                if (selectedEntityId && selectedShapeId) {
                                    dispatch({
                                        type: 'DUPLICATE_SHAPE',
                                        payload: {
                                            entityId: selectedEntityId,
                                            shapeId: selectedShapeId,
                                            offset: { x: 20, y: 20 }
                                        }
                                    });
                                }
                            }}
                        >
                            Duplicate Shape
                        </button>
                        <button
                            className="w-full py-2 px-3 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            onClick={() => {
                                if (selectedEntityId && selectedShapeId) {
                                    if (confirm('Are you sure you want to delete this shape?')) {
                                        dispatch({
                                            type: 'DELETE_SHAPE',
                                            payload: {
                                                entityId: selectedEntityId,
                                                shapeId: selectedShapeId
                                            }
                                        });
                                    }
                                }
                            }}
                        >
                            Delete Shape
                        </button>
                    </div>
                </div>
            )}

            {/* Status display */}
            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                <p>
                    <strong>Mode:</strong> {mode}
                </p>
                <p>
                    <strong>Selected Entity:</strong>{' '}
                    {selectedEntity ? selectedEntity.metaData.entityName : 'None'}
                </p>
                {selectedShape && (
                    <>
                        <p>
                            <strong>Selected Shape:</strong> {selectedShape.shapeType}
                        </p>
                        {selectedShape.subType && (
                            <p>
                                <strong>Sub Type:</strong> {selectedShape.subType}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ShapeDrawingTools;
