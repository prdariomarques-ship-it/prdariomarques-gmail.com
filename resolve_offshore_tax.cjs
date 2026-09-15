const fs = require('fs');
let code = fs.readFileSync('src/server/portfolioRepo.ts', 'utf-8');

// Replace isTaxExempt: null with isTaxExempt: false for the offshore assets
code = code.replace(/isTaxExempt: null/g, 'isTaxExempt: false');

fs.writeFileSync('src/server/portfolioRepo.ts', code);
console.log('Offshore ETFs tax classification resolved to false');
