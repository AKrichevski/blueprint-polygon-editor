import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Emulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dirs = [
    'src/app',
    'src/components/Button',
    'src/components/Input',
    'src/components/Modal',
    'src/components/Label',
    'src/features/editor/components',
    'src/features/editor/hooks',
    'src/features/editor/state',
    'src/features/editor/types',
    'src/features/editor/utils',
    'src/hooks',
    'src/contexts',
    'src/services',
    'src/types',
    'src/utils',
    'src/assets',
    'src/styles',
];

// Create directories
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
});

// Create basic mock data file
const mockDataContent = `export const mockEntities = [
  {
    "id": "entity-1",
    "name": "Apartment Unit A",
    "description": "Main living area and kitchen.",
    "polygons": [
      {
        "id": "poly-1-1",
        "points": [
          { "x": 50, "y": 50 },
          { "x": 150, "y": 50 },
          { "x": 150, "y": 150 },
          { "x": 50, "y": 150 }
        ]
      },
      {
        "id": "poly-1-2",
        "points": [
          { "x": 200, "y": 100 },
          { "x": 250, "y": 100 },
          { "x": 280, "y": 150 },
          { "x": 250, "y": 180 },
          { "x": 180, "y": 160 }
        ]
      }
    ]
  },
  {
    "id": "entity-2",
    "name": "Bedroom Suite",
    "description": "Master bedroom and bathroom.",
    "polygons": [
      {
        "id": "poly-2-1",
        "points": [
          { "x": 300, "y": 200 },
          { "x": 400, "y": 200 },
          { "x": 400, "y": 300 },
          { "x": 350, "y": 320 },
          { "x": 300, "y": 300 }
        ]
      }
    ]
  }
];
`;

const mockDataPath = path.join(__dirname, 'src/services/mockData.ts');
fs.writeFileSync(mockDataPath, mockDataContent);
console.log('Created mock data file');

console.log('Project structure setup complete!');
