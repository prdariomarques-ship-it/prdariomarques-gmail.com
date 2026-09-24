import { checkMarketSession, MarketSessionInfo } from '../utils/marketHours.ts';

export interface ServerMarketAsset {
  ticker: string;
  name: string;
  category: 'INDICES' | 'CAMBIO' | 'COMMODITIES' | 'JUROS';
  value: string;
  change: string;
  isPositive: boolean;
  unit?: string;
  sparkline?: number[];
  lastUpdate: string;
  volume24h?: string;
}

// Base seed de cotações em tempo real atualizadas
let currentQuotes: ServerMarketAsset[] = [
  {
    ticker: 'IBOV',
    name: 'Ibovespa',
    category: 'INDICES',
    value: '137.250',
    unit: 'pts',
    change: '+0,42%',
    isPositive: true,
    sparkline: [136100, 136450, 136800, 137050, 137180, 137250],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'SPX',
    name: 'S&P 500',
    category: 'INDICES',
    value: '5.860',
    unit: 'pts',
    change: '+0,35%',
    isPositive: true,
    sparkline: [5810, 5825, 5840, 5850, 5855, 5860],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'NDX',
    name: 'Nasdaq 100',
    category: 'INDICES',
    value: '20.450',
    unit: 'pts',
    change: '+0,48%',
    isPositive: true,
    sparkline: [20150, 20220, 20290, 20350, 20390, 20450],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'IFIX',
    name: 'IFIX (FIIs B3)',
    category: 'INDICES',
    value: '3.748',
    unit: 'pts',
    change: '+0,18%',
    isPositive: true,
    sparkline: [3710, 3720, 3732, 3740, 3745, 3748],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'IMAB',
    name: 'IMA-B (Tesouro IPCA+)',
    category: 'INDICES',
    value: '12.485',
    unit: 'pts',
    change: '+0,22%',
    isPositive: true,
    sparkline: [12320, 12380, 12410, 12440, 12465, 12485],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'IRFM',
    name: 'IRF-M (Prefixados ANBIMA)',
    category: 'INDICES',
    value: '23.180',
    unit: 'pts',
    change: '+0,12%',
    isPositive: true,
    sparkline: [22950, 23020, 23090, 23130, 23160, 23180],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'CDI',
    name: 'Taxa CDI Over Média',
    category: 'INDICES',
    value: '13,65',
    change: 'Estável',
    isPositive: true,
    unit: '% a.a.',
    sparkline: [12.65, 13.00, 13.25, 13.50, 13.65],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'IPCA',
    name: 'IPCA 12 Meses',
    category: 'INDICES',
    value: '4,25',
    change: '+0,15%',
    isPositive: false,
    unit: '% a.a.',
    sparkline: [4.45, 4.38, 4.30, 4.25, 4.25],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'SELIC',
    name: 'Taxa Selic Meta',
    category: 'JUROS',
    value: '13,75',
    change: 'Estável',
    isPositive: true,
    unit: '% a.a.',
    sparkline: [12.75, 13.00, 13.25, 13.50, 13.75],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'USDBRL',
    name: 'Dólar Comercial (PTAX)',
    category: 'CAMBIO',
    value: '5,48',
    change: '-0,25%',
    isPositive: false,
    sparkline: [5.56, 5.54, 5.51, 5.49, 5.48],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'EURBRL',
    name: 'Euro Comercial',
    category: 'CAMBIO',
    value: '6,08',
    change: '-0,18%',
    isPositive: false,
    sparkline: [6.14, 6.12, 6.10, 6.09, 6.08],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'DI27',
    name: 'DI Jan 2027',
    category: 'JUROS',
    value: '14,25',
    change: '+4 bps',
    isPositive: true,
    unit: '% a.a.',
    sparkline: [14.12, 14.16, 14.20, 14.22, 14.25],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'DI29',
    name: 'DI Jan 2029',
    category: 'JUROS',
    value: '14,65',
    change: '+3 bps',
    isPositive: true,
    unit: '% a.a.',
    sparkline: [14.50, 14.55, 14.58, 14.62, 14.65],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'US10Y',
    name: 'US Treasury 10Y',
    category: 'JUROS',
    value: '4,18',
    change: '-2 bps',
    isPositive: false,
    unit: '% a.a.',
    sparkline: [4.26, 4.24, 4.22, 4.20, 4.18],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'GOLD',
    name: 'Ouro (USD/oz)',
    category: 'COMMODITIES',
    value: '2.685',
    change: '+0,65%',
    isPositive: true,
    sparkline: [2640, 2655, 2670, 2678, 2685],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'BRENT',
    name: 'Petróleo (Brent)',
    category: 'COMMODITIES',
    value: '75,20',
    change: '+2,45%',
    isPositive: true,
    sparkline: [73.2, 73.8, 74.4, 74.9, 75.2],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'BTC',
    name: 'Bitcoin (BTC/USD)',
    category: 'COMMODITIES',
    value: '64.800',
    change: '+1,80%',
    isPositive: true,
    sparkline: [62800, 63400, 64100, 64500, 64800],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'USO',
    name: 'US Oil Fund (WTI)',
    category: 'COMMODITIES',
    value: '78,40',
    change: '+2,85%',
    isPositive: true,
    unit: 'USD',
    sparkline: [75.2, 76.1, 77.0, 77.8, 78.4],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'BNO',
    name: 'Brent Oil ETF (BNO)',
    category: 'COMMODITIES',
    value: '30,15',
    change: '+3,12%',
    isPositive: true,
    unit: 'USD',
    sparkline: [28.8, 29.2, 29.6, 29.9, 30.15],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'DBE',
    name: 'DB Energy (Diesel ULSD)',
    category: 'COMMODITIES',
    value: '21,45',
    change: '+2,75%',
    isPositive: true,
    unit: 'USD',
    sparkline: [20.4, 20.7, 21.0, 21.25, 21.45],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'DBC',
    name: 'DB Commodity Index',
    category: 'COMMODITIES',
    value: '23,80',
    change: '+1,95%',
    isPositive: true,
    unit: 'USD',
    sparkline: [23.1, 23.3, 23.5, 23.65, 23.8],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'PETR4',
    name: 'Petrobras PN',
    category: 'INDICES',
    value: '38,40',
    change: '+1,80%',
    isPositive: true,
    unit: 'R$',
    sparkline: [37.2, 37.6, 37.9, 38.15, 38.4],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'PRIO3',
    name: 'PRIO S.A.',
    category: 'INDICES',
    value: '44,20',
    change: '+2,40%',
    isPositive: true,
    unit: 'R$',
    sparkline: [42.8, 43.1, 43.5, 43.9, 44.2],
    lastUpdate: new Date().toISOString(),
  },
  {
    ticker: 'RAIL3',
    name: 'Rumo S.A. (Logística)',
    category: 'INDICES',
    value: '13,85',
    change: '-2,45%',
    isPositive: false,
    unit: 'R$',
    sparkline: [14.6, 14.4, 14.15, 13.95, 13.85],
    lastUpdate: new Date().toISOString(),
  },
];

