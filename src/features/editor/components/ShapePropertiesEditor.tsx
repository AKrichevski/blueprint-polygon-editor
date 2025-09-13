// @ts-nocheck
// src/features/editor/components/ShapePropertiesEditor.tsx
import React, { useState, useEffect } from 'react';
import { classNames, cn } from '../../../styles/theme';
import { useEditor } from "../../../contexts/editor";
import type { GeometricShape } from '../../../types';
import {calculateLineLength, calculatePolygonArea, calculatePolygonPerimeter} from "../utils/polygonHelpers.ts";

const ShapePropertiesEditor: React.FC = () => {
    const { state, selectedEntityId, selectedShapeId, dispatch } = useEditor();
    const [localProperties, setLocalProperties] = useState<any>({
        subType: '',
        style: {},
        text: '',
        radius: 0,
        radiusX: 0,
        radiusY: 0,
        rotation: 0,
        startAngle: 0,
        endAngle: 0
    });

    // Get selected entity and shape
    const selectedEntity = selectedEntityId ? state.entities[selectedEntityId] : null;
    const selectedShape = selectedEntity && selectedShapeId ?
        selectedEntity.shapes[selectedShapeId] : null;

    // Update local properties when selection changes
    useEffect(() => {
        if (selectedShape) {
            setLocalProperties({
                subType: selectedShape.subType || '',
                style: selectedShape.style || {},
                // Initialize all possible shape-specific properties with defaults
                text: '',
                radius: 0,
                radiusX: 0,
                radiusY: 0,
                rotation: 0,
                startAngle: 0,
                endAngle: 0,
                // Then override with actual shape properties
                ...getShapeSpecificProperties(selectedShape)
            });
        } else {
            setLocalProperties({
                subType: '',
                style: {},
                text: '',
                radius: 0,
                radiusX: 0,
                radiusY: 0,
                rotation: 0,
                startAngle: 0,
                endAngle: 0
            });
        }
    }, [selectedShape]);

    // Get shape-specific properties based on shape type
    const getShapeSpecificProperties = (shape: GeometricShape) => {
        const props: any = {};
        switch (shape.shapeType) {
            case 'text':
                if ('text' in shape) {
                    props.text = shape.text;
                }
                break;

            case 'circle':
                if ('radius' in shape) {
                    props.radius = shape.radius;
                }
                break;

            case 'ellipse':
                if ('radiusX' in shape && 'radiusY' in shape) {
                    props.radiusX = shape.radiusX;
                    props.radiusY = shape.radiusY;
                    props.rotation = shape.rotation || 0;
                }
                break;

            case 'arc':
                if ('radius' in shape && 'startAngle' in shape && 'endAngle' in shape) {
                    props.radius = shape.radius;
                    props.startAngle = shape.startAngle;
                    props.endAngle = shape.endAngle;
                }
                break;
            default:
                // No shape-specific properties needed
                break;
        }

        return props;
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEntityId || !selectedShapeId || !selectedShape) return;

        // Prepare update payload
        const updatePayload: any = {
            subType: localProperties.subType,
            style: localProperties.style,
        };

        // Add shape-specific properties
        switch (selectedShape.shapeType) {
            case 'text':
                updatePayload.text = localProperties.text;
                break;

            case 'circle':
                updatePayload.radius = parseFloat(localProperties.radius);
                break;

            case 'ellipse':
                updatePayload.radiusX = parseFloat(localProperties.radiusX);
                updatePayload.radiusY = parseFloat(localProperties.radiusY);
                updatePayload.rotation = parseFloat(localProperties.rotation);
                break;

            case 'arc':
                updatePayload.radius = parseFloat(localProperties.radius);
                updatePayload.startAngle = parseFloat(localProperties.startAngle);
                updatePayload.endAngle = parseFloat(localProperties.endAngle);
                break;
        }

        // Update shape properties
        dispatch({
            type: 'UPDATE_SHAPE_PROPERTIES',
            payload: {
                entityId: selectedEntityId,
                shapeId: selectedShapeId,
                properties: updatePayload
            }
        });
    };

    // If no shape is selected, show a message
    if (!selectedShape) {
        return (
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-2">Shape Properties</h2>
                <p className="text-gray-500 text-sm italic">
                    Select a shape to view or edit its properties
                </p>
            </div>
        );
    }

    // Common style properties for all shapes
    const styleProperties = [
        { name: 'strokeColor', label: 'Stroke Color', type: 'color' },
        { name: 'strokeWidth', label: 'Stroke Width', type: 'number', min: 0, step: 0.5 },
        { name: 'fillColor', label: 'Fill Color', type: 'color' },
    ];

    // Text-specific style properties
    const textStyleProperties = [
        { name: 'fontSize', label: 'Font Size', type: 'number', min: 8, step: 1 },
        { name: 'fontFamily', label: 'Font Family', type: 'text' },
        { name: 'align', label: 'Text Align', type: 'select', options: ['left', 'center', 'right'] },
        { name: 'rotation', label: 'Rotation', type: 'number', min: 0, max: 360, step: 1 },
    ];

    // Get appropriate style properties based on shape type
    const getApplicableStyleProperties = () => {
        if (selectedShape.shapeType === 'text') {
            return [
                { name: 'color', label: 'Text Color', type: 'color' },
                ...textStyleProperties
            ];
        } else if (selectedShape.shapeType === 'line') {
            return styleProperties.filter(prop => prop.name !== 'fillColor');
        } else {
            return styleProperties;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Shape Properties</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic properties */}
                <div>
                    <label className={classNames.form.label}>
                        Shape Type
                    </label>
                    <input
                        type="text"
                        value={selectedShape.shapeType}
                        disabled
                        className={cn(classNames.form.input, "bg-gray-100 cursor-not-allowed")}
                    />
                </div>

                <div>
                    <label htmlFor="subType" className={classNames.form.label}>
                        Sub Type
                    </label>
                    <input
                        id="subType"
                        type="text"
                        value={localProperties.subType}
                        onChange={(e) => setLocalProperties(prev => ({ ...prev, subType: e.target.value }))}
                        className={classNames.form.input}
                        placeholder="e.g., living_space, bedroom, wall"
                    />
                </div>

                {/* Shape-specific properties */}
                {selectedShape.shapeType === 'text' && (
                    <div>
                        <label htmlFor="text" className={classNames.form.label}>
                            Text Content
                        </label>
                        <textarea
                            id="text"
                            value={localProperties.text || ''}
                            onChange={(e) => setLocalProperties(prev => ({ ...prev, text: e.target.value }))}
                            className={classNames.form.textarea}
                            rows={3}
                        />
                    </div>
                )}

                {selectedShape.shapeType === 'circle' && (
                    <div>
                        <label htmlFor="radius" className={classNames.form.label}>
                            Radius
                        </label>
                        <input
                            id="radius"
                            type="number"
                            min="1"
                            step="1"
                            value={localProperties.radius || 0}
                            onChange={(e) => setLocalProperties(prev => ({ ...prev, radius: e.target.value }))}
                            className={classNames.form.input}
                        />
                    </div>
                )}

                {selectedShape.shapeType === 'ellipse' && (
                    <>
                        <div>
                            <label htmlFor="radiusX" className={classNames.form.label}>
                                Horizontal Radius
                            </label>
                            <input
                                id="radiusX"
                                type="number"
                                min="1"
                                step="1"
                                value={localProperties.radiusX || 0}
                                onChange={(e) => setLocalProperties(prev => ({ ...prev, radiusX: e.target.value }))}
                                className={classNames.form.input}
                            />
                        </div>
                        <div>
                            <label htmlFor="radiusY" className={classNames.form.label}>
                                Vertical Radius
                            </label>
                            <input
                                id="radiusY"
                                type="number"
                                min="1"
                                step="1"
                                value={localProperties.radiusY || 0}
                                onChange={(e) => setLocalProperties(prev => ({ ...prev, radiusY: e.target.value }))}
                                className={classNames.form.input}
                            />
                        </div>
                        <div>
                            <label htmlFor="rotation" className={classNames.form.label}>
                                Rotation (degrees)
                            </label>
                            <input
                                id="rotation"
                                type="number"
                                min="0"
                                max="360"
                                step="1"
                                value={localProperties.rotation || 0}
                                onChange={(e) => setLocalProperties(prev => ({ ...prev, rotation: e.target.value }))}
                                className={classNames.form.input}
                            />
                        </div>
                    </>
                )}

                {selectedShape.shapeType === 'arc' && (
                    <>
                        <div>
                            <label htmlFor="radius" className={classNames.form.label}>
                                Radius
                            </label>
                            <input
                                id="radius"
                                type="number"
                                min="1"
                                step="1"
                                value={localProperties.radius || 0}
                                onChange={(e) => setLocalProperties(prev => ({ ...prev, radius: e.target.value }))}
                                className={classNames.form.input}
                            />
                        </div>
                        <div>
                            <label htmlFor="startAngle" className={classNames.form.label}>
                                Start Angle (degrees)
                            </label>
                            <input
                                id="startAngle"
                                type="number"
                                min="0"
                                max="360"
                                step="1"
                                value={localProperties.startAngle || 0}
                                onChange={(e) => setLocalProperties(prev => ({ ...prev, startAngle: e.target.value }))}
                                className={classNames.form.input}
                            />
                        </div>
                        <div>
                            <label htmlFor="endAngle" className={classNames.form.label}>
                                End Angle (degrees)
                            </label>
                            <input
                                id="endAngle"
                                type="number"
                                min="0"
                                max="360"
                                step="1"
                                value={localProperties.endAngle || 0}
                                onChange={(e) => setLocalProperties(prev => ({ ...prev, endAngle: e.target.value }))}
                                className={classNames.form.input}
                            />
                        </div>
                    </>
                )}

                {/* Style properties */}
                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Style</h3>
                    {getApplicableStyleProperties().map((prop) => (
                        <div key={prop.name} className="mb-3">
                            <label htmlFor={prop.name} className={classNames.form.label}>
                                {prop.label}
                            </label>
                            {prop.type === 'color' ? (
                                <div className="flex items-center space-x-2">
                                    <input
                                        id={prop.name}
                                        type="color"
                                        value={localProperties.style?.[prop.name] || '#000000'}
                                        onChange={(e) => setLocalProperties(prev => ({
                                            ...prev,
                                            style: {
                                                ...prev.style,
                                                [prop.name]: e.target.value
                                            }
                                        }))}
                                        className="h-8 w-12 rounded"
                                    />
                                    <input
                                        type="text"
                                        value={localProperties.style?.[prop.name] || '#000000'}
                                        onChange={(e) => setLocalProperties(prev => ({
                                            ...prev,
                                            style: {
                                                ...prev.style,
                                                [prop.name]: e.target.value
                                            }
                                        }))}
                                        className={cn(classNames.form.input, "flex-1")}
                                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                        title="Valid hex color (e.g., #FF5733)"
                                    />
                                </div>
                            ) : prop.type === 'select' ? (
                                <select
                                    id={prop.name}
                                    value={localProperties.style?.[prop.name] || ''}
                                    onChange={(e) => setLocalProperties(prev => ({
                                        ...prev,
                                        style: {
                                            ...prev.style,
                                            [prop.name]: e.target.value
                                        }
                                    }))}
                                    className={classNames.form.select}
                                >
                                    <option value="">Default</option>
                                    {prop.options?.map(option => (
                                        <option key={option} value={option}>
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    id={prop.name}
                                    type={prop.type}
                                    min={prop.min}
                                    max={prop.max}
                                    step={prop.step}
                                    value={localProperties.style?.[prop.name] || ''}
                                    onChange={(e) => setLocalProperties(prev => ({
                                        ...prev,
                                        style: {
                                            ...prev.style,
                                            [prop.name]: e.target.value
                                        }
                                    }))}
                                    className={classNames.form.input}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Shape statistics */}
                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Statistics</h3>
                    <div className="gap-2 text-sm">
                        <div>
                            <span className="text-gray-600">ID:</span>{' '}
                            <span className="font-mono text-xs">{selectedShape.id}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Entity:</span>{' '}
                            {selectedEntity?.metaData.entityName}
                        </div>
                        <div>
                            <span className="text-gray-600">Name:</span>{' '}
                            <span className="font-mono text-xs">{selectedShape.name}</span>
                        </div>
                        {/* Shape type specific stats */}
                        {selectedShape.shapeType === 'polygon' && 'points' in selectedShape && (
                            <>
                                <div>
                                    <span className="text-gray-600">Points:</span>{' '}
                                    {selectedShape.points.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(', ')}
                                </div>
                                <div>
                                    <span className="text-gray-600">Area:</span>{' '}
                                    {calculatePolygonArea(selectedShape.points).toFixed(2)} px²
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-600">Perimeter:</span>{' '}
                                    {calculatePolygonPerimeter(selectedShape.points).toFixed(2)} px
                                </div>
                            </>
                        )}

                        {selectedShape.shapeType === 'line' && 'points' in selectedShape && (
                            <div className="col-span-2">
                                <span className="text-gray-600">Length:</span>{' '}
                                {calculateLineLength(selectedShape.points).toFixed(2)} px
                            </div>
                        )}

                        {selectedShape.shapeType === 'circle' && 'radius' in selectedShape && (
                            <>
                                <div>
                                    <span className="text-gray-600">Area:</span>{' '}
                                    {(Math.PI * Math.pow(selectedShape.radius, 2)).toFixed(2)} px²
                                </div>
                                <div>
                                    <span className="text-gray-600">Circumference:</span>{' '}
                                    {(2 * Math.PI * selectedShape.radius).toFixed(2)} px
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Form actions */}
                <div className="flex justify-end space-x-2 pt-4">
                    <button
                        type="submit"
                        className={cn(
                            classNames.button.base,
                            classNames.button.primary,
                            classNames.button.sizes.md
                        )}
                    >
                        Update Shape
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ShapePropertiesEditor;
