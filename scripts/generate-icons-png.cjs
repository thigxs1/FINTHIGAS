/**
 * generate-icons-png.cjs
 * Generates all PWA/favicon icons from LOGO-FINTHIGAS.png using sharp.
 * For iOS apple-touch-icon and Android maskable icon, it flattens the background
 * with #23242a so that transparent corners do not turn into white gaps ("frestas brancas")
 * on iPhone and Android home screens.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourcePng = path.resolve(__dirname, '../LOGO-FINTHIGAS.png');

if (!fs.existsSync(sourcePng)) {
  console.error('Source PNG not found:', sourcePng);
  process.exit(1);
}

// Background color matching the dark gradient edge of LOGO-FINTHIGAS.png
const BG_DARK = { r: 35, g: 36, b: 42 }; // #23242a

const outputs = [
  // Apple Touch Icons (iOS shortcut): MUST be 100% solid/opaque!
  // iOS clips the icon with its own squircle mask; transparent pixels turn into white gaps.
  { path: 'public/apple-touch-icon.png', size: 180, flatten: true },
  { path: 'public/apple-touch-icon-precomposed.png', size: 180, flatten: true },

  // Android Maskable Icon (must fill canvas with 100% opaque pixels)
  { path: 'public/icon-maskable-512.png', size: 512, flatten: true },

  // Standard PWA icons (can keep full bleed)
  { path: 'public/icon-512.png', size: 512, flatten: true },
  { path: 'public/icon-192.png', size: 192, flatten: true },
  { path: 'public/icon.png', size: 512, flatten: true },
  { path: 'public/logo.png', size: 512, flatten: true },
  { path: 'public/pwa-icon.png', size: 512, flatten: true },
  { path: 'src/assets/icon.png', size: 512, flatten: true },

  // Favicons (browser tabs)
  { path: 'public/favicon-48x48.png', size: 48, flatten: false },
  { path: 'public/favicon-32x32.png', size: 32, flatten: false },
  { path: 'public/favicon-16x16.png', size: 16, flatten: false },
];

async function run() {
  const srcBuf = fs.readFileSync(sourcePng);

  for (const { path: outPath, size, flatten } of outputs) {
    const dir = path.dirname(path.resolve(outPath));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let pipeline = sharp(srcBuf);

    if (flatten) {
      pipeline = pipeline.flatten({ background: BG_DARK });
    }

    await pipeline
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png({ quality: 100, compressionLevel: 6 })
      .toFile(outPath);

    console.log(`✓  ${outPath}  (${size}x${size}${flatten ? ' - flattened' : ''})`);
  }

  // Also create favicon.ico
  await sharp(srcBuf)
    .resize(32, 32, { fit: 'cover' })
    .toFile('public/favicon.ico');
  console.log('✓  public/favicon.ico  (32x32)');

  console.log('\n✅  All icons generated with seamless opaque background for iOS/Android!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
