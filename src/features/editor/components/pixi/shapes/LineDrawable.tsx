// // src/features/editor/components/pixi/shapes/LineDrawable.ts
// import {Container, Graphics, Text} from 'pixi.js';
// import type {LineShape} from '../../../../../types';
// import {applyShapeStyle, formatNumber, hexStringToNumber} from '../utils';
// import {calculateLineLength} from '../../../utils/polygonHelpers';
//
//
// export class LineDrawable {
//     public container: Container<any>;
//     public graphics: Graphics;
//     public controlPoints: Graphics[] = [];
//     public metrics: Container<any> | null = null;
//
//     private shapeId: string;
//     private entityId: string;
//     private shape: LineShape;
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
//         shape: LineShape,
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
//         this.container.label = `line-${shapeId}`;
//
//         // Create main graphics
//         this.graphics = new Graphics();
//         this.container.addChild(this.graphics);
//
//         // Draw the line
//         this.drawLine();
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
//     private drawLine() {
//         const {graphics, shape, isSelected, color} = this;
//         const strokeStyle = (style) => {
//             let strokeWidth = style?.strokeWidth || 1
//
//             const strokeColor = () => {
//                 let lineColor = color;
//                 if (style?.strokeColor) {
//                     lineColor = hexStringToNumber(style.strokeColor)
//                 } else if(isSelected) {
//                     lineColor = 0xA0A8E8
//                 }
//
//                 return lineColor;
//             }
//
//             return { color: strokeColor(), width: isSelected ? strokeWidth * 1.5 : strokeWidth}
//         }
//
//         // Clear previous drawing
//         graphics.clear();
//
//         // Draw line
//         if (shape.points.length === 2) {
//             graphics
//                 .moveTo(shape.points[0].x, shape.points[0].y)
//                 .lineTo(shape.points[1].x, shape.points[1].y)
//                 .stroke({...strokeStyle(shape.style)});
//
//             // Enable interaction
//             graphics.eventMode = 'static';
//             graphics.cursor = 'pointer';
//
//             // Set hit area - make it easier to click on thin lines
//             const hitAreaGraphics = new Graphics()
//                 .stroke({width: 10, color: 0xFF0000});
//
//             hitAreaGraphics.moveTo(shape.points[0].x, shape.points[0].y);
//             hitAreaGraphics.lineTo(shape.points[1].x, shape.points[1].y);
//             // graphics.hitArea = hitAreaGraphics;
//         }
//
//
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
//         // Create control points for each endpoint
//         this.shape.points.forEach((point, index) => {
//             const isSelected = index === this.selectedPointIndex;
//             const controlPoint = new Graphics()
//                 .circle(
//                     point.x,
//                     point.y,
//                     isSelected ? this.SELECTED_CONTROL_POINT_RADIUS : this.CONTROL_POINT_RADIUS)
//                 .fill({color: isSelected ? this.SELECTED_CONTROL_POINT_COLOR : this.CONTROL_POINT_COLOR})
//                 .stroke({width: 1, color: this.CONTROL_POINT_BORDER});
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
//         const length = calculateLineLength(this.shape.points);
//
//         // Calculate midpoint for placing text
//         const midpoint = this.calculateMidpoint();
//
//         // Create metrics container
//         this.metrics = new Container();
//         this.metrics.label = 'metrics';
//
//         // Create length text
//         const lengthText = new Text({
//             text: `Length: ${formatNumber(length)} px`,
//             style: {
//                 fontSize: 12,
//                 fill: 0x000000,
//                 fontFamily: 'Arial'
//             }
//         });
//         lengthText.position.set(midpoint.x + 10, midpoint.y - 10);
//
//         // Add to metrics container
//         this.metrics.addChild(lengthText);
//
//         // Add metrics to main container
//         this.container.addChild(this.metrics);
//     }
//
//     private calculateMidpoint() {
//         const {points} = this.shape;
//
//         if (points.length < 2) return {x: 0, y: 0};
//
//         // For simple lines, just use the midpoint between the two endpoints
//         if (points.length === 2) {
//             return {
//                 x: (points[0].x + points[1].x) / 2,
//                 y: (points[0].y + points[1].y) / 2
//             };
//         }
//
//         // For polylines, find the middle segment
//         const middleIndex = Math.floor(points.length / 2) - 1;
//         return {
//             x: (points[middleIndex].x + points[middleIndex + 1].x) / 2,
//             y: (points[middleIndex].y + points[middleIndex + 1].y) / 2
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
//         const {isSelected, selectedPointIndex, showControls, showMetrics} = options;
//
//         // Update state
//         this.isSelected = isSelected;
//         this.selectedPointIndex = selectedPointIndex;
//         this.showMetrics = showMetrics;
//
//         // Redraw line
//         this.drawLine();
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
