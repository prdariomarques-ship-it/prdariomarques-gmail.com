import { Portfolio, ComplianceAlert, DataMode, AssetClass } from '../types';
import { ComplianceAgent } from '../server/complianceAgent';

export type SimulationScenario = 'REBALANCE_IDEAL' | 'MARKET_STRESS' | 'LIQUIDITY_INJECTION';
export type ProjectionScenario = 'FULL_PIPELINE' | 'WEIGHTED_PIPELINE';

// 4 Carteiras do Pipeline Comercial Fiduciário para o Modo Projeção
export const PROJECTED_PIPELINE_PORTFOLIOS: Portfolio[] = [
  {
    id: 'port-proj-001',
    name: 'Holding Morumbi Family Office',
    clientName: 'Empresa Demo D S.A.',
    code: 'MORUMBI-FO',
    profile: 'Moderado',
    benchmark: 'IPCA + 5.5% a.a.',
    cashBalance: 822500,
    manager: 'Carlos Eduardo Mendes (CFA)',
    totalAum: 8000000,
    status: 'NORMAL',
    lastRebalanced: '15/03/2026 (Previsão de Fechamento)',
    isProjected: true,
    assets: [
      {
        id: 'ast-p1-1',
        ticker: 'NTN-B 2035',
        name: 'Tesouro IPCA+ 2035',
        assetClass: 'Renda Fixa',
        quantity: 850,
        currentPrice: 4200,
        totalValue: 3570000,
        allocationPercent: 44.6,
      },
      {
        id: 'ast-p1-2',
        ticker: 'KINEA-CRONOS',
        name: 'Kinea Cronos Multimercado FIM',
        assetClass: 'Multimercado',
        quantity: 24000,
        currentPrice: 100,
        totalValue: 2400000,
        allocationPercent: 30.0,
      },
      {
        id: 'ast-p1-3',
        ticker: 'BOVA11',
        name: 'iShares Ibovespa Fundo de Índice',
        assetClass: 'Renda Variável',
        quantity: 10500,
        currentPrice: 115,
        totalValue: 1207500,
        allocationPercent: 15.1,
      },
      {
        id: 'ast-p1-4',
        ticker: 'LFT-SELIC',
        name: 'Tesouro Selic Pós-Fixado (Reserva)',
        assetClass: 'Caixa',
        quantity: 53,
        currentPrice: 15500,
        totalValue: 822500,
        allocationPercent: 10.3,
      },
    ],
    mandateLimits: [
      { assetClass: 'Renda Fixa', targetPercent: 45, maxPercent: 65, minPercent: 30 },
      { assetClass: 'Multimercado', targetPercent: 30, maxPercent: 40, minPercent: 10 },
      { assetClass: 'Renda Variável', targetPercent: 15, maxPercent: 25, minPercent: 0 },
      { assetClass: 'Caixa', targetPercent: 10, maxPercent: 25, minPercent: 3 },
    ],
  },
  {
    id: 'port-proj-002',
    name: 'Dr. Paulo Sampaio Private Capital',
    clientName: 'Cliente Demo E',
    code: 'SAMPAIO-PRIV',
    profile: 'Arrojado',
    benchmark: 'Ibovespa / CDI 50/50',
    cashBalance: 444000,
    manager: 'Carlos Eduardo Mendes (CFA)',
    totalAum: 4500000,
    status: 'NORMAL',
    lastRebalanced: '28/02/2026 (Contrato em Assinatura)',
    isProjected: true,
    assets: [
      {
        id: 'ast-p2-1',
        ticker: 'WEGE3',
        name: 'WEG S.A. ON',
        assetClass: 'Renda Variável',
        quantity: 35000,
        currentPrice: 51.5,
        totalValue: 1802500,
        allocationPercent: 40.1,
      },
      {
        id: 'ast-p2-2',
        ticker: 'IVVB11',
        name: 'iShares S&P 500 BRL',
        assetClass: 'Internacional',
        quantity: 3100,
        currentPrice: 365,
        totalValue: 1131500,
        allocationPercent: 25.1,
      },
      {
        id: 'ast-p2-3',
        ticker: 'DEB-VALE',
        name: 'Debênture Incentivada Vale S.A.',
        assetClass: 'Renda Fixa',
        quantity: 1100,
        currentPrice: 1020,
        totalValue: 1122000,
        allocationPercent: 24.9,
      },
      {
        id: 'ast-p2-4',
        ticker: 'LFT-SELIC',
        name: 'Tesouro Selic Reserva',
        assetClass: 'Caixa',
        quantity: 29,
        currentPrice: 15300,
        totalValue: 444000,
        allocationPercent: 9.9,
      },
    ],
    mandateLimits: [
      { assetClass: 'Renda Variável', targetPercent: 40, maxPercent: 50, minPercent: 15 },
      { assetClass: 'Internacional', targetPercent: 25, maxPercent: 35, minPercent: 5 },
      { assetClass: 'Renda Fixa', targetPercent: 25, maxPercent: 40, minPercent: 10 },
      { assetClass: 'Caixa', targetPercent: 10, maxPercent: 20, minPercent: 2 },
    ],
  },
  {
    id: 'port-proj-003',
    name: 'Grupo Vanguarda Previdência Corporativa',
    clientName: 'Fundação Exemplo Seguridade',
    code: 'VANGUARDA-PREV',
    profile: 'Conservador',
    benchmark: '100% CDI',
    cashBalance: 350000,
    manager: 'Marina Fagundes (CNPI)',
    totalAum: 3500000,
    status: 'NORMAL',
    lastRebalanced: '10/04/2026 (Proposta IPS CMN 4.963)',
    isProjected: true,
    assets: [
      {
        id: 'ast-p3-1',
        ticker: 'NTN-F 2029',
        name: 'Tesouro Prefixado com Juros Semestrais',
        assetClass: 'Renda Fixa',
        quantity: 2450,
        currentPrice: 1000,
        totalValue: 2450000,
        allocationPercent: 70.0,
      },
      {
        id: 'ast-p3-2',
        ticker: 'VERDE-AM-PREV',
        name: 'Verde AM Previdência FIM',
        assetClass: 'Multimercado',
        quantity: 7000,
        currentPrice: 100,
        totalValue: 700000,
        allocationPercent: 20.0,
      },
      {
        id: 'ast-p3-3',
        ticker: 'LFT-SELIC',
        name: 'Caixa Disponível Previdenciário',
        assetClass: 'Caixa',
        quantity: 23,
        currentPrice: 15200,
        totalValue: 350000,
        allocationPercent: 10.0,
      },
    ],
    mandateLimits: [
      { assetClass: 'Renda Fixa', targetPercent: 70, maxPercent: 85, minPercent: 50 },
      { assetClass: 'Multimercado', targetPercent: 20, maxPercent: 30, minPercent: 0 },
      { assetClass: 'Caixa', targetPercent: 10, maxPercent: 25, minPercent: 3 },
    ],
  },
  {
    id: 'port-proj-004',
    name: 'RPPS Fundo Previdenciário do Litoral',
    clientName: 'Instituto Previdenciário Fictício',
    code: 'RPPS-LITORAL',
    profile: 'Conservador',
    benchmark: 'IPCA + 5.89% (Meta Atuarial)',
    cashBalance: 383500,
    manager: 'Renata Vasconcellos (CFA)',
    totalAum: 2500000,
    status: 'NORMAL',
    lastRebalanced: '20/02/2026 (Integralização Prevista)',
    isProjected: true,
    assets: [
      {
        id: 'ast-p4-1',
        ticker: 'NTN-B 2030',
        name: 'Tesouro IPCA+ Soberano 2030',
        assetClass: 'Renda Fixa',
        quantity: 510,
        currentPrice: 4150,
        totalValue: 2116500,
        allocationPercent: 84.7,
      },
      {
        id: 'ast-p4-2',
        ticker: 'LFT-SELIC',
        name: 'Caixa Operacional RPPS',
        assetClass: 'Caixa',
        quantity: 25,
        currentPrice: 15340,
        totalValue: 383500,
        allocationPercent: 15.3,
      },
    ],
    mandateLimits: [
      { assetClass: 'Renda Fixa', targetPercent: 85, maxPercent: 100, minPercent: 70 },
      { assetClass: 'Caixa', targetPercent: 15, maxPercent: 30, minPercent: 5 },
    ],
  },
];

