const fs = require('fs');
let code = fs.readFileSync('src/server/portfolioRepo.ts', 'utf-8');

code = code.replace(/isTaxExempt: undefined/g, 'isTaxExempt: null');

fs.writeFileSync('src/server/portfolioRepo.ts', code);
console.log('patched back to null');
