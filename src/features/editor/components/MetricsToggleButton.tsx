// src/features/editor/components/MetricsToggleButton.tsx
import React from 'react';
import {classNames, cn} from '../../../styles/theme';

interface MetricsToggleButtonProps {
    showMetrics: boolean;
    onToggle: () => void;
}

const MetricsToggleButton: React.FC<MetricsToggleButtonProps> = ({
                                                                     showMetrics,
                                                                     onToggle
                                                                 }) => {
    return (
        <div className="absolute bottom-4 left-4 z-10">
            <button
                className={cn(
                    classNames.button.base,
                    classNames.button.sizes.sm,
                    showMetrics ? classNames.button.primary : classNames.button.outline,
                    "flex items-center"
                )}
                onClick={onToggle}
                title={showMetrics ? "Hide polygon metrics" : "Show polygon metrics"}
            >
                {showMetrics ? "Hide Metrics" : "Show Metrics"}
            </button>
        </div>
    );
};

export default MetricsToggleButton;
