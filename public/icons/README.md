# PWA Icons Directory

This directory contains icons for the Progressive Web App (PWA) installation.

## Required Icons

The PWA requires the following icon sizes:

- **icon-192x192.png** - Standard icon for Android devices (192x192 pixels)
- **icon-512x512.png** - High-resolution icon for splash screens and app stores (512x512 pixels)

Both icons are configured as **maskable icons**, meaning they include a safe zone to ensure the icon looks good on all devices, even when the OS applies a mask (circle, squircle, etc.).

## Current Status

✓ **icon.svg** - Source SVG file with theme color (#4F46E5) and safe zone
✓ **generate-icons.js** - Script to generate PNG icons from SVG

## Generating Icons

### Option 1: Using Node.js (Recommended)

```bash
# Install sharp package (if not already installed)
npm install sharp

# Run the generation script
node public/icons/generate-icons.js
```

This will generate both required PNG files automatically.

### Option 2: Using Online Tools

If you prefer not to install dependencies:

1. Open https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
2. Upload `icon.svg` from this directory
3. Generate two versions:
   - 192x192 pixels → save as `icon-192x192.png`
   - 512x512 pixels → save as `icon-512x512.png`
4. Place both files in this directory

### Option 3: Using Design Tools

You can also use design tools like:
- **Figma**: Import SVG, export as PNG at required sizes
- **Adobe Illustrator**: Open SVG, export as PNG
- **Inkscape**: Open SVG, export bitmap at required sizes

## Maskable Icon Guidelines

The icon.svg follows maskable icon best practices:

- **Safe zone**: 80% of the icon size (centered)
- **Minimum safe zone**: 40% (for critical content)
- **Background**: Extends to edges with theme color
- **Content**: Centered within safe zone

Test your icons at: https://maskable.app/editor

## Customization

To customize the icon:

1. Edit `icon.svg` with your preferred design
2. Keep the safe zone in mind (80% centered area)
3. Use the theme color (#4F46E5) or update to match your brand
4. Regenerate PNG files using one of the methods above

## Verification

After generating icons, verify they work correctly:

1. Check file sizes (should be reasonable, < 50KB each)
2. Test on https://maskable.app/editor
3. Install the PWA and check the icon appearance
4. Test on different devices (Android, iOS, Desktop)

## References

- [PWA Icon Guidelines](https://web.dev/maskable-icon/)
- [Maskable Icon Editor](https://maskable.app/editor)
- [Web App Manifest Icons](https://developer.mozilla.org/en-US/docs/Web/Manifest/icons)
