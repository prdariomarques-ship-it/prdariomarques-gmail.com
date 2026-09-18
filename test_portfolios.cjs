const fs = require('fs');
const content = fs.readFileSync('src/server/portfolioRepo.ts', 'utf-8');
const match = content.match(/id: 'port-[a-z0-9-]+'/g);
console.log(match);
