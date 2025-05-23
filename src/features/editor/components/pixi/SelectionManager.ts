// // src/features/editor/components/pixi/SelectionManager.ts
// import { Application, Container, FederatedPointerEvent } from 'pixi.js';
//
// export class SelectionManager {
//     private app: Application;
//     private viewport: Container<any>;
//     private selectedEntityId: string | null;
//     private selectedShapeId: string | null;
//     private selectedPointIndex: number | null;
//     private onSelect: (entityId: string, shapeId: string, pointIndex?: number) => void;
//     private isDragging: boolean = false;
//     private dragStartPos: {x: number, y: number} | null = null;
//
//     constructor(
//         app: Application,
//         viewport: Container<any>,
//         selectedEntityId: string | null,
//         selectedShapeId: string | null,
//         selectedPointIndex: number | null
//     ) {
//         this.app = app;
//         this.viewport = viewport;
//         this.selectedEntityId = selectedEntityId;
//         this.selectedShapeId = selectedShapeId;
//         this.selectedPointIndex = selectedPointIndex;
//
//         // Connect to editor context for updating selection
//         this.setupSelectionHandler();
//     }
//
//     // Connect to the editor context - this should be called after component mounts
//     private setupSelectionHandler() {
//         // Default implementation until we can connect to context
//         this.onSelect = (entityId: string, shapeId: string, pointIndex?: number) => {
//             console.log(`Selected: Entity=${entityId}, Shape=${shapeId}, Point=${pointIndex ?? 'none'}`);
//             this.selectedEntityId = entityId;
//             this.selectedShapeId = shapeId;
//             this.selectedPointIndex = pointIndex ?? null;
//
//             // Dispatch a custom event that PixiCanvas component will listen for
//             // This is our way to communicate selection changes back to React
//             const event = new CustomEvent('shape-selected', {
//                 detail: { entityId, shapeId, pointIndex }
//             });
//             this.app.canvas.dispatchEvent(event);
//         };
//     }
//
//     // Update selection state
//     public updateSelection(
//         entityId: string | null,
//         shapeId: string | null,
//         pointIndex: number | null
//     ) {
//         this.selectedEntityId = entityId;
//         this.selectedShapeId = shapeId;
//         this.selectedPointIndex = pointIndex;
//     }
//
//     // Select a shape - this will be called from ShapeRenderer
//     public selectShape(entityId: string, shapeId: string) {
//         // If the shape is already selected, do nothing
//         if (this.selectedEntityId === entityId && this.selectedShapeId === shapeId) {
//             return;
//         }
//
//         // Update selection
//         this.onSelect(entityId, shapeId);
//     }
//
//     // Select a point within a shape
//     public selectPoint(entityId: string, shapeId: string, pointIndex: number) {
//         // If the point is already selected, do nothing
//         if (
//             this.selectedEntityId === entityId &&
//             this.selectedShapeId === shapeId &&
//             this.selectedPointIndex === pointIndex
//         ) {
//             return;
//         }
//
//         // Update selection
//         this.onSelect(entityId, shapeId, pointIndex);
//     }
//
//     // Start dragging a point
//     public startDragPoint(
//         entityId: string,
//         shapeId: string,
//         pointIndex: number,
//         event: FederatedPointerEvent
//     ) {
//         // First select the point
//         this.selectPoint(entityId, shapeId, pointIndex);
//
//         // Set up dragging state
//         this.isDragging = true;
//         this.dragStartPos = { x: event.globalX, y: event.globalY };
//
//         // Dispatch drag start event
//         const dragStartEvent = new CustomEvent('point-drag-start', {
//             detail: {
//                 entityId,
//                 shapeId,
//                 pointIndex,
//                 x: event.globalX,
//                 y: event.globalY
//             }
//         });
//         this.app.canvas.dispatchEvent(dragStartEvent);
//     }
//
//     // Handle point dragging
//     public dragPoint(
//         entityId: string,
//         shapeId: string,
//         pointIndex: number,
//         event: FederatedPointerEvent
//     ) {
//         if (!this.isDragging || !this.dragStartPos) return;
//
//         // Calculate position in world coordinates based on viewport transform
//         const viewportPosition = this.viewport.position;
//         const viewportScale = this.viewport.scale.x;
//
//         const worldX = (event.globalX - viewportPosition.x) / viewportScale;
//         const worldY = (event.globalY - viewportPosition.y) / viewportScale;
//
//         // Dispatch drag event
//         const dragEvent = new CustomEvent('point-drag', {
//             detail: {
//                 entityId,
//                 shapeId,
//                 pointIndex,
//                 x: worldX,
//                 y: worldY
//             }
//         });
//         this.app.canvas.dispatchEvent(dragEvent);
//     }
//
//     // End point dragging
//     public endDragPoint(
//         entityId: string,
//         shapeId: string,
//         pointIndex: number,
//         event: FederatedPointerEvent
//     ) {
//         if (!this.isDragging) return;
//
//         // Calculate final position
//         const viewportPosition = this.viewport.position;
//         const viewportScale = this.viewport.scale.x;
//
//         const worldX = (event.globalX - viewportPosition.x) / viewportScale;
//         const worldY = (event.globalY - viewportPosition.y) / viewportScale;
//
//         // Reset dragging state
//         this.isDragging = false;
//         this.dragStartPos = null;
//
//         // Dispatch drag end event
//         const dragEndEvent = new CustomEvent('point-drag-end', {
//             detail: {
//                 entityId,
//                 shapeId,
//                 pointIndex,
//                 x: worldX,
//                 y: worldY
//             }
//         });
//         this.app.canvas.dispatchEvent(dragEndEvent);
//     }
//
//     // Handle shape dragging
//     public startDragShape(entityId: string, shapeId: string, event: FederatedPointerEvent) {
//         // First select the shape
//         this.selectShape(entityId, shapeId);
//
//         // Setup dragging
//         this.isDragging = true;
//         this.dragStartPos = { x: event.globalX, y: event.globalY };
//
//         // Dispatch event
//         const dragStartEvent = new CustomEvent('shape-drag-start', {
//             detail: {
//                 entityId,
//                 shapeId,
//                 x: event.globalX,
//                 y: event.globalY
//             }
//         });
//         this.app.canvas.dispatchEvent(dragStartEvent);
//     }
//
//     // Handle deselection (clicking on background)
//     public deselect() {
//         if (this.selectedEntityId || this.selectedShapeId || this.selectedPointIndex !== null) {
//             this.selectedEntityId = null;
//             this.selectedShapeId = null;
//             this.selectedPointIndex = null;
//
//             // Dispatch deselection event
//             const deselectEvent = new CustomEvent('deselect');
//             this.app.canvas.dispatchEvent(deselectEvent);
//         }
//     }
// }
