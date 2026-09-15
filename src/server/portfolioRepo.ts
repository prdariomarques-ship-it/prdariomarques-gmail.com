import { Portfolio, AssetClass, MandateLimit, Policy, AssetClassThresholdConfig } from '../types';

export const initialPolicies: Policy[] = [
  {
    id: 'IPS-AW-001',
    code: 'IPS-AW-001',
    name: 'Mandato Bilateral Carteira Miguel (IPS Registrado)',
    type: 'MANDATO_CLIENTE',
    version: 'v2.4',
    effectiveDate: '01/01/2026',
    description: 'Declaração formal de política de investimentos (IPS) acordada bilateralmente com o titular e arquivada para fins de auditoria.',
    status: 'ACTIVE',
    rules: [
      {
        id: 'rul-aw-01',
        policyId: 'IPS-AW-001',
        assetClass: 'Renda Variável',
        profile: 'Moderado',
        minPercent: 10,
        targetPercent: 25,
        maxPercent: 35,
        tolerancePP: 5.0,
        source: 'MANDATO_CLIENTE',
        strictness: 'HARD_STOP',
        effectiveDate: '01/01/2026',
        description: 'Teto máximo de ações locais estipulado no mandato do cliente Miguel.',
      },
      {
        id: 'rul-aw-02',
        policyId: 'IPS-AW-001',
        assetClass: 'Renda Fixa',
        profile: 'Moderado',
        minPercent: 40,
        targetPercent: 50,
        maxPercent: 65,
        tolerancePP: 5.0,
        source: 'MANDATO_CLIENTE',
        strictness: 'HARD_STOP',
        effectiveDate: '01/01/2026',
      },
      {
        id: 'rul-aw-03',
        policyId: 'IPS-AW-001',
        assetClass: 'Caixa',
        profile: 'Moderado',
        minPercent: 2,
        targetPercent: 5,
        maxPercent: 10,
        tolerancePP: 2.0,
        source: 'MANDATO_CLIENTE',
        strictness: 'WARNING_TOLERANCE',
        effectiveDate: '01/01/2026',
      },
    ],
  },
  {
    id: 'POL-PREV-001',
    code: 'POL-HORIZON-PREV',
    name: 'Diretriz Interna de Alocação e Risco Previdenciário',
    type: 'POLITICA_INTERNA',
    version: 'v3.1',
    effectiveDate: '15/12/2025',
    description: 'Manual interno de risco e alocação do comitê de investimentos para mandatos de previdência PGBL/VGBL.',
    status: 'ACTIVE',
    rules: [
      {
        id: 'rul-hz-01',
        policyId: 'POL-HORIZON-PREV',
        assetClass: 'Multimercado',
        profile: 'Conservador',
        minPercent: 0,
        targetPercent: 10,
        maxPercent: 15,
        tolerancePP: 3.0,
        source: 'POLITICA_INTERNA',
        strictness: 'WARNING_TOLERANCE',
        effectiveDate: '15/12/2025',
        description: 'Limite interno da gestora para exposição a fundos multimercados.',
      },
    ],
  },
  {
    id: 'CVM-175-ANEXO-I',
    code: 'CVM-175-ANEXO-I',
    name: 'Resolução CVM 175 - Limites de Ativos no Exterior & Liquidez',
    type: 'REGRA_REGULATORIA',
    version: 'Res. CVM 175',
    effectiveDate: '02/10/2023',
    description: 'Regulamentação geral de fundos de investimento e carteiras administradas pela CVM, Anexo Normativo I.',
    status: 'ACTIVE',
    rules: [
      {
        id: 'rul-cvm-01',
        policyId: 'CVM-175-ANEXO-I',
        assetClass: 'Internacional',
        profile: 'Arrojado',
        minPercent: 0,
        targetPercent: 20,
        maxPercent: 25,
        tolerancePP: 5.0,
        source: 'REGRA_REGULATORIA',
        strictness: 'HARD_STOP',
        effectiveDate: '02/10/2023',
        description: 'Teto de 25% para investidores qualificados sem anexo específico de exterior.',
      },
    ],
  },
  {
    id: 'RES-CMN-4963-RPPS',
    code: 'RES-CMN-4963-RPPS',
    name: 'Resolução CMN nº 4.963/2021 - Aplicações dos Regimes Próprios (RPPS)',
    type: 'REGRA_REGULATORIA',
    version: 'CMN 4.963',
    effectiveDate: '25/11/2021',
    description: 'Diretrizes do Conselho Monetário Nacional para limites de alocação de recursos previdenciários de servidores públicos.',
    status: 'ACTIVE',
    rules: [
      {
        id: 'rul-rpps-01',
        policyId: 'RES-CMN-4963-RPPS',
        assetClass: 'Renda Variável',
        profile: 'Moderado',
        minPercent: 15,
        targetPercent: 25,
        maxPercent: 35,
        tolerancePP: 3.5,
        source: 'REGRA_REGULATORIA',
        strictness: 'HARD_STOP',
        effectiveDate: '25/11/2021',
        description: 'Teto de alocação em ações e índices para RPPS no segmento de renda variável.',
      },
    ],
  },
  {
    id: 'SUIT-MODERADO-V2',
    code: 'SUIT-MODERADO-V2',
    name: 'Matriz de Adequação de Suitability CVM 30 - Moderado',
    type: 'SUITABILITY',
    version: 'v2.0',
    effectiveDate: '01/06/2024',
    description: 'Limites de risco para perfil de investidor Moderado conforme regras de suitability da CVM e ANBIMA.',
    status: 'ACTIVE',
    rules: [
      {
        id: 'rul-suit-01',
        policyId: 'SUIT-MODERADO-V2',
        assetClass: 'Renda Variável',
        profile: 'Moderado',
        minPercent: 0,
        targetPercent: 20,
        maxPercent: 35,
        tolerancePP: 5.0,
        source: 'SUITABILITY',
        strictness: 'HARD_STOP',
        effectiveDate: '01/06/2024',
      },
    ],
  },
];

