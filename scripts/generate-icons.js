/**
 * 生成 PWA 图标
 * 红色背景 + 白色"青"字
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG icon content
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dc2626"/>
      <stop offset="100%" style="stop-color:#991b1b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="white" text-anchor="middle">青</text>
</svg>
`;

// Maskable icon (same but with more padding)
const svgMaskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dc2626"/>
      <stop offset="100%" style="stop-color:#991b1b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="240" font-weight="bold" fill="white" text-anchor="middle">青</text>
</svg>
`;

async function generateIcons() {
  console.log('🎨 生成 PWA 图标...');

  // 192x192
  await sharp(Buffer.from(svgIcon))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('✅ icon-192.png');

  // 512x512
  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('✅ icon-512.png');

  // maskable-512x512
  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'maskable-512.png'));
  console.log('✅ maskable-512.png');

  console.log('🎉 图标生成完成！');
}

generateIcons().catch(console.error);
