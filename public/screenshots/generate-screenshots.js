/**
 * Screenshot Generation Script for PWA
 * 
 * This script generates PNG screenshots from the SVG sources.
 * 
 * Requirements:
 * - Node.js
 * - sharp package: npm install sharp
 * 
 * Usage:
 * node public/screenshots/generate-screenshots.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if sharp is available
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.error('Error: sharp package is not installed.');
  console.error('Please install it with: npm install sharp');
  console.error('\nAlternatively, you can use online tools to convert screenshots to PNG:');
  console.error('1. Open https://svgtopng.com/ or https://cloudconvert.com/svg-to-png');
  console.error('2. Upload public/screenshots/desktop.svg and mobile.svg');
  console.error('3. Convert desktop.svg to 1280x720 PNG → save as desktop.png');
  console.error('4. Convert mobile.svg to 750x1334 PNG → save as mobile.png');
  process.exit(1);
}

const screenshots = [
  { 
    source: 'desktop.svg', 
    output: 'desktop.png',
    width: 1280,
    height: 720,
    description: 'Desktop screenshot (wide form factor)'
  },
  { 
    source: 'mobile.svg', 
    output: 'mobile.png',
    width: 750,
    height: 1334,
    description: 'Mobile screenshot (narrow form factor)'
  }
];

async function generateScreenshots() {
  console.log('Generating PWA screenshots...\n');

  for (const { source, output, width, height, description } of screenshots) {
    try {
      const sourcePath = path.join(__dirname, source);
      const outputPath = path.join(__dirname, output);
      
      const svgBuffer = fs.readFileSync(sourcePath);
      
      await sharp(svgBuffer)
        .resize(width, height)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${output} (${width}x${height})`);
      console.log(`  ${description}`);
    } catch (error) {
      console.error(`✗ Failed to generate ${output}:`, error.message);
    }
  }

  console.log('\n✓ Screenshot generation complete!');
  console.log('\nThese screenshots will be shown when users install the PWA.');
  console.log('You can customize the SVG files to match your actual application UI.');
}

generateScreenshots().catch(console.error);
