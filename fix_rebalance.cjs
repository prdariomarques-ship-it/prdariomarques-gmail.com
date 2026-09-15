const fs = require('fs');
let code = fs.readFileSync('src/utils/rebalancePerformanceData.ts', 'utf-8');

const replacement = `  const defaultActions: RebalanceActionRecord[] = [
    {
      id: 'reb-act-01',
      portfolioId: 'port-miguel-001',
      portfolioName: 'Carteira Miguel',
      clientName: 'Miguel',
      executionDate: '10/02/2026 14:32',
      auditProtocol: 'CVM175-REB-2026-0891',
      ordersCount: 4,
      totalVolumeBRL: 1480000,
      taxSavedBRL: 18450,
      preEfficiency: 58.5,
      postEfficiency: 89.2,
      efficiencyGain: 30.7,
      primaryAssetClass: 'Renda Variável',
      deviationEliminatedPP: 7.8,
      status: 'AUDITED',
    }
  ];`;

// the original defaultActions goes from line 51 to 137
const lines = code.split('\n');
const newLines = [];
let insideDefault = false;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('const defaultActions: RebalanceActionRecord[] = [')) {
    insideDefault = true;
    newLines.push(replacement);
    continue;
  }
  if (insideDefault && lines[i].includes('  ];')) {
    insideDefault = false;
    continue;
  }
  if (!insideDefault) {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('src/utils/rebalancePerformanceData.ts', newLines.join('\n'));
console.log('patched');
