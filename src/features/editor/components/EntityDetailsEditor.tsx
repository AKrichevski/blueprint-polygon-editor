// src/features/editor/components/EntityDetailsEditor.tsx
import React, { useState, useEffect } from 'react';
import { classNames, cn } from '../../../styles/theme';
import { useEditor } from "../../../contexts/editor";

const EntityDetailsEditor: React.FC = () => {
    const { state, selectedEntityId, dispatch } = useEditor();

    // Local state for form fields
    const [entityName, setEntityName] = useState('');
    const [entityDescription, setEntityDescription] = useState('');
    const [entityColor, setEntityColor] = useState('#3357FF');

    // Keep local state in sync with selected entity
    useEffect(() => {
        if (selectedEntityId && state.entities[selectedEntityId]) {
            const entity = state.entities[selectedEntityId];
            setEntityName(entity.metaData?.entityName || '');
            setEntityDescription(entity.metaData?.altText || '');
            setEntityColor(entity.metaData?.fontColor || '#3357FF');
        } else {
            // Reset form if no entity is selected
            setEntityName('');
            setEntityDescription('');
            setEntityColor('#3357FF');
        }
    }, [selectedEntityId, state.entities]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedEntityId) return;

        // Update entity metadata
        dispatch({
            type: 'UPDATE_ENTITY_METADATA',
            payload: {
                entityId: selectedEntityId,
                metaData: {
                    entityName,
                    altText: entityDescription,
                    fontColor: entityColor
                }
            }
        });
    };

    // If no entity is selected, show a message
    if (!selectedEntityId) {
        return (
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-2">Entity Details</h2>
                <p className="text-gray-500 text-sm italic">
                    Select an entity to view or edit its details
                </p>
            </div>
        );
    }

    // Get the currently selected entity
    const selectedEntity = state.entities[selectedEntityId];
    if (!selectedEntity) return null;

    // Count shapes in the entity (support both new and legacy formats)
    let shapeCount = 0;
    if (selectedEntity.shapes && typeof selectedEntity.shapes === 'object') {
        shapeCount = Object.keys(selectedEntity.shapes).length;
    } else if (selectedEntity.polygons && typeof selectedEntity.polygons === 'object') {
        shapeCount = Object.keys(selectedEntity.polygons).length;
    }

    // Get shape type breakdown
    const shapeTypeBreakdown: Record<string, number> = {};
    if (selectedEntity.shapes && typeof selectedEntity.shapes === 'object') {
        Object.values(selectedEntity.shapes).forEach(shape => {
            const shapeType = shape.shapeType || 'unknown';
            shapeTypeBreakdown[shapeType] = (shapeTypeBreakdown[shapeType] || 0) + 1;
        });
    } else if (selectedEntity.polygons && typeof selectedEntity.polygons === 'object') {
        // Legacy format - all polygons
        shapeTypeBreakdown['polygon'] = shapeCount;
    }

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Entity Details</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="entityName" className={classNames.form.label}>
                        Name
                    </label>
                    <input
                        id="entityName"
                        type="text"
                        value={entityName}
                        onChange={(e) => setEntityName(e.target.value)}
                        className={classNames.form.input}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="entityDescription" className={classNames.form.label}>
                        Description
                    </label>
                    <textarea
                        id="entityDescription"
                        value={entityDescription}
                        onChange={(e) => setEntityDescription(e.target.value)}
                        className={classNames.form.textarea}
                        rows={2}
                    />
                </div>

                <div>
                    <label htmlFor="entityColor" className={classNames.form.label}>
                        Color
                    </label>
                    <div className="flex items-center space-x-2">
                        <input
                            id="entityColor"
                            type="color"
                            value={entityColor}
                            onChange={(e) => setEntityColor(e.target.value)}
                            className="h-8 w-12 rounded"
                        />
                        <input
                            type="text"
                            value={entityColor}
                            onChange={(e) => setEntityColor(e.target.value)}
                            className={cn(classNames.form.input, "flex-1")}
                            pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                            title="Valid hex color (e.g., #FF5733)"
                        />
                    </div>
                </div>

                <div className="text-sm text-gray-600">
                    <p>
                        <strong>Entity ID:</strong> <span className="font-mono">{selectedEntityId}</span>
                    </p>
                    <p>
                        <strong>Total Shapes:</strong> {shapeCount}
                    </p>

                    {Object.entries(shapeTypeBreakdown).length > 0 && (
                        <div className="mt-2">
                            <strong>Shape Breakdown:</strong>
                            <ul className="ml-4 mt-1">
                                {Object.entries(shapeTypeBreakdown).map(([type, count]) => (
                                    <li key={type} className="text-xs">
                                        {count} {type}{count !== 1 ? 's' : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                    <button
                        type="submit"
                        className={cn(
                            classNames.button.base,
                            classNames.button.primary,
                            classNames.button.sizes.md
                        )}
                    >
                        Update Entity
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EntityDetailsEditor;
