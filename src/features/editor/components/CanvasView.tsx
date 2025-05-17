import React, {
    useRef,
    useState,
    useCallback,
    useMemo,
    memo,
} from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { classNames } from '../../../styles/theme';
import {
    GridRenderer,
    BackgroundRenderer,
    CoordinateDisplay
} from './canvas';
import ShapeRenderer from './canvas/ShapeRenderer';
import MetricsToggleButton from './MetricsToggleButton';
import { useCanvasEvents } from '../hooks';
import { EditMode } from "../../../types";
import { useEditor } from "../../../contexts/editor";

interface CanvasViewProps {
    width: number;
    height: number;
}
const xxx = new Map()
const CanvasView: React.FC<CanvasViewProps> = memo(({ width, height }) => {
    const { state, scale, mode, position, selectedPointIndex } = useEditor();
    const stageRef = useRef<Konva.Stage | null>(null);
    const [showShapeMetrics, setShowShapeMetrics] = useState(false);

    const {
        handleWheel,
        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleCanvasClick,
        handleMouseLeave,
        stageToWorld,
        worldToStage
    } = useCanvasEvents(stageRef, width, height, [], () => {});

    const toggleShapeMetrics = useCallback(() => {
        setShowShapeMetrics(prev => !prev);
    }, []);

    const getCursorClass = useMemo(() => {
        switch (mode) {
            case EditMode.SELECT:
                return selectedPointIndex !== null ? 'cursor-move' : 'cursor-select';
            case EditMode.ADD_POLYGON:
            case EditMode.ADD_RECTANGLE:
            case EditMode.ADD_CIRCLE:
            case EditMode.ADD_LINE:
            case EditMode.ADD_ARC:
            case EditMode.ADD_ELLIPSE:
            case EditMode.ADD_TEXT:
                return 'cursor-drawing';
            case EditMode.ADD_POINT:
                return 'cursor-add-point';
            case EditMode.DELETE_POINT:
                return 'cursor-delete-point';
            default:
                return 'cursor-select';
        }
    }, [mode, selectedPointIndex]);

    const stageProps = useMemo(() => ({
        width,
        height,
        scaleX: scale,
        scaleY: scale,
        x: position.x,
        y: position.y,
        draggable: false,
        onWheel: handleWheel,
        onMouseDown: handleCanvasMouseDown,
        onMouseMove: handleCanvasMouseMove,
        onMouseUp: handleCanvasMouseUp,
        onClick: handleCanvasClick,
        onMouseLeave: handleMouseLeave,
    }), [
        width,
        height,
        scale,
        position.x,
        position.y,
        handleWheel,
        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleCanvasClick,
        handleMouseLeave,
    ]);

    // const yyy = useMemo(() => {
    //     console.time("suka")
    //     if (!state.entities || typeof state.entities !== 'object') return null;
    //
    //     for (const entityKey in state.entities) {
    //         let entityId = ''
    //         console.log("xxxx state.entities", entityKey);
    //
    //         for (const key2 in state.entities[entityKey]) {
    //
    //             if (key2 === "id") {
    //
    //                 entityId  = entityKey ;
    //                 console.log("xxxx state.entities[entityKey] key2", entityKey, key2, entityId, state.entities[entityKey][key2]);
    //                 console.log("xxxx entityId key3", entityId);
    //             }
    //
    //             if (key2 === "shapes") {
    //                 for (const shapeId in state.entities[entityKey][key2]) {
    //                         const name = `${entityKey}-${key2}-${shapeId}`
    //                         xxx.set(name, {
    //                             entityType: state.entities[entityKey][key2][shapeId].entityType,
    //                             points: state.entities[entityKey][key2][shapeId].points,
    //                             shapeType: state.entities[entityKey][key2][shapeId].shapeType,
    //                         })
    //                 }
    //             }
    //
    //         }
    //     }
    //     console.timeEnd("suka")
    //     return true
    // }, [state.entities]);


    const renderedShapes = useMemo(() => {
        if (!state.entities || typeof state.entities !== 'object') return null;

        return Object.entries(state.entities).map(([entityId, entity]) => {
            if (!entity || !entity.shapes || typeof entity.shapes !== 'object') return null;
            // console.log("ffff", xxx.get([entityId]["shapes"][entity.shapes.shapeId]));
            // debugger
            return (
                <ShapeRenderer
                    key={entityId}
                    shapes={entity.shapes}
                    entityId={entityId}
                    entityColor={entity.metaData?.fontColor || '#3357FF'}
                    showMetrics={showShapeMetrics}
                />
            );
        });
    }, [state.entities, showShapeMetrics]);

    console.count('CanvasView');

    return (
        <div
            className={`${classNames.container.canvas} ${getCursorClass}`}
            style={{ width, height, position: 'relative' }}
        >
            <Stage ref={stageRef} {...stageProps}>
                <Layer>
                     {/*<GridRenderer width={width} height={height} />*/}
                    <BackgroundRenderer />
                    {renderedShapes}
                </Layer>
            </Stage>
            {/*{yyy}*/}
            <MetricsToggleButton
                showMetrics={showShapeMetrics}
                onToggle={toggleShapeMetrics}
            />
            <CoordinateDisplay stageRef={stageRef} />
        </div>
    );
});

export default CanvasView;
