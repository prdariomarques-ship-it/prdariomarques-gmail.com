const fs = require('fs');

let code = fs.readFileSync('src/server/portfolioRepo.ts', 'utf8');

// Find Dario
const darioStart = code.indexOf(`  {\n  id: 'port-dario-001',`);
if (darioStart !== -1) {
  // It ends at `  ],\n},` before `\n];\n\nexport const initialPortfolios`
  const darioEnd = code.indexOf(`  ],\n},\n];`, darioStart);
  if (darioEnd !== -1) {
    const darioBlock = code.substring(darioStart, darioEnd + 8); // include `  ],\n},`
    // Remove from initialPolicies
    code = code.substring(0, darioStart) + code.substring(darioEnd + 8);
    // Find end of initialPortfolios
    const endPortfolios = code.indexOf(`  ],\n},\n];`); // This will match Wilson's end
    if (endPortfolios !== -1) {
      code = code.substring(0, endPortfolios + 8) + ',\n' + darioBlock + code.substring(endPortfolios + 8);
      fs.writeFileSync('src/server/portfolioRepo.ts', code);
      console.log('Fixed Dario location');
    }
  }
}
