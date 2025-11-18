# Icon Generation Guide

## Required Icons for PWA

### Standard Icons
- `icon-72x72.png` - Android launcher icon (small)
- `icon-96x96.png` - Android launcher icon (medium)  
- `icon-128x128.png` - Android launcher icon (large)
- `icon-144x144.png` - Android launcher icon (extra large)
- `icon-152x152.png` - iPad touch icon
- `icon-192x192.png` - Android Chrome icon (standard)
- `icon-384x384.png` - Android Chrome icon (large)
- `icon-512x512.png` - Android Chrome icon (extra large)

### Apple-specific Icons
- `apple-touch-icon.png` (180x180) - iOS home screen icon
- `favicon-32x32.png` - Browser tab icon (desktop)
- `favicon-16x16.png` - Browser tab icon (small)

## Generate Icons Using ImageMagick

```bash
# Install ImageMagick
# Windows: choco install imagemagick
# macOS: brew install imagemagick
# Linux: sudo apt install imagemagick

# Generate all sizes from a master logo (logo.png)
convert logo.png -resize 72x72 icons/icon-72x72.png
convert logo.png -resize 96x96 icons/icon-96x96.png
convert logo.png -resize 128x128 icons/icon-128x128.png
convert logo.png -resize 144x144 icons/icon-144x144.png
convert logo.png -resize 152x152 icons/icon-152x152.png
convert logo.png -resize 192x192 icons/icon-192x192.png
convert logo.png -resize 384x384 icons/icon-384x384.png
convert logo.png -resize 512x512 icons/icon-512x512.png
convert logo.png -resize 180x180 icons/apple-touch-icon.png
convert logo.png -resize 32x32 icons/favicon-32x32.png
convert logo.png -resize 16x16 icons/favicon-16x16.png
```

## Online Icon Generators
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/
- https://favicon.io/

## Icon Design Guidelines
- Use high contrast colors
- Simple, recognizable design
- Test at small sizes (16x16)
- Consider dark/light mode compatibility
- Use vector graphics (SVG) when possible

## Placeholder Icon (Text-based)
If you don't have a logo yet, you can create simple text-based icons:

```html
<!-- SVG placeholder -->
<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#4F46E5"/>
  <text x="96" y="110" font-family="Arial" font-size="60" fill="white" text-anchor="middle">EM</text>
</svg>
```