/**
 * Aplica o Rebalanceamento Ideal nas carteiras (Cenário Sandbox Padrão)
 * Todas as classes excedentes são ajustadas em direção à meta (target)
 * e o caixa liberado é reinvestido nas classes deficitárias.
 */
export function applyIdealRebalanceSimulation(basePortfolios: Portfolio[]): Portfolio[] {
  return basePortfolios.map((portfolio) => {
    // Clonagem profunda
    const cloned: Portfolio = JSON.parse(JSON.stringify(portfolio));
    const limits = cloned.mandateLimits || [];

    // Se a carteira já estiver normal, mantém
    const currentAlerts = ComplianceAgent.evaluatePortfolio(cloned);
    const hasBreaches = currentAlerts.some((a) => a.severity === 'CRITICAL' || a.severity === 'WARNING');
    if (!hasBreaches) return cloned;

    const totalVal = cloned.totalAum;
    let freedCash = 0;

    // Ajusta os ativos das classes excedentes para a meta (targetPercent)
    cloned.assets.forEach((asset) => {
      const limit = limits.find((l) => l.assetClass === asset.assetClass);
      if (limit && asset.allocationPercent > limit.targetPercent) {
        // Reduz a alocação para o target
        const targetValue = (limit.targetPercent / 100) * totalVal * (asset.totalValue / (totalVal * (asset.allocationPercent / 100)));
        const excess = Math.max(0, asset.totalValue - targetValue);
        freedCash += excess;
        asset.totalValue = Math.round(targetValue);
        asset.quantity = Math.max(1, Math.round(targetValue / asset.currentPrice));
      }
    });

    // Reinveste o caixa nas classes de menor risco ou deficitárias (Renda Fixa / Caixa)
    if (freedCash > 0) {
      const fixedIncomeAsset = cloned.assets.find((a) => a.assetClass === 'Renda Fixa');
      const cashAsset = cloned.assets.find((a) => a.assetClass === 'Caixa');

      if (fixedIncomeAsset && cashAsset) {
        const toFixed = Math.round(freedCash * 0.7);
        const toCash = freedCash - toFixed;
        fixedIncomeAsset.totalValue += toFixed;
        fixedIncomeAsset.quantity = Math.round(fixedIncomeAsset.totalValue / fixedIncomeAsset.currentPrice);
        cashAsset.totalValue += toCash;
        cashAsset.quantity = Math.round(cashAsset.totalValue / cashAsset.currentPrice);
      } else if (cashAsset) {
        cashAsset.totalValue += freedCash;
        cashAsset.quantity = Math.round(cashAsset.totalValue / cashAsset.currentPrice);
      } else if (fixedIncomeAsset) {
        fixedIncomeAsset.totalValue += freedCash;
        fixedIncomeAsset.quantity = Math.round(fixedIncomeAsset.totalValue / fixedIncomeAsset.currentPrice);
      }
    }

    // Recalcula totais e percentuais
    const newTotal = cloned.assets.reduce((sum, a) => sum + a.totalValue, 0);
    cloned.totalAum = newTotal;
    cloned.assets.forEach((asset) => {
      asset.allocationPercent = Number(((asset.totalValue / newTotal) * 100).toFixed(1));
    });

    cloned.status = 'NORMAL';
    cloned.lastRebalanced = `${new Date().toLocaleDateString('pt-BR')} (Simulação Rebalanceada)`;
    return cloned;
  });
}

