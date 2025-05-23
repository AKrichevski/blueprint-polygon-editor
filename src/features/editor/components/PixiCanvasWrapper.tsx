// // src/features/editor/components/PixiCanvasWrapper.tsx
// import React, { useState, useEffect, useCallback } from 'react';
// import { useEditor } from '../../../contexts/editor';
// import PixiCanvas from './pixi/PixiCanvas';
// import type { PerformanceResults } from './pixi';
//
// interface PixiCanvasWrapperProps {
//     width: number;
//     height: number;
//     showMetrics?: boolean;
//     showPerformancePanel?: boolean;
// }
//
// const PixiCanvasWrapper: React.FC<PixiCanvasWrapperProps> = ({
//                                                                  width,
//                                                                  height,
//                                                                  showMetrics = false,
//                                                                  showPerformancePanel = false
//                                                              }) => {
//     const { updateSelectedEntitiesIds, dispatch } = useEditor();
//     const [performanceResults, setPerformanceResults] = useState<PerformanceResults[]>([]);
//
//     // Handle selection changes from PixiJS
//     useEffect(() => {
//         const handleShapeSelected = (event: CustomEvent) => {
//             const { entityId, shapeId, pointIndex } = event.detail;
//             updateSelectedEntitiesIds({
//                 entityId,
//                 shapeId,
//                 pointIndex: pointIndex || null
//             });
//         };
//
//         const handleDeselect = () => {
//             updateSelectedEntitiesIds({
//                 entityId: null,
//                 shapeId: null,
//                 pointIndex: null
//             });
//         };
//
//         const handlePointDrag = (event: CustomEvent) => {
//             const { entityId, shapeId, pointIndex, x, y } = event.detail;
//
//             // Dispatch action to move point
//             dispatch({
//                 type: 'MOVE_POINT',
//                 payload: {
//                     entityId,
//                     shapeId,
//                     pointIndex,
//                     newPosition: { x, y }
//                 }
//             });
//         };
//
//         // Add event listeners
//         document.addEventListener('shape-selected', handleShapeSelected as EventListener);
//         document.addEventListener('deselect', handleDeselect);
//         document.addEventListener('point-drag', handlePointDrag as EventListener);
//         document.addEventListener('point-drag-end', handlePointDrag as EventListener);
//         // document.addEventListener("wheel", (event) => { console.log("xxx wheel event:", event) })
//
//         // Cleanup
//         return () => {
//             document.removeEventListener('shape-selected', handleShapeSelected as EventListener);
//             document.removeEventListener('deselect', handleDeselect);
//             document.removeEventListener('point-drag', handlePointDrag as EventListener);
//             document.removeEventListener('point-drag-end', handlePointDrag as EventListener);
//             // document.removeEventListener("wheel", (event) => { console.log("xxx wheel event") })
//         };
//     }, [updateSelectedEntitiesIds, dispatch]);
//
//
//     // Handle performance results
//     const handlePerformanceResult = useCallback((result: PerformanceResults) => {
//         setPerformanceResults(prev => {
//             // Keep only the last 10 results
//             const newResults = [...prev, result];
//             if (newResults.length > 10) {
//                 return newResults.slice(-10);
//             }
//             return newResults;
//         });
//     }, []);
//
//     return (
//         <div className="relative w-full h-full">
//             <PixiCanvas
//                 width={width}
//                 height={height}
//                 showMetrics={showMetrics}
//                 onPerformanceResult={showPerformancePanel ? handlePerformanceResult : undefined}
//             />
//
//             {/* Optional performance panel */}
//             {showPerformancePanel && performanceResults.length > 0 && (
//                 <div className="absolute bottom-2 left-2 bg-white bg-opacity-80 p-2 rounded text-xs font-mono">
//                     <h3 className="font-bold mb-1">Performance</h3>
//                     <div>FPS: {performanceResults[performanceResults.length - 1].fps}</div>
//                     <div>Frame time: {performanceResults[performanceResults.length - 1].averageFrameTime}ms</div>
//                 </div>
//             )}
//         </div>
//     );
// };
//
// export default PixiCanvasWrapper;
