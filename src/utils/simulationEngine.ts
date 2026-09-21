import { Portfolio, Asset, ComplianceAlert } from '../types';

export type StressScenarioId =
  | 'BASELINE'
  | 'EQUITY_DROP_10'
  | 'EQUITY_DROP_20'
  | 'RATES_HIKE_200'
  | 'RATES_HIKE_400'
  | 'STRESS_CRISIS'
  | 'FX_SHOCK_15'
  | 'CREDIT_SPREAD_300'
  | 'REBALANCE_OPTIMAL';

export type SimulationScenario = StressScenarioId;

export type ProjectionScenario = 'BASELINE' | 'PESSIMISTIC' | 'MODERATE' | 'OPTIMISTIC';

export interface StressScenarioDef {
  id: StressScenarioId;
  name: string;
  shortLabel: string;
  tagline: string;
  description: string;
  severity: 'Neutro' | 'Moderado' | 'Alto' | 'Crítico' | 'Otimizado';
  colorBadge: string;
  shocks: {
    equitiesPercent: number;          // Variação em Ações e ETFs de Renda Variável
    fixedIncomePrePercent: number;    // Variação por duration em títulos prefixados/NTN-B
    fixedIncomePostPercent: number;   // Variação em LFT / CDB DI (quase zero valor, aumenta carrego)
    realEstatePercent: number;        // Variação em Fundos Imobiliários (IFIX)
    offshoreFxPercent: number;        // Variação cambial em ativos internacionais (Dólar)
    creditSpreadPercent: number;      // Variação por spread de crédito em Debêntures/CRIs
    cdiNewRate: number;               // Nova taxa Selic/CDI estimada
  };
  hypothesis: string;
}

