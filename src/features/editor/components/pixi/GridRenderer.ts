// // src/features/editor/components/pixi/GridRenderer.ts
// import { Container, Graphics } from 'pixi.js';
//
// export class GridRenderer extends Container {
//     private graphics: Graphics;
//     private width: number;
//     private height: number;
//     private position: { x: number, y: number };
//     private scale: number;
//     private gridSize = 50;
//     private gridColor = 0xE5E7EB; // Light gray
//
//     constructor(width: number, height: number, position: { x: number, y: number }, scale: number) {
//         super();
//         this.label = 'grid-renderer';
//         this.width = width;
//         this.height = height;
//         this.position = position;
//         this.scale = scale;
//
//         this.graphics = new Graphics();
//         this.addChild(this.graphics);
//
//         this.drawGrid();
//     }
//
//     private drawGrid() {
//         const { graphics, width, height, position, scale, gridSize, gridColor } = this;
//
//         // Clear previous grid
//         graphics.clear();
//
//         // Calculate grid parameters
//         const scaledGridSize = gridSize * scale;
//         const offsetX = position.x % scaledGridSize;
//         const offsetY = position.y % scaledGridSize;
//
//         graphics.stroke({width: 1, color:gridColor, alpha:0.5});
//
//         // Draw vertical lines
//         for (let x = offsetX; x < width; x += scaledGridSize) {
//             graphics.moveTo(x, 0);
//             graphics.lineTo(x, height);
//         }
//
//         // Draw horizontal lines
//         for (let y = offsetY; y < height; y += scaledGridSize) {
//             graphics.moveTo(0, y);
//             graphics.lineTo(width, y);
//         }
//     }
//
//     // Update grid when viewpoint changes
//     public update(width: number, height: number, position: { x: number, y: number }, scale: number) {
//         this.width = width;
//         this.height = height;
//         this.position = position;
//         this.scale = scale;
//
//         this.drawGrid();
//     }
// }