/**
 * Aplica Choque Severo de Volatilidade de Mercado (Stress Test CVM)
 * +18% em Ações/Internacional, -8% em Renda Fixa
 */
export function applyStressTestSimulation(basePortfolios: Portfolio[]): Portfolio[] {
  return basePortfolios.map((portfolio) => {
    const cloned: Portfolio = JSON.parse(JSON.stringify(portfolio));

    cloned.assets.forEach((asset) => {
      if (asset.assetClass === 'Renda Variável') {
        asset.currentPrice = Number((asset.currentPrice * 1.18).toFixed(2));
        asset.totalValue = Math.round(asset.quantity * asset.currentPrice);
      } else if (asset.assetClass === 'Internacional') {
        asset.currentPrice = Number((asset.currentPrice * 1.15).toFixed(2));
        asset.totalValue = Math.round(asset.quantity * asset.currentPrice);
      } else if (asset.assetClass === 'Renda Fixa') {
        asset.currentPrice = Number((asset.currentPrice * 0.92).toFixed(2));
        asset.totalValue = Math.round(asset.quantity * asset.currentPrice);
      }
    });

    const newTotal = cloned.assets.reduce((sum, a) => sum + a.totalValue, 0);
    cloned.totalAum = newTotal;
    cloned.assets.forEach((asset) => {
      asset.allocationPercent = Number(((asset.totalValue / newTotal) * 100).toFixed(1));
    });

    cloned.status = ComplianceAgent.getPortfolioOverallSeverity(cloned);
    return cloned;
  });
}

