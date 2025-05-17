import React, {memo} from "react";
import type {TextShape} from "../../../../../types";
import {useShapeInteractions} from "../../../hooks";
import {Text} from "react-konva";
import {colors} from "../../../../../styles/theme.ts";

const TextRenderer: React.FC<{
    entityId: string;
    shapeId: string;
    shape: TextShape;
    isSelected: boolean;
    color: string;
}> = memo(({shape, isSelected, color, entityId, shapeId}) => {
    const {handleShapeClick} = useShapeInteractions();

    const fontSize = shape.style?.fontSize || 12;
    const fontFamily = shape.style?.fontFamily || 'Arial';
    const textColor = shape.style?.color || color;
    const align = shape.style?.align || 'left';
    const rotation = shape.style?.rotation || 0;

    return (
        <Text
            x={shape.position.x}
            y={shape.position.y}
            text={shape.text}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fill={textColor}
            align={align}
            rotation={rotation}
            stroke={isSelected ? colors.state.selected : undefined}
            strokeWidth={isSelected ? 1 : 0}
            onClick={()=> handleShapeClick(entityId, shapeId)}
            hitStrokeWidth={10}
        />
    );
});

export default TextRenderer
