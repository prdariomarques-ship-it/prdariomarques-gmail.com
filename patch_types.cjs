const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');
code = code.replace(
  "productType?: string;",
  "productType?: 'tesouraria_banco' | 'corretora' | 'asset_gestora';"
);
fs.writeFileSync('src/types.ts', code);
console.log('patched src/types.ts');
