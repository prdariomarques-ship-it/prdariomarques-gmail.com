const fs = require('fs');
let code = fs.readFileSync('src/server/complianceAgent.ts', 'utf-8');

// Inside evaluatePortfolio, before `return alerts;`, we add logic to check concentration by CNPJ/Issuer
const concentrationLogic = `
    // Check concentration by Issuer (CNPJ)
    const issuerTotals: Record<string, number> = {};
    const issuerNames: Record<string, string> = {};
    for (const asset of portfolio.assets) {
      if (asset.cnpj || asset.name) {
        const key = asset.cnpj || asset.name;
        issuerTotals[key] = (issuerTotals[key] || 0) + asset.totalValue;
        issuerNames[key] = asset.name;
      }
    }

    const CONCENTRATION_LIMIT = 20.0; // 20% max per issuer
    for (const [key, value] of Object.entries(issuerTotals)) {
      const currentPercent = (value / totalVal) * 100;
      if (currentPercent > CONCENTRATION_LIMIT) {
        const absDeviation = currentPercent - CONCENTRATION_LIMIT;
        alerts.push({
          id: \`alt-\${portfolio.id}-conc-\${key.replace(/\\W/g, '')}\`,
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          clientName: portfolio.clientName,
          assetClass: 'Geral',
          currentPercent,
          targetPercent: CONCENTRATION_LIMIT,
          maxPercent: CONCENTRATION_LIMIT,
          minPercent: 0,
          deviationPP: absDeviation,
          severity: 'CRITICAL',
          message: \`[CRITICAL] Risco de Concentração de Crédito: emissor \${issuerNames[key]} atinge \${currentPercent.toFixed(1)}% do AUM, violando teto de 20%.\`,
          suggestedAction: \`Pulverizar posições no emissor \${issuerNames[key]} (venda sugerida de R$ \${((absDeviation/100)*totalVal).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}) para reenquadramento.\`,
          excessValueBRL: Math.round((absDeviation / 100) * totalVal),
          recommendedTradeValue: Math.round((absDeviation / 100) * totalVal),
          timestamp: new Date().toLocaleDateString('pt-BR'),
          ruleSource: 'POLITICA_INTERNA',
          policyId: 'CREDIT-CONC-01',
          limit: CONCENTRATION_LIMIT,
          currentValue: currentPercent,
          rule_source: 'POLITICA_INTERNA',
          policy_id: 'CREDIT-CONC-01',
          current_value: currentPercent,
          difference: absDeviation,
          effectiveDate: '01/01/2026',
          tolerancePP: 0,
          mandateVsInternalExplanation: 'Risco sistêmico e de contraparte monitorado por comitê de crédito interno.',
          marketContextExplanation: 'Concentração passiva por valorização ou aportes não diversificados.',
          aiExplanation: {
            what: \`A exposição de crédito em \${issuerNames[key]} chegou a \${currentPercent.toFixed(1)}%.\`,
            why: 'Falta de pulverização ou forte rali dos ativos deste emissor.',
            impact: 'Elevação do risco de crédito (default) sistêmico da carteira.',
            action: \`Vender \${absDeviation.toFixed(1)}% para pulverização.\`,
            confidence: 95,
            source: 'Comitê de Risco / CVM 175',
          }
        });
      }
    }
`;

code = code.replace(
  "    return alerts;\n  }",
  concentrationLogic + "\n    return alerts;\n  }"
);

fs.writeFileSync('src/server/complianceAgent.ts', code);
console.log('patched concentration rules');
