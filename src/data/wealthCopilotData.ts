export interface MarketAsset {
  ticker: string;
  name: string;
  category: 'INDICES' | 'CAMBIO' | 'COMMODITIES' | 'JUROS';
  value: string;
  change: string;
  isPositive: boolean;
  unit?: string;
  sparkline: number[];
}

export interface ClientRecord {
  id: string;
  portfolioId?: string;
  name: string;
  portfolioName: string;
  aumBRL: number;
  aumUSD: number;
  profile: 'Conservador' | 'Moderado' | 'Arrojado';
  status: 'OVERRIDE' | 'RECALIBRATION' | 'HEALTHY';
  statusLabel: string;
  mainClass: string;
  currentWeight: number;
  targetWeight: number;
  deviation: number;
  lastContact: string;
  manager: string;
  priorityReason?: string;
}

export interface RecalibrationEvent {
  id: string;
  title: string;
  impact: string;
  severity: 'Alta' | 'Média' | 'Baixa';
  category: string;
}

export interface OverrideEvent {
  id: string;
  title: string;
  detail: string;
  severity: 'Alta' | 'Média' | 'Baixa';
  date: string;
}

export const INITIAL_MARKET_ASSETS: MarketAsset[] = [
  {
    ticker: 'IBOV',
    name: 'Ibovespa',
    category: 'INDICES',
    value: '129.650',
    change: '-1,2%',
    isPositive: false,
    sparkline: [131200, 131000, 130500, 130800, 129900, 129650],
  },
  {
    ticker: 'SPX',
    name: 'S&P 500',
    category: 'INDICES',
    value: '5.271',
    change: '+0,8%',
    isPositive: true,
    sparkline: [5230, 5240, 5235, 5255, 5265, 5271],
  },
  {
    ticker: 'NDX',
    name: 'Nasdaq',
    category: 'INDICES',
    value: '16.428',
    change: '+1,2%',
    isPositive: true,
    sparkline: [16200, 16250, 16300, 16380, 16400, 16428],
  },
  {
    ticker: 'USDBRL',
    name: 'Dólar (USD/BRL)',
    category: 'CAMBIO',
    value: '5,02',
    change: '-0,4%',
    isPositive: false,
    sparkline: [5.05, 5.04, 5.03, 5.035, 5.025, 5.02],
  },
  {
    ticker: 'EURBRL',
    name: 'Euro (EUR/BRL)',
    category: 'CAMBIO',
    value: '5,48',
    change: '+0,2%',
    isPositive: true,
    sparkline: [5.46, 5.47, 5.465, 5.475, 5.48],
  },
  {
    ticker: 'US10Y',
    name: 'US Treasury 10Y',
    category: 'JUROS',
    value: '4,22',
    change: '+12 bps',
    isPositive: true,
    unit: '% a.a.',
    sparkline: [4.10, 4.12, 4.15, 4.18, 4.20, 4.22],
  },
  {
    ticker: 'DI26',
    name: 'DI Jan 2026',
    category: 'JUROS',
    value: '13,15',
    change: '+4 bps',
    isPositive: true,
    unit: '% a.a.',
    sparkline: [13.11, 13.12, 13.10, 13.14, 13.15],
  },
  {
    ticker: 'GOLD',
    name: 'Ouro (USD)',
    category: 'COMMODITIES',
    value: '2.168',
    change: '+1,5%',
    isPositive: true,
    sparkline: [2135, 2142, 2150, 2158, 2168],
  },
  {
    ticker: 'BRENT',
    name: 'Petróleo (Brent)',
    category: 'COMMODITIES',
    value: '85,4',
    change: '-0,8%',
    isPositive: false,
    sparkline: [86.2, 86.0, 85.8, 85.6, 85.4],
  },
  {
    ticker: 'COPPER',
    name: 'Cobre (USD)',
    category: 'COMMODITIES',
    value: '4,12',
    change: '+1,5%',
    isPositive: true,
    sparkline: [4.05, 4.07, 4.09, 4.10, 4.12],
  },
];