export const initialPortfolios: Portfolio[] = [
  {
    id: 'port-miguel-001',
    name: 'Carteira Miguel',
    clientName: 'Miguel',
    code: 'MIGUEL-001',
    manager: '',
    profile: 'Arrojado',
    benchmark: 'CDI',
    totalAum: 3999016.90,
    cashBalance: 0,
    lastRebalanced: '',
    status: 'NORMAL',
    assignedPolicyId: undefined,
    mandateLimits: [],
    assets: [
      {
        id: 'ast-miguel-cdb-001',
        ticker: 'CDB-BBA-001',
        name: 'CDB ITAU BBA POS',
        assetClass: 'Renda Fixa',
        sector: 'Pós-fixado',
        quantity: 100,
        currentPrice: 1000,
        totalValue: 100000.00,
        allocationPercent: 2.5,
        productType: 'tesouraria_banco',
        isTaxExempt: false,
      },
      // ── Pós-fixado — 9 produtos, R$ 3.028.755,91 (Itaú) ──
      {
        id: 'ast-miguel-52678',
        ticker: '52678',
        name: 'DIF CP FICFI',
        assetClass: 'Renda Fixa',
        sector: 'Pós-fixado',
        quantity: 25362.95,
        currentPrice: 30.88711,
        totalValue: 783388.21,
        allocationPercent: 19.59,
        cnpj: '20.335.522/0001-51',
        productType: 'asset_gestora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-56732',
        ticker: '56732',
        name: 'ITAÚ CRÉD BANCÁRIO',
        assetClass: 'Renda Fixa',
        sector: 'Pós-fixado',
        quantity: 402846.98,
        currentPrice: 1.4612,
        totalValue: 588640.00,
        allocationPercent: 14.72,
        cnpj: '51.998.694/0001-39',
        productType: 'asset_gestora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-56855',
        ticker: '56855',
        name: 'OCCAM LIQUIDEZ',
        assetClass: 'Renda Fixa',
        sector: 'Pós-fixado',
        quantity: 293187.23,
        currentPrice: 1.750704,
        totalValue: 513284.04,
        allocationPercent: 12.84,
        productType: 'asset_gestora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-59138',
        ticker: '59138',
        name: 'SEL KINEA ATACAMA RF',
        assetClass: 'Renda Fixa',
        sector: 'Pós-fixado',
        quantity: 465508.63,
        currentPrice: 1.039109,
        totalValue: 483714.18,
        allocationPercent: 12.10,
        cnpj: '08.604.187/0001-44',
        productType: 'asset_gestora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-58336',
        ticker: '58336',
        name: 'MAPFRE CONFIANZA RF',
        assetClass: 'Renda Fixa',
        sector: 'Pós-fixado',
        quantity: 204466.5,
        currentPrice: 1.505606,
        totalValue: 307845.95,
        allocationPercent: 7.70,
        productType: 'asset_gestora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-57559',
        ticker: '57559',
        name: 'BTG PACTUAL CORP SEL',
        assetClass: 'Renda Fixa',
        sector: 'Pós-fixado',
        quantity: 195142.28,
        currentPrice: 1.307091,
        totalValue: 255068.71,
        allocationPercent: 6.38,
        productType: 'asset_gestora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-58989',
        ticker: '58989',
        name: 'ITAÚ SELEÇÃO IBIUNA',
        assetClass: 'Renda Fixa',
        sector: 'Pós-fixado',
        quantity: 86203.35,
        currentPrice: 1.063998,
        totalValue: 91720.18,
        allocationPercent: 2.29,
        productType: 'asset_gestora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-54170',
        ticker: '54170',
        name: 'JGP SELECT FICFI MM',
        assetClass: 'Renda Fixa',
        sector: 'Pós-fixado',
        quantity: 253.5,
        currentPrice: 20.093145,
        totalValue: 5093.56,
        allocationPercent: 0.13,
        productType: 'asset_gestora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-atenas',
        ticker: 'ATENAS-VGBL',
        name: 'Itau Absolute Atenas Prev Rf Cp Vgbl',
        assetClass: 'Renda Fixa',
        sector: 'Pós-fixado',
        quantity: 0.69,
        currentPrice: 1.564843,
        totalValue: 1.08,
        allocationPercent: 0.00,
        productType: 'asset_gestora',
        isTaxExempt: false,
      },

      // ── Renda Fixa Ativo — 3 produtos, R$ 462.390,45 (Itaú) ──
      {
        id: 'ast-miguel-56294',
        ticker: '56294',
        name: 'BTG PACTUAL RF SEL',
        assetClass: 'Renda Fixa',
        sector: 'Renda Fixa Ativo',
        quantity: 170721.21,
        currentPrice: 1.498636,
        totalValue: 255848.95,
        allocationPercent: 6.40,
        productType: 'asset_gestora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-58343',
        ticker: '58343',
        name: 'VINLAND RF ATIVO SEL',
        assetClass: 'Renda Fixa',
        sector: 'Renda Fixa Ativo',
        quantity: 137387.82,
        currentPrice: 1.119348,
        totalValue: 153784.76,
        allocationPercent: 3.85,
        productType: 'asset_gestora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-50246',
        ticker: '50246',
        name: 'ITAÚ BTG PACTUAL RF',
        assetClass: 'Renda Fixa',
        sector: 'Renda Fixa Ativo',
        quantity: 882.48,
        currentPrice: 59.782514,
        totalValue: 52756.74,
        allocationPercent: 1.32,
        productType: 'asset_gestora',
        isTaxExempt: false,
      },

      // ── Inflação — 1 produto, R$ 152.171,68 (Itaú) ──
      {
        id: 'ast-miguel-56081',
        ticker: '56081',
        name: 'ICATU VANGUARDA INFR',
        assetClass: 'Renda Fixa',
        sector: 'Inflação',
        quantity: 106647.95,
        currentPrice: 1.42686,
        totalValue: 152171.68,
        allocationPercent: 3.81,
        productType: 'asset_gestora',
        isTaxExempt: true,
        taxExemptionReason: 'Fundo de Debêntures Incentivadas',
      },

      // ── Multimercado — 2 produtos, R$ 105.106,46 (Itaú) ──
      {
        id: 'ast-miguel-54430',
        ticker: '54430',
        name: 'KINEA APOLO FIC MM',
        assetClass: 'Multimercado',
        sector: 'Multimercado',
        quantity: 5305.25,
        currentPrice: 18.84927,
        totalValue: 100000.00,
        allocationPercent: 2.50,
        productType: 'asset_gestora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-54169',
        ticker: '54169',
        name: 'JGP CORPORATE PLUS',
        assetClass: 'Multimercado',
        sector: 'Multimercado',
        quantity: 251.27,
        currentPrice: 20.322752,
        totalValue: 5106.46,
        allocationPercent: 0.13,
        productType: 'asset_gestora',
        isTaxExempt: false,
      },

      // ── Avenue (offshore, USD convertido a 5,27) — 2 produtos ──
      {
        id: 'ast-miguel-sgov',
        ticker: 'SGOV',
        name: 'iShares 0-3 Month Treasury Bond ETF',
        assetClass: 'Internacional',
        sector: 'Avenue — orig. US$ 24.965,80 @ 5,27',
        quantity: 248,
        currentPrice: 529.8458,
        averagePrice: 530.5836,
        totalValue: 131569.77,
        unrealizedGainBRL: -183.19,
        unrealizedGainPercent: -0.13,
        allocationPercent: 3.29,
        productType: 'corretora',
        isTaxExempt: false,
      },
      {
        id: 'ast-miguel-tflo',
        ticker: 'TFLO',
        name: 'iShares Treasury Floating Rate Bond ETF',
        assetClass: 'Internacional',
        sector: 'Avenue — orig. US$ 22.584,94 @ 5,27',
        quantity: 447,
        currentPrice: 266.5566,
        averagePrice: 266.9255,
        totalValue: 119022.63,
        unrealizedGainBRL: -164.69,
        unrealizedGainPercent: -0.13,
        allocationPercent: 2.98,
        productType: 'corretora',
        isTaxExempt: false,
      },
    ],
  },
];

