import { initialPortfolios } from './src/server/portfolioRepo.ts';
console.log(initialPortfolios.length);
console.log(initialPortfolios.map(p => p.clientName));