export const CLIENTS_DIRECTORY: ClientRecord[] = [
  {
    id: 'cli-dario',
    portfolioId: 'port-dario-001',
    name: 'Dário Marques Neto',
    portfolioName: 'Carteira Dário',
    aumBRL: 728022.72,
    aumUSD: 141000,
    profile: 'Arrojado',
    status: 'HEALTHY',
    statusLabel: 'Saudável',
    mainClass: 'Renda Fixa & Offshore',
    currentWeight: 52,
    targetWeight: 50,
    deviation: 2,
    lastContact: 'Hoje',
    manager: 'MPX Wealth Management',
    priorityReason: 'Carteira individual Dário Marques Neto (Itaú Private + Avenue Offshore)',
  },
  {
    id: 'cli-miguel',
    portfolioId: 'port-miguel-001',
    name: 'Miguel',
    portfolioName: 'Carteira Miguel',
    aumBRL: 3999016.90,
    aumUSD: 775000,
    profile: 'Arrojado',
    status: 'HEALTHY',
    statusLabel: 'Saudável',
    mainClass: 'Crédito Privado & Renda Fixa',
    currentWeight: 48,
    targetWeight: 50,
    deviation: 2,
    lastContact: 'Ontem',
    manager: 'MPX Wealth Management',
    priorityReason: 'Carteira individual independente do cliente Miguel (mandato próprio e exclusivo)',
  },
  {
    id: 'cli-wilson',
    portfolioId: 'port-wilson-001',
    name: 'Wilson',
    portfolioName: 'Carteira Wilson',
    aumBRL: 2078568.86,
    aumUSD: 403000,
    profile: 'Moderado',
    status: 'HEALTHY',
    statusLabel: 'Saudável',
    mainClass: 'Debêntures & Crédito Privado',
    currentWeight: 60,
    targetWeight: 60,
    deviation: 0,
    lastContact: 'Há 2 dias',
    manager: 'MPX Wealth Management',
    priorityReason: 'Carteira individual independente do cliente Wilson (mandato próprio e exclusivo)',
  },
  {
    id: 'cli-001',
    portfolioId: 'port-dario-001',
    name: 'Família Silva',
    portfolioName: 'Carteira Alpha Multimercado',
    aumBRL: 12500000,
    aumUSD: 2420000,
    profile: 'Arrojado',
    status: 'OVERRIDE',
    statusLabel: 'Em Override',
    mainClass: 'Renda Variável',
    currentWeight: 42,
    targetWeight: 30,
    deviation: 12,
    lastContact: 'Há 2 dias',
    manager: 'MPX Wealth Management',
    priorityReason: 'Excesso de RV (+12 p.p.) - Revisão de tese recomendada',
  },
  {
    id: 'cli-002',
    portfolioId: 'port-dario-001',
    name: 'Rocha Investimentos',
    portfolioName: 'Portfólio Institucional Rocha',
    aumBRL: 8400000,
    aumUSD: 1625000,
    profile: 'Moderado',
    status: 'RECALIBRATION',
    statusLabel: 'Em Recalibração',
    mainClass: 'Crédito Privado',
    currentWeight: 22,
    targetWeight: 15,
    deviation: 7,
    lastContact: 'Ontem',
    manager: 'MPX Wealth Management',
    priorityReason: 'Exposição a Crédito Privado (+7 p.p.) acima do teto de liquidez',
  },
  {
    id: 'cli-003',
    portfolioId: 'port-dario-001',
    name: 'Castro Family Office',
    portfolioName: 'Castro Wealth Preservation',
    aumBRL: 15200000,
    aumUSD: 2940000,
    profile: 'Conservador',
    status: 'RECALIBRATION',
    statusLabel: 'Em Recalibração',
    mainClass: 'Fundos Imobiliários',
    currentWeight: 18,
    targetWeight: 12,
    deviation: 6,
    lastContact: 'Há 4 dias',
    manager: 'MPX Wealth Management',
    priorityReason: 'Fundos Imobiliários (+6 p.p.) - Acompanhar liquidez secundária',
  },
  {
    id: 'cli-005',
    name: 'Mendes & Associados',
    portfolioName: 'Mendes Capital Fundo Exclusivo',
    aumBRL: 6800000,
    aumUSD: 1315000,
    profile: 'Moderado',
    status: 'OVERRIDE',
    statusLabel: 'Em Override',
    mainClass: 'Internacional',
    currentWeight: 28,
    targetWeight: 20,
    deviation: 8,
    lastContact: 'Há 5 dias',
    manager: 'MPX Wealth Management',
    priorityReason: 'Tese de dólar e tecnologia offshore com limite expirado',
  },
  {
    id: 'cli-006',
    name: 'Oliveira Participações',
    portfolioName: 'Oliveira Yield Conservador',
    aumBRL: 19800000,
    aumUSD: 3830000,
    profile: 'Conservador',
    status: 'HEALTHY',
    statusLabel: 'Saudável',
    mainClass: 'Renda Fixa Pós-Fixada',
    currentWeight: 75,
    targetWeight: 75,
    deviation: 0,
    lastContact: 'Há 1 semana',
    manager: 'MPX Wealth Management',
  },
  {
    id: 'cli-007',
    name: 'Guimarães Tech Venture',
    portfolioName: 'Guimarães Crescimento Tech',
    aumBRL: 5400000,
    aumUSD: 1045000,
    profile: 'Arrojado',
    status: 'OVERRIDE',
    statusLabel: 'Em Override',
    mainClass: 'Ações Globais Tech',
    currentWeight: 35,
    targetWeight: 25,
    deviation: 10,
    lastContact: 'Ontem',
    manager: 'MPX Wealth Management',
    priorityReason: 'Sobrepeso em Semicondutores (SMH/SOXX)',
  },
  {
    id: 'cli-008',
    name: 'Borges Family Office',
    portfolioName: 'Borges Dinâmico Hedge',
    aumBRL: 11200000,
    aumUSD: 2165000,
    profile: 'Moderado',
    status: 'HEALTHY',
    statusLabel: 'Saudável',
    mainClass: 'Multimercado',
    currentWeight: 30,
    targetWeight: 30,
    deviation: 0,
    lastContact: 'Há 3 dias',
    manager: 'MPX Wealth Management',
  },
  {
    id: 'cli-009',
    name: 'Barreto Investimentos',
    portfolioName: 'Barreto Liquidez & Oportunidade',
    aumBRL: 4200000,
    aumUSD: 812000,
    profile: 'Conservador',
    status: 'HEALTHY',
    statusLabel: 'Saudável',
    mainClass: 'Títulos Públicos LFT/CDB',
    currentWeight: 80,
    targetWeight: 80,
    deviation: 0,
    lastContact: 'Há 10 dias',
    manager: 'MPX Wealth Management',
  },
  // Mais 18 clientes monitorados saudáveis completando os 27 clientes
  ...Array.from({ length: 18 }).map((_, i) => ({
    id: `cli-${10 + i}`,
    name: `Cliente Private ${10 + i} - Gestão Ativa`,
    portfolioName: `Portfólio Mandato Especial ${10 + i}`,
    aumBRL: 3200000 + i * 450000,
    aumUSD: Math.round((3200000 + i * 450000) / 5.16),
    profile: (i % 2 === 0 ? 'Moderado' : i % 3 === 0 ? 'Conservador' : 'Arrojado') as 'Conservador' | 'Moderado' | 'Arrojado',
    status: 'HEALTHY' as const,
    statusLabel: 'Saudável',
    mainClass: i % 2 === 0 ? 'Renda Fixa DI' : 'Alocação Balanceada',
    currentWeight: 50,
    targetWeight: 50,
    deviation: 0,
    lastContact: `Há ${i + 2} dias`,
    manager: 'MPX Wealth Management',
  })),
];

