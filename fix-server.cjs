const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');
content = content.replace(/if \(req\.method === 'GET' && !url\.startsWith\('\/api'\) && .*\) \{/g, "if (req.method === 'GET' && !url.startsWith('/api') && req.headers.accept?.includes('text/html')) {");
fs.writeFileSync('server.ts', content);
