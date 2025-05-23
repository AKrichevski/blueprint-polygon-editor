// // src/features/editor/components/PerformanceTestPanel.tsx
// import React, { useState, useCallback } from 'react';
// import { useEditor } from '../../../contexts/editor';
// import { generateSizedTestData, measurePerformance} from '../../../utils/performanceTest';
// import { cn } from '../../../styles/theme';
// import type {PerformanceResults} from "./pixi";
//
// interface PerformanceTestPanelProps {
//     currentRenderingEngine: 'konva' | 'pixi';
//     onRenderingEngineChange: (engine: 'konva' | 'pixi') => void;
// }
//
// /**
//  * PerformanceTestPanel - Component for running performance tests
//  * Compares Konva vs PixiJS rendering performance with various dataset sizes
//  */
// const PerformanceTestPanel: React.FC<PerformanceTestPanelProps> = ({
//                                                                        currentRenderingEngine,
//                                                                        onRenderingEngineChange
//                                                                    }) => {
//     const { dispatch } = useEditor();
//     const [isTesting, setIsTesting] = useState(false);
//     const [results, setResults] = useState<PerformanceResults[]>([]);
//     const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'>('medium');
//
//     // Sizes with approximate shape counts
//     const sizes = [
//         { value: 'small', label: 'Small', count: '~50 shapes' },
//         { value: 'medium', label: 'Medium', count: '~300 shapes' },
//         { value: 'large', label: 'Large', count: '~1,000 shapes' },
//         { value: 'xlarge', label: 'X-Large', count: '~5,000 shapes' },
//         { value: 'xxlarge', label: 'XX-Large', count: '~10,000 shapes' }
//     ];
//
//     // Handle running test
//     const runTest = useCallback(async () => {
//         setIsTesting(true);
//
//         // Generate test data
//         const testData = generateSizedTestData(selectedSize);
//
//         // Load the test data
//         dispatch({
//             type: 'SET_ENTITIES',
//             payload: testData
//         });
//
//         // Wait for rendering to stabilize
//         await new Promise(resolve => setTimeout(resolve, 500));
//
//         // Run test for current engine
//         measurePerformance(
//             currentRenderingEngine,
//             selectedSize,
//             (result) => {
//                 setResults(prev => [...prev, result]);
//                 setIsTesting(false);
//             }
//         );
//     }, [currentRenderingEngine, selectedSize, dispatch]);
//
//     // Run test for both engines
//     const runComparison = useCallback(async () => {
//         setIsTesting(true);
//
//         // Generate test data
//         const testData = generateSizedTestData(selectedSize);
//
//         // Run test for Konva
//         onRenderingEngineChange('konva');
//
//         // Load the test data
//         dispatch({
//             type: 'SET_ENTITIES',
//             payload: testData
//         });
//
//         // Wait for rendering to stabilize
//         await new Promise(resolve => setTimeout(resolve, 1000));
//
//         // Run test for Konva
//         measurePerformance(
//             'konva',
//             selectedSize,
//             async (konvaResult) => {
//                 setResults(prev => [...prev, konvaResult]);
//
//                 // Run test for PixiJS
//                 onRenderingEngineChange('pixi');
//
//                 // Wait for rendering to stabilize
//                 await new Promise(resolve => setTimeout(resolve, 1000));
//
//                 measurePerformance(
//                     'pixi',
//                     selectedSize,
//                     (pixiResult) => {
//                         setResults(prev => [...prev, pixiResult]);
//                         setIsTesting(false);
//                     }
//                 );
//             }
//         );
//     }, [selectedSize, dispatch, onRenderingEngineChange]);
//
//     // Clear results
//     const clearResults = useCallback(() => {
//         setResults([]);
//     }, []);
//
//     return (
//         <div className="bg-white rounded-lg shadow p-4">
//             <h2 className="text-lg font-semibold mb-4">Performance Testing</h2>
//
//             <div className="space-y-4">
//                 {/* Dataset size selection */}
//                 <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Test Dataset Size
//                     </label>
//                     <select
//                         className="w-full px-3 py-2 border border-gray-300 rounded"
//                         value={selectedSize}
//                         onChange={(e) => setSelectedSize(e.target.value as any)}
//                         disabled={isTesting}
//                     >
//                         {sizes.map(size => (
//                             <option key={size.value} value={size.value}>
//                                 {size.label} ({size.count})
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//
//                 {/* Test buttons */}
//                 <div className="flex flex-col space-y-2">
//                     <button
//                         className={cn(
//                             "px-4 py-2 rounded text-white font-medium",
//                             isTesting
//                                 ? "bg-blue-300 cursor-not-allowed"
//                                 : "bg-blue-500 hover:bg-blue-600"
//                         )}
//                         onClick={runTest}
//                         disabled={isTesting}
//                     >
//                         {isTesting ? "Testing..." : `Test ${currentRenderingEngine.toUpperCase()} Performance`}
//                     </button>
//
//                     <button
//                         className={cn(
//                             "px-4 py-2 rounded text-white font-medium",
//                             isTesting
//                                 ? "bg-purple-300 cursor-not-allowed"
//                                 : "bg-purple-600 hover:bg-purple-700"
//                         )}
//                         onClick={runComparison}
//                         disabled={isTesting}
//                     >
//                         Run Comparison (Both Engines)
//                     </button>
//                 </div>
//
//                 {/* Test results */}
//                 {results.length > 0 && (
//                     <div className="mt-4">
//                         <div className="flex justify-between items-center mb-2">
//                             <h3 className="text-md font-medium">Results</h3>
//                             <button
//                                 className="text-sm text-red-500 hover:text-red-700"
//                                 onClick={clearResults}
//                             >
//                                 Clear Results
//                             </button>
//                         </div>
//
//                         <div className="overflow-x-auto">
//                             <table className="min-w-full divide-y divide-gray-200">
//                                 <thead className="bg-gray-50">
//                                 <tr>
//                                     <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                         Engine
//                                     </th>
//                                     <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                         Size
//                                     </th>
//                                     <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                         FPS
//                                     </th>
//                                     <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                         Avg Frame (ms)
//                                     </th>
//                                     <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                         Min/Max (ms)
//                                     </th>
//                                 </tr>
//                                 </thead>
//                                 <tbody className="bg-white divide-y divide-gray-200">
//                                 {results.map((result, index) => (
//                                     <tr key={index} className={result.engine === 'pixi' ? 'bg-blue-50' : ''}>
//                                         <td className="px-3 py-2 whitespace-nowrap text-sm">
//                                             <span className={`font-medium ${result.engine === 'pixi' ? 'text-blue-700' : 'text-gray-700'}`}>
//                                               {result.engine === 'pixi' ? 'PixiJS (WebGL)' : 'Konva (Canvas)'}
//                                             </span>
//                                         </td>
//                                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
//                                             {result.dataSize}
//                                         </td>
//                                         <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
//                                             {result.fps}
//                                             <span className="text-xs ml-1 text-gray-500">fps</span>
//                                         </td>
//                                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
//                                             {result.averageFrameTime}
//                                             <span className="text-xs ml-1">ms</span>
//                                         </td>
//                                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
//                                             {result.minFrameTime} / {result.maxFrameTime}
//                                             <span className="text-xs ml-1">ms</span>
//                                         </td>
//                                     </tr>
//                                 ))}
//                                 </tbody>
//                             </table>
//                         </div>
//
//                         {/* Performance analysis */}
//                         {results.length >= 2 && (
//                             <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
//                                 <h4 className="font-medium mb-1">Analysis</h4>
//                                 {renderPerformanceComparison(results)}
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };
//
// /**
//  * Render performance comparison analysis
//  */
// function renderPerformanceComparison(results: PerformanceResults[]): React.ReactNode {
//     // Find most recent Konva and PixiJS results
//     const konvaResults = results.filter(r => r.engine === 'konva').slice(-1)[0];
//     const pixiResults = results.filter(r => r.engine === 'pixi').slice(-1)[0];
//
//     // If we don't have both, show a message
//     if (!konvaResults || !pixiResults) {
//         return (
//             <p>Run tests on both engines to see comparison.</p>
//         );
//     }
//
//     // Calculate improvement percentages
//     const konvaFps = parseFloat(konvaResults.fps);
//     const pixiFps = parseFloat(pixiResults.fps);
//     const konvaFrameTime = parseFloat(konvaResults.averageFrameTime);
//     const pixiFrameTime = parseFloat(pixiResults.averageFrameTime);
//
//     const fpsImprovement = ((pixiFps - konvaFps) / konvaFps) * 100;
//     const frameTimeImprovement = ((konvaFrameTime - pixiFrameTime) / konvaFrameTime) * 100;
//
//     // Determine performance difference text
//     let performanceText: string;
//     if (fpsImprovement > 200) {
//         performanceText = 'dramatically faster';
//     } else if (fpsImprovement > 100) {
//         performanceText = 'more than twice as fast';
//     } else if (fpsImprovement > 50) {
//         performanceText = 'significantly faster';
//     } else if (fpsImprovement > 20) {
//         performanceText = 'noticeably faster';
//     } else if (fpsImprovement > 10) {
//         performanceText = 'somewhat faster';
//     } else if (fpsImprovement > 0) {
//         performanceText = 'slightly faster';
//     } else {
//         performanceText = 'slower';
//     }
//
//     return (
//         <div>
//             <p>
//                 With this dataset ({pixiResults.dataSize}), <strong>PixiJS (WebGL)</strong> rendering is{' '}
//                 <span className={fpsImprovement > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
//                     {performanceText}
//                 </span>{' '}
//                 than Konva (Canvas).
//             </p>
//
//             <ul className="list-disc ml-5 mt-2 space-y-1">
//                 <li>
//                     <strong>FPS Improvement:</strong>{' '}
//                     <span className={fpsImprovement > 0 ? 'text-green-600' : 'text-red-600'}>
//                         {fpsImprovement > 0 ? '+' : ''}{fpsImprovement.toFixed(1)}%
//                     </span>{' '}
//                     ({konvaFps.toFixed(1)} → {pixiFps.toFixed(1)} FPS)
//                 </li>
//                 <li>
//                     <strong>Frame Time Reduction:</strong>{' '}
//                     <span className={frameTimeImprovement > 0 ? 'text-green-600' : 'text-red-600'}>
//                         {frameTimeImprovement > 0 ? '-' : '+'}
//                         {Math.abs(frameTimeImprovement).toFixed(1)}%
//                     </span>{' '}
//                     ({konvaFrameTime}ms → {pixiFrameTime}ms)
//                 </li>
//             </ul>
//
//             <p className="mt-2 text-xs text-gray-500">
//                 {fpsImprovement > 50
//                     ? "The WebGL rendering shows substantial performance improvements, especially recommended for large datasets."
//                     : fpsImprovement > 10
//                         ? "WebGL rendering shows some performance advantages, more noticeable with larger datasets."
//                         : "Performance differences are minimal with this dataset size. Try a larger dataset to see more significant differences."
//                 }
//             </p>
//         </div>
//     );
// }
//
// export default PerformanceTestPanel;