export const STRESS_SCENARIOS: Record<StressScenarioId, StressScenarioDef> = {
  BASELINE: {
    id: 'BASELINE',
    name: 'Mercado Neutro / Fechamento Vigente',
    shortLabel: 'Neutro (0%)',
    tagline: 'Cenário base sem choques exógenos',
    description: 'Mantém as cotações e taxas reais de fechamento do pregão.',
    severity: 'Neutro',
    colorBadge: 'bg-slate-700/60 text-slate-300 border-slate-600',
    shocks: {
      equitiesPercent: 0,
      fixedIncomePrePercent: 0,
      fixedIncomePostPercent: 0,
      realEstatePercent: 0,
      offshoreFxPercent: 0,
      creditSpreadPercent: 0,
      cdiNewRate: 13.15,
    },
    hypothesis: 'Mercado em equilíbrio com Selic em 13,25% e CDI em 13,15% a.a.',
  },
  EQUITY_DROP_10: {
    id: 'EQUITY_DROP_10',
    name: 'Queda de Bolsa 10%',
    shortLabel: 'Queda Bolsa 10%',
    tagline: 'Correção tática de mercado acionário local e global',
    description: 'Queda de 10% nas ações locais e internacionais, -4% em FIIs e alta de 3% no Dólar como refúgio.',
    severity: 'Moderado',
    colorBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    shocks: {
      equitiesPercent: -10,
      fixedIncomePrePercent: -1.2,
      fixedIncomePostPercent: 0,
      realEstatePercent: -4.0,
      offshoreFxPercent: 3.0,
      creditSpreadPercent: -0.8,
      cdiNewRate: 13.15,
    },
    hypothesis: 'Aversão moderada a risco nos mercados acionários sem alteração na trajetória da Selic.',
  },
  EQUITY_DROP_20: {
    id: 'EQUITY_DROP_20',
    name: 'Queda Severa de Bolsa 20%',
    shortLabel: 'Queda Bolsa 20%',
    tagline: 'Bear market acionário e liquidação de posições em risco',
    description: 'Queda de 20% em ações e equities globais, retração de 8% em FIIs e valorização de 7% no Dólar.',
    severity: 'Crítico',
    colorBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    shocks: {
      equitiesPercent: -20,
      fixedIncomePrePercent: -2.5,
      fixedIncomePostPercent: 0,
      realEstatePercent: -8.0,
      offshoreFxPercent: 7.0,
      creditSpreadPercent: -2.0,
      cdiNewRate: 13.50,
    },
    hypothesis: 'Correção severa de múltiplos de lucros com flight-to-safety para ativos pós-fixados e moeda forte.',
  },
  RATES_HIKE_200: {
    id: 'RATES_HIKE_200',
    name: 'Alta de Juros 2% (+200 bps)',
    shortLabel: 'Alta Juros 2%',
    tagline: 'Aperto monetário e abertura de taxas na curva futura de DI',
    description: 'Selic sobe para 15,25%. Títulos prefixados e indexados à inflação (NTN-B) sofrem marcação a mercado média de -4,5% pela duration.',
    severity: 'Alto',
    colorBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    shocks: {
      equitiesPercent: -4.0,
      fixedIncomePrePercent: -4.5,
      fixedIncomePostPercent: 0,
      realEstatePercent: -5.0,
      offshoreFxPercent: -1.5,
      creditSpreadPercent: -1.8,
      cdiNewRate: 15.15,
    },
    hypothesis: 'Copom acelera alta de juros para conter desancoragem inflacionária; duration longa é penalizada.',
  },
  RATES_HIKE_400: {
    id: 'RATES_HIKE_400',
    name: 'Alta Severa de Juros 4% (+400 bps)',
    shortLabel: 'Alta Juros 4%',
    tagline: 'Choque severo de juros com Selic a 17,25%',
    description: 'Marcação a mercado de -9,0% em títulos prefixados e debêntures longas, compressão de múltiplos em bolsa.',
    severity: 'Crítico',
    colorBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    shocks: {
      equitiesPercent: -9.0,
      fixedIncomePrePercent: -9.0,
      fixedIncomePostPercent: 0,
      realEstatePercent: -10.0,
      offshoreFxPercent: -2.0,
      creditSpreadPercent: -3.5,
      cdiNewRate: 17.15,
    },
    hypothesis: 'Crise de prêmio de risco fiscal com disparada dos DIs longos e forte perda de valor patrimonial em títulos com duration > 3 anos.',
  },
  STRESS_CRISIS: {
    id: 'STRESS_CRISIS',
    name: 'Crise Sistêmica Combinada',
    shortLabel: 'Crise Combinada',
    tagline: 'Choque triplo: Bolsa -15%, Juros +3% e Dólar +12%',
    description: 'Pior combinação macroeconômica: desvalorização de renda variável, marcação negativa de duration e pressão cambial.',
    severity: 'Crítico',
    colorBadge: 'bg-red-600/25 text-red-300 border-red-500/40',
    shocks: {
      equitiesPercent: -15,
      fixedIncomePrePercent: -6.5,
      fixedIncomePostPercent: 0,
      realEstatePercent: -8.5,
      offshoreFxPercent: 12.0,
      creditSpreadPercent: -4.2,
      cdiNewRate: 16.15,
    },
    hypothesis: 'Eventos simultâneos de aversão a risco global, fuga de capitais locais e estresse de crédito corporativo.',
  },
  FX_SHOCK_15: {
    id: 'FX_SHOCK_15',
    name: 'Choque Cambial (Dólar +15%)',
    shortLabel: 'Dólar +15%',
    tagline: 'Desvalorização abrupta do Real testando o teto CVM 175',
    description: 'Dólar dispara de R$ 5,82 para R$ 6,69. Posições offshore valorizam em reais e correm risco de extrapolar o limite regulatório de 20%.',
    severity: 'Moderado',
    colorBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    shocks: {
      equitiesPercent: -3.0,
      fixedIncomePrePercent: -2.0,
      fixedIncomePostPercent: 0,
      realEstatePercent: -1.5,
      offshoreFxPercent: 15.0,
      creditSpreadPercent: -1.0,
      cdiNewRate: 14.15,
    },
    hypothesis: 'Desvalorização do Real frente ao Dólar gera valorização passiva das posições no exterior e risco de desenquadramento passivo CVM 175.',
  },
  CREDIT_SPREAD_300: {
    id: 'CREDIT_SPREAD_300',
    name: 'Abertura de Spreads de Crédito (+300 bps)',
    shortLabel: 'Spreads Crédito +300bps',
    tagline: 'Estresse de liquidez secundária em debêntures, CRIs e CRAs',
    description: 'Desvalorização de -4,5% nos ativos de crédito privado por alargamento de spread de risco de crédito.',
    severity: 'Alto',
    colorBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    shocks: {
      equitiesPercent: -2.0,
      fixedIncomePrePercent: -1.0,
      fixedIncomePostPercent: 0,
      realEstatePercent: -3.5,
      offshoreFxPercent: 2.0,
      creditSpreadPercent: -4.5,
      cdiNewRate: 13.15,
    },
    hypothesis: 'Dificuldade de liquidez e reprecificação de spreads em emissões corporativas privadas.',
  },
  REBALANCE_OPTIMAL: {
    id: 'REBALANCE_OPTIMAL',
    name: 'Carteira Pós-Rebalanceamento Fiduciário',
    shortLabel: 'Pós-Rebalanceamento',
    tagline: 'Carteira imunizada com colchão de liquidez Selic e limites 100% CVM 175',
    description: 'Simulação da carteira após a execução de ordens preventivas de rebalanceamento fiduciário.',
    severity: 'Otimizado',
    colorBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    shocks: {
      equitiesPercent: 0,
      fixedIncomePrePercent: 0.5,
      fixedIncomePostPercent: 0,
      realEstatePercent: 0.2,
      offshoreFxPercent: 0,
      creditSpreadPercent: 0,
      cdiNewRate: 13.15,
    },
    hypothesis: 'Execução do plano de rebalanceamento preventivo zera desvios e maximiza resiliência.',
  },
};

