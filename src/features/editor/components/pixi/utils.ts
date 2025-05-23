// // src/features/editor/components/pixi/utils.ts
//
// /**
//  * Utility functions for PixiJS renderer
//  */
//
// /**
//  * Convert a hex string color to a PIXI.js compatible number
//  * @param hexString Hex color string (e.g., '#3357FF' or '3357FF')
//  * @returns PIXI compatible color number
//  */
// export function hexStringToNumber(hexString: string): number {
//     // Remove # if present
//     const hex = hexString.startsWith('#') ? hexString.substring(1) : hexString;
//
//     // Parse as integer with base 16
//     return parseInt(hex, 16);
// }
//
// /**
//  * Convert PIXI.js color number to hex string
//  * @param colorNumber PIXI color number
//  * @returns Hex color string with # prefix
//  */
// export function numberToHexString(colorNumber: number): string {
//     return `#${colorNumber.toString(16).padStart(6, '0')}`;
// }
//
// /**
//  * Add alpha component to color
//  * @param color Base color number
//  * @param alpha Alpha value (0-1)
//  * @returns Color with alpha as number
//  */
// export function colorWithAlpha(color: number, alpha: number): number {
//     // Convert alpha (0-1) to 0-255 range
//     const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
//
//     // Convert color to hex string, add alpha, convert back to number
//     const colorHex = color.toString(16).padStart(6, '0');
//
//     return parseInt(`${alphaHex}${colorHex}`, 16);
// }
//
// /**
//  * Adjust color brightness
//  * @param color Base color number
//  * @param factor Brightness factor (0-2, where 1 is original color)
//  * @returns Adjusted color as number
//  */
// export function adjustColorBrightness(color: number, factor: number): number {
//     // Extract RGB components
//     const r = (color >> 16) & 0xFF;
//     const g = (color >> 8) & 0xFF;
//     const b = color & 0xFF;
//
//     // Adjust brightness
//     const newR = Math.min(255, Math.round(r * factor));
//     const newG = Math.min(255, Math.round(g * factor));
//     const newB = Math.min(255, Math.round(b * factor));
//
//     // Recombine components
//     return (newR << 16) + (newG << 8) + newB;
// }
//
// /**
//  * Calculate color for selection highlighting
//  * @param baseColor Base color number
//  * @returns Selection highlight color
//  */
// export function getSelectionColor(baseColor: number): number {
//     // For now, use a fixed selection color
//     return 0x00A8E8; // Bright blue
// }
//
// /**
//  * Calculate color for hover highlighting
//  * @param baseColor Base color number
//  * @returns Hover highlight color
//  */
// export function getHoverColor(baseColor: number): number {
//     // For now, use a fixed hover color
//     return baseColor || 0x61DAFB; // Light blue
// }
//
// /**
//  * Apply style to graphics based on selection state
//  * @param graphics Graphics object to style
//  * @param options Styling options
//  */
// export function applyShapeStyle(
//     graphics: any,
//     options: {
//         isSelected: boolean;
//         isHovered: boolean;
//         baseColor: number;
//         fillAlpha?: number;
//         strokeWidth?: number;
//     }
// ): void {
//     const { isSelected, isHovered, baseColor, fillAlpha = 0.2, strokeWidth = 1 } = options;
//
//     // Determine stroke color based on state
//     let strokeColor = baseColor;
//     let actualStrokeWidth = strokeWidth;
//
//     if (isSelected) {
//         strokeColor = getSelectionColor(baseColor);
//         actualStrokeWidth = strokeWidth * 1.5;
//     } else if (isHovered) {
//         strokeColor = getHoverColor(baseColor);
//     }
//
//     graphics.fill({color: baseColor, alpha: fillAlpha})
//         .stroke({width: actualStrokeWidth, color: strokeColor})
// }
//
// /**
//  * Format a number for display (e.g., in metrics)
//  * @param value Number to format
//  * @param decimalPlaces Number of decimal places
//  * @returns Formatted string
//  */
// export function formatNumber(value: number, decimalPlaces = 2): string {
//     return value.toFixed(decimalPlaces);
// }
