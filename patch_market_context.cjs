const fs = require('fs');
let code = fs.readFileSync('src/server/complianceAgent.ts', 'utf-8');

const targetFunctionEnd = `
      // Explicação estruturada de IA padronizada
      const aiExplanation = {`;

const newCode = `
      // Identificar ativos da classe que podem explicar o desvio
      const classAssets = portfolio.assets.filter(a => a.assetClass === alloc.assetClass);
      let marketContextExplanation = '';
      let bestPerformingAsset = null;
      let worstPerformingAsset = null;
      
      for (const asset of classAssets) {
        if (asset.historicalPerformance) {
          if (!bestPerformingAsset || (asset.historicalPerformance.twelveMonths || 0) > (bestPerformingAsset.historicalPerformance?.twelveMonths || 0)) {
            bestPerformingAsset = asset;
          }
          if (!worstPerformingAsset || (asset.historicalPerformance.twelveMonths || 0) < (worstPerformingAsset.historicalPerformance?.twelveMonths || 0)) {
            worstPerformingAsset = asset;
          }
        }
      }

      let whyExplanation = 'Variação de mercado e rendimento acumulado dos ativos componentes aumentaram a participação relativa da classe de forma desproporcional sem intervenção recente de caixa.';
      
      if (isOver && bestPerformingAsset && bestPerformingAsset.historicalPerformance?.twelveMonths) {
        const perf = bestPerformingAsset.historicalPerformance.twelveMonths;
        if (perf > 5) {
          marketContextExplanation = \`\${alloc.assetClass} está \${absDeviation.toFixed(1)} p.p. acima do limite; o ativo \${bestPerformingAsset.ticker} valorizou \${perf.toFixed(1)}% em 12 meses, o que explica boa parte do desvio.\`;
          whyExplanation = \`A valorização expressiva de ativos da carteira (ex: \${bestPerformingAsset.ticker} subiu \${perf.toFixed(1)}% em 12 meses) distorceu a alocação relativa para além do limite permitido.\`;
        }
      } else if (!isOver && worstPerformingAsset && worstPerformingAsset.historicalPerformance?.twelveMonths !== undefined) {
        const perf = worstPerformingAsset.historicalPerformance.twelveMonths;
        if (perf < -5) {
          marketContextExplanation = \`\${alloc.assetClass} está \${absDeviation.toFixed(1)} p.p. abaixo do piso; o ativo \${worstPerformingAsset.ticker} desvalorizou \${Math.abs(perf).toFixed(1)}% em 12 meses, pressionando a classe para baixo.\`;
          whyExplanation = \`A desvalorização de ativos da classe (ex: \${worstPerformingAsset.ticker} caiu \${Math.abs(perf).toFixed(1)}% em 12 meses) reduziu a participação relativa para abaixo do piso obrigatório.\`;
        }
      }
      
      // Explicação estruturada de IA padronizada
      const aiExplanation = {`;

code = code.replace(targetFunctionEnd, newCode);

const aiWhyOriginal = 'why: `Variação de mercado e rendimento acumulado dos ativos componentes aumentaram a participação relativa da classe de forma desproporcional sem intervenção recente de caixa.`,';
const aiWhyNew = 'why: whyExplanation,';
code = code.replace(aiWhyOriginal, aiWhyNew);

const objOriginal = `        mandateVsInternalExplanation,
        aiExplanation,
      });`;
const objNew = `        mandateVsInternalExplanation,
        marketContextExplanation,
        aiExplanation,
      });`;
code = code.replace(objOriginal, objNew);

fs.writeFileSync('src/server/complianceAgent.ts', code);
console.log('patched');
