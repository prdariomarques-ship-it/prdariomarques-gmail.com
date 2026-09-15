const fs = require('fs');

let chatView = fs.readFileSync('src/components/AiComplianceChatView.tsx', 'utf-8');
chatView = chatView.replace('da Carteira Alpha Wealth para', 'da Carteira Miguel para');
fs.writeFileSync('src/components/AiComplianceChatView.tsx', chatView);

let portfolioRepo = fs.readFileSync('src/server/portfolioRepo.ts', 'utf-8');
portfolioRepo = portfolioRepo.replace('Mandato Bilateral Alpha Wealth Private', 'Mandato Bilateral Carteira Miguel');
portfolioRepo = portfolioRepo.replace('do cliente Cliente Demo A', 'do cliente Miguel');
portfolioRepo = portfolioRepo.replace('Fundo Horizon', 'Fundo de Previdência');
portfolioRepo = portfolioRepo.replace('POL-HORIZON-PREV', 'POL-PREV-001');
fs.writeFileSync('src/server/portfolioRepo.ts', portfolioRepo);

let policyEngine = fs.readFileSync('src/policyEngine.ts', 'utf-8');
policyEngine = policyEngine.replaceAll('Alpha Wealth Private (Roberto Silveira)', 'Carteira Miguel');
policyEngine = policyEngine.replaceAll('Alpha Wealth Strategy (Roberto Silveira)', 'Carteira Miguel');
policyEngine = policyEngine.replaceAll('Horizonte Previdência & Renda Fixa (Beatriz Drummond)', 'Carteira Miguel (Previdência)');
fs.writeFileSync('src/policyEngine.ts', policyEngine);

console.log('mocks cleaned');
