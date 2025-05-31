// src/features/editor/EditorPage.tsx
import React, {
    useEffect,
    useState,
    useRef,
    Suspense,
    useCallback,
    memo,
} from 'react';
import {
    CanvasView,
    EntityList,
    ZoomControls,
    SvgBackgroundUploader,
    KeyboardShortcutsHelp,
} from './components';
import EntityDetailsEditor from './components/EntityDetailsEditor';
import ShapePropertiesEditor from './components/ShapePropertiesEditor';
import ShapeDrawingTools from './components/ShapeDrawingTools';
import ImportExportTool from './components/ImportExportTool';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { classNames } from '../../styles/theme';
import { useEditor } from "../../contexts/editor";

// Lazy‐load the HelpGuide modal
const HelpGuide = React.lazy(() => import('./components/HelpGuide'));

const EditorPage: React.FC = memo(() => {
    const { isLoading: editorLoading } = useEditor();
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const { width, height } = useCanvasSize(canvasContainerRef);

    // Hook for keyboard shortcuts in the canvas/editor
    useKeyboardShortcuts();

    // On first load, maybe show the help modal
    useEffect(() => {
        document.title = "Blueprint Shape Editor";
        if (localStorage.getItem('blueprint-editor-first-visit') !== 'false') {
            setIsHelpModalOpen(true);
            localStorage.setItem('blueprint-editor-first-visit', 'false');
        }
    }, []);

    const openHelp = useCallback(() => setIsHelpModalOpen(true), []);
    const closeHelp = useCallback(() => setIsHelpModalOpen(false), []);

    if (editorLoading) {
        return (
            <div className={classNames.loading.container}>
                <div className="text-center">
                    <div className={classNames.loading.spinner} />
                    <p className={classNames.loading.text}>
                        Loading Blueprint Shape Editor...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {/* ========== HEADER ========== */}
            <header className="mb-4 flex justify-between items-center px-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Blueprint Shape Editor
                    </h1>
                    <p className="text-gray-600">
                        Create, edit, and manage geometric shapes on your blueprint
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={openHelp}
                    >
                        Help Guide
                    </button>
                    <KeyboardShortcutsHelp />
                </div>
            </header>

            {/* ========== MAIN CONTENT ========== */}
            <div className="flex-1 overflow-hidden">
                {/* Use a 12-column grid; sidebar spans 2 columns, canvas spans 10 */}
                <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-2">
                    {/* Sidebar: lg:col-span-2 (≈1/6 width) */}
                    <div className="lg:col-span-2 space-y-4 overflow-auto px-4">
                        <EntityList />
                        <EntityDetailsEditor />
                        <ShapePropertiesEditor />
                        <ShapeDrawingTools />
                        <SvgBackgroundUploader />
                        <ImportExportTool />
                    </div>

                    {/* Canvas: lg:col-span-10 (≈5/6 width) */}
                    <div className="lg:col-span-10 flex flex-col h-full w-full px-4">
                        <div
                            ref={canvasContainerRef}
                            className="
                relative
                flex-1
                w-full
                h-full
                border border-gray-300
                rounded-lg
                bg-gray-100
                overflow-hidden
              "
                        >
                            <CanvasView width={width} height={height} />
                            <ZoomControls />
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== HELP MODAL ========== */}
            {isHelpModalOpen && (
                <Suspense
                    fallback={
                        <div className={classNames.loading.container}>
                            <div className={classNames.loading.spinner} />
                        </div>
                    }
                >
                    <HelpGuide isOpen={isHelpModalOpen} onClose={closeHelp} />
                </Suspense>
            )}
        </div>
    );
});

export default EditorPage;
