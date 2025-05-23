// // src/features/editor/components/pixi/types.ts
//
// import { Container, Graphics } from 'pixi.js';
// import type { GeometricShape, Point } from '../../../../types';
//
// export interface PerformanceResults {
//     engine: 'konva' | 'pixi';
//     dataSize: string;
//     totalTime: number;
//     frames: number;
//     averageFrameTime: string;
//     minFrameTime: string;
//     maxFrameTime: string;
//     fps: string;
//     timestamp: string;
// }
//
// export interface ShapeRenderOptions {
//     isSelected: boolean;
//     isHovered: boolean;
//     showControls: boolean;
//     showMetrics: boolean;
// }
//
// export interface ShapeDrawable {
//     container: Container<any>;
//     graphics: Graphics;
//     controlPoints?: Graphics[];
//     metrics?: Container<any>;
//     hitArea?: Graphics;
//     update: (options: ShapeRenderOptions) => void;
//     handlePointerDown?: (event: any) => void;
//     handlePointerMove?: (event: any) => void;
//     handlePointerUp?: (event: any) => void;
// }
//
// export interface ShapeStyleOptions {
//     strokeColor: number;
//     strokeWidth: number;
//     fillColor: number;
//     fillAlpha: number;
//     selectedStrokeColor: number;
//     hoveredStrokeColor: number;
//     controlPointRadius: number;
//     controlPointColor: number;
//     selectedControlPointColor: number;
// }
//
// export interface PolygonRenderData {
//     id: string;
//     entityId: string;
//     shape: GeometricShape;
//     isSelected: boolean;
//     color: number;
//     points: Point[];
//     selectedPointIndex: number | null;
// }
//
// export interface CircleRenderData {
//     id: string;
//     entityId: string;
//     shape: GeometricShape;
//     isSelected: boolean;
//     color: number;
//     center: Point;
//     radius: number;
// }
//
// export interface LineRenderData {
//     id: string;
//     entityId: string;
//     shape: GeometricShape;
//     isSelected: boolean;
//     color: number;
//     points: Point[];
//     selectedPointIndex: number | null;
// }
//
// export interface TextRenderData {
//     id: string;
//     entityId: string;
//     shape: GeometricShape;
//     isSelected: boolean;
//     color: number;
//     position: Point;
//     text: string;
//     fontSize: number;
//     fontFamily: string;
// }
//
// export interface EllipseRenderData {
//     id: string;
//     entityId: string;
//     shape: GeometricShape;
//     isSelected: boolean;
//     color: number;
//     center: Point;
//     radiusX: number;
//     radiusY: number;
//     rotation: number;
// }
//
// export interface ArcRenderData {
//     id: string;
//     entityId: string;
//     shape: GeometricShape;
//     isSelected: boolean;
//     color: number;
//     center: Point;
//     radius: number;
//     startAngle: number;
//     endAngle: number;
// }
//
// export interface PointRenderData {
//     id: string;
//     entityId: string;
//     shape: GeometricShape;
//     isSelected: boolean;
//     color: number;
//     point: Point;
// }
//
// export interface ViewportBounds {
//     minX: number;
//     minY: number;
//     maxX: number;
//     maxY: number;
// }
