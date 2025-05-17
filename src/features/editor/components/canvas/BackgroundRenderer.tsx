// src/features/editor/components/canvas/BackgroundRenderer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Group, Image } from 'react-konva';
import { getSvgDimensions } from '../../utils/svgUtils';
import {useEditor} from "../../../../contexts/editor";

interface BackgroundRendererProps {
    onLoad?: (dimensions: { width: number, height: number }) => void;
}

const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({ onLoad }) => {
    const { state, scale,position } = useEditor();
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
    const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Load SVG image when the src changes
    useEffect(() => {
        if (!state.svgBackground) {
            setImageElement(null);
            setLoadError(null);
            return;
        }

        setIsLoading(true);
        setLoadError(null);

        // Try to extract dimensions from SVG string
        try {
            // If the SVG is a data URL, extract the base64 content
            let svgContent = state.svgBackground;
            if (svgContent.startsWith('data:image/svg+xml;base64,')) {
                const base64Content = svgContent.split(',')[1];
                svgContent = atob(base64Content);
            }

            const extractedDimensions = getSvgDimensions(svgContent);
            setDimensions(extractedDimensions);

            // Call onLoad callback with dimensions
            if (onLoad) {
                onLoad(extractedDimensions);
            }
        } catch (error) {
            console.warn('Could not extract SVG dimensions, using defaults:', error);
        }

        // Load the image
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            setImageElement(img);
            setIsLoading(false);

            // If we couldn't get dimensions from SVG content, use the loaded image dimensions
            if (dimensions.width === 500 && dimensions.height === 500) {
                const imageDimensions = { width: img.width, height: img.height };
                setDimensions(imageDimensions);

                if (onLoad) {
                    onLoad(imageDimensions);
                }
            }
        };

        img.onerror = (event) => {
            setIsLoading(false);
            setLoadError('Failed to load SVG background. Please check the file format.');
            console.error('SVG loading error:', event);
        };

        img.src = state.svgBackground;

        // Cleanup
        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [state.svgBackground, onLoad]);

    // Memoize the background element to prevent unnecessary rerenders
    const backgroundElement = useMemo(() => {
        if (!imageElement) return null;

        const { width, height } = dimensions;

        // Calculate scaled dimensions while maintaining aspect ratio
        // This ensures the SVG background fits appropriately with the polygons
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        // Position at the center of the viewport
        const centerX = position.x;
        const centerY = position.y;

        return (
            <Image
                image={imageElement}
                x={centerX}
                y={centerY}
                width={scaledWidth}
                height={scaledHeight}
                opacity={0.7}
                listening={false} // Make it non-interactive
            />
        );
    }, [imageElement, dimensions, scale, position]);

    // Show loading or error indicators
    if (isLoading) {
        return (
            <Group>
                {/* Loading indicator could be added here if needed */}
            </Group>
        );
    }

    if (loadError) {
        return (
            <Group>
                {/* Error indicator could be added here if needed */}
            </Group>
        );
    }

    if (!state.svgBackground || !imageElement) return null;

    return (
        <Group>
            {backgroundElement}
        </Group>
    );
};

export default BackgroundRenderer;