// In-memory store that can be modified when simulated rebalancing occurs
let storePortfolios: Portfolio[] = JSON.parse(JSON.stringify(initialPortfolios));
let storePolicies: Policy[] = JSON.parse(JSON.stringify(initialPolicies));

export function getPortfoliosRepo(): Portfolio[] {
  return storePortfolios;
}

export function getPortfolioByIdRepo(id: string): Portfolio | undefined {
  return storePortfolios.find((p) => p.id === id);
}

export function updatePortfolioRepo(updated: Portfolio): void {
  const index = storePortfolios.findIndex((p) => p.id === updated.id);
  if (index !== -1) {
    storePortfolios[index] = updated;
  }
}

export function resetPortfoliosRepo(): Portfolio[] {
  storePortfolios = JSON.parse(JSON.stringify(initialPortfolios));
  return storePortfolios;
}

/**
 * Simula volatilidade súbita ou choque de mercado em uma carteira para gerar
 * um novo alerta crítico de desenquadramento em tempo real.
 */
export function simulateMarketShockRepo(targetPortfolioId?: string): {
  success: boolean;
  portfolio: Portfolio;
  affectedAsset: string;
  previousPercent: number;
  newPercent: number;
} {
  // Prioriza port-004 (que começa normal/enquadrada) ou a carteira solicitada
  let target = storePortfolios.find((p) => p.id === (targetPortfolioId || 'port-004'));
  if (!target) {
    target = storePortfolios[0];
  }

  // Encontra ativo de renda variável ou internacional para choque de alta
  const equityAssets = target.assets.filter((a) => a.assetClass === 'Renda Variável');
  const targetAsset = equityAssets.length > 0 ? equityAssets[0] : target.assets[0];

  const previousAllocation = targetAsset.allocationPercent;

  // Aplica choque expressivo de preço (+80%) no ativo para violar o teto do mandato com folga
  targetAsset.currentPrice = Math.round(targetAsset.currentPrice * 1.8 * 100) / 100;
  targetAsset.totalValue = targetAsset.quantity * targetAsset.currentPrice;

  // Recalcula valor total e percentuais da carteira
  const newTotalAum = target.assets.reduce((sum, a) => sum + a.totalValue, 0);
  target.totalAum = newTotalAum;
  for (const a of target.assets) {
    a.allocationPercent = Math.round((a.totalValue / newTotalAum) * 10000) / 100;
  }

  target.status = 'CRITICAL';
  const newAllocation = targetAsset.allocationPercent;

  return {
    success: true,
    portfolio: target,
    affectedAsset: targetAsset.ticker,
    previousPercent: previousAllocation,
    newPercent: newAllocation,
  };
}

