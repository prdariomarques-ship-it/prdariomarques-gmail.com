const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf-8');

code = code.replace(
  "globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],",
  "globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],\n        maximumFileSizeToCacheInBytes: 5000000," // 5MB
);

// wait, I didn't actually add the workbox config when replacing the vite config initially! 
// Let's check my vite.config.ts replacement from before. I left out workbox.
// Let's just insert the workbox config explicitly into VitePWA.
code = code.replace(
  "devOptions:",
  "workbox: {\n          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],\n          maximumFileSizeToCacheInBytes: 5000000,\n        },\n        devOptions:"
);

fs.writeFileSync('vite.config.ts', code);
console.log('patched vite config');
