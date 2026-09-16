import { Asset, HistoricalPerformance } from '../types.ts';
import { getPortfoliosRepo, updatePortfolioRepo } from './portfolioRepo.ts';

// Simulate fetching real market data.
// In a real scenario, this would call an external API like Economatica, Bloomberg, or Alpha Vantage.
export async function fetchHistoricalPerformance(ticker: string): Promise<HistoricalPerformance | null> {
  // Simulated real data for known tickers in the system
  const mockMarketData: Record<string, HistoricalPerformance> = {
    'SGOV': { twelveMonths: 4.2 },
    'TFLO': { twelveMonths: 5.1 },
    'CDB-BBA-001': { twelveMonths: 10.5 },
    '52678': { twelveMonths: 11.2 }, // DIF CP FICFI
    '56732': { twelveMonths: 10.8 }, // ITAÚ CRÉD BANCÁRIO
    '56855': { twelveMonths: 10.9 }, // OCCAM LIQUIDEZ
    '56081': { twelveMonths: 6.5 },  // ICATU VANGUARDA INFR
    '54430': { twelveMonths: 8.2 },  // KINEA APOLO
  };

  return mockMarketData[ticker] || null;
}

export async function enrichPortfoliosWithMarketData(): Promise<{ missingDataAssets: string[] }> {
  const portfolios = getPortfoliosRepo();
  const missingDataAssets: string[] = [];

  for (const portfolio of portfolios) {
    let modified = false;
    for (const asset of portfolio.assets) {
      const perf = await fetchHistoricalPerformance(asset.ticker);
      if (perf) {
        asset.historicalPerformance = perf;
        modified = true;
      } else {
        // Explictly null/empty instead of estimating
        // @ts-ignore
        asset.historicalPerformance = null;
        missingDataAssets.push(`${asset.ticker} (${asset.name})`);
        modified = true; // Mark modified even if null to ensure it's saved if we care
      }
    }
    if (modified) {
      updatePortfolioRepo(portfolio);
    }
  }

  return { missingDataAssets };
}