/**
 * Simula Injeção de Liquidez (+R$ 10.0M em Caixa/Renda Fixa nas 4 carteiras)
 * Dilui os excessos sem venda de ativos
 */
export function applyLiquidityInjectionSimulation(basePortfolios: Portfolio[]): Portfolio[] {
  const injectionPerPortfolio = 2500000; // R$ 2.5M por carteira = +R$ 10.0M total

  return basePortfolios.map((portfolio) => {
    const cloned: Portfolio = JSON.parse(JSON.stringify(portfolio));
    const cashAsset = cloned.assets.find((a) => a.assetClass === 'Caixa');

    if (cashAsset) {
      cashAsset.totalValue += injectionPerPortfolio;
      cashAsset.quantity = Math.round(cashAsset.totalValue / cashAsset.currentPrice);
    } else {
      cloned.assets.push({
        id: `ast-inject-${cloned.id}`,
        ticker: 'LFT-SELIC',
        name: 'Tesouro Selic (Novo Aporte de Caixa)',
        assetClass: 'Caixa',
        quantity: Math.round(injectionPerPortfolio / 15400),
        currentPrice: 15400,
        totalValue: injectionPerPortfolio,
        allocationPercent: 0,
      });
    }

    const newTotal = cloned.assets.reduce((sum, a) => sum + a.totalValue, 0);
    cloned.totalAum = newTotal;
    cloned.assets.forEach((asset) => {
      asset.allocationPercent = Number(((asset.totalValue / newTotal) * 100).toFixed(1));
    });

    cloned.status = ComplianceAgent.getPortfolioOverallSeverity(cloned);
    return cloned;
  });
}

/**
 * Gera o dataset completo para os três modos:
 * - LIVE: Base de demonstração normal
 * - SIMULATION: Base modelada segundo o cenário sandbox selecionado
 * - PROJECTION: Base expandida com as carteiras do pipeline comercial
 */
export function resolvePortfoliosAndAlertsForMode(
  basePortfolios: Portfolio[],
  dataMode: DataMode,
  simScenario: SimulationScenario = 'REBALANCE_IDEAL',
  projScenario: ProjectionScenario = 'FULL_PIPELINE'
): { portfolios: Portfolio[]; alerts: ComplianceAlert[] } {
  if (dataMode === 'SIMULATION') {
    let simPortfolios: Portfolio[];
    if (simScenario === 'REBALANCE_IDEAL') {
      simPortfolios = applyIdealRebalanceSimulation(basePortfolios);
    } else if (simScenario === 'MARKET_STRESS') {
      simPortfolios = applyStressTestSimulation(basePortfolios);
    } else {
      simPortfolios = applyLiquidityInjectionSimulation(basePortfolios);
    }
    const alerts = ComplianceAgent.evaluateAllPortfolios(simPortfolios);
    return { portfolios: simPortfolios, alerts };
  }

  if (dataMode === 'PROJECTION') {
    const pipelineToAdd =
      projScenario === 'WEIGHTED_PIPELINE'
        ? PROJECTED_PIPELINE_PORTFOLIOS.slice(0, 3) // Três primeiros com >70% de probabilidade
        : PROJECTED_PIPELINE_PORTFOLIOS;

    const merged = [...basePortfolios, ...pipelineToAdd];
    const alerts = ComplianceAgent.evaluateAllPortfolios(merged);
    return { portfolios: merged, alerts };
  }

  // LIVE DATA: Base original avaliada
  const alerts = ComplianceAgent.evaluateAllPortfolios(basePortfolios);
  return { portfolios: basePortfolios, alerts };
}
