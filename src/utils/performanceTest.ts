// // src/utils/performanceTest.ts
// // import { Entity, Point, GeometricShape } from '../types';
// import { v4 as uuidv4 } from 'uuid';
// import type {Entity, GeometricShape} from "../types";
// import type {PerformanceResults} from "../features/editor/components/pixi";
//
// /**
//  * Utility to generate test data for performance benchmarking
//  * This helps compare Konva vs PixiJS rendering performance
//  */
//
// // Shape generation options
// interface GenerateOptions {
//     /**
//      * Number of entities to generate
//      */
//     entityCount: number;
//
//     /**
//      * Shapes per entity (min/max range)
//      */
//     shapesPerEntity: [number, number];
//
//     /**
//      * Points per polygon (min/max range)
//      */
//     pointsPerPolygon: [number, number];
//
//     /**
//      * Area bounds for shape generation
//      */
//     bounds: {
//         minX: number;
//         minY: number;
//         maxX: number;
//         maxY: number;
//     };
//
//     /**
//      * Distribution of shape types
//      * Values should sum to 1.0
//      */
//     shapeDistribution: {
//         polygon: number;
//         rectangle: number;
//         circle: number;
//         ellipse: number;
//         line: number;
//         arc: number;
//         point: number;
//         text: number;
//     };
// }
//
// // Default shape colors for entities
// const ENTITY_COLORS = [
//     '#FF5733', // Coral
//     '#33FF57', // Green
//     '#3357FF', // Blue
//     '#F3FF33', // Yellow
//     '#FF33F3', // Pink
//     '#33FFF7', // Cyan
//     '#FF9933', // Orange
//     '#9933FF', // Purple
// ];
//
// // Default test data options
// const DEFAULT_OPTIONS: GenerateOptions = {
//     entityCount: 5,
//     shapesPerEntity: [10, 20],
//     pointsPerPolygon: [4, 8],
//     bounds: {
//         minX: 0,
//         minY: 0,
//         maxX: 3000,
//         maxY: 3000,
//     },
//     shapeDistribution: {
//         polygon: 0.4,
//         rectangle: 0.2,
//         circle: 0.1,
//         ellipse: 0.05,
//         line: 0.1,
//         arc: 0.05,
//         point: 0.05,
//         text: 0.05,
//     },
// };
//
// /**
//  * Generate a random integer between min and max (inclusive)
//  */
// function randomInt(min: number, max: number): number {
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }
//
// /**
//  * Generate a random point within the specified bounds
//  */
// function generateRandomPoint(bounds: GenerateOptions['bounds']){
//     return {
//         x: randomInt(bounds.minX, bounds.maxX),
//         y: randomInt(bounds.minY, bounds.maxY),
//     };
// }
//
// /**
//  * Generate a random polygon with the specified number of points
//  */
// function generatePolygon(
//     pointCount: number,
//     bounds: GenerateOptions['bounds'],
//     entityId: string
// ) {
//     const centerX = randomInt(bounds.minX + 100, bounds.maxX - 100);
//     const centerY = randomInt(bounds.minY + 100, bounds.maxY - 100);
//     const radius = randomInt(30, 100);
//
//     // Generate points in a roughly circular pattern
//     const points = [];
//     for (let i = 0; i < pointCount; i++) {
//         const angle = (i / pointCount) * Math.PI * 2;
//         // Add some randomness to make it less regular
//         const r = radius * (0.7 + Math.random() * 0.6);
//         const x = centerX + Math.cos(angle) * r;
//         const y = centerY + Math.sin(angle) * r;
//         points.push({ x, y });
//     }
//
//     return {
//         id: uuidv4(),
//         entityType: entityId,
//         subType: 'test',
//         shapeType: 'polygon',
//         points,
//         style: {
//             strokeColor: '#000000',
//             strokeWidth: 1,
//             fillColor: '#00000033'
//         }
//     };
// }
//
// /**
//  * Generate a rectangle shape
//  */
// function generateRectangle(bounds: GenerateOptions['bounds'], entityId: string) {
//     const width = randomInt(30, 150);
//     const height = randomInt(30, 150);
//     const x = randomInt(bounds.minX, bounds.maxX - width);
//     const y = randomInt(bounds.minY, bounds.maxY - height);
//
//     return {
//         id: uuidv4(),
//         entityType: entityId,
//         subType: 'test',
//         shapeType: 'rectangle',
//         points: [
//             { x, y },
//             { x: x + width, y },
//             { x: x + width, y: y + height },
//             { x, y: y + height }
//         ],
//         style: {
//             strokeColor: '#000000',
//             strokeWidth: 1,
//             fillColor: '#00000033'
//         }
//     };
// }
//
// /**
//  * Generate a circle shape
//  */
// function generateCircle(bounds: GenerateOptions['bounds'], entityId: string): GeometricShape {
//     const radius = randomInt(10, 50);
//     const center = {
//         x: randomInt(bounds.minX + radius, bounds.maxX - radius),
//         y: randomInt(bounds.minY + radius, bounds.maxY - radius)
//     };
//
//     return {
//         id: uuidv4(),
//         entityType: entityId,
//         subType: 'test',
//         shapeType: 'circle',
//         center,
//         radius,
//         style: {
//             strokeColor: '#000000',
//             strokeWidth: 1,
//             fillColor: '#00000033'
//         }
//     };
// }
//
// /**
//  * Generate an ellipse shape
//  */
// function generateEllipse(bounds: GenerateOptions['bounds'], entityId: string): GeometricShape {
//     const radiusX = randomInt(15, 75);
//     const radiusY = randomInt(15, 75);
//     const center = {
//         x: randomInt(bounds.minX + radiusX, bounds.maxX - radiusX),
//         y: randomInt(bounds.minY + radiusY, bounds.maxY - radiusY)
//     };
//     const rotation = randomInt(0, 359);
//
//     return {
//         id: uuidv4(),
//         entityType: entityId,
//         subType: 'test',
//         shapeType: 'ellipse',
//         center,
//         radiusX,
//         radiusY,
//         rotation,
//         style: {
//             strokeColor: '#000000',
//             strokeWidth: 1,
//             fillColor: '#00000033'
//         }
//     };
// }
//
// /**
//  * Generate a line shape
//  */
// function generateLine(bounds: GenerateOptions['bounds'], entityId: string): GeometricShape {
//     const startX = randomInt(bounds.minX, bounds.maxX);
//     const startY = randomInt(bounds.minY, bounds.maxY);
//     const endX = startX + randomInt(-100, 100);
//     const endY = startY + randomInt(-100, 100);
//
//     return {
//         id: uuidv4(),
//         entityType: entityId,
//         subType: 'test',
//         shapeType: 'line',
//         points: [
//             { x: startX, y: startY },
//             { x: endX, y: endY }
//         ],
//         style: {
//             strokeColor: '#000000',
//             strokeWidth: 1
//         }
//     };
// }
//
// /**
//  * Generate an arc shape
//  */
// function generateArc(bounds: GenerateOptions['bounds'], entityId: string): GeometricShape {
//     const radius = randomInt(20, 80);
//     const center = {
//         x: randomInt(bounds.minX + radius, bounds.maxX - radius),
//         y: randomInt(bounds.minY + radius, bounds.maxY - radius)
//     };
//     const startAngle = randomInt(0, 270);
//     const endAngle = startAngle + randomInt(10, 359 - startAngle);
//
//     return {
//         id: uuidv4(),
//         entityType: entityId,
//         subType: 'test',
//         shapeType: 'arc',
//         center,
//         radius,
//         startAngle,
//         endAngle,
//         style: {
//             strokeColor: '#000000',
//             strokeWidth: 1,
//             fillColor: '#00000033'
//         }
//     };
// }
//
// /**
//  * Generate a point shape
//  */
// function generatePoint(bounds: GenerateOptions['bounds'], entityId: string): GeometricShape {
//     const point = generateRandomPoint(bounds);
//
//     return {
//         id: uuidv4(),
//         entityType: entityId,
//         subType: 'test',
//         shapeType: 'point',
//         point,
//         style: {
//             radius: randomInt(3, 6),
//             fillColor: '#000000',
//             strokeColor: '#FFFFFF'
//         }
//     };
// }
//
// /**
//  * Generate a text shape
//  */
// function generateText(bounds: GenerateOptions['bounds'], entityId: string): GeometricShape {
//     const position = generateRandomPoint(bounds);
//     const words = ['Room', 'Area', 'Space', 'Wall', 'Window', 'Door', 'Kitchen', 'Bathroom', 'Office'];
//     const text = words[randomInt(0, words.length - 1)] + ' ' + randomInt(1, 999);
//
//     return {
//         id: uuidv4(),
//         entityType: entityId,
//         subType: 'test',
//         shapeType: 'text',
//         position,
//         text,
//         style: {
//             fontSize: randomInt(10, 16),
//             fontFamily: 'Arial',
//             color: '#000000',
//             align: 'left'
//         }
//     };
// }
//
// /**
//  * Generate a test JSON dataset with the specified options
//  */
// export function generateTestData(options: Partial<GenerateOptions> = {}): Record<string, Entity> {
//     const opts = { ...DEFAULT_OPTIONS, ...options };
//     const entities: Record<string, Entity> = {};
//
//     // Generate entities
//     for (let e = 0; e < opts.entityCount; e++) {
//         const entityId = `entity-${e + 1}`;
//         const colorIndex = e % ENTITY_COLORS.length;
//
//         // Create entity
//         entities[entityId] = {
//             id: entityId,
//             metaData: {
//                 entityName: `Test Entity ${e + 1}`,
//                 altText: `A test entity for performance benchmarking`,
//                 fontColor: ENTITY_COLORS[colorIndex]
//             },
//             shapes: {},
//             visible: true
//         };
//
//         // Determine shapes per entity
//         const shapeCount = randomInt(opts.shapesPerEntity[0], opts.shapesPerEntity[1]);
//
//         // Generate shapes for this entity
//         for (let s = 0; s < shapeCount; s++) {
//             // Determine shape type based on distribution
//             const rand = Math.random();
//             let shapeType: string = 'polygon';
//             let cumulativeProbability = 0;
//
//             for (const [type, probability] of Object.entries(opts.shapeDistribution)) {
//                 cumulativeProbability += probability;
//                 if (rand <= cumulativeProbability) {
//                     shapeType = type;
//                     break;
//                 }
//             }
//
//             // Generate shape based on type
//             let shape;
//             switch (shapeType) {
//                 case 'polygon':
//                     const pointCount = randomInt(opts.pointsPerPolygon[0], opts.pointsPerPolygon[1]);
//                     shape = generatePolygon(pointCount, opts.bounds, entityId);
//                     break;
//                 case 'rectangle':
//                     shape = generateRectangle(opts.bounds, entityId);
//                     break;
//                 case 'circle':
//                     shape = generateCircle(opts.bounds, entityId);
//                     break;
//                 case 'ellipse':
//                     shape = generateEllipse(opts.bounds, entityId);
//                     break;
//                 case 'line':
//                     shape = generateLine(opts.bounds, entityId);
//                     break;
//                 case 'arc':
//                     shape = generateArc(opts.bounds, entityId);
//                     break;
//                 case 'point':
//                     shape = generatePoint(opts.bounds, entityId);
//                     break;
//                 case 'text':
//                     shape = generateText(opts.bounds, entityId);
//                     break;
//                 default:
//                     shape = generatePolygon(4, opts.bounds, entityId);
//             }
//
//             // Add shape to entity
//             entities[entityId].shapes[shape.id] = shape;
//         }
//     }
//
//     return entities;
// }
//
// /**
//  * Generate test data with defined size categories
//  */
// export function generateSizedTestData(size: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'): Record<string, Entity> {
//     const sizeOptions: Record<string, Partial<GenerateOptions>> = {
//         small: {
//             entityCount: 5,
//             shapesPerEntity: [5, 10],
//             // Total: ~25-50 shapes
//         },
//         medium: {
//             entityCount: 10,
//             shapesPerEntity: [20, 30],
//             // Total: ~200-300 shapes
//         },
//         large: {
//             entityCount: 20,
//             shapesPerEntity: [50, 70],
//             // Total: ~1,000-1,400 shapes
//         },
//         xlarge: {
//             entityCount: 30,
//             shapesPerEntity: [100, 200],
//             // Total: ~3,000-6,000 shapes
//         },
//         xxlarge: {
//             entityCount: 50,
//             shapesPerEntity: [200, 300],
//             // Total: ~10,000-15,000 shapes
//         }
//     };
//
//     return generateTestData(sizeOptions[size]);
// }
//
// /**
//  * Measure rendering performance
//  */
// export function measurePerformance(
//     renderingEngine: 'konva' | 'pixi',
//     dataSize: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge',
//     callback: (results: PerformanceResults) => void
// ) {
//     // Start measuring
//     const startTime = performance.now();
//     let framesRendered = 0;
//     let frameTimeSum = 0;
//     let minFrameTime = Infinity;
//     let maxFrameTime = 0;
//     let lastFrameTime = performance.now();
//
//     // Set up frame measurement
//     const frameAnalyzer = () => {
//         const now = performance.now();
//         const frameTime = now - lastFrameTime;
//         lastFrameTime = now;
//
//         // Skip first frame
//         if (framesRendered > 0) {
//             frameTimeSum += frameTime;
//             minFrameTime = Math.min(minFrameTime, frameTime);
//             maxFrameTime = Math.max(maxFrameTime, frameTime);
//         }
//
//         framesRendered++;
//
//         // Stop after 100 frames or 10 seconds
//         if (framesRendered < 100 && (now - startTime) < 10000) {
//             requestAnimationFrame(frameAnalyzer);
//         } else {
//             // Calculate results
//             const avg = frameTimeSum / (framesRendered - 1); // Skip first frame
//             const fps = 1000 / avg;
//
//             const results: PerformanceResults = {
//                 engine: renderingEngine,
//                 dataSize,
//                 totalTime: now - startTime,
//                 frames: framesRendered - 1, // Skip first frame
//                 averageFrameTime: avg.toFixed(2),
//                 minFrameTime: minFrameTime.toFixed(2),
//                 maxFrameTime: maxFrameTime.toFixed(2),
//                 fps: fps.toFixed(1),
//                 timestamp: new Date().toISOString()
//             };
//
//             callback(results);
//         }
//     };
//
//     // Start measuring
//     requestAnimationFrame(frameAnalyzer);
// }
//
//
