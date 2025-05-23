// // src/features/editor/components/pixi/shapes/PolygonDrawable.ts
// import { Container, Graphics, Text } from 'pixi.js';
// import type { PolygonShape, Point } from '../../../../../types';
// import { applyShapeStyle, formatNumber, hexStringToNumber } from '../utils';
// import { calculatePolygonArea, calculatePolygonPerimeter } from '../../../utils/polygonHelpers';
//
//
// export class PolygonDrawable {
//     public container: Container<any>;
//     public graphics: Graphics;
//     public controlPoints: Graphics[] = [];
//     public metrics: Container<any> | null = null;
//
//     private shapeId: string;
//     private entityId: string;
//     private shape: PolygonShape;
//     private isSelected: boolean;
//     private selectedPointIndex: number | null;
//     private color: number;
//     private showMetrics: boolean;
//
//     // Control point styling
//     private readonly CONTROL_POINT_RADIUS = 6;
//     private readonly SELECTED_CONTROL_POINT_RADIUS = 8;
//     private readonly CONTROL_POINT_COLOR = 0xFFFFFF;
//     private readonly CONTROL_POINT_BORDER = 0x000000;
//     private readonly SELECTED_CONTROL_POINT_COLOR = 0xFF3333;
//
//     constructor(
//         shapeId: string,
//         entityId: string,
//         shape: PolygonShape,
//         isSelected: boolean,
//         selectedPointIndex: number | null,
//         color: number,
//         showMetrics: boolean
//     ) {
//         this.shapeId = shapeId;
//         this.entityId = entityId;
//         this.shape = shape;
//         this.isSelected = isSelected;
//         this.selectedPointIndex = selectedPointIndex;
//         this.color = color;
//         this.showMetrics = showMetrics;
//
//         // Create container
//         this.container = new Container();
//         this.container.label = `polygon-${shapeId}`;
//
//         // Create main graphics
//         this.graphics = new Graphics();
//         this.container.addChild(this.graphics);
//
//         // Draw the polygon
//         this.drawPolygon();
//
//         // Add control points if selected
//         if (isSelected) {
//             this.drawControlPoints();
//         }
//
//         // Add metrics if needed
//         if (showMetrics && isSelected) {
//             this.drawMetrics();
//         }
//     }
//
//     private drawPolygon() {
//         const { graphics, shape, isSelected, color } = this;
//
//         // Clear previous drawing
//         graphics.clear();
//
//         // Get shape style
//         const strokeColor = shape.style?.strokeColor
//             ? hexStringToNumber(shape.style.strokeColor)
//             : color;
//
//         const strokeWidth = shape.style?.strokeWidth || 1;
//
//         const fillColor = shape.style?.fillColor
//             ? hexStringToNumber(shape.style.fillColor)
//             : color;
//
//         // Apply style
//         applyShapeStyle(graphics, {
//             isSelected,
//             isHovered: false,
//             baseColor: strokeColor,
//             fillAlpha: 0.2,
//             strokeWidth
//         });
//
//         // Draw polygon
//         const points = shape.points.flatMap(p => [p.x, p.y]);
//         graphics.poly(points).fill();
//
//         // Enable interaction
//         graphics.eventMode = 'static';
//         graphics.cursor = 'pointer';
//         graphics.on('pointerdown', () => {
//             console.log('drawPolygon clicked!');
//         });
//     }
//
//     private drawControlPoints() {
//         // Clear existing control points
//         this.controlPoints.forEach(point => {
//             if (point.parent) {
//                 point.parent.removeChild(point);
//             }
//         });
//         this.controlPoints = [];
//
//         // Create control points for each vertex
//         this.shape.points.forEach((point, index) => {
//             const isSelected = index === this.selectedPointIndex;
//             const controlPoint = new Graphics().circle(
//                 point.x,
//                 point.y,
//                 isSelected ? this.SELECTED_CONTROL_POINT_RADIUS : this.CONTROL_POINT_RADIUS)
//                 .fill({color: isSelected ? this.SELECTED_CONTROL_POINT_COLOR : this.CONTROL_POINT_COLOR})
//                 .stroke({width: 1, color: this.CONTROL_POINT_BORDER});
//             controlPoint.on('pointerdown', () => {
//                 console.log('controlPoint clicked!');
//             });
//
//             // Enable interaction
//             controlPoint.eventMode = 'static';
//             controlPoint.cursor = 'move';
//
//             // Add to container and store reference
//             this.container.addChild(controlPoint);
//             this.controlPoints.push(controlPoint);
//         });
//     }
//
//     private drawMetrics() {
//         if (this.metrics) {
//             this.container.removeChild(this.metrics);
//         }
//
//         // Calculate metrics
//         const area = calculatePolygonArea(this.shape.points);
//         const perimeter = calculatePolygonPerimeter(this.shape.points);
//
//         // Calculate centroid (average of all points)
//         const centroid = this.calculateCentroid();
//
//         // Create metrics container
//         this.metrics = new Container();
//         this.metrics.label = 'metrics';
//
//         // Create area text
//         const areaText = new Text({
//             text: `Area: ${formatNumber(area)} px²`,
//             style: {
//                 fontSize: 12,
//                 fill: 0x000000,
//                 fontFamily: 'Arial'
//             }
//         });
//         areaText.position.set(centroid.x - 50, centroid.y - 30);
//
//         // Create perimeter text
//         const perimeterText = new Text({
//             text: `Perimeter: ${formatNumber(perimeter)} px`,
//             style: {
//                 fontSize: 12,
//                 fill: 0x000000,
//                 fontFamily: 'Arial'
//             }
//         });
//         perimeterText.position.set(centroid.x - 50, centroid.y - 15);
//
//         // Add to metrics container
//         this.metrics.addChild(areaText);
//         this.metrics.addChild(perimeterText);
//
//         // Add metrics to main container
//         this.container.addChild(this.metrics);
//     }
//
//     private calculateCentroid(): Point {
//         const { points } = this.shape;
//
//         if (points.length === 0) return { x: 0, y: 0 };
//
//         let sumX = 0;
//         let sumY = 0;
//
//         points.forEach(point => {
//             sumX += point.x;
//             sumY += point.y;
//         });
//
//         return {
//             x: sumX / points.length,
//             y: sumY / points.length
//         };
//     }
//
//     // Update the drawable with new state
//     public update(options: {
//         isSelected: boolean;
//         selectedPointIndex: number | null;
//         showControls: boolean;
//         showMetrics: boolean;
//     }) {
//         const { isSelected, selectedPointIndex, showControls, showMetrics } = options;
//
//         // Update state
//         this.isSelected = isSelected;
//         this.selectedPointIndex = selectedPointIndex;
//         this.showMetrics = showMetrics;
//
//         // Redraw polygon
//         this.drawPolygon();
//
//         // Update control points
//         if (isSelected && showControls) {
//             this.drawControlPoints();
//         } else {
//             // Remove control points
//             this.controlPoints.forEach(point => {
//                 if (point.parent) {
//                     point.parent.removeChild(point);
//                 }
//             });
//             this.controlPoints = [];
//         }
//
//         // Update metrics
//         if (isSelected && showMetrics) {
//             this.drawMetrics();
//         } else if (this.metrics) {
//             this.container.removeChild(this.metrics);
//             this.metrics = null;
//         }
//     }
// }
