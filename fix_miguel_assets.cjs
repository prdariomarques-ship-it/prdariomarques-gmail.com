const fs = require('fs');

let fileContent = fs.readFileSync('src/server/portfolioRepo.ts', 'utf-8');

// The easiest way is to use regex to inject productType inside each asset of Miguel if it is missing
// Actually, it's easier to just match each asset block
const lines = fileContent.split('\n');
let inMiguel = false;
let inAssets = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("id: 'port-miguel-001'")) {
    inMiguel = true;
  }
  
  if (inMiguel && lines[i].includes('assets: [')) {
    inAssets = true;
  }
  
  if (inMiguel && inAssets) {
    if (lines[i].includes('name:')) {
      const nameMatch = lines[i].match(/name:\s*'([^']+)'/);
      if (nameMatch) {
        const name = nameMatch[1].toUpperCase();
        let pType = 'asset_gestora';
        if (name.includes('CDB') || name.includes('LCI') || name.includes('LCA') || name.includes('COMPROMISSADA') || name.includes('LF') || name.includes('CRI') || name.includes('CRA')) {
          pType = 'tesouraria_banco';
        } else if (name.includes('ETF') || name.includes('ISHARES') || name.includes('HASH11') || name.includes('IVVB11') || name.includes('BOVA11')) {
          pType = 'corretora';
        } else {
          pType = 'asset_gestora';
        }
        
        let hasProductType = false;
        let j = i;
        while (j < i + 15 && lines[j] && !lines[j].includes('}')) {
          if (lines[j].includes('productType:')) {
            lines[j] = `        productType: '${pType}',`;
            hasProductType = true;
          }
          j++;
        }
        
        if (!hasProductType) {
           // Insert right after name
           lines.splice(i + 1, 0, `        productType: '${pType}',`);
           // Adjust indices since we shifted
        }
      }
    }
    
    // Naive block exit, actually let's just do it globally for now 
    // since miguel is the only one or we can just stop after it.
    if (lines[i].includes('export const') && !lines[i].includes('initialPortfolios')) {
       // stop processing
       break;
    }
  }
}

fs.writeFileSync('src/server/portfolioRepo.ts', lines.join('\n'));
console.log('patched miguel portfolio assets again');