export function getPoliciesRepo(): Policy[] {
  return storePolicies;
}

export function getPolicyByIdRepo(id: string): Policy | undefined {
  return storePolicies.find((p) => p.id === id);
}

export const defaultAssetClassThresholds: AssetClassThresholdConfig[] = [
  {
    assetClass: 'Renda Variável',
    minPercent: 10,
    targetPercent: 25,
    maxPercent: 35,
    warningTolerancePP: 2.0,
    criticalTolerancePP: 5.0,
    warningTriggerPercent: 33.0,
    criticalTriggerPercent: 40.0,
    sourceDescription: 'Mandato Bilateral IPS & CVM 175',
    notes: 'Ações B3, ETFs locais, BDRs Nível I/II',
  },
  {
    assetClass: 'Renda Fixa',
    minPercent: 40,
    targetPercent: 50,
    maxPercent: 65,
    warningTolerancePP: 3.0,
    criticalTolerancePP: 5.0,
    warningTriggerPercent: 62.0,
    criticalTriggerPercent: 70.0,
    sourceDescription: 'Resolução CMN 4.963 / ANBIMA',
    notes: 'Títulos públicos federais, Debêntures incentivadas, CDBs',
  },
  {
    assetClass: 'Internacional',
    minPercent: 0,
    targetPercent: 15,
    maxPercent: 20,
    warningTolerancePP: 2.0,
    criticalTolerancePP: 5.0,
    warningTriggerPercent: 18.0,
    criticalTriggerPercent: 25.0,
    sourceDescription: 'Resolução CVM 175 Anexo I (Teto Geral 20%)',
    notes: 'ETFs globais, fundos offshore 332, ADRs',
  },
  {
    assetClass: 'Multimercado',
    minPercent: 0,
    targetPercent: 10,
    maxPercent: 15,
    warningTolerancePP: 2.0,
    criticalTolerancePP: 3.0,
    warningTriggerPercent: 13.0,
    criticalTriggerPercent: 18.0,
    sourceDescription: 'Diretriz Interna de Risco & Alocação',
    notes: 'Fundos Macro, Quantitativos, Long & Short',
  },
  {
    assetClass: 'Caixa',
    minPercent: 2,
    targetPercent: 5,
    maxPercent: 10,
    warningTolerancePP: 1.0,
    criticalTolerancePP: 2.0,
    warningTriggerPercent: 9.0,
    criticalTriggerPercent: 12.0,
    sourceDescription: 'Gestão de Liquidez & Disponibilidades',
    notes: 'Operações compromissadas overnight, CDI diário',
  },
];

