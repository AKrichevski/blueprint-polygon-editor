// src/features/editor/utils/svgUtils.ts

// Extract dimensions from SVG
export const getSvgDimensions = (svgString: string): { width: number; height: number } => {
    try {
        // Create a temporary DOM element to parse the SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');

        // Check for parse errors
        const parseError = svgDoc.querySelector('parsererror');
        if (parseError) {
            console.error('SVG parse error:', parseError.textContent);
            return { width: 500, height: 500 };
        }

        const svgElement = svgDoc.documentElement;

        // Try to get width and height from different attributes
        let width: number | string | undefined;
        let height: number | string | undefined;

        // First check explicit width and height attributes
        if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
            width = svgElement.getAttribute('width');
            height = svgElement.getAttribute('height');
        }
        // Then try viewBox
        else if (svgElement.hasAttribute('viewBox')) {
            const viewBox = svgElement.getAttribute('viewBox')?.split(' ');
            if (viewBox && viewBox.length === 4) {
                width = parseFloat(viewBox[2]);
                height = parseFloat(viewBox[3]);
            }
        }

        // Parse values and handle units (px, in, cm, etc.)
        const parseValue = (value: string | number | undefined): number => {
            if (value === undefined) return 500;
            if (typeof value === 'number') return value;

            // Handle percentage (convert to pixels assuming 1000px reference)
            if (value.endsWith('%')) {
                return parseFloat(value) * 10; // 100% = 1000px
            }

            // Handle other units by just extracting the number
            return parseFloat(value) || 500;
        };

        return {
            width: parseValue(width),
            height: parseValue(height)
        };
    } catch (error) {
        console.error('Error parsing SVG:', error);
        return { width: 500, height: 500 }; // Default dimensions if parsing fails
    }
};
