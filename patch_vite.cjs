const fs = require('fs');
const file = 'vite.config.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\s*define:\\s*\\{\\s*'__FLOWCORE_RUNTIME_TOKEN__':[^}]+\\},/g, '');

fs.writeFileSync(file, content);
console.log("Success vite patch");
