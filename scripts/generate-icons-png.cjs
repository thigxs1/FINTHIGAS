/**
 * generate-icons-png.cjs
 * Generates all PWA/favicon icons from LOGO-FINTHIGAS.png using sharp.
 * Run: node scripts/generate-icons-png.cjs
 */

const fs = require('fs');
const path = require('path');

// Try to load sharp
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('sharp not found. Run: npm install sharp');
  process.exit(1);
}

const sourcePng = path.resolve(__dirname, '../LOGO-FINTHIGAS.png');

if (!fs.existsSync(sourcePng)) {
  console.error('Source PNG not found:', sourcePng);
  process.exit(1);
}

const outputs = [
  // PWA icons
  { path: 'public/icon-512.png', size: 512 },
  { path: 'public/icon-192.png', size: 192 },
  // Maskable (same logo, full bleed — the logo already has its own background)
  { path: 'public/icon-maskable-512.png', size: 512 },
  // Apple Touch Icon (iOS shortcut)
  { path: 'public/apple-touch-icon.png', size: 180 },
  { path: 'public/apple-touch-icon-precomposed.png', size: 180 },
  // Favicons (browser tab)
  { path: 'public/favicon-48x48.png', size: 48 },
  { path: 'public/favicon-32x32.png', size: 32 },
  { path: 'public/favicon-16x16.png', size: 16 },
  // Misc copies
  { path: 'public/icon.png', size: 512 },
  { path: 'public/logo.png', size: 512 },
  { path: 'public/pwa-icon.png', size: 512 },
  { path: 'src/assets/icon.png', size: 512 },
];

async function run() {
  const srcBuf = fs.readFileSync(sourcePng);

  for (const { path: outPath, size } of outputs) {
    const dir = path.dirname(path.resolve(outPath));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(srcBuf)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png({ quality: 100, compressionLevel: 6 })
      .toFile(outPath);

    console.log(`✓  ${outPath}  (${size}x${size})`);
  }

  console.log('\n✅  All icons generated from LOGO-FINTHIGAS.png successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
