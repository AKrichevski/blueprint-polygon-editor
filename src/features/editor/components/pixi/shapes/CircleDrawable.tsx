// // src/features/editor/components/pixi/shapes/CircleDrawable.ts
// import { Container, Graphics, Text } from 'pixi.js';
// import type { CircleShape } from '../../../../../types';
// import { applyShapeStyle, formatNumber, hexStringToNumber } from '../utils';
//
// export class CircleDrawable {
//     public container: Container<any>;
//     public graphics: Graphics;
//     public metrics: Container<any> | null = null;
//     public controlPoints: Graphics[] = [];
//
//     private shapeId: string;
//     private entityId: string;
//     private shape: CircleShape;
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
//         shape: CircleShape,
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
//         this.container.label = `circle-${shapeId}`;
//
//         // Create main graphics
//         this.graphics = new Graphics();
//         this.container.addChild(this.graphics);
//
//         // Draw the circle
//         this.drawCircle();
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
//     private drawCircle() {
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
//         // Draw circle
//         graphics.drawCircle(shape.center.x, shape.center.y, shape.radius);
//         graphics.endFill();
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
//         // Create radius control point (on the edge of the circle)
//         const radiusPoint = new Graphics()
//             .circle(this.shape.center.x + this.shape.radius, this.shape.center.y, this.CONTROL_POINT_RADIUS)
//             .fill({color: this.CONTROL_POINT_COLOR})
//             .stroke({width: 1, color: this.CONTROL_POINT_BORDER});
//
//         // Enable interaction
//         centerPoint.eventMode = 'static';
//         centerPoint.cursor = 'move';
//         radiusPoint.eventMode = 'static';
//         radiusPoint.cursor = 'nwse-resize';
//
//         // Add to container and store reference
//         this.container.addChild(centerPoint);
//         this.container.addChild(radiusPoint);
//         this.controlPoints.push(centerPoint);
//         this.controlPoints.push(radiusPoint);
//     }
//
//     private drawMetrics() {
//         if (this.metrics) {
//             this.container.removeChild(this.metrics);
//         }
//
//         // Calculate metrics
//         const { radius } = this.shape;
//         const area = Math.PI * radius * radius;
//         const circumference = 2 * Math.PI * radius;
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
//         // Create circumference text
//         const circumferenceText = new Text({
//             text: `Circumference: ${formatNumber(circumference)} px`,
//             style: {
//                 fontSize: 12,
//                 fill: 0x000000,
//                 fontFamily: 'Arial'
//             }
//         });
//         circumferenceText.position.set(this.shape.center.x - 50, this.shape.center.y - 15);
//
//         // Add to metrics container
//         this.metrics.addChild(areaText);
//         this.metrics.addChild(circumferenceText);
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
//         // Redraw circle
//         this.drawCircle();
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