let storeAssetClassThresholds: AssetClassThresholdConfig[] = JSON.parse(
  JSON.stringify(defaultAssetClassThresholds)
);

export function getLimitsConfigRepo(portfolioId?: string): AssetClassThresholdConfig[] {
  if (portfolioId && portfolioId !== 'all') {
    const portfolio = storePortfolios.find((p) => p.id === portfolioId);
    if (portfolio && portfolio.mandateLimits.length > 0) {
      return portfolio.mandateLimits.map((ml) => {
        const base = storeAssetClassThresholds.find((t) => t.assetClass === ml.assetClass);
        return {
          assetClass: ml.assetClass,
          minPercent: ml.minPercent,
          targetPercent: ml.targetPercent,
          maxPercent: ml.maxPercent,
          warningTolerancePP: ml.warningTolerancePP ?? base?.warningTolerancePP ?? 2.0,
          criticalTolerancePP: ml.criticalTolerancePP ?? ml.tolerancePP ?? base?.criticalTolerancePP ?? 5.0,
          warningTriggerPercent:
            ml.warningTriggerPercent ?? (base?.warningTriggerPercent ?? ml.maxPercent - 2.0),
          criticalTriggerPercent:
            ml.criticalTriggerPercent ?? (base?.criticalTriggerPercent ?? ml.maxPercent + (ml.tolerancePP ?? 5.0)),
          sourceDescription: base?.sourceDescription,
          notes: base?.notes,
        };
      });
    }
  }
  return storeAssetClassThresholds;
}

export function updateLimitsConfigRepo(
  configs: AssetClassThresholdConfig[],
  portfolioId?: string
): Portfolio[] {
  // Atualiza thresholds armazenados globalmente
  storeAssetClassThresholds = JSON.parse(JSON.stringify(configs));

  // Aplica aos portfólios correspondentes
  for (const port of storePortfolios) {
    if (!portfolioId || portfolioId === 'all' || port.id === portfolioId) {
      for (const cfg of configs) {
        const existingLimit = port.mandateLimits.find((l) => l.assetClass === cfg.assetClass);
        if (existingLimit) {
          existingLimit.minPercent = cfg.minPercent;
          existingLimit.targetPercent = cfg.targetPercent;
          existingLimit.maxPercent = cfg.maxPercent;
          existingLimit.warningTolerancePP = cfg.warningTolerancePP;
          existingLimit.criticalTolerancePP = cfg.criticalTolerancePP;
          existingLimit.tolerancePP = cfg.criticalTolerancePP;
          existingLimit.warningTriggerPercent = cfg.warningTriggerPercent;
          existingLimit.criticalTriggerPercent = cfg.criticalTriggerPercent;
        } else {
          port.mandateLimits.push({
            assetClass: cfg.assetClass,
            minPercent: cfg.minPercent,
            targetPercent: cfg.targetPercent,
            maxPercent: cfg.maxPercent,
            tolerancePP: cfg.criticalTolerancePP,
            warningTolerancePP: cfg.warningTolerancePP,
            criticalTolerancePP: cfg.criticalTolerancePP,
            warningTriggerPercent: cfg.warningTriggerPercent,
            criticalTriggerPercent: cfg.criticalTriggerPercent,
            ruleSource: 'POLITICA_INTERNA',
          });
        }
      }
    }
  }

  return storePortfolios;
}

export function resetLimitsConfigRepo(): AssetClassThresholdConfig[] {
  storeAssetClassThresholds = JSON.parse(JSON.stringify(defaultAssetClassThresholds));
  return storeAssetClassThresholds;
}
