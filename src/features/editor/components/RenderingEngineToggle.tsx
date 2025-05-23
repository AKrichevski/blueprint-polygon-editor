// // src/features/editor/components/RenderingEngineToggle.tsx
// import React from 'react';
// import { classNames, cn } from '../../../styles/theme';
//
// interface RenderingEngineToggleProps {
//     currentEngine: 'konva' | 'pixi';
//     onEngineChange: (engine: 'konva' | 'pixi') => void;
// }
//
// const RenderingEngineToggle: React.FC<RenderingEngineToggleProps> = ({
//                                                                          currentEngine,
//                                                                          onEngineChange
//                                                                      }) => {
//     return (
//         <div className="flex items-center space-x-2 ml-4">
//             <span className="text-sm text-gray-600">Renderer:</span>
//             <div className="relative inline-flex rounded-md shadow-sm">
//                 <button
//                     type="button"
//                     className={cn(
//                         "relative inline-flex items-center px-3 py-1 text-sm font-medium rounded-l-md",
//                         currentEngine === 'konva'
//                             ? "bg-blue-600 text-white"
//                             : "bg-white text-gray-700 hover:bg-gray-50"
//                     )}
//                     onClick={() => onEngineChange('konva')}
//                 >
//                     Konva (Canvas)
//                 </button>
//                 <button
//                     type="button"
//                     className={cn(
//                         "relative -ml-px inline-flex items-center px-3 py-1 text-sm font-medium rounded-r-md",
//                         currentEngine === 'pixi'
//                             ? "bg-blue-600 text-white"
//                             : "bg-white text-gray-700 hover:bg-gray-50"
//                     )}
//                     onClick={() => onEngineChange('pixi')}
//                 >
//                     PixiJS (WebGL)
//                 </button>
//             </div>
//         </div>
//     );
// };
//
// export default RenderingEngineToggle;
