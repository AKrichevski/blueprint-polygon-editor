import type { PolygonShape } from "../../../../types";
import React, { memo, useMemo } from "react";
import {
    calculatePolygonArea,
    calculatePolygonCentroid,
    calculatePolygonPerimeter,
} from "../../utils/polygonHelpers.ts";
import colors from "tailwindcss/colors";
import { Group, Text } from "react-konva";

export const ShapeMetrics: React.FC<{
    shape: PolygonShape;
}> = memo(({ shape }) => {
    const { area, perimeter, centroid } = useMemo(() => {
        const area = calculatePolygonArea(shape.points);
        const perimeter = calculatePolygonPerimeter(shape.points);
        const centroid = calculatePolygonCentroid(shape.points);
        return { area, perimeter, centroid };
    }, [shape]);

    return (
        <Group>
            <Text
                x={centroid.x - 50}
                y={centroid.y - 30}
                text={`Area: ${area.toFixed(2)} px²`}
                fontSize={12}
                fill={colors.gray[800]}
            />
            <Text
                x={centroid.x - 50}
                y={centroid.y - 15}
                text={`Perimeter: ${perimeter.toFixed(2)} px`}
                fontSize={12}
                fill={colors.gray[800]}
            />
        </Group>
    );
});
