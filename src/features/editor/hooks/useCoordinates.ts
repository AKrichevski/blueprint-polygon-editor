// src/features/editor/hooks/useCoordinates.ts
import React, { useState, useCallback } from 'react';
import Konva from 'konva';
import type {Point} from "../../../types";
import {useEditor} from "../../../contexts/editor";

export const useCoordinates = (stageRef: React.RefObject<Konva.Stage | null>) => {
    const { scale,  position } = useEditor();
    const [mousePosition, setMousePosition] = useState<Point | null>(null);

    const handleMouseMove = useCallback(() => {
        const pos = stageRef.current?.getPointerPosition();
        if (pos) {
            // Convert to world coordinates
            const worldPos = {
                x: Math.round((pos.x - position.x) / scale),
                y: Math.round((pos.y - position.y) / scale),
            };
            setMousePosition(worldPos);
        }
    }, [position, scale, stageRef]);

    const handleMouseLeave = useCallback(() => {
        setMousePosition(null);
    }, []);

    return {
        mousePosition,
        handleMouseMove,
        handleMouseLeave
    };
};
