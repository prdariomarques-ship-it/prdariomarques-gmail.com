const fs = require('fs');
let code = fs.readFileSync('src/server/portfolioRepo.ts', 'utf-8');

code = code.replace(/isTaxExempt: null/g, 'isTaxExempt: undefined');

fs.writeFileSync('src/server/portfolioRepo.ts', code);
console.log('patched to undefined for ts safety');
