/**
 * Icon Generation Script for PWA
 * 
 * This script generates PNG icons from the SVG source.
 * 
 * Requirements:
 * - Node.js
 * - sharp package: npm install sharp
 * 
 * Usage:
 * node public/icons/generate-icons.js
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
  console.error('\nAlternatively, you can use online tools to convert icon.svg to PNG:');
  console.error('1. Open https://svgtopng.com/ or https://cloudconvert.com/svg-to-png');
  console.error('2. Upload public/icons/icon.svg');
  console.error('3. Generate 192x192 and 512x512 PNG versions');
  console.error('4. Save as icon-192x192.png and icon-512x512.png in public/icons/');
  process.exit(1);
}

const iconSizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' }
];

const svgPath = path.join(__dirname, 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generateIcons() {
  console.log('Generating PWA icons...\n');

  for (const { size, name } of iconSizes) {
    try {
      const outputPath = path.join(__dirname, name);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('\n✓ Icon generation complete!');
  console.log('\nGenerated icons are optimized for maskable icons (safe zone included).');
  console.log('You can test them at: https://maskable.app/editor');
}

generateIcons().catch(console.error);
