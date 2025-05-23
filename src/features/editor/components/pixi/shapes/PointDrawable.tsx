// // src/features/editor/components/pixi/shapes/PointDrawable.ts
// import { Container, Graphics } from 'pixi.js';
// import type { PointShape } from '../../../../../types';
// import { hexStringToNumber } from '../utils';
//
// export class PointDrawable {
//     public container: Container<any>;
//     public graphics: Graphics;
//     public controlPoints: Graphics[] = [];
//
//     private shapeId: string;
//     private entityId: string;
//     private shape: PointShape;
//     private isSelected: boolean;
//     private color: number;
//
//     constructor(
//         shapeId: string,
//         entityId: string,
//         shape: PointShape,
//         isSelected: boolean,
//         color: number
//     ) {
//         this.shapeId = shapeId;
//         this.entityId = entityId;
//         this.shape = shape;
//         this.isSelected = isSelected;
//         this.color = color;
//
//         // Create container
//         this.container = new Container();
//         this.container.label = `point-${shapeId}`;
//
//         // Create main graphics
//         this.graphics = new Graphics();
//         this.container.addChild(this.graphics);
//
//         // Draw the point
//         this.drawPoint();
//     }
//
//     private drawPoint() {
//         const { graphics, shape, isSelected, color } = this;
//
//         // Clear previous drawing
//         graphics.clear();
//
//         // Get shape style
//         const fillColor = shape.style?.fillColor
//             ? hexStringToNumber(shape.style.fillColor)
//             : color;
//
//         const strokeColor = shape.style?.strokeColor
//             ? hexStringToNumber(shape.style.strokeColor)
//             : 0xFFFFFF;
//
//         const pointRadius = shape.style?.radius || 3;
//         graphics.circle(shape.point.x, shape.point.y, isSelected ? pointRadius * 1.5 : pointRadius)
//             .fill({color: isSelected ? 0x00A8E8 : fillColor})
//             .stroke({width: 1, color: isSelected ? 0x00A8E8 : strokeColor})
//
//         // Add pulse animation effect if selected
//         if (isSelected) {
//             // In a real implementation, we would add an animation here
//             // For now, just make it a bit bigger
//             const pulseEffect = new Graphics()
//                 .circle(shape.point.x, shape.point.y, pointRadius * 2.5)
//                 .fill({color: 0x00A8E8, alpha: 0.1})
//
//             this.container.addChild(pulseEffect);
//             this.controlPoints.push(pulseEffect);
//         }
//
//         // Enable interaction
//         graphics.eventMode = 'static';
//         graphics.cursor = 'pointer';
//     }
//
//     // Update the drawable with new state
//     public update(options: {
//         isSelected: boolean;
//         showControls?: boolean;
//         showMetrics?: boolean;
//     }) {
//         const { isSelected } = options;
//
//         // Update state
//         this.isSelected = isSelected;
//
//         // Remove any existing pulse effects
//         this.controlPoints.forEach(point => {
//             if (point.parent) {
//                 point.parent.removeChild(point);
//             }
//         });
//         this.controlPoints = [];
//
//         // Redraw point
//         this.drawPoint();
//     }
// }
