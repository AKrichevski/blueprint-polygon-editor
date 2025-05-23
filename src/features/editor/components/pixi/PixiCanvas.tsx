// // src/features/editor/components/pixi/PixiCanvas.tsx
// import React, {useRef, useEffect, useState, useCallback, memo} from 'react';
// import { Application, Container, FederatedPointerEvent } from 'pixi.js';
// import { useEditor } from "../../../../contexts/editor";
// import { ShapeRenderer } from './ShapeRenderer';
// import { GridRenderer } from './GridRenderer';
// import { BackgroundRenderer } from './BackgroundRenderer';
// import { SelectionManager } from './SelectionManager';
// import { POSITION_EPSILON } from '../../../../consts';
// import type { PerformanceResults } from './types';
//
// interface PixiCanvasProps {
//     width: number;
//     height: number;
//     showMetrics?: boolean;
//     onPerformanceResult?: (result: PerformanceResults) => void;
// }
//
// const PixiCanvas: React.FC<PixiCanvasProps> = ({
//                                                    width,
//                                                    height,
//                                                    showMetrics = false,
//                                                    onPerformanceResult
//                                                }) => {
//     const canvasRef = useRef<HTMLDivElement | null>(null);
//     const appRef = useRef<Application | null>(null);
//     const viewportRef = useRef<Container<any> | null>(null);
//     const selectionManagerRef = useRef<SelectionManager | null>(null);
//     const isDraggingRef = useRef(false);
//     const dragStartRef = useRef<{ x: number, y: number, stageX: number, stageY: number } | null>(null);
//     const frameCountRef = useRef(0);
//     const renderStartTimeRef = useRef(0);
//     const frameTimesRef = useRef<number[]>([]);
//     const isDestroyingRef = useRef(false);
//
//     const [isReady, setIsReady] = useState(false);
//     console.count("Pixi rerander")
//     const {
//         state,
//         scale,
//         position,
//         selectedEntityId,
//         selectedShapeId,
//         selectedPointIndex,
//         mode,
//         updatePosition,
//         updateScale
//     } = useEditor();
//
//     // Initialize PixiJS application
//     useEffect(() => {
//         let app: Application | null = null;
//         let mounted = true;
//
//         const initPixi = async () => {
//             if (!canvasRef.current) return;
//
//             try {
//                 // Create PixiJS application
//                 app = new Application();
//
//                 await app.init({
//                     width,
//                     height,
//                     backgroundColor: 0xf8f8f8,
//                     antialias: true,
//                     resolution: window.devicePixelRatio || 1,
//                     autoDensity: true,
//                 });
//
//                 // Make sure component is still mounted and not in the process of unmounting
//                 if (!mounted || !canvasRef.current || isDestroyingRef.current) {
//                     if (app) {
//                         try {
//                             app.destroy(true, { children: true, texture: true, baseTexture: true });
//                         } catch (e) {
//                             console.warn('Error during app cleanup:', e);
//                         }
//                     }
//                     return;
//                 }
//
//                 // Add canvas to DOM
//                 if ("appendChild" in canvasRef.current) {
//                     canvasRef.current.appendChild(app.canvas);
//                 }
//
//                 // Create viewport container
//                 const viewport = new Container();
//                 viewport.label = 'viewport';
//                 app.stage.addChild(viewport);
//                 viewportRef.current = viewport;
//
//                 // Apply initial transform
//                 updateViewportTransform(viewport, position, scale);
//
//                 // Create selection manager
//                 selectionManagerRef.current = new SelectionManager(
//                     app,
//                     viewport,
//                     selectedEntityId,
//                     selectedShapeId,
//                     selectedPointIndex
//                 );
//
//                 // Store app reference
//                 appRef.current = app;
//
//                 // Setup performance monitoring
//                 if (onPerformanceResult) {
//                     renderStartTimeRef.current = performance.now();
//                     frameCountRef.current = 0;
//                     frameTimesRef.current = [];
//
//                     // Add ticker for frame counting
//                     app.ticker.add(() => {
//                         if (frameCountRef.current === 0) {
//                             renderStartTimeRef.current = performance.now();
//                         }
//
//                         const frameTime = app.ticker.deltaMS;
//                         frameTimesRef.current.push(frameTime);
//                         frameCountRef.current++;
//
//                         // Report results after 60 frames
//                         if (frameCountRef.current >= 60) {
//                             const endTime = performance.now();
//                             const totalTime = endTime - renderStartTimeRef.current;
//                             const fps = 1000 / (totalTime / frameCountRef.current);
//
//                             // Calculate min, max, avg frame times
//                             const minFrameTime = Math.min(...frameTimesRef.current).toFixed(2);
//                             const maxFrameTime = Math.max(...frameTimesRef.current).toFixed(2);
//                             const avgFrameTime = (frameTimesRef.current.reduce((sum, time) => sum + time, 0) /
//                                 frameTimesRef.current.length).toFixed(2);
//
//                             // Report results
//                             onPerformanceResult({
//                                 engine: 'pixi',
//                                 dataSize: 'custom',
//                                 totalTime,
//                                 frames: frameCountRef.current,
//                                 averageFrameTime: avgFrameTime,
//                                 minFrameTime,
//                                 maxFrameTime,
//                                 fps: fps.toFixed(1),
//                                 timestamp: new Date().toISOString()
//                             });
//
//                             // Reset counters
//                             frameCountRef.current = 0;
//                             frameTimesRef.current = [];
//                         }
//                     });
//                 }
//
//                 setIsReady(true);
//             } catch (error) {
//                 console.error('Error initializing PixiJS application:', error);
//             }
//         };
//
//         initPixi().then(r => console.log("Pixi rerander:", r));
//
//         // Cleanup on unmount
//         return () => {
//             mounted = false;
//             // isDestroyingRef.current = true;
//
//             // Safely clean up PixiJS application
//             if (appRef.current) {
//                 try {
//                     const currentApp = appRef.current;
//
//                     // Stop ticker first
//                     if (currentApp.ticker) {
//                         currentApp.ticker.stop();
//                     }
//
//                     // Destroy app
//                     if (currentApp.renderer) {
//                         // currentApp.destroy(true, { children: true, texture: true, baseTexture: true });
//                     }
//                 } catch (e) {
//                     console.warn('Error during app cleanup:', e);
//                 }
//
//                 appRef.current = null;
//             }
//
//             // Remove canvas from DOM if it exists
//             if (canvasRef.current && canvasRef.current?.firstChild) {
//                 try {
//                     canvasRef.current?.removeChild(canvasRef.current.firstChild);
//                 } catch (e) {
//                     console.warn('Error removing canvas from DOM:', e);
//                 }
//             }
//
//             viewportRef.current = null;
//             selectionManagerRef.current = null;
//         };
//     }, []);
//
//     // Update transform when position or scale change
//     useEffect(() => {
//         if (!viewportRef.current) return;
//
//         updateViewportTransform(viewportRef.current, position, scale);
//     }, [position, scale]);
//
//     // Update selection when it changes
//     useEffect(() => {
//         if (!selectionManagerRef.current) return;
//
//         selectionManagerRef.current.updateSelection(selectedEntityId, selectedShapeId, selectedPointIndex);
//     }, [selectedEntityId, selectedShapeId, selectedPointIndex]);
//
//     // Update viewport transform
//     const updateViewportTransform = (viewport: Container<any>, pos: {x: number, y: number}, zoom: number) => {
//         viewport.position.set(pos.x, pos.y);
//         viewport.scale.set(zoom, zoom);
//     };
//
//     // Pan handling
//     const handlePointerDown = useCallback((e: React.PointerEvent) => {
//         if (mode !== 'select' || !appRef.current || !canvasRef.current) return;
//
//         // Only start drag if clicked on background (not a shape)
//         // We'll implement proper hit testing later
//         // For now, just check if the pointer event happened directly on canvas
//         if (e.target === canvasRef.current?.firstChild) {
//             isDraggingRef.current = true;
//             dragStartRef.current = {
//                 x: e.clientX,
//                 y: e.clientY,
//                 stageX: position.x,
//                 stageY: position.y
//             };
//
//             // Capture pointer for better drag handling
//             (e.target as HTMLElement).setPointerCapture(e.pointerId);
//         }
//     }, [mode, position]);
//
//     const handlePointerMove = useCallback((e: React.PointerEvent) => {
//         if (!isDraggingRef.current || !dragStartRef.current) return;
//
//         const dx = e.clientX - dragStartRef.current?.x;
//         const dy = e.clientY - dragStartRef.current?.y;
//
//         const newX = dragStartRef.current?.stageX + dx;
//         const newY = dragStartRef.current?.stageY + dy;
//
//         // Only update if position changed significantly
//         if (Math.abs(newX - position.x) > POSITION_EPSILON ||
//             Math.abs(newY - position.y) > POSITION_EPSILON) {
//             updatePosition(newX, newY);
//         }
//     }, [updatePosition, position]);
//
//     const handlePointerUp = useCallback(() => {
//         isDraggingRef.current = false;
//         dragStartRef.current = null;
//     }, []);
//
//     const wheelHandler = useCallback((e: WheelEvent) => {
//         e.preventDefault();
//
//         const canvas = canvasRef.current;
//         if (!canvas) return;
//
//         const rect = canvas.getBoundingClientRect();
//         const mouseX = e.clientX - rect.left;
//         const mouseY = e.clientY - rect.top;
//
//         const worldX = (mouseX - position.x) / scale;
//         const worldY = (mouseY - position.y) / scale;
//
//         const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
//         const newScale = Math.max(0.1, Math.min(10, scale * zoomFactor));
//
//         const newX = mouseX - worldX * newScale;
//         const newY = mouseY - worldY * newScale;
//
//         updateScale("set", newScale);
//         updatePosition(newX, newY);
//     }, [position.x, position.y, scale, updateScale, updatePosition]);
//
//     useEffect(() => {
//         const canvas = canvasRef.current;
//         if (!canvas) return;
//
//         canvas.addEventListener("wheel", wheelHandler, { passive: false });
//         return () => {
//             canvas.removeEventListener("wheel", wheelHandler);
//         };
//     }, [wheelHandler]);
//
//
//     // Render content when app and entities change
//     useEffect(() => {
//         if (!appRef.current || !viewportRef.current || !isReady || isDestroyingRef.current) return;
//
//         const viewport = viewportRef.current;
//
//         // Only rerender when entities or background actually change
//         const entities = state.entities;
//         const svgBg = state.svgBackground;
//
//         // Clear and re-render scene
//         viewport.removeChildren();
//
//         const grid = new GridRenderer(width, height, position, scale);
//         viewport.addChild(grid);
//
//         if (svgBg) {
//             const background = new BackgroundRenderer(svgBg, scale);
//             viewport.addChild(background);
//         }
//
//         for (const [entityId, entity] of Object.entries(entities)) {
//             if (!entity.visible) continue;
//
//             const entityContainer = new Container();
//             entityContainer.label = `entity-${entityId}`;
//             viewport.addChild(entityContainer);
//
//             const shapeRenderer = new ShapeRenderer(
//                 entityId,
//                 entity,
//                 selectedEntityId,
//                 selectedShapeId,
//                 selectedPointIndex,
//                 showMetrics,
//                 selectionManagerRef.current
//             );
//
//             entityContainer.addChild(shapeRenderer);
//         }
//     }, [
//         state.entities,
//         state.svgBackground,
//         isReady,
//         width,
//         height,
//         position.x, // reduced dependency recalculation
//         position.y,
//         scale,
//         selectedEntityId,
//         selectedShapeId,
//         selectedPointIndex,
//         showMetrics
//     ]);
//
//
//     return (
//         <div
//             ref={canvasRef}
//             className="relative w-full h-full"
//             onPointerDown={handlePointerDown}
//             onPointerMove={handlePointerMove}
//             onPointerUp={handlePointerUp}
//             onPointerLeave={handlePointerUp}
//         />
//     );
// };
//
// export default memo(PixiCanvas);
