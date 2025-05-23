// // src/features/editor/components/pixi/shapes/EllipseDrawable.ts
// import {Container, Graphics, Text} from 'pixi.js';
// import type {EllipseShape} from '../../../../../types';
// import {applyShapeStyle, formatNumber, hexStringToNumber} from '../utils';
//
// export class EllipseDrawable {
//     public container: Container<any>;
//     public graphics: Graphics;
//     public metrics: Container<any> | null = null;
//     public controlPoints: Graphics[] = [];
//
//     private shapeId: string;
//     private entityId: string;
//     private shape: EllipseShape;
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
//         shape: EllipseShape,
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
//         this.container.label = `ellipse-${shapeId}`;
//
//         // Create main graphics
//         this.graphics = new Graphics();
//         this.container.addChild(this.graphics);
//
//         // Draw the ellipse
//         this.drawEllipse();
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
//     private drawEllipse() {
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
//         // Apply style
//         applyShapeStyle(graphics, {
//             isSelected,
//             isHovered: false,
//             baseColor: strokeColor,
//             fillAlpha: 0.2,
//             strokeWidth
//         });
//
//         graphics.ellipse(shape.center.x, shape.center.y, shape.radiusX, shape.radiusY);
//
//         // Apply rotation if needed
//         if (shape.rotation) {
//             // PixiJS rotation is in radians
//             this.graphics.rotation = shape.rotation * (Math.PI / 180);
//             this.graphics.pivot.set(shape.center.x, shape.center.y);
//             this.graphics.position.set(shape.center.x, shape.center.y);
//         }
//
//         // Enable interaction
//         graphics.eventMode = 'static';
//         graphics.cursor = 'pointer';
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
//         // Create X-radius control point (on the right side of the ellipse)
//         const xRadiusPoint = new Graphics()
//             .circle(this.shape.center.x + this.shape.radiusX, this.shape.center.y, this.CONTROL_POINT_RADIUS)
//             .fill({color: this.CONTROL_POINT_COLOR})
//             .stroke({width: 1, color: this.CONTROL_POINT_BORDER});
//
//         // Create Y-radius control point (on the bottom of the ellipse)
//         const yRadiusPoint = new Graphics()
//             .circle(this.shape.center.x, this.shape.center.y + this.shape.radiusY, this.CONTROL_POINT_RADIUS)
//             .fill({color: this.CONTROL_POINT_COLOR})
//             .stroke({width: 1, color: this.CONTROL_POINT_BORDER});
//
//         // Create rotation control point (at an angle)
//         const rotationPoint = new Graphics()
//             .fill({color: this.CONTROL_POINT_COLOR})
//             .stroke({width: 1, color: this.CONTROL_POINT_BORDER});
//
//         // Position at 45 degrees, taking rotation into account
//         const angle = (this.shape.rotation || 0) + 45;
//         const angleInRadians = angle * (Math.PI / 180);
//         const rotationX = this.shape.center.x + Math.cos(angleInRadians) * this.shape.radiusX * 1.2;
//         const rotationY = this.shape.center.y + Math.sin(angleInRadians) * this.shape.radiusY * 1.2;
//
//         rotationPoint.drawCircle(
//             rotationX,
//             rotationY,
//             this.CONTROL_POINT_RADIUS
//         );
//         rotationPoint.endFill();
//
//         // Enable interaction
//         centerPoint.eventMode = 'static';
//         centerPoint.cursor = 'move';
//         xRadiusPoint.eventMode = 'static';
//         xRadiusPoint.cursor = 'ew-resize';
//         yRadiusPoint.eventMode = 'static';
//         yRadiusPoint.cursor = 'ns-resize';
//         rotationPoint.eventMode = 'static';
//         rotationPoint.cursor = 'crosshair';
//
//         // Add to container and store reference
//         this.container.addChild(centerPoint);
//         this.container.addChild(xRadiusPoint);
//         this.container.addChild(yRadiusPoint);
//         this.container.addChild(rotationPoint);
//         this.controlPoints.push(centerPoint);
//         this.controlPoints.push(xRadiusPoint);
//         this.controlPoints.push(yRadiusPoint);
//         this.controlPoints.push(rotationPoint);
//     }
//
//     private drawMetrics() {
//         if (this.metrics) {
//             this.container.removeChild(this.metrics);
//         }
//
//         // Calculate metrics
//         const { radiusX, radiusY } = this.shape;
//         const area = Math.PI * radiusX * radiusY;
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
//         areaText.position.set(this.shape.center.x - 50, this.shape.center.y - 30);
//
//         // Create dimensions text
//         const dimensionsText = new Text({
//             text: `X: ${formatNumber(radiusX * 2)}, Y: ${formatNumber(radiusY * 2)}`,
//             style: {
//                 fontSize: 12,
//                 fill: 0x000000,
//                 fontFamily: 'Arial'
//             }
//         });
//         dimensionsText.position.set(this.shape.center.x - 50, this.shape.center.y - 15);
//
//         // Add rotation info if applicable
//         if (this.shape.rotation) {
//             const rotationText = new Text({
//                 text: `Rotation: ${formatNumber(this.shape.rotation)}°`,
//                 style: {
//                     fontSize: 12,
//                     fill: 0x000000,
//                     fontFamily: 'Arial'
//                 }
//             });
//             rotationText.position.set(this.shape.center.x - 50, this.shape.center.y);
//             this.metrics.addChild(rotationText);
//         }
//
//         // Add to metrics container
//         this.metrics.addChild(areaText);
//         this.metrics.addChild(dimensionsText);
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
//         // Redraw ellipse
//         this.drawEllipse();
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
