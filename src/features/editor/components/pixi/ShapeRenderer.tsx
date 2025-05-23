// // src/features/editor/components/pixi/ShapeRenderer.tsx
// import { Container } from 'pixi.js';
// import type { Entity, PolygonShape, CircleShape, EllipseShape, LineShape, TextShape, ArcShape, PointShape } from '../../../../types';
// import { PolygonDrawable } from './shapes';
// import { CircleDrawable } from './shapes';
// import { LineDrawable } from './shapes';
// import { TextDrawable } from './shapes';
// import { EllipseDrawable } from './shapes';
// import { ArcDrawable } from './shapes';
// import { PointDrawable } from './shapes';
// import { SelectionManager } from './SelectionManager';
// import { hexStringToNumber } from './utils';
//
// export class ShapeRenderer extends Container {
//     private drawables = new Map<string, any>();
//     private entity: Entity;
//     private entityId: string;
//     private selectionManager: SelectionManager | null;
//     private selectedShapeId: string | null;
//     private selectedPointIndex: number | null;
//     private showMetrics: boolean;
//
//     constructor(
//         entityId: string,
//         entity: Entity,
//         selectedEntityId: string | null,
//         selectedShapeId: string | null,
//         selectedPointIndex: number | null,
//         showMetrics: boolean,
//         selectionManager: SelectionManager | null
//     ) {
//         super();
//         this.label = `shape-renderer-${entityId}`;
//         this.entity = entity;
//         this.entityId = entityId;
//         this.selectedShapeId = selectedEntityId === entityId ? selectedShapeId : null;
//         this.selectedPointIndex = this.selectedShapeId ? selectedPointIndex : null;
//         this.showMetrics = showMetrics;
//         this.selectionManager = selectionManager;
//
//         this.renderShapes();
//     }
//
//     private renderShapes() {
//         const { shapes } = this.entity;
//         const entityColor = hexStringToNumber(this.entity.metaData?.fontColor || '#3357FF');
//
//         // Create drawables for each shape
//         const hasSelectionManager = !!this.selectionManager;
//         let caunter = 0
//         for (const shapeId in shapes) {
//             ++caunter
//             const shape = shapes[shapeId];
//             const type = shape.shapeType;
//             const isSelected = shapeId === this.selectedShapeId;
//             let drawable = null;
//             if (type !== 'polygon') {
//                 debugger
//             }
//             switch (type) {
//                 case 'polygon':
//                 case 'rectangle':
//                     drawable = new PolygonDrawable(
//                         shapeId, this.entityId, shape as PolygonShape,
//                         isSelected, this.selectedPointIndex, entityColor, this.showMetrics
//                     );
//                     break;
//
//                 case 'circle':
//                     drawable = new CircleDrawable(
//                         shapeId, this.entityId, shape as CircleShape,
//                         isSelected, entityColor, this.showMetrics
//                     );
//                     break;
//
//                 case 'line':
//                     drawable = new LineDrawable(
//                         shapeId, this.entityId, shape as LineShape,
//                         isSelected, this.selectedPointIndex, entityColor, this.showMetrics
//                     );
//                     break;
//
//                 case 'text':
//                     drawable = new TextDrawable(
//                         shapeId, this.entityId, shape as TextShape,
//                         isSelected, entityColor
//                     );
//                     break;
//
//                 case 'ellipse':
//                     drawable = new EllipseDrawable(
//                         shapeId, this.entityId, shape as EllipseShape,
//                         isSelected, entityColor, this.showMetrics
//                     );
//                     break;
//
//                 case 'arc':
//                     drawable = new ArcDrawable(
//                         shapeId, this.entityId, shape as ArcShape,
//                         isSelected, entityColor, this.showMetrics
//                     );
//                     break;
//
//                 case 'point':
//                     drawable = new PointDrawable(
//                         shapeId, this.entityId, shape as PointShape,
//                         isSelected, entityColor
//                     );
//                     break;
//
//                 default:
//                     console.warn(`Unknown shape type: ${type}`);
//                     continue;
//             }
//
//             this.drawables.set(shapeId, drawable);
//             this.addChild(drawable.container);
//
//             const graphics = drawable.graphics;
//             if (!graphics || !hasSelectionManager) continue;
//
//             graphics.eventMode = 'static';
//             graphics.cursor = 'pointer';
//             graphics.metadata = { entityId: this.entityId, shapeId, type };
//
//             graphics.on('pointerdown', (e) => {
//                 e.stopPropagation();
//                 this.selectionManager!.selectShape(this.entityId, shapeId);
//             });
//
//             const points = drawable.controlPoints;
//             if (Array.isArray(points)) {
//                 for (let i = 0; i < points.length; i++) {
//                     const point = points[i];
//                     if (!point) continue;
//
//                     point.eventMode = 'static';
//                     point.cursor = 'move';
//                     point.metadata = {
//                         entityId: this.entityId,
//                         shapeId,
//                         pointIndex: i,
//                         type: 'control-point'
//                     };
//
//                     point.on('pointerdown', (e) => {
//                         e.stopPropagation();
//                         this.selectionManager!.selectPoint(this.entityId, shapeId, i);
//                     });
//                 }
//             }
//         }
//         console.log("xxx amaunt of shaps:",caunter)
//     }
//
//     // Update if selection state changes
//     public updateSelection(
//         selectedEntityId: string | null,
//         selectedShapeId: string | null,
//         selectedPointIndex: number | null
//     ) {
//         const newSelectedShapeId = selectedEntityId === this.entityId ? selectedShapeId : null;
//
//         if (this.selectedShapeId !== newSelectedShapeId ||
//             this.selectedPointIndex !== selectedPointIndex) {
//
//             this.selectedShapeId = newSelectedShapeId;
//             this.selectedPointIndex = newSelectedShapeId ? selectedPointIndex : null;
//
//             // Update all drawables with new selection state
//             for (const [shapeId, drawable] of this.drawables.entries()) {
//                 drawable.update({
//                     isSelected: shapeId === this.selectedShapeId,
//                     selectedPointIndex: this.selectedPointIndex,
//                     showControls: shapeId === this.selectedShapeId,
//                     showMetrics: this.showMetrics && shapeId === this.selectedShapeId
//                 });
//             }
//         }
//     }
//
//     // Update metrics visibility
//     public updateMetricsVisibility(showMetrics: boolean) {
//         if (this.showMetrics !== showMetrics) {
//             this.showMetrics = showMetrics;
//
//             for (const [shapeId, drawable] of this.drawables.entries()) {
//                 if (drawable.update) {
//                     drawable.update({
//                         isSelected: shapeId === this.selectedShapeId,
//                         selectedPointIndex: this.selectedPointIndex,
//                         showControls: shapeId === this.selectedShapeId,
//                         showMetrics: showMetrics && shapeId === this.selectedShapeId
//                     });
//                 }
//             }
//         }
//     }
// }
