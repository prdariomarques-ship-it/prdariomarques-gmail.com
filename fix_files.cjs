const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
pkg.files = ["dist", "server.js", "server_real.ts", "src"];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