// Função que simula o feed intradiário contínuo dos mercados
export function getLiveMarketQuotes(): {
  success: boolean;
  timestamp: string;
  source: string;
  marketStatus: 'OPEN' | 'PRE_MARKET' | 'AFTER_MARKET' | 'CLOSED';
  sessionInfo: MarketSessionInfo;
  quotes: ServerMarketAsset[];
} {
  const now = new Date();
  const nowIso = now.toISOString();
  const sessionInfo = checkMarketSession(now);

  // Aplica micro-oscilações intradiárias apenas nos ativos abertos ou globais
  currentQuotes = currentQuotes.map((asset) => {
    // Se o mercado local estiver fechado, apenas commodities/cripto globais oscilam suavemente
    const isGlobal24h = asset.category === 'COMMODITIES' || asset.ticker === 'BTC';
    if (sessionInfo.status === 'CLOSED' && !isGlobal24h) {
      return asset;
    }

    // 35% de chance de micro-variação em cada chamada (reduzida para 15% em pós-mercado)
    const tickProbability = sessionInfo.status === 'AFTER_MARKET' ? 0.15 : 0.35;
    if (Math.random() < tickProbability) {
      const isCambio = asset.category === 'CAMBIO';
      const isJuros = asset.category === 'JUROS';
      const isCommodity = asset.category === 'COMMODITIES';
      const hasDecimals =
        isCambio ||
        isJuros ||
        (!!asset.unit && asset.unit !== 'pts' && asset.unit !== 'USD') ||
        asset.ticker === 'BRENT' ||
        asset.ticker === 'USO' ||
        asset.ticker === 'BNO' ||
        asset.ticker === 'DBE' ||
        asset.ticker === 'DBC' ||
        asset.ticker === 'PETR4' ||
        asset.ticker === 'PRIO3' ||
        asset.ticker === 'RAIL3';

      // Converte valor formatado pt-BR para float de forma robusta
      let numVal: number;
      if (asset.value.includes(',')) {
        numVal = parseFloat(asset.value.replace(/\./g, '').replace(',', '.'));
      } else if (!hasDecimals) {
        // Números inteiros com separador de milhar (ex: "137.250", "20.450", "12.485", "3.748")
        numVal = parseFloat(asset.value.replace(/\./g, ''));
      } else {
        numVal = parseFloat(asset.value.replace(',', '.'));
      }

      if (!isNaN(numVal)) {
        let delta = 0;
        if (isCambio) {
          delta = (Math.random() - 0.49) * 0.005;
        } else if (isJuros) {
          delta = (Math.random() - 0.49) * 0.01;
        } else if (asset.ticker === 'BRENT' || asset.ticker === 'USO' || asset.ticker === 'BNO') {
          delta = (Math.random() - 0.46) * 0.12; // Leve viés de alta de energia
        } else if (asset.ticker === 'IBOV') {
          delta = (Math.random() - 0.48) * 35;
        } else if (asset.ticker === 'BTC') {
          delta = (Math.random() - 0.48) * 45;
        } else if (asset.ticker === 'SPX' || asset.ticker === 'NDX') {
          delta = (Math.random() - 0.48) * 4;
        } else if (asset.ticker === 'IMAB' || asset.ticker === 'IRFM') {
          delta = (Math.random() - 0.49) * 2.5;
        } else if (asset.ticker === 'IFIX') {
          delta = (Math.random() - 0.49) * 0.8;
        } else {
          delta = (Math.random() - 0.49) * 0.05;
        }

        const updatedVal = Math.max(0.01, numVal + delta);
        const formattedVal = hasDecimals
          ? updatedVal.toFixed(2).replace('.', ',')
          : Math.round(updatedVal).toLocaleString('pt-BR');

        // Atualizar sparkline
        let updatedSpark = asset.sparkline ? [...asset.sparkline] : [];
        if (updatedSpark.length > 0) {
          updatedSpark.push(Math.round(updatedVal * 100) / 100);
          if (updatedSpark.length > 7) {
            updatedSpark.shift();
          }
        }

        return {
          ...asset,
          value: formattedVal,
          isPositive: delta >= 0 ? true : false,
          sparkline: updatedSpark,
          lastUpdate: nowIso,
        };
      }
    }
    return asset;
  });

  return {
    success: true,
    timestamp: nowIso,
    source: 'B3 / Banco Central PTAX / ICE / COMEX / Fed',
    marketStatus: sessionInfo.status,
    sessionInfo,
    quotes: currentQuotes,
  };
}
