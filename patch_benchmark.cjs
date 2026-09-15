const fs = require('fs');
let code = fs.readFileSync('src/server/complianceAgent.ts', 'utf-8');

const targetLogic = `      if (isOver && bestPerformingAsset && bestPerformingAsset.historicalPerformance?.twelveMonths) {
        const perf = bestPerformingAsset.historicalPerformance.twelveMonths;
        if (perf > 5) {
          marketContextExplanation = \`Breach triggered by passive market movement rather than manual trading. \${bestPerformingAsset.ticker} experienced a \${perf.toFixed(1)}% price increase over the period, artificially inflating the allocation by \${absDeviation.toFixed(1)} p.p. above the mandate.\`;
          whyExplanation = \`A valorização expressiva de ativos da carteira (ex: \${bestPerformingAsset.ticker} subiu \${perf.toFixed(1)}% em 12 meses) distorceu a alocação relativa para além do limite permitido.\`;
        }
      } else if (!isOver && worstPerformingAsset && worstPerformingAsset.historicalPerformance?.twelveMonths !== undefined) {
        const perf = worstPerformingAsset.historicalPerformance.twelveMonths;
        if (perf < -5) {
          marketContextExplanation = \`Breach triggered by passive market contraction rather than manual trading. \${worstPerformingAsset.ticker} experienced a \${Math.abs(perf).toFixed(1)}% price drop, suppressing the allocation \${absDeviation.toFixed(1)} p.p. below the required mandate minimum.\`;
          whyExplanation = \`A desvalorização de ativos da classe (ex: \${worstPerformingAsset.ticker} caiu \${Math.abs(perf).toFixed(1)}% em 12 meses) reduziu a participação relativa para abaixo do piso obrigatório.\`;
        }
      }`;

const enhancedLogic = `
      // Mock benchmark return for comparison
      const benchmarkReturns: Record<string, number> = {
        'CDI': 10.5,
        'IBOVESPA': 15.2,
        'S&P 500': 22.4,
        'IMA-B': 8.7,
        'IPCA+': 6.5,
      };
      const bmkReturn = benchmarkReturns[portfolio.benchmark] || 10.0;

      if (isOver && bestPerformingAsset && bestPerformingAsset.historicalPerformance?.twelveMonths) {
        const perf = bestPerformingAsset.historicalPerformance.twelveMonths;
        if (perf > 5) {
          const outperformance = perf - bmkReturn;
          let extraContext = '';
          if (outperformance > 0) {
            extraContext = \` The asset outperformed the portfolio benchmark (\${portfolio.benchmark} at \${bmkReturn.toFixed(1)}%) by \${outperformance.toFixed(1)} p.p.\`;
            mandateVsInternalExplanation += \`\\n\\n[Análise de Mercado]: O desenquadramento foi impulsionado majoritariamente por ganhos de capital (valorização passiva de ativos) superando o benchmark, e não por falha de governança em novos aportes.\`;
          }
          marketContextExplanation = \`Breach triggered by passive market movement rather than manual trading. \${bestPerformingAsset.ticker} experienced a \${perf.toFixed(1)}% price increase over the period, artificially inflating the allocation by \${absDeviation.toFixed(1)} p.p. above the mandate.\${extraContext}\`;
          whyExplanation = \`A valorização expressiva de ativos da carteira (ex: \${bestPerformingAsset.ticker} subiu \${perf.toFixed(1)}% em 12 meses) distorceu a alocação relativa para além do limite permitido.\`;
        }
      } else if (!isOver && worstPerformingAsset && worstPerformingAsset.historicalPerformance?.twelveMonths !== undefined) {
        const perf = worstPerformingAsset.historicalPerformance.twelveMonths;
        if (perf < -5) {
          const underperformance = bmkReturn - perf;
          let extraContext = '';
          if (underperformance > 0) {
            extraContext = \` The asset underperformed the portfolio benchmark (\${portfolio.benchmark} at \${bmkReturn.toFixed(1)}%) by \${underperformance.toFixed(1)} p.p.\`;
            mandateVsInternalExplanation += \`\\n\\n[Análise de Mercado]: O desenquadramento (abaixo do piso) foi causado majoritariamente pela forte desvalorização do ativo contra o benchmark (perda de capital), não caracterizando resgate manual indevido.\`;
          }
          marketContextExplanation = \`Breach triggered by passive market contraction rather than manual trading. \${worstPerformingAsset.ticker} experienced a \${Math.abs(perf).toFixed(1)}% price drop, suppressing the allocation \${absDeviation.toFixed(1)} p.p. below the required mandate minimum.\${extraContext}\`;
          whyExplanation = \`A desvalorização de ativos da classe (ex: \${worstPerformingAsset.ticker} caiu \${Math.abs(perf).toFixed(1)}% em 12 meses) reduziu a participação relativa para abaixo do piso obrigatório.\`;
        }
      }`;

if(code.includes(targetLogic)) {
    code = code.replace(targetLogic, enhancedLogic);
    fs.writeFileSync('src/server/complianceAgent.ts', code);
    console.log('patched benchmark logic');
} else {
    console.log('could not find target logic');
}
