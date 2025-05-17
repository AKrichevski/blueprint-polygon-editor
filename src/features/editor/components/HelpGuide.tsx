// src/features/editor/components/HelpGuide.tsx
import React, { useState } from 'react';
import { classNames, cn } from '../../../styles/theme';
import Modal from "../../../components/Modal";

interface HelpGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

const HelpGuide: React.FC<HelpGuideProps> = ({ isOpen, onClose }) => {
    const [currentPage, setCurrentPage] = useState(0);

    const guidePages = [
        {
            title: 'Welcome to Blueprint Polygon Editor',
            content: (
                <div className="space-y-4">
                    <p>
                        Blueprint Polygon Editor is a powerful tool for creating, editing, and managing
                        polygons on architectural blueprints. This guide will help you get started.
                    </p>
                    <img
                        src="/api/placeholder/600/300"
                        alt="Blueprint Editor Overview"
                        className="mx-auto rounded border border-gray-300 shadow-sm"
                    />
                    <p>
                        You can use this tool to:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Create and manage entities (rooms, areas, walls, etc.)</li>
                        <li>Draw polygons on your blueprint</li>
                        <li>Edit polygon points for precise positioning</li>
                        <li>Add and remove points from existing polygons</li>
                        <li>Import and export your data</li>
                    </ul>
                </div>
            )
        },
        {
            title: 'Working with Entities',
            content: (
                <div className="space-y-4">
                    <p>
                        <strong>Entities</strong> are collections of related polygons. For example,
                        an entity might represent "Walls," "Living Area," "Kitchen," or any other
                        logical grouping in your blueprint.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/2">
                            <h3 className="font-medium mb-2">Entity List</h3>
                            <img
                                src="/api/placeholder/280/200"
                                alt="Entity List Panel"
                                className="rounded border border-gray-300"
                            />
                            <p className="text-sm mt-2">
                                The Entity List panel shows all available entities. Click on an entity to select it.
                            </p>
                        </div>
                        <div className="md:w-1/2">
                            <h3 className="font-medium mb-2">Adding New Entities</h3>
                            <img
                                src="/api/placeholder/280/200"
                                alt="Adding New Entity"
                                className="rounded border border-gray-300"
                            />
                            <p className="text-sm mt-2">
                                Click "Add Entity" to create a new entity. You'll need to provide a name and can
                                optionally add a description and choose a color.
                            </p>
                        </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded text-sm">
                        <strong>Tip:</strong> Organize your work by creating separate entities for different
                        elements of your blueprint (walls, rooms, windows, doors, etc.).
                    </div>
                </div>
            )
        },
        {
            title: 'Creating and Editing Polygons',
            content: (
                <div className="space-y-4">
                    <p>
                        Once you've selected an entity, you can create and edit polygons that belong to it.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-medium mb-2">Adding Polygons</h3>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Select an entity from the Entity List</li>
                                <li>Click "Add Polygon" in the Polygon Tools panel</li>
                                <li>Click on the canvas to add points to your polygon</li>
                                <li>Click "Finish Polygon" when you're done (minimum 3 points)</li>
                            </ol>
                        </div>
                        <div>
                            <h3 className="font-medium mb-2">Editing Polygons</h3>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Click on a polygon to select it</li>
                                <li>In "Select" mode, you can drag points to move them</li>
                                <li>Use "Add Point" mode to add new points to the polygon</li>
                                <li>Use "Delete Point" mode to remove points (min 3 points)</li>
                            </ol>
                        </div>
                    </div>
                    <div className="text-center">
                        <img
                            src="/api/placeholder/500/250"
                            alt="Polygon Editing Example"
                            className="mx-auto rounded border border-gray-300"
                        />
                    </div>
                </div>
            )
        },
        {
            title: 'Navigation and Keyboard Shortcuts',
            content: (
                <div className="space-y-4">
                    <p>
                        The Blueprint Polygon Editor supports several navigation methods and keyboard shortcuts
                        to speed up your workflow.
                    </p>

                    <h3 className="font-medium mb-2">Canvas Navigation</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Pan:</strong> Click and drag the canvas in Select mode</li>
                        <li><strong>Zoom:</strong> Use the mouse wheel, or the + / - buttons</li>
                        <li><strong>Double-click:</strong> Zoom in at the cursor position</li>
                        <li><strong>Reset view:</strong> Click the "Reset" button or press Ctrl+0</li>
                    </ul>

                    <h3 className="font-medium mt-4 mb-2">Common Keyboard Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        <div className="flex items-center">
                            <span className="bg-gray-100 px-2 py-1 rounded text-sm w-10 text-center mr-2">s</span>
                            <span>Select mode</span>
                        </div>
                        <div className="flex items-center">
                            <span className="bg-gray-100 px-2 py-1 rounded text-sm w-10 text-center mr-2">a</span>
                            <span>Add Polygon mode</span>
                        </div>
                        <div className="flex items-center">
                            <span className="bg-gray-100 px-2 py-1 rounded text-sm w-10 text-center mr-2">p</span>
                            <span>Add Point mode</span>
                        </div>
                        <div className="flex items-center">
                            <span className="bg-gray-100 px-2 py-1 rounded text-sm w-10 text-center mr-2">d</span>
                            <span>Delete Point mode</span>
                        </div>
                        <div className="flex items-center">
                            <span className="bg-gray-100 px-2 py-1 rounded text-sm w-10 text-center mr-2">Esc</span>
                            <span>Cancel / Deselect</span>
                        </div>
                        <div className="flex items-center">
                            <span className="bg-gray-100 px-2 py-1 rounded text-sm w-10 text-center mr-2">Del</span>
                            <span>Delete selected point</span>
                        </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded text-sm mt-4">
                        <strong>Tip:</strong> Press the <strong>?</strong> key or click "Keyboard Shortcuts" in the
                        upper right to see all available shortcuts.
                    </div>
                </div>
            )
        },
        {
            title: 'SVG Backgrounds & Import/Export',
            content: (
                <div className="space-y-4">
                    <h3 className="font-medium mb-2">Working with SVG Backgrounds</h3>
                    <p>
                        You can upload an SVG file to use as a background for your canvas. This is useful when
                        you want to trace over an existing blueprint.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/2">
                            <img
                                src="/api/placeholder/280/200"
                                alt="SVG Background Uploader"
                                className="rounded border border-gray-300"
                            />
                            <p className="text-sm mt-2">
                                Use the "Upload SVG Background" button to select an SVG file from your computer.
                            </p>
                        </div>
                        <div className="md:w-1/2">
                            <img
                                src="/api/placeholder/280/200"
                                alt="Extracting Polygons from SVG"
                                className="rounded border border-gray-300"
                            />
                            <p className="text-sm mt-2">
                                You can even extract polygons directly from SVG elements like paths, polygons, and rectangles.
                            </p>
                        </div>
                    </div>

                    <h3 className="font-medium mt-6 mb-2">Importing and Exporting Data</h3>
                    <p>
                        The Blueprint Polygon Editor allows you to save your work and continue later or transfer
                        it to another device.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Autosave:</strong> Your work is automatically saved to your browser's local storage</li>
                        <li><strong>Export:</strong> Download your data as a JSON file or copy it to clipboard</li>
                        <li><strong>Import:</strong> Upload a previously exported JSON file or paste the data</li>
                    </ul>

                    <div className="p-3 bg-yellow-50 rounded text-sm mt-4">
                        <strong>Important:</strong> Always export your data as a backup before clearing your browser
                        cache or when working on important projects. Local storage can be lost if you clear your
                        browser data.
                    </div>
                </div>
            )
        }
    ];

    // Get the current page content
    const currentPageData = guidePages[currentPage];

    // Navigation controls
    const goToNextPage = () => {
        if (currentPage < guidePages.length - 1) {
            setCurrentPage(currentPage + 1);
        } else {
            onClose();
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={currentPageData.title}
            size="lg"
        >
            <div className="space-y-6">
                {/* Page content */}
                <div className="min-h-[300px]">
                    {currentPageData.content}
                </div>

                {/* Page navigation */}
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="flex items-center">
                        <span className="text-sm text-gray-500">
                            Page {currentPage + 1} of {guidePages.length}
                        </span>

                        {/* Page indicators */}
                        <div className="flex space-x-1 ml-3">
                            {guidePages.map((_, index) => (
                                <button
                                    key={index}
                                    className={`w-2 h-2 rounded-full ${
                                        index === currentPage
                                            ? 'bg-blue-500'
                                            : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                    onClick={() => setCurrentPage(index)}
                                    aria-label={`Go to page ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        {currentPage > 0 && (
                            <button
                                className={cn(
                                    classNames.button.base,
                                    classNames.button.outline,
                                    classNames.button.sizes.md
                                )}
                                onClick={goToPrevPage}
                            >
                                Previous
                            </button>
                        )}

                        <button
                            className={cn(
                                classNames.button.base,
                                classNames.button.primary,
                                classNames.button.sizes.md
                            )}
                            onClick={goToNextPage}
                        >
                            {currentPage < guidePages.length - 1 ? 'Next' : 'Get Started'}
                        </button>
                    </div>
                </div>

                {/* Skip tutorial link */}
                <div className="text-center">
                    <button
                        className="text-sm text-gray-500 hover:text-gray-700"
                        onClick={onClose}
                    >
                        Skip tutorial
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default HelpGuide;