export interface PortfolioResilienceReport {
  portfolioId: string;
  portfolioName: string;
  scenarioId: StressScenarioId;
  scenarioName: string;
  baseAum: number;
  stressedAum: number;
  pnlBrl: number;
  pnlPercent: number;
  resilienceScore: number; // 0 to 100
  resilienceClassification: 'MÁXIMA RESILIÊNCIA' | 'ALTA RESILIÊNCIA' | 'RESILIÊNCIA MODERADA' | 'VULNERÁVEL';
  cushionBufferPercent: number; // % in Cash + Post-fixed LFT
  offshoreStressedWeight: number; // % in offshore post-shock
  cvm175BreachedUnderStress: boolean;
  keyInsights: string[];
  recommendedAction: string;
}

/**
 * Calcula o impacto do cenário de estresse em uma carteira específica.
 */
export function calculatePortfolioStress(
  portfolio: Portfolio,
  scenarioId: StressScenarioId
): {
  stressedPortfolio: Portfolio;
  report: PortfolioResilienceReport;
} {
  const scenario = STRESS_SCENARIOS[scenarioId] || STRESS_SCENARIOS.BASELINE;
  const shocks = scenario.shocks;

  let cushionValue = 0;
  let offshoreValue = 0;

  const stressedAssets: Asset[] = portfolio.assets.map((asset) => {
    let shockMultiplier = 1.0;
    const assetClass = asset.assetClass;
    const assetName = (asset.name || '').toUpperCase();
    const ticker = (asset.ticker || '').toUpperCase();
    const sector = (asset.sector || '').toUpperCase();

    const isOffshore =
      assetClass === 'Internacional' ||
      sector.includes('GLOBAL') ||
      sector.includes('EUA') ||
      ticker.includes('SGOV') ||
      ticker.includes('TFLO') ||
      ticker.includes('SPY') ||
      assetName.includes('GLOBAL') ||
      assetName.includes('OFFSHORE');

    const isEquities =
      assetClass === 'Renda Variável' ||
      sector.includes('AÇÕES') ||
      sector.includes('EQUITIES') ||
      assetName.includes('AÇÕES');

    const isRealEstate =
      assetName.includes('FII') ||
      ticker.endsWith('11') && !ticker.startsWith('BOVA');

    const isCreditPrivado =
      assetName.includes('DEBÊNTURE') ||
      assetName.includes('CRI') ||
      assetName.includes('CRA');

    const isPreFixedOrInflation =
      assetName.includes('IPCA+') ||
      assetName.includes('PREFIXADO') ||
      assetName.includes('NTN-B');

    const isPostFixedOrCash =
      assetClass === 'Caixa' ||
      assetName.includes('SELIC') ||
      assetName.includes('CDI') ||
      assetName.includes('TESOURO SELIC') ||
      assetName.includes('CDB DI');

    if (isPostFixedOrCash) {
      cushionValue += asset.totalValue;
      shockMultiplier += shocks.fixedIncomePostPercent / 100;
    } else if (isEquities) {
      shockMultiplier += shocks.equitiesPercent / 100;
    } else if (isRealEstate) {
      shockMultiplier += shocks.realEstatePercent / 100;
    } else if (isCreditPrivado) {
      shockMultiplier += (shocks.creditSpreadPercent + shocks.fixedIncomePrePercent * 0.5) / 100;
    } else if (isPreFixedOrInflation) {
      shockMultiplier += shocks.fixedIncomePrePercent / 100;
    }

    if (isOffshore) {
      // Impacto cambial offshore
      shockMultiplier += shocks.offshoreFxPercent / 100;
    }

    // Garante que o multiplicador nunca seja negativo
    shockMultiplier = Math.max(0.05, shockMultiplier);

    const newTotalValue = Math.round(asset.totalValue * shockMultiplier * 100) / 100;
    const newWeight = portfolio.totalAum > 0 ? (newTotalValue / portfolio.totalAum) * 100 : asset.allocationPercent;

    if (isOffshore) {
      offshoreValue += newTotalValue;
    }

    return {
      ...asset,
      totalValue: newTotalValue,
      allocationPercent: newWeight,
    };
  });

  const stressedAum = stressedAssets.reduce((sum, a) => sum + a.totalValue, 0);
  const baseAum = portfolio.totalAum;
  const pnlBrl = stressedAum - baseAum;
  const pnlPercent = baseAum > 0 ? (pnlBrl / baseAum) * 100 : 0;

  // Recalcular pesos exatos com base no novo AUM estressado
  const normalizedAssets = stressedAssets.map((asset) => ({
    ...asset,
    allocationPercent: stressedAum > 0 ? Math.round((asset.totalValue / stressedAum) * 10000) / 100 : 0,
  }));

  const cushionBufferPercent = baseAum > 0 ? (cushionValue / baseAum) * 100 : 0;
  const offshoreStressedWeight = stressedAum > 0 ? (offshoreValue / stressedAum) * 100 : 0;
  const cvm175BreachedUnderStress = offshoreStressedWeight > 20.0;

  // Cálculo de Score de Resiliência (0 - 100)
  // Baseado na retenção de valor e no colchão defensivo
  let resilienceScore = 100 + pnlPercent * 4.5 + (cushionBufferPercent - 30) * 0.5;
  if (cvm175BreachedUnderStress) resilienceScore -= 15;
  resilienceScore = Math.max(15, Math.min(99, Math.round(resilienceScore)));

  let resilienceClassification: 'MÁXIMA RESILIÊNCIA' | 'ALTA RESILIÊNCIA' | 'RESILIÊNCIA MODERADA' | 'VULNERÁVEL';
  if (resilienceScore >= 85) {
    resilienceClassification = 'MÁXIMA RESILIÊNCIA';
  } else if (resilienceScore >= 72) {
    resilienceClassification = 'ALTA RESILIÊNCIA';
  } else if (resilienceScore >= 55) {
    resilienceClassification = 'RESILIÊNCIA MODERADA';
  } else {
    resilienceClassification = 'VULNERÁVEL';
  }

  const keyInsights: string[] = [];
  if (pnlPercent < -5) {
    keyInsights.push(`Drawdown projetado de ${pnlPercent.toFixed(1)}% (-R$ ${Math.abs(pnlBrl).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}) em caso de estresse severo.`);
  } else if (pnlPercent < 0) {
    keyInsights.push(`Impacto controlado de ${pnlPercent.toFixed(1)}% amortecido pela alocação defensiva.`);
  } else {
    keyInsights.push(`Carteira preserva capital com variação neutra/positiva (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%).`);
  }

  if (cushionBufferPercent >= 35) {
    keyInsights.push(`Colchão de liquidez robusto de ${cushionBufferPercent.toFixed(1)}% em CDI/Tesouro Selic age como estabilizador.`);
  } else {
    keyInsights.push(`Baixo colchão de caixa (${cushionBufferPercent.toFixed(1)}%), elevando vulnerabilidade a choques de liquidez.`);
  }

  if (cvm175BreachedUnderStress) {
    keyInsights.push(`⚠️ Alerta CVM 175: Valorização do Dólar eleva a posição exterior para ${offshoreStressedWeight.toFixed(1)}%, rompendo o teto de 20%.`);
  }

  let recommendedAction = 'Manter monitoramento de liquidez e enquadramento regulatório periódico.';
  if (cvm175BreachedUnderStress) {
    recommendedAction = 'Executar rebalanceamento preventivo de ativos offshore para evitar desenquadramento passivo CVM 175.';
  } else if (resilienceScore < 60) {
    recommendedAction = 'Aumentar a alocação em LFT D+0 e reduzir duration de títulos prefixados para blindar o patrimônio.';
  } else if (scenarioId === 'EQUITY_DROP_10' || scenarioId === 'EQUITY_DROP_20') {
    recommendedAction = 'Aproveitar a assimetria pós-queda para recomprar ações defensivas com desconto dentro da banda de tolerância.';
  }

  const stressedPortfolio: Portfolio = {
    ...portfolio,
    totalAum: stressedAum,
    assets: normalizedAssets,
  };

  const report: PortfolioResilienceReport = {
    portfolioId: portfolio.id,
    portfolioName: portfolio.clientName || portfolio.name,
    scenarioId,
    scenarioName: scenario.name,
    baseAum,
    stressedAum,
    pnlBrl,
    pnlPercent,
    resilienceScore,
    resilienceClassification,
    cushionBufferPercent,
    offshoreStressedWeight,
    cvm175BreachedUnderStress,
    keyInsights,
    recommendedAction,
  };

  return { stressedPortfolio, report };
}

