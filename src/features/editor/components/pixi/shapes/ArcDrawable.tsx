// // src/features/editor/components/pixi/shapes/ArcDrawable.ts
// import { Container, Graphics, Text } from 'pixi.js';
// import type { ArcShape } from '../../../../../types';
// import { formatNumber, hexStringToNumber } from '../utils';
//
// export class ArcDrawable {
//     public container: Container<any>;
//     public graphics: Graphics;
//     public metrics: Container<any> | null = null;
//     public controlPoints: Graphics[] = [];
//
//     private shapeId: string;
//     private entityId: string;
//     private shape: ArcShape;
//     private isSelected: boolean;
//     private color: number;
//     private showMetrics: boolean;
//
//     // Control point styling
//     private readonly CONTROL_POINT_RADIUS = 6;
//     private readonly CONTROL_POINT_COLOR = 0xFFFFFF;
//     private readonly CONTROL_POINT_BORDER = 0x000000;
//
//     constructor(
//         shapeId: string,
//         entityId: string,
//         shape: ArcShape,
//         isSelected: boolean,
//         color: number,
//         showMetrics: boolean
//     ) {
//         this.shapeId = shapeId;
//         this.entityId = entityId;
//         this.shape = shape;
//         this.isSelected = isSelected;
//         this.color = color;
//         this.showMetrics = showMetrics;
//
//         // Create container
//         this.container = new Container();
//         this.container.label = `arc-${shapeId}`;
//
//         // Create main graphics
//         this.graphics = new Graphics();
//         this.container.addChild(this.graphics);
//
//         // Draw the arc
//         this.drawArc();
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
//     private drawArc() {
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
//         graphics.stroke({
//             width: isSelected ? strokeWidth * 1.5 : strokeWidth,
//             color: isSelected ? 0x00A8E8 : strokeColor
//         });
//
//         // Only fill if fillColor is specified and is not transparent
//         if (shape.style?.fillColor) {
//             graphics.fill({color: fillColor, alpha: 0.2})
//         }
//
//         // Draw arc - convert angles from degrees to radians
//         const startAngleRad = (shape.startAngle * Math.PI) / 180;
//         const endAngleRad = (shape.endAngle * Math.PI) / 180;
//
//         // PixiJS doesn't have a direct arc method, so we need to approximate with an arc
//         this.drawArcPath(
//             graphics,
//             shape.center.x,
//             shape.center.y,
//             shape.radius,
//             startAngleRad,
//             endAngleRad
//         );
//
//         // Enable interaction
//         graphics.eventMode = 'static';
//         graphics.cursor = 'pointer';
//     }
//
//     // Helper method to draw an arc path
//     private drawArcPath(
//         graphics: Graphics,
//         x: number,
//         y: number,
//         radius: number,
//         startAngle: number,
//         endAngle: number
//     ) {
//         // Make sure end angle is greater than start angle
//         if (endAngle < startAngle) {
//             endAngle += Math.PI * 2;
//         }
//
//         // Calculate arc points
//         const segments = Math.ceil(Math.abs(endAngle - startAngle) * 30); // More segments for smoother arc
//         const angleStep = (endAngle - startAngle) / segments;
//
//         // Start point
//         const startX = x + Math.cos(startAngle) * radius;
//         const startY = y + Math.sin(startAngle) * radius;
//
//         graphics.moveTo(startX, startY);
//
//         // Draw arc segments
//         for (let i = 1; i <= segments; i++) {
//             const angle = startAngle + angleStep * i;
//             const px = x + Math.cos(angle) * radius;
//             const py = y + Math.sin(angle) * radius;
//             graphics.lineTo(px, py);
//         }
//
//         // If filling, draw lines back to center
//         if (graphics.fillStyle.color !== undefined) {
//             graphics.lineTo(x, y);
//             graphics.lineTo(startX, startY);
//         }
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
//         // Create center control point
//         const centerPoint = new Graphics()
//             .circle(this.shape.center.x, this.shape.center.y, this.CONTROL_POINT_RADIUS)
//             .fill({color: this.CONTROL_POINT_COLOR})
//             .stroke({width: 1, color: this.CONTROL_POINT_BORDER});
//
//         // Create radius control point
//         const radiusPoint = new Graphics()
//             .fill({color: this.CONTROL_POINT_COLOR})
//             .stroke({width: 1, color: this.CONTROL_POINT_BORDER});
//
//
//         // Position at middle of the arc
//         const midAngle = (this.shape.startAngle + this.shape.endAngle) / 2;
//         const midAngleRad = (midAngle * Math.PI) / 180;
//         const radiusX = this.shape.center.x + Math.cos(midAngleRad) * this.shape.radius;
//         const radiusY = this.shape.center.y + Math.sin(midAngleRad) * this.shape.radius;
//
//         radiusPoint.circle(
//             radiusX,
//             radiusY,
//             this.CONTROL_POINT_RADIUS
//         );
//
//         // Create start angle control point
//         const startPoint = new Graphics()
//             .fill({color: this.CONTROL_POINT_COLOR})
//             .stroke({width: 1, color: this.CONTROL_POINT_BORDER});
//
//         const startAngleRad = (this.shape.startAngle * Math.PI) / 180;
//         const startX = this.shape.center.x + Math.cos(startAngleRad) * this.shape.radius;
//         const startY = this.shape.center.y + Math.sin(startAngleRad) * this.shape.radius;
//
//         startPoint.circle(
//             startX,
//             startY,
//             this.CONTROL_POINT_RADIUS
//         );
//
//         // Create end angle control point
//         const endPoint = new Graphics()
//             .fill({color: this.CONTROL_POINT_COLOR})
//             .stroke({width: 1, color: this.CONTROL_POINT_BORDER});
//
//         const endAngleRad = (this.shape.endAngle * Math.PI) / 180;
//         const endX = this.shape.center.x + Math.cos(endAngleRad) * this.shape.radius;
//         const endY = this.shape.center.y + Math.sin(endAngleRad) * this.shape.radius;
//
//         endPoint.circle(
//             endX,
//             endY,
//             this.CONTROL_POINT_RADIUS
//         );
//
//         // Enable interaction
//         centerPoint.eventMode = 'static';
//         centerPoint.cursor = 'move';
//         radiusPoint.eventMode = 'static';
//         radiusPoint.cursor = 'move';
//         startPoint.eventMode = 'static';
//         startPoint.cursor = 'crosshair';
//         endPoint.eventMode = 'static';
//         endPoint.cursor = 'crosshair';
//
//         // Add to container and store reference
//         this.container.addChild(centerPoint);
//         this.container.addChild(radiusPoint);
//         this.container.addChild(startPoint);
//         this.container.addChild(endPoint);
//         this.controlPoints.push(centerPoint);
//         this.controlPoints.push(radiusPoint);
//         this.controlPoints.push(startPoint);
//         this.controlPoints.push(endPoint);
//     }
//
//     private drawMetrics() {
//         if (this.metrics) {
//             this.container.removeChild(this.metrics);
//         }
//
//         // Calculate metrics
//         const { radius, startAngle, endAngle } = this.shape;
//         const angleDiff = Math.abs(endAngle - startAngle);
//         const arcLength = (angleDiff / 360) * (2 * Math.PI * radius);
//
//         // Create metrics container
//         this.metrics = new Container();
//         this.metrics.label = 'metrics';
//
//         // Create radius text
//         const radiusText = new Text({
//             text: `Radius: ${formatNumber(radius)} px`,
//             style: {
//                 fontSize: 12,
//                 fill: 0x000000,
//                 fontFamily: 'Arial'
//             }
//         });
//         radiusText.position.set(this.shape.center.x - 50, this.shape.center.y - 30);
//
//         // Create arc length text
//         const arcLengthText = new Text({
//             text: `Arc Length: ${formatNumber(arcLength)} px`,
//             style: {
//                 fontSize: 12,
//                 fill: 0x000000,
//                 fontFamily: 'Arial'
//             }
//         });
//         arcLengthText.position.set(this.shape.center.x - 50, this.shape.center.y - 15);
//
//         // Create angle text
//         const angleText = new Text({
//             text: `Angle: ${formatNumber(angleDiff)}°`,
//             style: {
//                 fontSize: 12,
//                 fill: 0x000000,
//                 fontFamily: 'Arial'
//             }
//         });
//         angleText.position.set(this.shape.center.x - 50, this.shape.center.y);
//
//         // Add to metrics container
//         this.metrics.addChild(radiusText);
//         this.metrics.addChild(arcLengthText);
//         this.metrics.addChild(angleText);
//
//         // Add metrics to main container
//         this.container.addChild(this.metrics);
//     }
//
//     // Update the drawable with new state
//     public update(options: {
//         isSelected: boolean;
//         selectedPointIndex?: number | null;
//         showControls: boolean;
//         showMetrics: boolean;
//     }) {
//         const { isSelected, showControls, showMetrics } = options;
//
//         // Update state
//         this.isSelected = isSelected;
//         this.showMetrics = showMetrics;
//
//         // Redraw arc
//         this.drawArc();
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
