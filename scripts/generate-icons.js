// SVGからPNGアイコンを生成するスクリプト
// SVGを直接データURLとして使用する簡易版

import fs from 'fs';
import path from 'path';

const iconSizes = [16, 32, 192, 512];
const publicDir = path.join(process.cwd(), 'public');

// アイコンサイズ用のSVGテンプレートを生成
function generateIconSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d9488;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="url(#bg)"/>
  
  <!-- Calculator icon -->
  <rect x="${size*0.3}" y="${size*0.25}" width="${size*0.4}" height="${size*0.5}" rx="${size*0.05}" fill="#ffffff" opacity="0.9"/>
  <rect x="${size*0.32}" y="${size*0.28}" width="${size*0.36}" height="${size*0.12}" rx="${size*0.02}" fill="#065f46"/>
  
  <!-- Calculator buttons -->
  <circle cx="${size*0.38}" cy="${size*0.5}" r="${size*0.03}" fill="#10b981"/>
  <circle cx="${size*0.5}" cy="${size*0.5}" r="${size*0.03}" fill="#10b981"/>
  <circle cx="${size*0.62}" cy="${size*0.5}" r="${size*0.03}" fill="#10b981"/>
  
  <circle cx="${size*0.38}" cy="${size*0.6}" r="${size*0.03}" fill="#10b981"/>
  <circle cx="${size*0.5}" cy="${size*0.6}" r="${size*0.03}" fill="#10b981"/>
  <circle cx="${size*0.62}" cy="${size*0.6}" r="${size*0.03}" fill="#059669"/>
  
  <circle cx="${size*0.38}" cy="${size*0.7}" r="${size*0.03}" fill="#10b981"/>
  <circle cx="${size*0.5}" cy="${size*0.7}" r="${size*0.03}" fill="#10b981"/>
  <circle cx="${size*0.62}" cy="${size*0.7}" r="${size*0.03}" fill="#059669"/>
</svg>`;
}

// 各サイズのSVGアイコンを生成
iconSizes.forEach(size => {
  const svgContent = generateIconSVG(size);
  const filename = size === 32 ? 'favicon.svg' : size === 128 ? 'icon.svg' : `icon-${size}.svg`;
  const filepath = path.join(publicDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename} (${size}x${size})`);
});

// Apple Touch Iconも生成
const appleTouchIconSVG = generateIconSVG(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleTouchIconSVG);
console.log('Generated apple-touch-icon.svg (180x180)');

console.log('All icon files generated successfully!');