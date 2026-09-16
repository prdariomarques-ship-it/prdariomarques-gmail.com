const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
pkg.scripts.dev = "tsx server_real.ts";
pkg.scripts.build = "vite build && esbuild server_real.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs";
pkg.scripts.start = "node server.ts";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
