// src/features/editor/components/SvgBackgroundUploader.tsx
import React, {useRef, useState} from 'react';
import Modal from '../../../components/Modal';
import {classNames, cn} from '../../../styles/theme';
import {useEditor} from "../../../contexts/editor";

const SvgBackgroundUploader: React.FC = () => {
    const {state, dispatch} = useEditor();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if file is SVG
        if (file.type !== 'image/svg+xml') {
            alert('Please select an SVG file.');
            if (fileInputRef.current && "value" in fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        // Read file as data URL for preview and set background
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;

            // Generate a preview
            setPreviewUrl(result);

            // Show the confirmation modal
            setIsModalOpen(true);
        };
        reader.readAsDataURL(file);
    };

    // Set background from the preview
    const confirmBackground = () => {
        if (previewUrl) {
            try {
                // Try to optimize the SVG before setting it
                const reader = new FileReader();
                reader.onload = () => {
                    dispatch({type: 'SET_SVG_BACKGROUND', payload: previewUrl});
                };

                // If file input has a file, read it as text
                if ("files" in fileInputRef.current && fileInputRef.current?.files?.length) {
                    reader.readAsText(fileInputRef.current.files[0]);
                } else {
                    // Otherwise just set the preview URL directly
                    dispatch({type: 'SET_SVG_BACKGROUND', payload: previewUrl});
                }
            } catch (error) {
                console.error('Error optimizing SVG:', error);
                // Fall back to unoptimized version
                dispatch({type: 'SET_SVG_BACKGROUND', payload: previewUrl});
            }

            setIsModalOpen(false);
        }
    };

    // Trigger file input click
    const handleUploadClick = () => {
        if (fileInputRef.current && "click" in fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Clear background
    const handleClearBackground = () => {
        dispatch({type: 'SET_SVG_BACKGROUND', payload: null});
        if (fileInputRef.current && "value" in fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setPreviewUrl(null);
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Background</h2>

            <div className="space-y-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".svg"
                    className="hidden"
                />

                <button
                    className="w-full py-2 bg-blue-500 text-white rounded"
                    onClick={handleUploadClick}
                >
                    {state.svgBackground ? 'Change SVG Background' : 'Upload SVG Background'}
                </button>

                {state.svgBackground && (
                    <button
                        className="w-full py-2 border border-gray-300 rounded"
                        onClick={handleClearBackground}
                    >
                        Clear Background
                    </button>
                )}
            </div>

            {/* Preview Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Confirm SVG Background"
            >
                <div className="space-y-4">
                    <p>Do you want to use this SVG as the background?</p>

                    {previewUrl && (
                        <div className="border border-gray-300 rounded p-2 flex justify-center bg-gray-100">
                            <img
                                src={previewUrl}
                                alt="SVG Preview"
                                className="max-h-48 object-contain"
                            />
                        </div>
                    )}

                    <div className="flex justify-end space-x-2">
                        <button
                            className={cn(
                                classNames.button.base,
                                classNames.button.sizes.md,
                                classNames.button.outline
                            )}
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className={cn(
                                classNames.button.base,
                                classNames.button.sizes.md,
                                classNames.button.primary
                            )}
                            onClick={confirmBackground}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SvgBackgroundUploader;
