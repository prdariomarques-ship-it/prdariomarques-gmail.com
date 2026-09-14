import { Portfolio, Asset } from '../types';

export interface LiquidityTier {
  id: string;
  name: string;
  label: string;
  timeframe: string;
  valueBRL: number;
  percentage: number;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  assetClasses: string[];
}

export interface PortfolioLiquidityItem {
  portfolioId: string;
  portfolioName: string;
  clientName: string;
  totalAum: number;
  d0Value: number;
  d0Percent: number;
  d1PlusValue: number;
  d1PlusPercent: number;
  liquidityStatus: 'ADEQUATE' | 'WARNING' | 'CRITICAL';
  statusLabel: string;
}

export interface ConsolidatedLiquiditySummary {
  totalAum: number;
  d0ValueBRL: number;
  d0Percent: number;
  d1PlusValueBRL: number;
  d1PlusPercent: number;
  minimumRequiredD0Percent: number; // e.g. 10.0%
  minimumRequiredD0ValueBRL: number;
  excessD0ValueBRL: number; // Folga de liquidez imediata acima do mínimo
  liquidityHealthScore: number; // 0 a 100
  liquidityStatus: 'EXCELLENT' | 'ADEQUATE' | 'ATTENTION' | 'CRITICAL';
  liquidityStatusText: string;
  coverageDaysEst: number; // Dias de cobertura estimada para saques normais
  tiers: LiquidityTier[];
  portfolioBreakdown: PortfolioLiquidityItem[];
}

/**
 * Classifica a liquidez de um ativo financeiro individual com base em sua classe,
 * ticker e perfil de liquidação do mercado brasileiro e internacional.
 */
export function classifyAssetLiquidityTier(asset: Asset): 'D0' | 'D1' | 'D2_D5' | 'D6_D30' | 'D30_PLUS' {
  const tickerUpper = (asset.ticker || '').toUpperCase();
  const nameUpper = (asset.name || '').toUpperCase();

  // D+0: Caixa puro, reservas imediatas, fundos DI D+0, compromissadas
  if (
    asset.assetClass === 'Caixa' ||
    tickerUpper.includes('SELIC') ||
    tickerUpper.includes('CAIXA') ||
    tickerUpper.includes('CASH') ||
    nameUpper.includes('CAIXA') ||
    nameUpper.includes('RESERVA') ||
    nameUpper.includes('LIQUIDEZ DIÁRIA')
  ) {
    return 'D0';
  }

  // D+1: Títulos públicos federais (Tesouro Direto / NTN-F / LFT D+1)
  if (
    tickerUpper.startsWith('NTN') ||
    tickerUpper.startsWith('LFT') ||
    tickerUpper.startsWith('LTN') ||
    nameUpper.includes('TESOURO')
  ) {
    return 'D1';
  }

  // D+2 a D+5: Ações da B3 (T+2), ETFs de índice (BOVA11, SMAL11, IVVB11), BDRs
  if (
    asset.assetClass === 'Renda Variável' ||
    asset.assetClass === 'Internacional' ||
    tickerUpper.endsWith('11') ||
    tickerUpper.endsWith('3') ||
    tickerUpper.endsWith('4') ||
    tickerUpper.endsWith('34')
  ) {
    return 'D2_D5';
  }

  // D+6 a D+30: Fundos Multimercado (cotização padrão D+30), FIIs com menor liquidez
  if (asset.assetClass === 'Multimercado' || nameUpper.includes('FIM') || nameUpper.includes('MULTIMERCADO')) {
    return 'D6_D30';
  }

  // D+30+ ou carência: Crédito Privado fechado (CDB com carência, Debêntures, CRI, CRA)
  return 'D30_PLUS';
}

/**
 * Calcula o Índice de Liquidez Imediata consolidado para o portfólio completo
 * e o comparativo D+0 versus D+1 ou superior.
 */
