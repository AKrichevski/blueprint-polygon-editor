// src/features/editor/components/ImportExportTool.tsx
import React, { useState, useRef, useCallback } from 'react';
import Modal from '../../../components/Modal';
import { classNames, cn } from '../../../styles/theme';
import { useEditor } from "../../../contexts/editor";

const ImportExportTool: React.FC = () => {
    const { exportData, importData, saveToLocalStorage } = useEditor();
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [exportText, setExportText] = useState('');
    const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
    const [isAnalyzingData, setIsAnalyzingData] = useState(false);
    const [dataFormatAnalysis, setDataFormatAnalysis] = useState<string | null>(null);
    const exportTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const importTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Handle export button click
    const handleExport = () => {
        try {
            const jsonData = exportData();
            setExportText(jsonData);
            setIsExportModalOpen(true);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again.');
        }
    };

    // Handle import button click - opens the import modal
    const handleOpenImport = () => {
        setImportText('');
        setImportStatus(null);
        setDataFormatAnalysis(null);
        setIsAnalyzingData(false);
        setIsImportModalOpen(true);
    };

    // Analyze the data format before importing
    const analyzeDataFormat = useCallback((jsonText: string) => {
        setIsAnalyzingData(true);

        try {
            // Try to parse the JSON
            const parsedData = JSON.parse(jsonText);

            // Generate a human-readable description of the data format
            let formatDescription = "Data Format Analysis:\n\n";

            if (parsedData.entities && typeof parsedData.entities === 'object') {
                const entityCount = Object.keys(parsedData.entities).length;
                formatDescription += `✅ Standard shape format detected with 'entities' property\n`;
                formatDescription += `📊 Contains ${entityCount} entities\n\n`;

                // Analyze shape types across all entities
                const shapeTypes: Record<string, number> = {};
                const totalShapes = { count: 0, legacy: 0, new: 0 };

                Object.values(parsedData.entities).forEach((entity: any) => {
                    if (entity.shapes && typeof entity.shapes === 'object') {
                        Object.values(entity.shapes).forEach((shape: any) => {
                            const shapeType = shape.shapeType || 'unknown';
                            shapeTypes[shapeType] = (shapeTypes[shapeType] || 0) + 1;
                            totalShapes.count++;
                            totalShapes.new++;
                        });
                    }

                    if (entity.polygons && typeof entity.polygons === 'object') {
                        const polygonCount = Object.keys(entity.polygons).length;
                        shapeTypes['polygon (legacy)'] = (shapeTypes['polygon (legacy)'] || 0) + polygonCount;
                        totalShapes.count += polygonCount;
                        totalShapes.legacy += polygonCount;
                    }
                });

                formatDescription += `📈 Total shapes: ${totalShapes.count}\n`;
                if (totalShapes.new > 0) {
                    formatDescription += `   - New format shapes: ${totalShapes.new}\n`;
                }
                if (totalShapes.legacy > 0) {
                    formatDescription += `   - Legacy polygon format: ${totalShapes.legacy}\n`;
                }

                if (Object.keys(shapeTypes).length > 0) {
                    formatDescription += `\n🔍 Shape types detected:\n`;
                    Object.entries(shapeTypes).forEach(([type, count]) => {
                        formatDescription += `   - ${type}: ${count}\n`;
                    });
                }
            }
            else if (Array.isArray(parsedData)) {
                formatDescription += `⚠️  Array format detected (non-standard)\n`;
                formatDescription += `📊 Contains ${parsedData.length} items\n`;

                // Check if items look like entities
                const sampleItem = parsedData[0];
                if (sampleItem && typeof sampleItem === 'object') {
                    if (sampleItem.metaData || sampleItem.polygons || sampleItem.shapes) {
                        formatDescription += `✅ Items appear to be entities\n`;
                    } else {
                        formatDescription += `⚠️  Items do not appear to be standard entities\n`;
                    }
                }
            }
            else if (typeof parsedData === 'object') {
                // Check if root keys might be entity IDs
                const hasEntitiesStructure = Object.values(parsedData).some(
                    value => typeof value === 'object' &&
                        value !== null &&
                        (Object.prototype.hasOwnProperty.call(value, 'metaData') ||
                            Object.prototype.hasOwnProperty.call(value, 'polygons') ||
                            Object.prototype.hasOwnProperty.call(value, 'shapes'))
                );

                if (hasEntitiesStructure) {
                    formatDescription += `⚠️  Root object appears to directly contain entities (legacy format)\n`;
                    formatDescription += `📊 Contains ${Object.keys(parsedData).length} potential entities\n`;

                    // Analyze shapes in root-level entities
                    const shapeTypes: Record<string, number> = {};
                    let totalShapes = 0;

                    Object.values(parsedData).forEach((entity: any) => {
                        if (entity.shapes && typeof entity.shapes === 'object') {
                            Object.values(entity.shapes).forEach((shape: any) => {
                                const shapeType = shape.shapeType || shape.type || 'unknown';
                                shapeTypes[shapeType] = (shapeTypes[shapeType] || 0) + 1;
                                totalShapes++;
                            });
                        }

                        if (entity.polygons && typeof entity.polygons === 'object') {
                            const polygonCount = Object.keys(entity.polygons).length;
                            shapeTypes['polygon (legacy)'] = (shapeTypes['polygon (legacy)'] || 0) + polygonCount;
                            totalShapes += polygonCount;
                        }
                    });

                    if (totalShapes > 0) {
                        formatDescription += `📈 Total shapes: ${totalShapes}\n`;
                        formatDescription += `\n🔍 Shape types detected:\n`;
                        Object.entries(shapeTypes).forEach(([type, count]) => {
                            formatDescription += `   - ${type}: ${count}\n`;
                        });
                    }
                } else {
                    formatDescription += `❌ Unknown object structure\n`;
                    formatDescription += `❓ Does not match any known Blueprint Editor format\n`;
                }
            } else {
                formatDescription += `❌ Unrecognized data format\n`;
            }

            // Check for SVG background
            if (parsedData.svgBackground) {
                formatDescription += `\n✅ SVG background data found\n`;
            }

            // Add note about format handling
            formatDescription += `\n📝 Import Notes:\n`;
            formatDescription += `• The importer supports all shape types (point, line, arc, circle, ellipse, polygon, rectangle, text)\n`;
            formatDescription += `• Legacy polygon-only formats will be automatically converted\n`;
            formatDescription += `• Shape data will be validated and any invalid shapes will be skipped\n`;

            setDataFormatAnalysis(formatDescription);
        } catch (error) {
            setDataFormatAnalysis(`❌ Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check the data format and try again.`);
        } finally {
            setIsAnalyzingData(false);
        }
    }, []);

    // Handle import file selection
    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Clear previous status
        setImportStatus(null);
        setDataFormatAnalysis(null);

        // Check file size and type
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setImportStatus({
                success: false,
                message: 'File is too large. Maximum allowed size is 10MB.'
            });
            if (fileInputRef.current && "value" in fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            setImportStatus({
                success: false,
                message: 'Invalid file type. Please select a JSON file.'
            });
            if (fileInputRef.current && "value" in fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        // Read the file
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonContent = event.target?.result as string;
                setImportText(jsonContent);

                // Analyze the data format
                analyzeDataFormat(jsonContent);
            } catch (error) {
                setImportStatus({
                    success: false,
                    message: 'Failed to read the file. Please try again.'
                });
                console.error(error);
            }
        };
        reader.onerror = () => {
            setImportStatus({
                success: false,
                message: 'Error reading file. Please try again.'
            });
        };
        reader.readAsText(file);
    };

    // Handle import submission
    const handleImport = useCallback(() => {
        if (!importText.trim()) {
            setImportStatus({
                success: false,
                message: 'Please enter or upload JSON data to import.'
            });
            return;
        }

        try {
            setImportStatus({
                success: false,
                message: 'Processing data...'
            });

            // Attempt to import the data directly
            // The processImportData function now handles all shape types and legacy formats
            const success = importData(importText);

            if (success) {
                setImportStatus({
                    success: true,
                    message: 'Data imported successfully! All shape types have been processed.'
                });

                // Auto-save to localStorage
                saveToLocalStorage();

                // Show success message with delay before closing
                setTimeout(() => {
                    setIsImportModalOpen(false);
                    setImportStatus(null);
                }, 1500);
            } else {
                // importData returned false - the function handled its own error messaging
                setImportStatus({
                    success: false,
                    message: 'Import failed. Please check the data format and try again.'
                });
            }
        } catch (importError) {
            console.error("Import implementation error:", importError);
            setImportStatus({
                success: false,
                message: `Import failed: ${importError instanceof Error ? importError.message : 'Unknown error'}`
            });
        }
    }, [importText, importData, saveToLocalStorage]);

    // Handle textual JSON changes
    const handleImportTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setImportText(newText);

        // Clear previous status
        setImportStatus(null);

        // Only trigger analysis if the text has substantial content
        if (newText.trim().length > 20) {
            // Debounce the analysis to avoid excessive processing
            if (importTextAreaRef.current) {
                const element = importTextAreaRef.current;
                const timerId = element.dataset.timerId;

                if (timerId) {
                    window.clearTimeout(parseInt(timerId));
                }

                const newTimerId = window.setTimeout(() => {
                    analyzeDataFormat(newText);
                }, 500);

                element.dataset.timerId = newTimerId.toString();
            } else {
                analyzeDataFormat(newText);
            }
        } else {
            setDataFormatAnalysis(null);
        }
    };

    // Copy export text to clipboard
    const handleCopyToClipboard = () => {
        if (exportTextAreaRef.current) {
            exportTextAreaRef.current.select();
            document.execCommand('copy');

            // Show feedback
            const button = document.getElementById('copy-button');
            if (button) {
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.setAttribute('disabled', 'true');

                setTimeout(() => {
                    if (button) {
                        button.textContent = originalText;
                        button.removeAttribute('disabled');
                    }
                }, 2000);
            }
        }
    };

    // Download export text as a file
    const handleDownloadFile = () => {
        const blob = new Blob([exportText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blueprint-shapes-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Import/Export</h2>

            <div className="space-y-3">
                <button
                    className={cn(
                        classNames.button.base,
                        classNames.button.primary,
                        classNames.button.sizes.md,
                        classNames.button.fullWidth
                    )}
                    onClick={handleExport}
                >
                    Export Data
                </button>

                <button
                    className={cn(
                        classNames.button.base,
                        classNames.button.outline,
                        classNames.button.sizes.md,
                        classNames.button.fullWidth
                    )}
                    onClick={handleOpenImport}
                >
                    Import Data
                </button>

                <p className="text-xs text-gray-500 mt-2">
                    Export/import all shapes: polygons, circles, lines, arcs, ellipses, rectangles, points, and text. Legacy polygon-only formats are automatically converted.
                </p>
            </div>

            {/* Export Modal */}
            <Modal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                title="Export Shape Data"
                size="lg"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-700">
                        Copy the JSON data below or download it as a file. This includes all shapes and entities in the new format.
                    </p>

                    <div className="relative">
                        <textarea
                            ref={exportTextAreaRef}
                            value={exportText}
                            readOnly
                            className="w-full h-64 p-3 font-mono text-xs border border-gray-300 rounded bg-gray-50"
                        />

                        <div className="absolute top-2 right-2 flex space-x-2">
                            <button
                                id="copy-button"
                                className="px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700"
                                onClick={handleCopyToClipboard}
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            className={cn(
                                classNames.button.base,
                                classNames.button.secondary,
                                classNames.button.sizes.md
                            )}
                            onClick={handleDownloadFile}
                        >
                            Download as File
                        </button>

                        <button
                            className={cn(
                                classNames.button.base,
                                classNames.button.outline,
                                classNames.button.sizes.md
                            )}
                            onClick={() => setIsExportModalOpen(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Import Modal */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Import Shape Data"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-sm text-blue-800">
                            <strong>Enhanced Import:</strong> This import now supports all shape types including points, lines, arcs, circles, ellipses, polygons, rectangles, and text. Legacy polygon-only formats are automatically converted.
                        </p>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                            <strong>Warning:</strong> Importing data will replace your current work.
                            Make sure to export your existing data first if you want to keep it.
                        </p>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImportFile}
                            accept=".json,application/json"
                            className="hidden"
                        />

                        <button
                            className={cn(
                                classNames.button.base,
                                classNames.button.outline,
                                classNames.button.sizes.md
                            )}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Select JSON File
                        </button>

                        <p className="text-sm text-gray-500 mt-2">
                            Or paste JSON data below
                        </p>
                    </div>

                    <div className="space-y-2">
                        <textarea
                            ref={importTextAreaRef}
                            value={importText}
                            onChange={handleImportTextChange}
                            className="w-full h-40 p-3 font-mono text-xs border border-gray-300 rounded"
                            placeholder="Paste JSON data here..."
                        />

                        {isAnalyzingData && (
                            <div className="flex items-center space-x-2 text-sm text-blue-500">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                                     viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Analyzing data format...</span>
                            </div>
                        )}

                        {dataFormatAnalysis && (
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <h3 className="text-sm font-medium mb-1">Data Format Analysis</h3>
                                <pre className="text-xs font-mono whitespace-pre-wrap">{dataFormatAnalysis}</pre>
                            </div>
                        )}
                    </div>

                    {importStatus && (
                        <div className={`p-3 rounded ${
                            importStatus.success
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : importStatus.message === 'Processing data...'
                                    ? 'bg-blue-50 border border-blue-200 text-blue-800'
                                    : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                            <div className="flex items-center">
                                {importStatus.message === 'Processing data...' && (
                                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg"
                                         fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                <p className="text-sm">{importStatus.message}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            className={cn(
                                classNames.button.base,
                                classNames.button.outline,
                                classNames.button.sizes.md
                            )}
                            onClick={() => setIsImportModalOpen(false)}
                        >
                            Cancel
                        </button>

                        <button
                            className={cn(
                                classNames.button.base,
                                classNames.button.primary,
                                classNames.button.sizes.md
                            )}
                            onClick={handleImport}
                            disabled={!importText.trim() || importStatus?.message === 'Processing data...'}
                        >
                            Import Data
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ImportExportTool;
