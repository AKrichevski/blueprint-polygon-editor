// // src/features/editor/components/pixi/shapes/TextDrawable.ts
// import { Container, Graphics, Text as PixiText } from 'pixi.js';
// import type { TextShape } from '../../../../../types';
// import { hexStringToNumber } from '../utils';
//
// export class TextDrawable {
//     public container: Container<any>;
//     public graphics: Graphics;
//     public controlPoints: Graphics[] = [];
//
//     private shapeId: string;
//     private entityId: string;
//     private shape: TextShape;
//     private isSelected: boolean;
//     private color: number;
//     private textElement: PixiText;
//
//     constructor(
//         shapeId: string,
//         entityId: string,
//         shape: TextShape,
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
//         this.container.label = `text-${shapeId}`;
//
//         // Create main graphics for hit detection
//         this.graphics = new Graphics();
//         this.container.addChild(this.graphics);
//
//         // Create text element
//         this.textElement = new PixiText({
//             text: shape.text,
//             style: {
//                 fontSize: shape.style?.fontSize || 12,
//                 fontFamily: shape.style?.fontFamily || 'Arial',
//                 fill: hexStringToNumber(shape.style?.color || '#000000'),
//                 align: shape.style?.align || 'left'
//             }
//         });
//         this.textElement.position.set(shape.position.x, shape.position.y);
//
//         // Apply rotation if needed
//         if (shape.style?.rotation) {
//             this.textElement.angle = shape.style.rotation;
//         }
//
//         this.container.addChild(this.textElement);
//
//         // Draw selection indicators if selected
//         if (isSelected) {
//             this.drawSelectionIndicator();
//         }
//
//         // Enable interaction
//         this.graphics.eventMode = 'static';
//         this.graphics.cursor = 'text';
//         this.textElement.eventMode = 'static';
//         this.textElement.cursor = 'text';
//     }
//
//     private drawSelectionIndicator() {
//         // Create a rectangle around the text
//         const bounds = this.textElement.getBounds();
//         const padding = 2; // Padding around text
//
//         const indicator = new Graphics();
//         indicator.lineStyle(1, 0x00A8E8, 0.8);
//         indicator.drawRect(
//             bounds.x - padding,
//             bounds.y - padding,
//             bounds.width + padding * 2,
//             bounds.height + padding * 2
//         );
//
//         // Add position control point
//         const positionControl = new Graphics()
//             .circle(this.shape.position.x, this.shape.position.y, 6)
//             .fill({color: 0xFFFFFF})
//             .stroke({width: 1, color: 0xFFFFFF});
//
//         // Enable interaction for the control point
//         positionControl.eventMode = 'static';
//         positionControl.cursor = 'move';
//
//         // Add to container and store reference
//         this.container.addChild(indicator);
//         this.container.addChild(positionControl);
//         this.controlPoints.push(indicator);
//         this.controlPoints.push(positionControl);
//     }
//
//     // Update the graphics for hit detection
//     private updateHitArea() {
//         const bounds = this.textElement.getBounds();
//         const padding = 5; // Extra padding for easier selection
//
//         this.graphics.clear();
//
//
//         this.graphics.rect(
//             bounds.x - padding,
//             bounds.y - padding,
//             bounds.width + padding * 2,
//             bounds.height + padding * 2
//         )
//             .fill({color: 0xFFFFFF, alpha: 0.01})
//     }
//
//     // Update the drawable with new state
//     public update(options: {
//         isSelected: boolean;
//         showControls?: boolean;
//     }) {
//         const { isSelected, showControls = true } = options;
//
//         // Update state
//         this.isSelected = isSelected;
//
//         // Remove any existing selection indicators
//         this.controlPoints.forEach(graphic => {
//             if (graphic.parent) {
//                 graphic.parent.removeChild(graphic);
//             }
//         });
//         this.controlPoints = [];
//
//         // Update text properties (in case they changed)
//         this.textElement.text = this.shape.text;
//         this.textElement.style = {
//             fontSize: this.shape.style?.fontSize || 12,
//             fontFamily: this.shape.style?.fontFamily || 'Arial',
//             fill: hexStringToNumber(this.shape.style?.color || '#000000'),
//             align: this.shape.style?.align || 'left'
//         };
//         this.textElement.position.set(this.shape.position.x, this.shape.position.y);
//
//         // Apply rotation if needed
//         if (this.shape.style?.rotation) {
//             this.textElement.angle = this.shape.style.rotation;
//         } else {
//             this.textElement.angle = 0;
//         }
//
//         // Update hit area
//         this.updateHitArea();
//
//         // Draw selection indicator if selected
//         if (isSelected && showControls) {
//             this.drawSelectionIndicator();
//         }
//     }
// }
