// src/hooks/useCanvasSize.ts
import React, { useState, useLayoutEffect, useRef } from 'react';

interface CanvasSize {
    width: number;
    height: number;
}

export function useCanvasSize(
    containerRef: React.RefObject<HTMLDivElement | null>
): CanvasSize {
    const [size, setSize] = useState<CanvasSize>({ width: 1000, height: 600 });
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Re‐run whenever containerRef.current changes (i.e. when the <div> appears).
    useLayoutEffect(() => {
        const element = containerRef.current;
        if (!element) {
            // If the ref isn’t attached yet, do nothing.
            return;
        }

        // Measure once immediately:
        const updateSize = () => {
            if (element) {
                setSize({
                    width: element.clientWidth,
                    height: element.clientHeight,
                });
            }
        };
        updateSize();

        // Now observe for future size changes:
        resizeObserverRef.current = new ResizeObserver(updateSize);
        resizeObserverRef.current.observe(element);

        // Clean up on unmount or if element changes:
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
        };
    }, [containerRef.current]); // ← Notice containerRef.current here

    return size;
}