export function calculateConsolidatedLiquidity(portfolios: Portfolio[]): ConsolidatedLiquiditySummary {
  let totalAum = 0;
  let d0Value = 0;
  let d1Value = 0;
  let d2to5Value = 0;
  let d6to30Value = 0;
  let d30PlusValue = 0;

  const portfolioBreakdown: PortfolioLiquidityItem[] = [];

  for (const port of portfolios) {
    let portD0 = port.cashBalance || 0;
    let portD1Plus = 0;
    let portTotal = 0;

    // Processa os ativos de cada carteira
    if (Array.isArray(port.assets)) {
      for (const asset of port.assets) {
        const val = asset.totalValue || 0;
        portTotal += val;

        const tier = classifyAssetLiquidityTier(asset);
        if (tier === 'D0') {
          portD0 += val;
          d0Value += val;
        } else if (tier === 'D1') {
          portD1Plus += val;
          d1Value += val;
        } else if (tier === 'D2_D5') {
          portD1Plus += val;
          d2to5Value += val;
        } else if (tier === 'D6_D30') {
          portD1Plus += val;
          d6to30Value += val;
        } else {
          portD1Plus += val;
          d30PlusValue += val;
        }
      }
    }

    // Adiciona saldo de caixa não alocado à soma global de D+0
    if (port.cashBalance && port.cashBalance > 0) {
      d0Value += port.cashBalance;
      portTotal += port.cashBalance;
    }

    totalAum += portTotal;

    const d0Pct = portTotal > 0 ? Number(((portD0 / portTotal) * 100).toFixed(1)) : 0;
    const d1PlusPct = portTotal > 0 ? Number(((portD1Plus / portTotal) * 100).toFixed(1)) : 0;

    let status: 'ADEQUATE' | 'WARNING' | 'CRITICAL' = 'ADEQUATE';
    let statusLabel = 'Adequado (≥ 10%)';

    if (d0Pct < 5.0) {
      status = 'CRITICAL';
      statusLabel = 'Crítico (< 5%)';
    } else if (d0Pct < 10.0) {
      status = 'WARNING';
      statusLabel = 'Atenção (5% a 10%)';
    }

    portfolioBreakdown.push({
      portfolioId: port.id,
      portfolioName: port.name,
      clientName: port.clientName,
      totalAum: portTotal,
      d0Value: portD0,
      d0Percent: d0Pct,
      d1PlusValue: portD1Plus,
      d1PlusPercent: d1PlusPct,
      liquidityStatus: status,
      statusLabel,
    });
  }

  // Se totalAum for 0, usa fallback seguro
  if (totalAum === 0) {
    totalAum = 1;
  }

  const d1PlusValue = d1Value + d2to5Value + d6to30Value + d30PlusValue;

  const d0Percent = Number(((d0Value / totalAum) * 100).toFixed(1));
  const d1PlusPercent = Number(((d1PlusValue / totalAum) * 100).toFixed(1));

  // Parâmetros fiduciários de liquidez (Meta prudencial de 10% em D+0)
  const minimumRequiredD0Percent = 10.0;
  const minimumRequiredD0ValueBRL = Math.round(totalAum * (minimumRequiredD0Percent / 100));
  const excessD0ValueBRL = d0Value - minimumRequiredD0ValueBRL;

  // Classificação de saúde de liquidez consolidada
  let liquidityStatus: 'EXCELLENT' | 'ADEQUATE' | 'ATTENTION' | 'CRITICAL' = 'ADEQUATE';
  let liquidityStatusText = 'Liquidez Imediata em Nível Seguro';

  if (d0Percent >= 15.0) {
    liquidityStatus = 'EXCELLENT';
    liquidityStatusText = 'Excelente Reserva Imediata';
  } else if (d0Percent >= 10.0) {
    liquidityStatus = 'ADEQUATE';
    liquidityStatusText = 'Adequado • Cumpre Diretrizes CVM 175';
  } else if (d0Percent >= 6.0) {
    liquidityStatus = 'ATTENTION';
    liquidityStatusText = 'Atenção • Próximo ao Limite Prudencial';
  } else {
    liquidityStatus = 'CRITICAL';
    liquidityStatusText = 'Crítico • Abaixo da Reserva Técnica Mínima';
  }

  // Health Score (0 a 100)
  const liquidityHealthScore = Math.min(
    100,
    Math.max(10, Math.round((d0Percent / minimumRequiredD0Percent) * 80 + 10))
  );

  // Estimativa de dias de cobertura para resgates médios normais da base
  const coverageDaysEst = Math.round((d0Percent / 10) * 45);

  const tiers: LiquidityTier[] = [
    {
      id: 'd0',
      name: 'D+0',
      label: 'Liquidez Imediata (D+0)',
      timeframe: 'Mesmo Dia',
      valueBRL: d0Value,
      percentage: d0Percent,
      color: '#10b981', // emerald-500
      bgColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      description: 'Caixa livre, fundos DI D+0 e ativos resgatáveis no mesmo dia útil.',
      assetClasses: ['Caixa', 'Reservas Imediatas'],
    },
    {
      id: 'd1',
      name: 'D+1',
      label: 'Curto Prazo (D+1)',
      timeframe: '1 Dia Útil',
      valueBRL: d1Value,
      percentage: Number(((d1Value / totalAum) * 100).toFixed(1)),
      color: '#06b6d4', // cyan-500
      bgColor: 'rgba(6, 182, 212, 0.15)',
      borderColor: 'rgba(6, 182, 212, 0.4)',
      description: 'Títulos públicos federais Tesouro Direto e papéis sovereign pós-fixados.',
      assetClasses: ['Renda Fixa Soberana'],
    },
    {
      id: 'd2_d5',
      name: 'D+2 a D+5',
      label: 'Ciclo B3 (D+2 a D+5)',
      timeframe: '2 a 5 Dias Úteis',
      valueBRL: d2to5Value,
      percentage: Number(((d2to5Value / totalAum) * 100).toFixed(1)),
      color: '#6366f1', // indigo-500
      bgColor: 'rgba(99, 102, 241, 0.15)',
      borderColor: 'rgba(99, 102, 241, 0.4)',
      description: 'Ações locais B3, ETFs e BDRs internacionais com liquidação T+2.',
      assetClasses: ['Renda Variável', 'Internacional'],
    },
    {
      id: 'd6_d30',
      name: 'D+6 a D+30',
      label: 'Fundos de Gestão Ativa (D+6 a D+30)',
      timeframe: '6 a 30 Dias',
      valueBRL: d6to30Value,
      percentage: Number(((d6to30Value / totalAum) * 100).toFixed(1)),
      color: '#f59e0b', // amber-500
      bgColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      description: 'Fundos Multimercado (FIM) com prazos de cotização intermediários.',
      assetClasses: ['Multimercado'],
    },
    {
      id: 'd30_plus',
      name: 'D+30+',
      label: 'Crédito Privado & Carência (D+30+)',
      timeframe: '> 30 Dias / Vencimento',
      valueBRL: d30PlusValue,
      percentage: Number(((d30PlusValue / totalAum) * 100).toFixed(1)),
      color: '#8b5cf6', // purple-500
      bgColor: 'rgba(139, 92, 246, 0.15)',
      borderColor: 'rgba(139, 92, 246, 0.4)',
      description: 'Debêntures, CDBs com carência e papéis de crédito estruturado.',
      assetClasses: ['Crédito Privado', 'Estruturados'],
    },
  ];

  return {
    totalAum,
    d0ValueBRL: d0Value,
    d0Percent,
    d1PlusValueBRL: d1PlusValue,
    d1PlusPercent,
    minimumRequiredD0Percent,
    minimumRequiredD0ValueBRL,
    excessD0ValueBRL,
    liquidityHealthScore,
    liquidityStatus,
    liquidityStatusText,
    coverageDaysEst,
    tiers,
    portfolioBreakdown,
  };
}
