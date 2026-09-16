import { enrichPortfoliosWithMarketData } from './src/server/marketDataService';
async function run() {
  const res = await enrichPortfoliosWithMarketData();
  console.log('Missing Data Assets:', res.missingDataAssets);
}
run();
