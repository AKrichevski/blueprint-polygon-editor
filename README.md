# Blueprint Polygon Editor

A React-based web application for visualizing, creating, and manipulating geometric shapes on architectural blueprints. This tool provides an interactive canvas for shape editing with support for multiple shape types including polygons, circles, lines, arcs, ellipses, points, rectangles, and text annotations.

## Features

### Core Functionality
- **Interactive Canvas**: Pan, zoom, and manipulate shapes with smooth performance
- **Multi-Shape Support**: Work with 8 different shape types:
    - Polygons (custom shapes with 3+ points)
    - Rectangles (four-sided shapes)
    - Circles (perfect circles)
    - Ellipses (oval shapes with rotation support)
    - Lines (straight line segments)
    - Arcs (circular segments with start/end angles)
    - Points (individual coordinate markers)
    - Text (annotations with styling options)

### Shape Management
- **Entity-Based Organization**: Group shapes into logical entities (rooms, walls, areas, etc.)
- **Real-Time Editing**: Drag points, add/remove vertices, and modify shape properties
- **Multi-Selection**: Select and manipulate multiple shapes simultaneously
- **Context Menus**: Right-click actions for duplicate, delete, and move operations
- **Layer Visibility**: Show/hide entire entities or individual shapes

### Advanced Features
- **SVG Background Support**: Upload blueprint images as canvas backgrounds
- **Import/Export**: Save and load projects with full shape data preservation
- **Keyboard Shortcuts**: Efficient workflow with customizable hotkeys
- **Performance Optimization**: Viewport culling and spatial indexing for large datasets
- **Responsive Design**: Works on desktop and tablet devices

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Canvas Rendering**: Konva.js with react-konva for 2D graphics
- **Styling**: Tailwind CSS with custom theme system
- **State Management**: React Context API with optimized reducers
- **Build Tool**: Vite for fast development and building
- **Icons**: React Icons and Material-UI Icons

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blueprint-polygon-editor
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## Usage Guide

### Basic Workflow

1. **Create an Entity**: Start by adding a new entity (e.g., "Living Room", "Walls")
2. **Select Shape Tool**: Choose from polygon, rectangle, circle, or other shape tools
3. **Draw Shapes**: Click on the canvas to create shapes
4. **Edit Shapes**:
    - Select shapes to see control points
    - Drag points to reshape
    - Use "Add Point" mode to insert new vertices
    - Use "Delete Point" mode to remove vertices
5. **Organize**: Group related shapes into entities for better organization

### Keyboard Shortcuts

- `S` - Switch to Select mode
- `A` - Add Polygon mode
- `P` - Add Point mode (when shape is selected)
- `D` - Delete Point mode (when shape is selected)
- `Ctrl+A` - Select all shapes in current entity
- `Delete` - Delete selected shapes or points
- `Ctrl+C` - Duplicate selected shapes
- `Esc` - Clear selection or cancel current operation
- `+/-` - Zoom in/out
- `0` - Reset zoom and position
- `F` - Focus on selected shape

### Shape Types and Properties

Each shape type has specific properties that can be edited:

- **Polygons/Rectangles**: Points, stroke color, fill color, stroke width
- **Circles**: Center position, radius, colors
- **Ellipses**: Center, horizontal/vertical radius, rotation, colors
- **Lines**: Start/end points, stroke properties, dash patterns
- **Arcs**: Center, radius, start/end angles, colors
- **Points**: Position, radius, colors
- **Text**: Position, content, font properties, alignment

### Data Format

The application uses a structured JSON format for data:

```json
{
  "entities": {
    "entity-id": {
      "id": "entity-id",
      "metaData": {
        "entityName": "Living Room",
        "altText": "Main living area",
        "fontColor": "#3357FF"
      },
      "shapes": {
        "shape-id": {
          "id": "shape-id",
          "shapeType": "polygon",
          "points": [
            {"x": 100, "y": 100},
            {"x": 200, "y": 100},
            {"x": 200, "y": 200},
            {"x": 100, "y": 200}
          ],
          "style": {
            "strokeColor": "#000000",
            "fillColor": "#FF000033",
            "strokeWidth": 2
          }
        }
      },
      "visible": true
    }
  },
  "svgBackground": null
}
```

## Project Structure

```
src/
├── app/                    # Application setup and configuration
├── components/             # Reusable UI components
│   ├── Button/            # Button component with variants
│   ├── Modal/             # Modal dialog component
│   └── ...
├── features/              # Feature-specific modules
│   └── editor/            # Main editor functionality
│       ├── components/    # Editor-specific components
│       ├── hooks/         # Custom hooks for editor logic
│       ├── state/         # State management
│       ├── types/         # TypeScript interfaces
│       └── utils/         # Utility functions
├── hooks/                 # Global custom hooks
├── contexts/              # React context providers
├── types/                 # Global TypeScript types
├── utils/                 # Global utility functions
├── styles/                # Theme and styling configuration
└── consts/                # Application constants
```

### Key Components

- **EditorPage**: Main application container
- **CanvasView**: Interactive canvas with shape rendering
- **EntityList**: Entity management sidebar
- **ShapeDrawingTools**: Shape creation tools
- **ShapePropertiesEditor**: Property editing panel
- **ImportExportTool**: Data persistence functionality

## Performance Features

- **Viewport Culling**: Only renders shapes visible in the current view
- **Spatial Indexing**: Efficient hit detection and collision detection
- **Optimized Rendering**: Memoized components and selective re-renders
- **Bounding Box Caching**: Pre-calculated boundaries for fast interactions
- **Batched Updates**: Groups similar operations for better performance

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Quality

The project includes:
- TypeScript for type safety
- ESLint for code quality
- Prettier configuration
- Strict mode enabled
- Performance optimizations

## Browser Compatibility

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

This project is for educational purposes. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Limitations

- Canvas rendering may slow down with extremely large datasets (10,000+ shapes)
- SVG backgrounds should be optimized for web (< 5MB recommended)
- Browser storage limitations apply to auto-save functionality
- No server-side persistence (local storage only)

## Troubleshooting

### Common Issues

1. **Shapes not rendering**: Check browser console for errors, ensure valid JSON data
2. **Performance issues**: Reduce number of visible shapes, disable metrics display
3. **Import/Export failures**: Verify JSON format matches expected structure
4. **Canvas interactions not working**: Check if shapes are properly selected and in correct mode

### Performance Tips

- Use entity visibility to hide unnecessary shapes
- Keep SVG backgrounds under 5MB
- Avoid having too many complex shapes visible simultaneously
- Use the metrics toggle to monitor performance

## License

This project is intended for **educational and personal use only**. It is **NOT licensed for commercial use**.

The code is provided as-is for learning purposes, demonstrations, and personal projects. Any commercial use, redistribution for profit, or incorporation into commercial products is strictly prohibited.

## Acknowledgments

- Built with React 19 and modern web technologies
- Canvas rendering powered by Konva.js
- UI components styled with Tailwind CSS
- Icons from React Icons and Material-UI
- Inspired by architectural blueprint editing workflows

---

For questions or issues, please refer to the project documentation or create an issue in the repository.
