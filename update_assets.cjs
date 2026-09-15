const fs = require('fs');
let code = fs.readFileSync('src/server/portfolioRepo.ts', 'utf-8');

// Use a simple replacement loop
const updates = {
  '52678': { cnpj: '20.335.522/0001-51', productType: 'asset_gestora', isTaxExempt: false },
  '56732': { cnpj: '51.998.694/0001-39', productType: 'asset_gestora', isTaxExempt: false },
  '56855': { productType: 'asset_gestora', isTaxExempt: false },
  '59138': { cnpj: '08.604.187/0001-44', productType: 'asset_gestora', isTaxExempt: false },
  '58336': { productType: 'asset_gestora', isTaxExempt: false },
  '57559': { productType: 'asset_gestora', isTaxExempt: false },
  '58989': { productType: 'asset_gestora', isTaxExempt: false },
  '54170': { productType: 'asset_gestora', isTaxExempt: false },
  'ATENAS-VGBL': { productType: 'asset_gestora', isTaxExempt: false },
  '56294': { productType: 'asset_gestora', isTaxExempt: false },
  '58343': { productType: 'asset_gestora', isTaxExempt: false },
  '50246': { productType: 'asset_gestora', isTaxExempt: false },
  '56081': { productType: 'asset_gestora', isTaxExempt: true, taxExemptionReason: 'Fundo de Debêntures Incentivadas' }, // Vanguarda INFR is usually incentivada
  '54430': { productType: 'asset_gestora', isTaxExempt: false },
  '54169': { productType: 'asset_gestora', isTaxExempt: false },
  'SGOV': { productType: 'corretora', isTaxExempt: false },
  'TFLO': { productType: 'corretora', isTaxExempt: false }
};

for (const [ticker, data] of Object.entries(updates)) {
  const regex = new RegExp(`(ticker:\\s*'${ticker}',[\\s\\S]*?allocationPercent:\\s*[\\d\\.]+,)`, 'g');
  code = code.replace(regex, (match) => {
    let newFields = '';
    if (data.cnpj) newFields += `\n        cnpj: '${data.cnpj}',`;
    if (data.productType) newFields += `\n        productType: '${data.productType}',`;
    if (data.isTaxExempt !== undefined) newFields += `\n        isTaxExempt: ${data.isTaxExempt},`;
    if (data.taxExemptionReason) newFields += `\n        taxExemptionReason: '${data.taxExemptionReason}',`;
    return match + newFields;
  });
}

fs.writeFileSync('src/server/portfolioRepo.ts', code);
console.log('Updated portfolioRepo.ts');
