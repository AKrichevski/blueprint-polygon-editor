// src/components/StorageMonitor.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useEditor } from '../contexts/editor';
import { getSerializedSize, formatByteSize, getAvailableStorageSpace } from '../contexts/editor/EditorStorageUtils';

/**
 * Component that monitors localStorage usage and provides warnings
 * and interface for exporting when approaching limits
 */
const StorageMonitor: React.FC = () => {
    const { state, exportData } = useEditor();
    const [isVisible, setIsVisible] = useState(false);
    const [storageInfo, setStorageInfo] = useState({
        currentSize: 0,
        availableSpace: 0,
        usagePercent: 0
    });

    // Calculate storage usage
    const calculateStorageUsage = useCallback(() => {
        const stateToSave = {
            entities: state.entities,
            svgBackground: state.svgBackground
        };

        const currentSize = getSerializedSize(stateToSave);
        const availableSpace = getAvailableStorageSpace();

        // Only show if we can calculate available space and if
        // we're using more than 70% of available space
        const usagePercent = availableSpace > 0
            ? (currentSize / availableSpace) * 100
            : 0;

        setStorageInfo({
            currentSize,
            availableSpace,
            usagePercent
        });

        // Show warning when usage is high
        setIsVisible(usagePercent > 70);
    }, [state.entities, state.svgBackground]);

    // Update calculations when state changes
    useEffect(() => {
        calculateStorageUsage();
    }, [calculateStorageUsage]);

    // Handle export button click
    const handleExport = () => {
        try {
            // Generate data
            const jsonData = exportData();

            // Create and trigger download
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `blueprint-polygon-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Hide after successful export
            setIsVisible(false);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Failed to export data. Please try again.');
        }
    };

    // Only render when needed
    if (!isVisible) return null;

    // Determine warning level
    const warningLevel = storageInfo.usagePercent > 90
        ? 'bg-red-100 border-red-500 text-red-700'
        : 'bg-yellow-100 border-yellow-500 text-yellow-700';

    return (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${warningLevel}`}>
            <div className="flex items-start">
                <div className="mr-4">
                    <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <div>
                    <h3 className="font-semibold mb-1">Storage Warning</h3>
                    <p className="text-sm mb-2">
                        Your project is using {formatByteSize(storageInfo.currentSize)}
                        ({Math.round(storageInfo.usagePercent)}% of available storage).
                    </p>
                    <p className="text-sm mb-3">
                        To prevent data loss, please export your work now.
                    </p>
                    <div className="flex space-x-2">
                        <button
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            onClick={handleExport}
                        >
                            Export Now
                        </button>
                        <button
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                            onClick={() => setIsVisible(false)}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorageMonitor;
