import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.resolve('logo_pwa.svg');
const svgBuffer = fs.readFileSync(svgPath);

// 1. Copy SVG files
const svgDestinations = [
  'public/logo_pwa.svg',
  'public/icon.svg',
  'src/assets/logo_pwa.svg',
  'src/assets/icon.svg'
];

for (const dest of svgDestinations) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dest, svgBuffer);
  console.log(`Copied SVG to ${dest}`);
}

// 2. Generate PNG icons
const pngOutputs = [
  { path: 'public/icon-512.png', size: 512 },
  { path: 'public/icon-192.png', size: 192 },
  { path: 'public/icon.png', size: 512 },
  { path: 'public/apple-touch-icon.png', size: 180 },
  { path: 'public/apple-touch-icon-precomposed.png', size: 180 },
  { path: 'public/favicon-32x32.png', size: 32 },
  { path: 'public/favicon-16x16.png', size: 16 },
  { path: 'src/assets/icon.png', size: 512 }
];

async function generate() {
  for (const { path: outPath, size } of pngOutputs) {
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(svgBuffer)
      .resize(size, size, { fit: 'cover' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outPath);

    console.log(`Generated ${outPath} (${size}x${size})`);
  }
  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
