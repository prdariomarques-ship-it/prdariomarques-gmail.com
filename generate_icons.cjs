const sharp = require('sharp');

const svgCode = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0f172a" />
  <path d="M256 64 L416 128 L416 256 C416 364 348 438 256 480 C164 438 96 364 96 256 L96 128 L256 64 Z" fill="#10b981" />
  <path d="M224 352 L144 272 L176 240 L224 288 L336 176 L368 208 Z" fill="#ffffff" />
</svg>`;

const svgBuffer = Buffer.from(svgCode);

async function generate() {
  await sharp(svgBuffer).resize(192, 192).png().toFile('public/pwa-192x192.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/pwa-512x512.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  
  const maskableSvgCode = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#10b981" />
    <path d="M256 128 L416 192 L416 320 C416 428 348 502 256 544 C164 502 96 428 96 320 L96 192 L256 128 Z" fill="#ffffff" />
    <path d="M224 416 L144 336 L176 304 L224 352 L336 240 L368 272 Z" fill="#0f172a" />
  </svg>`;
  await sharp(Buffer.from(maskableSvgCode)).resize(512, 512).png().toFile('public/pwa-maskable-512x512.png');
  
  require('fs').writeFileSync('public/icon.svg', svgCode);
  console.log('Icons generated successfully!');
}

generate().catch(console.error);
