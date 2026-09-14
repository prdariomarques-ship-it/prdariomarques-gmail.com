import { Portfolio, AssetClass, MandateLimit, Policy, AssetClassThresholdConfig } from '../types';

export const initialPolicies: Policy[] = [
  {
    id: 'IPS-AW-001',
    code: 'IPS-AW-001',
    name: 'Mandato Bilateral Alpha Wealth Private (IPS Registrado)',
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
        description: 'Teto máximo de ações locais estipulado no mandato do cliente Cliente Demo A.',
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
    id: 'POL-HORIZON-PREV',
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
    id: 'port-001',
    name: 'Carteira Alpha Wealth Private',
    clientName: 'Cliente Demo A & Família',
    code: 'AW-7821',
    manager: 'Carlos Eduardo Mendes (CFA)',
    profile: 'Moderado',
    benchmark: 'CDI + 2.5%',
    totalAum: 4850000, // R$ 4,85 milhões
    cashBalance: 120000,
    lastRebalanced: '15/01/2026',
    status: 'CRITICAL', // Renda Variável está em 43.3% vs teto 35% (+8.3 p.p.)
    assignedPolicyId: 'IPS-AW-001',
    mandateLimits: [
      { assetClass: 'Renda Fixa', minPercent: 40, targetPercent: 50, maxPercent: 65, policyId: 'IPS-AW-001', ruleSource: 'MANDATO_CLIENTE', tolerancePP: 5.0 },
      { assetClass: 'Renda Variável', minPercent: 10, targetPercent: 25, maxPercent: 35, policyId: 'IPS-AW-001', ruleSource: 'MANDATO_CLIENTE', tolerancePP: 5.0 },
      { assetClass: 'Internacional', minPercent: 5, targetPercent: 15, maxPercent: 20, policyId: 'CVM-175-ANEXO-I', ruleSource: 'REGRA_REGULATORIA', tolerancePP: 3.0 },
      { assetClass: 'Multimercado', minPercent: 0, targetPercent: 10, maxPercent: 15, policyId: 'POL-HORIZON-PREV', ruleSource: 'POLITICA_INTERNA', tolerancePP: 5.0 },
      { assetClass: 'Caixa', minPercent: 2, targetPercent: 5, maxPercent: 10, policyId: 'IPS-AW-001', ruleSource: 'MANDATO_CLIENTE', tolerancePP: 2.0 },
    ],
    assets: [
      {
        id: 'ast-101',
        ticker: 'PETR4',
        name: 'Petrobras PN',
        assetClass: 'Renda Variável',
        quantity: 18000,
        currentPrice: 38.50,
        totalValue: 693000,
        allocationPercent: 14.29,
        averagePrice: 42.00,
        unrealizedGainBRL: -63000,
        unrealizedGainPercent: -8.33,
        taxRatePercent: 15,
        isTaxExempt: false,
      },
      {
        id: 'ast-102',
        ticker: 'VALE3',
        name: 'Vale S.A. ON',
        assetClass: 'Renda Variável',
        quantity: 11000,
        currentPrice: 62.20,
        totalValue: 684200,
        allocationPercent: 14.11,
        averagePrice: 51.50,
        unrealizedGainBRL: 117700,
        unrealizedGainPercent: 20.78,
        taxRatePercent: 15,
        isTaxExempt: false,
      },
      {
        id: 'ast-103',
        ticker: 'ITUB4',
        name: 'Itaú Unibanco PN',
        assetClass: 'Renda Variável',
        quantity: 21000,
        currentPrice: 34.40,
        totalValue: 722400,
        allocationPercent: 14.89,
        averagePrice: 33.80,
        unrealizedGainBRL: 12600,
        unrealizedGainPercent: 1.78,
        taxRatePercent: 15,
        isTaxExempt: false,
      },
      {
        id: 'ast-104',
        ticker: 'NTN-B 2035',
        name: 'Tesouro IPCA+ com Juros Semestrais',
        assetClass: 'Renda Fixa',
        quantity: 350,
        currentPrice: 4200.00,
        totalValue: 1470000,
        allocationPercent: 30.31,
        averagePrice: 3950.00,
        unrealizedGainBRL: 87500,
        unrealizedGainPercent: 6.33,
        holdingPeriodDays: 820,
        taxRatePercent: 15,
        isTaxExempt: false,
      },
      {
        id: 'ast-105',
        ticker: 'CDB-BTG-115',
        name: 'CDB BTG Pactual 115% CDI 2027',
        assetClass: 'Renda Fixa',
        quantity: 500,
        currentPrice: 1000.00,
        totalValue: 500000,
        allocationPercent: 10.31,
        averagePrice: 1000.00,
        unrealizedGainBRL: 0,
        unrealizedGainPercent: 0,
        holdingPeriodDays: 450,
        taxRatePercent: 17.5,
        isTaxExempt: false,
      },
      {
        id: 'ast-106',
        ticker: 'IVVB11',
        name: 'iShares S&P 500 Fundo de Índice',
        assetClass: 'Internacional',
        quantity: 1800,
        currentPrice: 365.00,
        totalValue: 657000,
        allocationPercent: 13.55,
        averagePrice: 315.00,
        unrealizedGainBRL: 90000,
        unrealizedGainPercent: 15.87,
        taxRatePercent: 15,
        isTaxExempt: false,
      },
      {
        id: 'ast-107',
        ticker: 'LFT-SELIC',
        name: 'Tesouro Selic 2028 (Caixa)',
        assetClass: 'Caixa',
        quantity: 8,
        currentPrice: 15425.00,
        totalValue: 123400,
        allocationPercent: 2.54,
        averagePrice: 15425.00,
        unrealizedGainBRL: 0,
        unrealizedGainPercent: 0,
        taxRatePercent: 15,
        isTaxExempt: false,
      },
    ],
  },
  {
    id: 'port-002',
    name: 'Fundo Horizon Previdência PGBL',
    clientName: 'Empresa Exemplo S.A.',
    code: 'HZ-4091',
    manager: 'Marina Fagundes (CNPI)',
    profile: 'Conservador',
    benchmark: 'IPCA + 5.5%',
    totalAum: 12400000, // R$ 12,4 milhões
    cashBalance: 450000,
    lastRebalanced: '02/02/2026',
    status: 'WARNING', // Multimercado está em 18.5% vs teto de 15% (+3.5 p.p. -> ATENÇÃO POLÍTICA INTERNA)
    assignedPolicyId: 'POL-HORIZON-PREV',
    mandateLimits: [
      { assetClass: 'Renda Fixa', minPercent: 60, targetPercent: 75, maxPercent: 85, policyId: 'POL-HORIZON-PREV', ruleSource: 'POLITICA_INTERNA', tolerancePP: 5.0 },
      { assetClass: 'Multimercado', minPercent: 0, targetPercent: 10, maxPercent: 15, policyId: 'POL-HORIZON-PREV', ruleSource: 'POLITICA_INTERNA', tolerancePP: 3.0 },
      { assetClass: 'Renda Variável', minPercent: 0, targetPercent: 8, maxPercent: 10, policyId: 'SUIT-MODERADO-V2', ruleSource: 'SUITABILITY', tolerancePP: 2.0 },
      { assetClass: 'Internacional', minPercent: 0, targetPercent: 5, maxPercent: 10, policyId: 'CVM-175-ANEXO-I', ruleSource: 'REGRA_REGULATORIA', tolerancePP: 2.0 },
      { assetClass: 'Caixa', minPercent: 2, targetPercent: 5, maxPercent: 10, policyId: 'POL-HORIZON-PREV', ruleSource: 'POLITICA_INTERNA', tolerancePP: 2.0 },
    ],
    assets: [
      {
        id: 'ast-201',
        ticker: 'TESOURO-IPCA-2045',
        name: 'NTN-B Principal 2045',
        assetClass: 'Renda Fixa',
        quantity: 4500,
        currentPrice: 1450.00,
        totalValue: 6525000,
        allocationPercent: 52.62,
      },
      {
        id: 'ast-202',
        ticker: 'DEB-VALE-2029',
        name: 'Debênture Incentivada Vale IPCA+6.8%',
        assetClass: 'Renda Fixa',
        quantity: 2100,
        currentPrice: 1100.00,
        totalValue: 2310000,
        allocationPercent: 18.63,
      },
      {
        id: 'ast-203',
        ticker: 'KINEA-CRONOS-FIM',
        name: 'Kinea Cronos FIM Previdenciário',
        assetClass: 'Multimercado',
        quantity: 1150000,
        currentPrice: 2.00,
        totalValue: 2300000,
        allocationPercent: 18.55,
      },
      {
        id: 'ast-204',
        ticker: 'SPX-NIMBUS-FIC',
        name: 'SPX Nimbus FIC FIM Previdência',
        assetClass: 'Renda Variável',
        quantity: 450000,
        currentPrice: 1.80,
        totalValue: 810000,
        allocationPercent: 6.53,
      },
      {
        id: 'ast-205',
        ticker: 'CAIXA-SELIC',
        name: 'Fundo DI Caixa Liquidez',
        assetClass: 'Caixa',
        quantity: 455000,
        currentPrice: 1.00,
        totalValue: 455000,
        allocationPercent: 3.67,
      },
    ],
  },
  {
    id: 'port-003',
    name: 'Portfólio Solaris Tech Inovação',
    clientName: 'Cliente Demo B & Associados',
    code: 'SOL-9912',
    manager: 'Guilherme Rocha (CGA)',
    profile: 'Arrojado',
    benchmark: 'S&P 500 (BRL) 60% + Ibov 40%',
    totalAum: 3200000,
    cashBalance: 80000,
    lastRebalanced: '20/01/2026',
    status: 'CRITICAL', // Internacional em 34.2% vs teto de 25% (+9.2 p.p. -> REGRA REGULATÓRIA CVM 175)
    assignedPolicyId: 'CVM-175-ANEXO-I',
    mandateLimits: [
      { assetClass: 'Renda Fixa', minPercent: 15, targetPercent: 25, maxPercent: 40, policyId: 'POL-HORIZON-PREV', ruleSource: 'POLITICA_INTERNA', tolerancePP: 5.0 },
      { assetClass: 'Renda Variável', minPercent: 25, targetPercent: 45, maxPercent: 55, policyId: 'IPS-AW-001', ruleSource: 'MANDATO_CLIENTE', tolerancePP: 5.0 },
      { assetClass: 'Internacional', minPercent: 10, targetPercent: 20, maxPercent: 25, policyId: 'CVM-175-ANEXO-I', ruleSource: 'REGRA_REGULATORIA', tolerancePP: 5.0 },
      { assetClass: 'Multimercado', minPercent: 0, targetPercent: 10, maxPercent: 20, policyId: 'POL-HORIZON-PREV', ruleSource: 'POLITICA_INTERNA', tolerancePP: 5.0 },
      { assetClass: 'Caixa', minPercent: 2, targetPercent: 5, maxPercent: 10, policyId: 'IPS-AW-001', ruleSource: 'MANDATO_CLIENTE', tolerancePP: 2.0 },
    ],
    assets: [
      {
        id: 'ast-301',
        ticker: 'NASD11',
        name: 'Trend Nasdaq 100 ETF',
        assetClass: 'Internacional',
        quantity: 4800,
        currentPrice: 135.00,
        totalValue: 648000,
        allocationPercent: 20.25,
      },
      {
        id: 'ast-302',
        ticker: 'NVDC34',
        name: 'NVIDIA Corp BDR',
        assetClass: 'Internacional',
        quantity: 3500,
        currentPrice: 128.00,
        totalValue: 448000,
        allocationPercent: 14.00,
      },
      {
        id: 'ast-303',
        ticker: 'BOVA11',
        name: 'iShares Ibovespa ETF',
        assetClass: 'Renda Variável',
        quantity: 9000,
        currentPrice: 132.00,
        totalValue: 1188000,
        allocationPercent: 37.13,
      },
      {
        id: 'ast-304',
        ticker: 'CDB-INTER-IPCA',
        name: 'CDB Banco Inter IPCA+7.2% 2028',
        assetClass: 'Renda Fixa',
        quantity: 800,
        currentPrice: 1040.00,
        totalValue: 832000,
        allocationPercent: 26.00,
      },
      {
        id: 'ast-305',
        ticker: 'TESOURO-SELIC',
        name: 'Tesouro Selic DI',
        assetClass: 'Caixa',
        quantity: 5,
        currentPrice: 16800.00,
        totalValue: 84000,
        allocationPercent: 2.62,
      },
    ],
  },
  {
    id: 'port-004',
    name: 'Família Demo Family Office',
    clientName: 'Holdings Fictícias S.A.',
    code: 'FB-1044',
    manager: 'Carlos Eduardo Mendes (CFA)',
    profile: 'Arrojado',
    benchmark: 'CDI + 3.0%',
    totalAum: 18900000, // R$ 18,9 milhões
    cashBalance: 750000,
    lastRebalanced: '10/02/2026',
    status: 'NORMAL', // 🟢 Totalmente Enquadrada
    mandateLimits: [
      { assetClass: 'Renda Fixa', minPercent: 30, targetPercent: 45, maxPercent: 55 },
      { assetClass: 'Renda Variável', minPercent: 15, targetPercent: 25, maxPercent: 35 },
      { assetClass: 'Internacional', minPercent: 5, targetPercent: 15, maxPercent: 20 },
      { assetClass: 'Multimercado', minPercent: 5, targetPercent: 10, maxPercent: 15 },
      { assetClass: 'Caixa', minPercent: 2, targetPercent: 5, maxPercent: 10 },
    ],
    assets: [
      {
        id: 'ast-401',
        ticker: 'NTN-B 2030',
        name: 'Tesouro IPCA+ 2030',
        assetClass: 'Renda Fixa',
        quantity: 1800,
        currentPrice: 4300.00,
        totalValue: 7740000,
        allocationPercent: 40.95,
      },
      {
        id: 'ast-402',
        ticker: 'CRI-HELVETIA',
        name: 'CRI Helvetia Prime IPCA+7.5%',
        assetClass: 'Renda Fixa',
        quantity: 900,
        currentPrice: 1100.00,
        totalValue: 990000,
        allocationPercent: 5.24,
      },
      {
        id: 'ast-403',
        ticker: 'HGLG11',
        name: 'CSHG Logística FII',
        assetClass: 'Renda Variável',
        quantity: 14000,
        currentPrice: 165.00,
        totalValue: 2310000,
        allocationPercent: 12.22,
      },
      {
        id: 'ast-404',
        ticker: 'BBAS3',
        name: 'Banco do Brasil ON',
        assetClass: 'Renda Variável',
        quantity: 45000,
        currentPrice: 28.50,
        totalValue: 1282500,
        allocationPercent: 6.79,
      },
      {
        id: 'ast-405',
        ticker: 'WEGE3',
        name: 'WEG S.A. ON',
        assetClass: 'Renda Variável',
        quantity: 22000,
        currentPrice: 51.20,
        totalValue: 1126400,
        allocationPercent: 5.96,
      },
      {
        id: 'ast-406',
        ticker: 'IVVB11',
        name: 'iShares S&P 500 ETF',
        assetClass: 'Internacional',
        quantity: 6800,
        currentPrice: 365.00,
        totalValue: 2482000,
        allocationPercent: 13.13,
      },
      {
        id: 'ast-407',
        ticker: 'VERDE-AM-FIM',
        name: 'Verde AM 60 FIC FIM',
        assetClass: 'Multimercado',
        quantity: 1500000,
        currentPrice: 1.45,
        totalValue: 2175000,
        allocationPercent: 11.51,
      },
      {
        id: 'ast-408',
        ticker: 'CAIXA-CDI',
        name: 'Operações Compromissadas Selic',
        assetClass: 'Caixa',
        quantity: 794100,
        currentPrice: 1.00,
        totalValue: 794100,
        allocationPercent: 4.20,
      },
    ],
  },
  {
    id: 'port-005',
    name: 'Fundo Titanium Institucional',
    clientName: 'Fundo Previdenciário Demo',
    code: 'TI-6610',
    manager: 'Renata Vasconcellos (CFA)',
    profile: 'Moderado',
    benchmark: 'IPCA + 5.8% (Meta Atuarial)',
    totalAum: 9800000,
    cashBalance: 320000,
    lastRebalanced: '28/01/2026',
    status: 'WARNING', // Renda Variável em 38.6% vs teto de 35% (+3.6 p.p. -> REGRA REGULATÓRIA RPPS CMN 4.963)
    assignedPolicyId: 'RES-CMN-4963-RPPS',
    mandateLimits: [
      { assetClass: 'Renda Fixa', minPercent: 45, targetPercent: 55, maxPercent: 70, policyId: 'RES-CMN-4963-RPPS', ruleSource: 'REGRA_REGULATORIA', tolerancePP: 5.0 },
      { assetClass: 'Renda Variável', minPercent: 15, targetPercent: 25, maxPercent: 35, policyId: 'RES-CMN-4963-RPPS', ruleSource: 'REGRA_REGULATORIA', tolerancePP: 3.5 },
      { assetClass: 'Multimercado', minPercent: 0, targetPercent: 10, maxPercent: 15, policyId: 'POL-HORIZON-PREV', ruleSource: 'POLITICA_INTERNA', tolerancePP: 5.0 },
      { assetClass: 'Internacional', minPercent: 0, targetPercent: 5, maxPercent: 10, policyId: 'CVM-175-ANEXO-I', ruleSource: 'REGRA_REGULATORIA', tolerancePP: 2.0 },
      { assetClass: 'Caixa', minPercent: 2, targetPercent: 5, maxPercent: 10, policyId: 'RES-CMN-4963-RPPS', ruleSource: 'REGRA_REGULATORIA', tolerancePP: 2.0 },
    ],
    assets: [
      {
        id: 'ast-501',
        ticker: 'NTN-F 2029',
        name: 'Tesouro Prefixado com Juros Semestrais',
        assetClass: 'Renda Fixa',
        quantity: 4200,
        currentPrice: 1080.00,
        totalValue: 4536000,
        allocationPercent: 46.29,
      },
      {
        id: 'ast-502',
        ticker: 'CRA-JBS-2028',
        name: 'CRA JBS Alimentos IPCA+6.9%',
        assetClass: 'Renda Fixa',
        quantity: 800,
        currentPrice: 1020.00,
        totalValue: 816000,
        allocationPercent: 8.33,
      },
      {
        id: 'ast-503',
        ticker: 'BRAX11',
        name: 'iShares IBrX-50 ETF',
        assetClass: 'Renda Variável',
        quantity: 26000,
        currentPrice: 112.00,
        totalValue: 2912000,
        allocationPercent: 29.71,
      },
      {
        id: 'ast-504',
        ticker: 'EQTL3',
        name: 'Equatorial Energia ON',
        assetClass: 'Renda Variável',
        quantity: 27000,
        currentPrice: 32.20,
        totalValue: 869400,
        allocationPercent: 8.87,
      },
      {
        id: 'ast-505',
        ticker: 'LEGACY-CAP-FIM',
        name: 'Legacy Capital Previdência FIM',
        assetClass: 'Multimercado',
        quantity: 250000,
        currentPrice: 1.48,
        totalValue: 370000,
        allocationPercent: 3.78,
      },
      {
        id: 'ast-506',
        ticker: 'SELIC-CAIXA',
        name: 'Caixa Soberano DI',
        assetClass: 'Caixa',
        quantity: 296600,
        currentPrice: 1.00,
        totalValue: 296600,
        allocationPercent: 3.03,
      },
    ],
  },
  {
    id: 'port-006',
    name: 'Carteira Minerva Cautela',
    clientName: 'Cliente Demo C',
    code: 'MIN-0042',
    manager: 'Marina Fagundes (CNPI)',
    profile: 'Conservador',
    benchmark: '100% CDI',
    totalAum: 2150000,
    cashBalance: 110000,
    lastRebalanced: '08/02/2026',
    status: 'NORMAL',
    mandateLimits: [
      { assetClass: 'Renda Fixa', minPercent: 70, targetPercent: 85, maxPercent: 95 },
      { assetClass: 'Multimercado', minPercent: 0, targetPercent: 5, maxPercent: 10 },
      { assetClass: 'Caixa', minPercent: 5, targetPercent: 10, maxPercent: 20 },
      { assetClass: 'Renda Variável', minPercent: 0, targetPercent: 0, maxPercent: 5 },
      { assetClass: 'Internacional', minPercent: 0, targetPercent: 0, maxPercent: 5 },
    ],
    assets: [
      {
        id: 'ast-601',
        ticker: 'CDB-SAFRA-110',
        name: 'CDB Banco Safra 110% CDI',
        assetClass: 'Renda Fixa',
        quantity: 1100,
        currentPrice: 1000.00,
        totalValue: 1100000,
        allocationPercent: 51.16,
      },
      {
        id: 'ast-602',
        ticker: 'LCI-BRADESCO-95',
        name: 'LCI Bradesco Isenta 95% CDI',
        assetClass: 'Renda Fixa',
        quantity: 750,
        currentPrice: 1000.00,
        totalValue: 750000,
        allocationPercent: 34.88,
      },
      {
        id: 'ast-603',
        ticker: 'TESOURO-SELIC-2029',
        name: 'Tesouro Selic 2029',
        assetClass: 'Caixa',
        quantity: 20,
        currentPrice: 15000.00,
        totalValue: 300000,
        allocationPercent: 13.95,
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
