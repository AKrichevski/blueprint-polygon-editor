// src/features/editor/components/canvas/GridRenderer.tsx
import React, { useMemo } from 'react';
import { Group, Line } from 'react-konva';
import { colors } from '../../../../styles/theme';
import {useEditor} from "../../../../contexts/editor";

interface GridRendererProps {
    width: number;
    height: number;
}

const GridRenderer: React.FC<GridRendererProps> = ({ width, height }) => {
    const { scale, position } = useEditor();

    const gridLines = useMemo(() => {
        const gridSize = 50 * scale;
        const offsetX = position.x % gridSize;
        const offsetY = position.y % gridSize;

        const lines = [];

        // Vertical lines
        for (let x = offsetX; x < width; x += gridSize) {
            lines.push(
                <Line
                    key={`v-${x}`}
                    points={[x, 0, x, height]}
                    stroke={colors.gray[200]}
                    strokeWidth={1}
                />
            );
        }

        // Horizontal lines
        for (let y = offsetY; y < height; y += gridSize) {
            lines.push(
                <Line
                    key={`h-${y}`}
                    points={[0, y, width, y]}
                    stroke={colors.gray[200]}
                    strokeWidth={1}
                />
            );
        }

        return lines;
    }, [width, height, scale, position]);

    return (
        <Group>
            {gridLines}
        </Group>
    );
};

export default GridRenderer;
