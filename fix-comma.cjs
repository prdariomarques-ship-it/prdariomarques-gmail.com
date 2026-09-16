const fs = require('fs');
let code = fs.readFileSync('src/server/portfolioRepo.ts', 'utf8');
code = code.replace(/},\n,\n  {/g, '},\n  {');
fs.writeFileSync('src/server/portfolioRepo.ts', code);
