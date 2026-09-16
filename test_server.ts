import { ComplianceAgent } from './src/server/complianceAgent';
import { getPortfoliosRepo } from './src/server/portfolioRepo';
const p = getPortfoliosRepo();
const a = ComplianceAgent.evaluatePerformance(p[0]);
console.log(a);
