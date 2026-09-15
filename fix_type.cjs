const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(
  'isTaxExempt?: boolean;', 
  'isTaxExempt?: boolean | null;'
);

fs.writeFileSync('src/types.ts', code);
console.log('patched types');
