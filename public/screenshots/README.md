# PWA Screenshots Directory

This directory contains screenshots for the PWA installation prompt. Screenshots help users understand what the app looks like before installing it.

## Required Screenshots

The PWA requires the following screenshots:

- **desktop.png** - 1280x720 pixels (wide form factor)
- **mobile.png** - 750x1334 pixels (narrow form factor)

## Current Status

✓ **desktop.svg** - Source SVG for desktop screenshot
✓ **mobile.svg** - Source SVG for mobile screenshot
✓ **generate-screenshots.js** - Script to generate PNG screenshots from SVG

## Generating Screenshots

### Option 1: Using Node.js (Recommended)

```bash
# Install sharp package (if not already installed)
npm install --save-dev sharp

# Run the generation script
node public/screenshots/generate-screenshots.js
```

This will automatically generate both required PNG files.

### Option 2: Use Online Tools (No installation required)

1. **Go to an SVG to PNG converter:**
   - https://svgtopng.com/
   - https://cloudconvert.com/svg-to-png
   - https://convertio.co/svg-png/

2. **Convert desktop screenshot:**
   - Upload `desktop.svg`
   - Set width: 1280 pixels
   - Set height: 720 pixels
   - Download and save as `desktop.png`

3. **Convert mobile screenshot:**
   - Upload `mobile.svg`
   - Set width: 750 pixels
   - Set height: 1334 pixels
   - Download and save as `mobile.png`

### Option 3: Capture Real Screenshots (Best for Production)

For the best user experience, use actual application screenshots:

**Desktop Screenshot (1280x720):**
1. Open the application in a browser
2. Set viewport to 1280x720 (use DevTools)
3. Navigate to a representative page (dashboard, publications list)
4. Take a screenshot using:
   - Browser DevTools screenshot feature
   - OS screenshot tool (crop to exact size)
   - Screenshot extensions

**Mobile Screenshot (750x1334):**
1. Open the application in mobile view
2. Set viewport to 750x1334 (use DevTools device emulation)
3. Navigate to a mobile-optimized page
4. Take a screenshot using the same methods

**Tips for real screenshots:**
- Show the app with realistic content (not test data)
- Highlight key features (optimistic updates, offline mode)
- Ensure good lighting and contrast
- Remove any sensitive information
- Use PNG format for best quality

## Customizing SVG Screenshots

The provided SVG files are placeholders showing a generic content management interface. To customize them:

1. **Edit the SVG files** with any text editor or SVG editor
2. **Update colors** to match your brand (currently using #4F46E5 theme color)
3. **Change content** to reflect your actual UI
4. **Add your logo** or branding elements
5. **Regenerate PNG files** using one of the methods above

### SVG Editing Tools:
- **Figma** (recommended) - Import SVG, edit, export
- **Adobe Illustrator** - Professional vector editing
- **Inkscape** (free) - Open-source vector editor
- **VS Code** - Direct text editing for simple changes

## Screenshot Best Practices

**Do:**
- Show the app in actual use
- Highlight unique features (offline mode, optimistic updates)
- Use realistic content
- Ensure text is readable
- Show the app's value proposition

**Don't:**
- Use lorem ipsum or placeholder text
- Show error states or broken UI
- Include sensitive user data
- Use low-quality or blurry images
- Show outdated UI

## Verification

After generating screenshots:

1. **Check files exist:**
   ```bash
   ls -la public/screenshots/*.png
   ```

2. **Verify dimensions:**
   - desktop.png should be 1280x720
   - mobile.png should be 750x1334

3. **Check file sizes:**
   - Target: < 200KB per screenshot
   - Use optimization tools if needed (TinyPNG, ImageOptim)

4. **Test in PWA install prompt:**
   - Build and serve the application
   - Open in a PWA-compatible browser
   - Trigger the install prompt
   - Verify screenshots appear correctly

## Troubleshooting

**Screenshots not showing in install prompt:**
- Verify manifest.json references correct paths
- Check browser console for errors
- Ensure PNG files are valid
- Clear browser cache and service worker

**File sizes too large:**
- Use PNG optimization tools (TinyPNG, ImageOptim)
- Reduce color depth if possible
- Consider JPEG for photographic content (update manifest)

**Screenshots look pixelated:**
- Ensure source images are at exact required dimensions
- Don't upscale smaller images
- Use high-quality source material

## References

- [PWA Screenshots Best Practices](https://web.dev/add-manifest/#screenshots)
- [Web App Manifest Specification](https://developer.mozilla.org/en-US/docs/Web/Manifest/screenshots)
- [PWA Install Prompt Guidelines](https://web.dev/customize-install/)
