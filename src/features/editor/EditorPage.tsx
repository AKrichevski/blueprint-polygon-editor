import React, {
    useEffect,
    useState,
    useRef,
    Suspense,
    useMemo,
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

// Lazy-loaded
const HelpGuide = React.lazy(() => import('./components/HelpGuide'));

const SHAPE_TYPES_LEGEND = Object.freeze([
    { icon: '⬜', type: 'Polygon', desc: 'Custom shapes with 3+ points' },
    { icon: '▭', type: 'Rectangle', desc: 'Four-sided shapes' },
    { icon: '○', type: 'Circle', desc: 'Perfect circles' },
    { icon: '◜', type: 'Arc', desc: 'Circular segments' },
    { icon: '📏', type: 'Line', desc: 'Straight lines' },
    { icon: '⬭', type: 'Ellipse', desc: 'Oval shapes' },
    { icon: '•', type: 'Point', desc: 'Individual points' },
    { icon: '🗛', type: 'Text', desc: 'Text annotations' },
]);

const EditorPage: React.FC = memo(() => {
    const { isLoading: editorLoading } = useEditor();
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const { width, height } = useCanvasSize(canvasContainerRef);

    useKeyboardShortcuts();

    useEffect(() => {
        document.title = "Blueprint Shape Editor";

        if (localStorage.getItem('blueprint-editor-first-visit') !== 'false') {
            setIsHelpModalOpen(true);
            localStorage.setItem('blueprint-editor-first-visit', 'false');
        }
    }, []);

    const openHelp = useCallback(() => setIsHelpModalOpen(true), []);
    const closeHelp = useCallback(() => setIsHelpModalOpen(false), []);

    const shapeLegend = useMemo(() => (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Shape Types Available</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {SHAPE_TYPES_LEGEND.map(shape => (
                    <div key={shape.type} className="flex items-center">
                        <span className="mr-1">{shape.icon}</span>
                        <span>
              <strong>{shape.type}</strong>: {shape.desc}
            </span>
                    </div>
                ))}
            </div>
        </div>
    ), []);

    if (editorLoading) {
        return (
            <div className={classNames.loading.container}>
                <div className="text-center">
                    <div className={classNames.loading.spinner}></div>
                    <p className={classNames.loading.text}>Loading Blueprint Shape Editor...</p>
                </div>
            </div>
        );
    }

    console.count("EditorPage");

    return (
        <div className={classNames.container.base}>
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Blueprint Shape Editor</h1>
                    <p className="text-gray-600">Create, edit, and manage geometric shapes on your blueprint</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <EntityList />
                    <EntityDetailsEditor />
                    <ShapePropertiesEditor />
                    <ShapeDrawingTools />
                    <SvgBackgroundUploader />
                    <ImportExportTool />
                </div>

                {/* Canvas */}
                <div className="lg:col-span-3">
                    <div
                        ref={canvasContainerRef}
                        className="relative border border-gray-300 rounded-lg bg-gray-100 h-[600px]"
                    >
                        <CanvasView width={width} height={height} />
                        <ZoomControls />
                    </div>
                    {shapeLegend}
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 py-4 text-center text-gray-500 text-sm border-t border-gray-200">
                <p>Blueprint Shape Editor v1.0 • Created with React + TypeScript + Konva</p>
                <p className="mt-1">
                    Supports: Polygons, Rectangles, Circles, Arcs, Lines, Ellipses, Points, and Text
                </p>
            </footer>

            {/* Help Modal */}
            {isHelpModalOpen && (
                <Suspense fallback={
                    <div className={classNames.loading.container}>
                        <div className={classNames.loading.spinner}></div>
                    </div>
                }>
                    <HelpGuide isOpen={isHelpModalOpen} onClose={closeHelp} />
                </Suspense>
            )}
        </div>
    );
});

export default EditorPage;
