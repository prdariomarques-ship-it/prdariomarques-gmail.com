const fs = require('fs');
let code = fs.readFileSync('src/server/portfolioRepo.ts', 'utf-8');

// Replace SGOV and TFLO isTaxExempt
code = code.replace(
  /ticker: 'SGOV',[\s\S]*?isTaxExempt: false,/,
  match => match.replace('isTaxExempt: false', 'isTaxExempt: null')
);

code = code.replace(
  /ticker: 'TFLO',[\s\S]*?isTaxExempt: false,/,
  match => match.replace('isTaxExempt: false', 'isTaxExempt: null')
);

fs.writeFileSync('src/server/portfolioRepo.ts', code);
console.log('patched offshore assets to null');