/**
 * Resolve todas as carteiras e alertas de acordo com o DataMode e o cenário de simulação selecionado.
 */
export function resolvePortfoliosAndAlertsForMode(
  portfolios: Portfolio[],
  alerts: ComplianceAlert[],
  mode: 'LIVE' | 'SIMULATION' | 'PROJECTION',
  simulationScenario: SimulationScenario = 'BASELINE',
  projectionScenario: ProjectionScenario = 'BASELINE'
): {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  stressReports: Record<string, PortfolioResilienceReport>;
  aggregatedResilience: {
    totalBaseAum: number;
    totalStressedAum: number;
    totalPnlBrl: number;
    totalPnlPercent: number;
    averageScore: number;
    breachedPortfoliosCount: number;
  };
} {
  if (mode === 'LIVE' && simulationScenario === 'BASELINE') {
    return {
      portfolios,
      alerts,
      stressReports: {},
      aggregatedResilience: {
        totalBaseAum: portfolios.reduce((s, p) => s + p.totalAum, 0),
        totalStressedAum: portfolios.reduce((s, p) => s + p.totalAum, 0),
        totalPnlBrl: 0,
        totalPnlPercent: 0,
        averageScore: 92,
        breachedPortfoliosCount: 0,
      },
    };
  }

  const effectiveScenario = mode === 'SIMULATION' ? simulationScenario : 'BASELINE';
  const stressReports: Record<string, PortfolioResilienceReport> = {};

  let totalBaseAum = 0;
  let totalStressedAum = 0;
  let scoreSum = 0;
  let breachedCount = 0;

  const stressedPortfolios = portfolios.map((portfolio) => {
    const { stressedPortfolio, report } = calculatePortfolioStress(portfolio, effectiveScenario);
    stressReports[portfolio.id] = report;

    totalBaseAum += report.baseAum;
    totalStressedAum += report.stressedAum;
    scoreSum += report.resilienceScore;
    if (report.cvm175BreachedUnderStress) {
      breachedCount += 1;
    }

    return stressedPortfolio;
  });

  const totalPnlBrl = totalStressedAum - totalBaseAum;
  const totalPnlPercent = totalBaseAum > 0 ? (totalPnlBrl / totalBaseAum) * 100 : 0;
  const averageScore = portfolios.length > 0 ? Math.round(scoreSum / portfolios.length) : 85;

  // Gerar alertas complementares gerados pelo estresse
  const dynamicStressAlerts: ComplianceAlert[] = [];
  if (effectiveScenario !== 'BASELINE') {
    stressedPortfolios.forEach((p) => {
      const rep = stressReports[p.id];
      if (rep && rep.cvm175BreachedUnderStress) {
        dynamicStressAlerts.push({
          id: `stress-cvm-${p.id}`,
          portfolioId: p.id,
          portfolioName: p.name,
          clientName: p.clientName || p.name,
          assetClass: 'Internacional',
          severity: 'CRITICAL',
          message: `Risco de Desenquadramento CVM 175 sob Estresse (${STRESS_SCENARIOS[effectiveScenario].shortLabel}): No cenário ${STRESS_SCENARIOS[effectiveScenario].name}, a exposição internacional sobe para ${rep.offshoreStressedWeight.toFixed(1)}%, ultrapassando o limite fiduciário de 20%.`,
          suggestedAction: rep.recommendedAction,
          currentPercent: rep.offshoreStressedWeight,
          targetPercent: 15.0,
          maxPercent: 20.0,
          minPercent: 0,
          deviationPP: rep.offshoreStressedWeight - 20.0,
          excessValueBRL: Math.round(((rep.offshoreStressedWeight - 20.0) / 100) * rep.stressedAum),
          recommendedTradeValue: Math.round(((rep.offshoreStressedWeight - 20.0) / 100) * rep.stressedAum),
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          ruleSource: 'REGRA_REGULATORIA',
          policyId: 'CVM-175-ART-64',
          limit: 20.0,
          currentValue: rep.offshoreStressedWeight,
          difference: rep.offshoreStressedWeight - 20.0,
          effectiveDate: new Date().toISOString().split('T')[0],
          tolerancePP: 1.0,
        });
      }
    });
  }

  return {
    portfolios: stressedPortfolios,
    alerts: [...alerts, ...dynamicStressAlerts],
    stressReports,
    aggregatedResilience: {
      totalBaseAum,
      totalStressedAum,
      totalPnlBrl,
      totalPnlPercent,
      averageScore,
      breachedPortfoliosCount: breachedCount,
    },
  };
}
