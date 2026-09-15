const fs = require('fs');
let code = fs.readFileSync('src/components/common/ComplianceAlertCard.tsx', 'utf-8');

code = code.replace(
  "Desvio Passivo de Mercado (vs. Operação Manual)",
  "Explanation (Market Movement)"
);

fs.writeFileSync('src/components/common/ComplianceAlertCard.tsx', code);
console.log('patched ComplianceAlertCard.tsx');

let agentCode = fs.readFileSync('src/server/complianceAgent.ts', 'utf-8');

// Enhance the marketContextExplanation to be more explicit about price movement vs manual trade
const targetLogic = `if (perf > 5) {
          marketContextExplanation = \`O ativo \${bestPerformingAsset.ticker} valorizou \${perf.toFixed(1)}% nos últimos 12 meses, causando grande parte dos \${absDeviation.toFixed(1)} p.p. de desvio por variação de mercado (desenquadramento passivo), sem necessidade de operação manual recente.\`;`;

const enhancedLogic = `if (perf > 5) {
          marketContextExplanation = \`Breach triggered by passive market movement rather than manual trading. \${bestPerformingAsset.ticker} experienced a \${perf.toFixed(1)}% price increase over the period, artificially inflating the allocation by \${absDeviation.toFixed(1)} p.p. above the mandate.\`;`;

agentCode = agentCode.replace(targetLogic, enhancedLogic);

const targetLogic2 = `if (perf < -5) {
          marketContextExplanation = \`O ativo \${worstPerformingAsset.ticker} desvalorizou \${Math.abs(perf).toFixed(1)}% nos últimos 12 meses, causando grande parte dos -\${absDeviation.toFixed(1)} p.p. de desvio por contração de mercado (desenquadramento passivo), sem necessidade de resgate manual recente.\`;`;

const enhancedLogic2 = `if (perf < -5) {
          marketContextExplanation = \`Breach triggered by passive market contraction rather than manual trading. \${worstPerformingAsset.ticker} experienced a \${Math.abs(perf).toFixed(1)}% price drop, suppressing the allocation \${absDeviation.toFixed(1)} p.p. below the required mandate minimum.\`;`;

agentCode = agentCode.replace(targetLogic2, enhancedLogic2);

fs.writeFileSync('src/server/complianceAgent.ts', agentCode);
console.log('patched complianceAgent.ts');
