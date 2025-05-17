// src/hooks/useCanvasSize.ts
import React, { useState, useEffect, useRef } from 'react';

interface CanvasSize {
    width: number;
    height: number;
}

export function useCanvasSize(containerRef: React.RefObject<HTMLDivElement | null>): CanvasSize {
    const [size, setSize] = useState<CanvasSize>({ width: 800, height: 600 });
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setSize({
                    width: clientWidth,
                    height: clientHeight,
                });
            }
        };

        // Initial size calculation
        updateSize();

        // Set up ResizeObserver
        if (containerRef.current) {
            resizeObserverRef.current = new ResizeObserver(updateSize);
            if ("observe" in resizeObserverRef.current) {
                resizeObserverRef.current.observe(containerRef.current);
            }
        }

        // Clean up
        return () => {
            if (resizeObserverRef.current) {
                if ("disconnect" in resizeObserverRef.current) {
                    resizeObserverRef.current.disconnect();
                }
            }
        };
    }, [containerRef]);

    return size;
}
