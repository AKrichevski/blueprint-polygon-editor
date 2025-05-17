// src/features/editor/components/EntityList.tsx
import React, {useState} from 'react';
import {useEditor} from "../../../contexts/editor";
import {RiArrowDownSLine, RiArrowUpSLine, RiEyeLine, RiEyeOffLine} from 'react-icons/ri';
import type {Entity} from "../../../types";

const EntityList: React.FC = () => {
    const {state, dispatch, selectedEntityId, updateSelectedEntitiesIds} = useEditor();
    const [showAddEntityForm, setShowAddEntityForm] = useState(false);
    const [newEntityName, setNewEntityName] = useState('');
    const [newEntityDescription, setNewEntityDescription] = useState('');
    const [newEntityColor, setNewEntityColor] = useState('#3357FF');
    const [entityToDelete, setEntityToDelete] = useState<string | null>(null);
    const [expandedPanel, setExpandedPanel] = useState(true);

    // Handle entity visibility toggle
    const handleToggleVisibility = (e: React.MouseEvent, entityId: string) => {
        e.stopPropagation(); // Prevent selection when clicking the eye icon
        dispatch({
            type: 'TOGGLE_ENTITY_VISIBILITY',
            payload: {entityId}
        });
    };

    // Handle add entity form submission
    const handleAddEntity = (e: React.FormEvent) => {
        e.preventDefault();

        if (newEntityName.trim()) {
            // Generate an ID based on the name (simplified)
            const id = newEntityName.toLowerCase().replace(/\s+/g, '_');

            dispatch({
                type: 'ADD_ENTITY',
                payload: {
                    id,
                    name: newEntityName.trim(),
                    description: newEntityDescription.trim(),
                    color: newEntityColor,
                },
            });

            // Reset form
            setNewEntityName('');
            setNewEntityDescription('');
            setShowAddEntityForm(false);
        }
    };

    // Confirm entity deletion
    const confirmDeleteEntity = () => {
        if (entityToDelete) {
            dispatch({type: 'DELETE_ENTITY', payload: entityToDelete});
            setEntityToDelete(null);
        }
    };

    // Cancel entity deletion
    const cancelDeleteEntity = () => {
        setEntityToDelete(null);
    };

    // Convert entities object to array for rendering with null checks
    const entitiesList = Object.entries(state.entities || {}).map(([id, entity]) => ({
        id,
        ...entity
    }));

    // Get shape count for an entity with null checks
    const getShapeCount = (entity: Entity) => {
        if (!entity) return 0;

        if (entity.shapes && typeof entity.shapes === 'object') {
            return Object.keys(entity.shapes).length;
        }

        return 0;
    };

    return (
        <div className="bg-white rounded-lg shadow p-3">
            <div className="flex justify-between items-center mb-4" onClick={() => setExpandedPanel(prev => !prev)}>
                <h2 className="text-lg font-semibold">Layers</h2>
                <button
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    onClick={() => setShowAddEntityForm(true)}
                >
                    Add Entity
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                    {expandedPanel ? (
                        <RiArrowUpSLine className="w-5 h-5"/>
                    ) : (
                        <RiArrowDownSLine className="w-5 h-5"/>
                    )}
                </button>
            </div>

            {/* Entity list */}
            {expandedPanel && (<div className="space-y-2 max-h-96 overflow-y-auto">
                {entitiesList.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No entities yet. Create one to get started.</p>
                ) : (
                    entitiesList.map((entity) => {
                        const shapeCount = getShapeCount(entity);
                        const entityName = entity.metaData?.entityName || entity.id;
                        const entityDescription = entity.metaData?.altText || '';
                        const entityColor = entity.metaData?.fontColor || '#3357FF';

                        return (
                            <div
                                key={entity.id}
                                className={`p-3 rounded border ${
                                    entity.id === selectedEntityId
                                        ? 'bg-blue-100 border-blue-300'
                                        : 'bg-gray-50 border-gray-200'
                                }`}
                                style={{borderLeft: `4px solid ${entityColor}`}}
                            >
                                <div className="flex justify-between items-start">
                                    <div
                                        className="flex-1 cursor-pointer"
                                        onClick={() => updateSelectedEntitiesIds({entityId: entity.id})}
                                    >
                                        <h3 className="font-medium">{entityName}</h3>
                                        {entityDescription && (
                                            <p className="text-sm text-gray-600">{entityDescription}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            {shapeCount} shape{shapeCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {/* Visibility toggle button */}
                                        <button
                                            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                                                !entity.visible ? 'text-gray-400' : 'text-blue-600'
                                            }`}
                                            onClick={(e) => handleToggleVisibility(e, entity.id)}
                                            title={entity.visible ? "Hide entity" : "Show entity"}
                                        >
                                            {entity.visible ? (
                                                <RiEyeLine className="w-5 h-5"/>
                                            ) : (
                                                <RiEyeOffLine className="w-5 h-5"/>
                                            )}
                                        </button>
                                        <button
                                            className="text-red-500 hover:text-red-700 text-sm"
                                            onClick={() => setEntityToDelete(entity.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>)}

            {/* Add entity form */}
            {showAddEntityForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">Add New Entity</h3>
                        <form onSubmit={handleAddEntity}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={newEntityName}
                                    onChange={(e) => setNewEntityName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={newEntityDescription}
                                    onChange={(e) => setNewEntityDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    rows={3}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Color
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="color"
                                        value={newEntityColor}
                                        onChange={(e) => setNewEntityColor(e.target.value)}
                                        className="w-10 h-10 border border-gray-300 rounded mr-2"
                                    />
                                    <input
                                        type="text"
                                        value={newEntityColor}
                                        onChange={(e) => setNewEntityColor(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 border border-gray-300 rounded"
                                    onClick={() => setShowAddEntityForm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded"
                                    disabled={!newEntityName.trim()}
                                >
                                    Add Entity
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {entityToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
                        <p className="mb-4">
                            Are you sure you want to delete this entity? This will also delete all
                            associated shapes. This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 border border-gray-300 rounded"
                                onClick={cancelDeleteEntity}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded"
                                onClick={confirmDeleteEntity}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntityList;
