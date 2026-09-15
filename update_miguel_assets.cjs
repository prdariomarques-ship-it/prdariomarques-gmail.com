const fs = require('fs');

let fileContent = fs.readFileSync('src/server/portfolioRepo.ts', 'utf-8');

// Find the portfolio
// Since it's a TypeScript file, we can do string replacements carefully.

// Let's replace line by line for the assets in port-miguel-001
const lines = fileContent.split('\n');
let inMiguel = false;
let inAssets = false;
let bracketDepth = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("id: 'port-miguel-001'")) {
    inMiguel = true;
  }
  
  if (inMiguel && lines[i].includes('assets: [')) {
    inAssets = true;
  }
  
  if (inMiguel && inAssets) {
    if (lines[i].includes('{')) bracketDepth += (lines[i].match(/{/g) || []).length;
    if (lines[i].includes('}')) bracketDepth -= (lines[i].match(/}/g) || []).length;
    
    // We are inside an asset object
    if (lines[i].includes('name:')) {
      const nameMatch = lines[i].match(/name:\s*'([^']+)'/);
      if (nameMatch) {
        const name = nameMatch[1].toUpperCase();
        let pType = 'asset_gestora';
        if (name.includes('CDB') || name.includes('LCI') || name.includes('LCA') || name.includes('COMPROMISSADA') || name.includes('LF') || name.includes('CRI') || name.includes('CRA')) {
          pType = 'tesouraria_banco';
        } else if (name.includes('ETF') || name.includes('ISHARES') || name.includes('HASH11') || name.includes('IVVB11') || name.includes('BOVA11')) {
          pType = 'corretora';
        } else if (name.includes('FI ') || name.includes('FICFI') || name.includes('FUNDO') || name.includes('KINEA') || name.includes('OCCAM') || name.includes('MAPFRE') || name.includes('BTG') || name.includes('ITAÚ CRÉD') || name.includes('ITAÚ AÇÕES') || name.includes('CONSTANCIA') || name.includes('PERFIN')) {
          pType = 'asset_gestora';
        }
        
        // ensure productType is in the next lines or add it
        // Since we already have some productType lines, let's remove them first to avoid duplicates
        let j = i;
        while (j < i + 10 && lines[j] && !lines[j].includes('}')) {
          if (lines[j].includes('productType:')) {
            lines[j] = `        productType: '${pType}',`;
          }
          j++;
        }
      }
    }
    
    if (bracketDepth === 0 && lines[i].includes(']')) {
      inAssets = false;
      inMiguel = false;
    }
  }
}

fs.writeFileSync('src/server/portfolioRepo.ts', lines.join('\n'));
console.log('patched miguel portfolio assets');
