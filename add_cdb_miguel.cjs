const fs = require('fs');

let fileContent = fs.readFileSync('src/server/portfolioRepo.ts', 'utf-8');

const cdbAsset = `
      {
        id: 'ast-miguel-cdb-001',
        ticker: 'CDB-BBA-001',
        name: 'CDB ITAU BBA POS',
        assetClass: 'Renda Fixa',
        sector: 'Pós-fixado',
        quantity: 100,
        currentPrice: 1000,
        totalValue: 100000.00,
        allocationPercent: 2.5,
        productType: 'tesouraria_banco',
        isTaxExempt: false,
      },`;

fileContent = fileContent.replace('assets: [', 'assets: [' + cdbAsset);

fs.writeFileSync('src/server/portfolioRepo.ts', fileContent);
console.log('Added CDB to Miguel portfolio');
