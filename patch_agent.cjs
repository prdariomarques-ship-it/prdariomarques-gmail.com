const fs = require('fs');
let code = fs.readFileSync('src/server/complianceAgent.ts', 'utf-8');

const targetStr = "marketContextExplanation = `${alloc.assetClass} está ${absDeviation.toFixed(1)} p.p. acima do limite; o ativo ${bestPerformingAsset.ticker} valorizou ${perf.toFixed(1)}% em 12 meses, o que explica boa parte do desvio.`;";
const replaceStr = "marketContextExplanation = `O ativo ${bestPerformingAsset.ticker} valorizou ${perf.toFixed(1)}% nos últimos 12 meses, causando grande parte dos ${absDeviation.toFixed(1)} p.p. de desvio por variação de mercado (desenquadramento passivo), sem necessidade de operação manual recente.`;";
code = code.replace(targetStr, replaceStr);

const targetStr2 = "marketContextExplanation = `${alloc.assetClass} está ${absDeviation.toFixed(1)} p.p. abaixo do piso; o ativo ${worstPerformingAsset.ticker} desvalorizou ${Math.abs(perf).toFixed(1)}% em 12 meses, pressionando a classe para baixo.`;";
const replaceStr2 = "marketContextExplanation = `O ativo ${worstPerformingAsset.ticker} desvalorizou ${Math.abs(perf).toFixed(1)}% nos últimos 12 meses, causando grande parte dos -${absDeviation.toFixed(1)} p.p. de desvio por contração de mercado (desenquadramento passivo), sem necessidade de resgate manual recente.`;";
code = code.replace(targetStr2, replaceStr2);

fs.writeFileSync('src/server/complianceAgent.ts', code);
console.log('patched agent');