export const RECALIBRATION_EVENTS: RecalibrationEvent[] = [
  {
    id: 'rec-1',
    title: 'Juros longos (US10Y)',
    impact: 'Impacto em duration',
    severity: 'Alta',
    category: 'Renda Fixa Internacional',
  },
  {
    id: 'rec-2',
    title: 'Setor de Tecnologia (EUA)',
    impact: 'Revisar exposição',
    severity: 'Média',
    category: 'Ações Globais',
  },
  {
    id: 'rec-3',
    title: 'Commodities',
    impact: 'Oportunidade tática',
    severity: 'Média',
    category: 'Alternativos & Energia',
  },
  {
    id: 'rec-4',
    title: 'Crédito Privado Local (Spread)',
    impact: 'Reavaliar prêmio de debêntures',
    severity: 'Média',
    category: 'Crédito Privado',
  },
  {
    id: 'rec-5',
    title: 'Fundos Imobiliários (Vacância)',
    impact: 'Ajuste de rendimento médio',
    severity: 'Baixa',
    category: 'Real Estate',
  },
  {
    id: 'rec-6',
    title: 'Alocação Cambial Direta',
    impact: 'Rebalanceamento por descolamento',
    severity: 'Baixa',
    category: 'Câmbio',
  },
];

export const OVERRIDE_EVENTS: OverrideEvent[] = [
  {
    id: 'ovr-1',
    title: 'Tese de inflação (EUA)',
    detail: 'Mudança relevante de premissa macroeconômica',
    severity: 'Alta',
    date: 'Hoje, 07:45',
  },
  {
    id: 'ovr-2',
    title: 'Curva DI',
    detail: 'Revisar posição prefixada após ata do Copom',
    severity: 'Alta',
    date: 'Hoje, 08:00',
  },
];
