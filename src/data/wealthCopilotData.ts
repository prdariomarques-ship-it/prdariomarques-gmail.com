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

export interface MacroIndicator {
  code: string;
  name: string;
  currentValue: string;
  previousValue: string;
  unit: string;
  frequency: string;
  source: string;
  lastRelease: string;
  nextRelease: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  impactDescription: string;
}

export const OFFICIAL_MACRO_INDICATORS: MacroIndicator[] = [
  {
    code: 'SELIC_META',
    name: 'Taxa Selic Meta (Copom)',
    currentValue: '13,25',
    previousValue: '12,25',
    unit: '% a.a.',
    frequency: 'A cada 45 dias',
    source: 'Banco Central do Brasil (Copom)',
    lastRelease: 'Vigente Copom',
    nextRelease: 'Próxima Reunião Copom',
    trend: 'UP',
    impactDescription: 'Taxa básica que remunera a dívida pública soberana (LFT) e ancora o CDI.',
  },
  {
    code: 'CDI_OVER',
    name: 'Taxa CDI Over Média',
    currentValue: '13,15',
    previousValue: '12,15',
    unit: '% a.a.',
    frequency: 'Diário',
    source: 'B3 / Cetip',
    lastRelease: 'Fechamento anterior',
    nextRelease: 'D+0 Contínuo',
    trend: 'UP',
    impactDescription: 'Benchmark primordial de liquidez e carrego da Renda Fixa privada e fundos DI.',
  },
  {
    code: 'IPCA_12M',
    name: 'IPCA Acumulado 12 Meses',
    currentValue: '4,83',
    previousValue: '4,42',
    unit: '% a.a.',
    frequency: 'Mensal',
    source: 'IBGE (Índice Oficial de Inflação)',
    lastRelease: 'Mês anterior',
    nextRelease: 'Dia 10 do mês subsequente',
    trend: 'UP',
    impactDescription: 'Indexador principal dos títulos NTN-B e debêntures incentivadas de infraestrutura.',
  },
  {
    code: 'META_INFLACAO',
    name: 'Meta de Inflação CMN',
    currentValue: '3,00',
    previousValue: '3,00',
    unit: '% a.a.',
    frequency: 'Contínua',
    source: 'Conselho Monetário Nacional (CMN)',
    lastRelease: 'Vigente',
    nextRelease: 'Horizonte Relevante 2025/2026',
    trend: 'STABLE',
    impactDescription: 'Centro da meta com intervalo de tolerância de 1,5 p.p. (piso 1,50% e teto 4,50%).',
  },
  {
    code: 'PIB_BR',
    name: 'PIB Brasil (Crescimento Anual)',
    currentValue: '+3,10',
    previousValue: '+2,90',
    unit: '% a.a.',
    frequency: 'Trimestral',
    source: 'IBGE Contas Nacionais',
    lastRelease: 'Último trimestre divulgado',
    nextRelease: 'Trimestral',
    trend: 'UP',
    impactDescription: 'Mede o nível de atividade econômica doméstica e consumo das famílias.',
  },
  {
    code: 'DOLAR_PTAX',
    name: 'Câmbio Dólar Comercial (PTAX)',
    currentValue: '5,82',
    previousValue: '5,62',
    unit: 'R$',
    frequency: 'Diário (Bacen)',
    source: 'Banco Central do Brasil',
    lastRelease: 'Fechamento PTAX',
    nextRelease: 'Contínuo',
    trend: 'UP',
    impactDescription: 'Afeta diretamente a conversão de AUM internacional e o limite de 20% CVM 175.',
  },
  {
    code: 'FED_FUNDS',
    name: 'Fed Funds Rate (EUA)',
    currentValue: '4,50 - 4,75',
    previousValue: '4,75 - 5,00',
    unit: '% a.a.',
    frequency: 'FOMC (EUA)',
    source: 'Federal Reserve',
    lastRelease: 'Último FOMC',
    nextRelease: 'Próxima reunião FOMC',
    trend: 'DOWN',
    impactDescription: 'Taxa livre de risco americana que ancora a curva de Treasuries e o custo global de capital.',
  },
  {
    code: 'DI_JAN_27',
    name: 'Curva Pré B3 (DI Jan 2027)',
    currentValue: '15,10',
    previousValue: '14,35',
    unit: '% a.a.',
    frequency: 'Tempo Real B3',
    source: 'B3 Mercado Futuro',
    lastRelease: 'Pregão B3',
    nextRelease: 'Contínuo',
    trend: 'UP',
    impactDescription: 'Taxa futura média negociada para duration de 2 anos no mercado de capitais brasileiro.',
  },
];

export const INITIAL_MARKET_ASSETS: MarketAsset[] = [
  {
    ticker: 'IBOV',
    name: 'Ibovespa',
    category: 'INDICES',
    value: '127.850',
    change: '-0,35%',
    isPositive: false,
    sparkline: [129200, 128900, 128400, 128100, 127950, 127850],
  },
  {
    ticker: 'SPX',
    name: 'S&P 500',
    category: 'INDICES',
    value: '5.980',
    change: '+0,42%',
    isPositive: true,
    sparkline: [5910, 5930, 5945, 5960, 5975, 5980],
  },
  {
    ticker: 'NDX',
    name: 'Nasdaq 100',
    category: 'INDICES',
    value: '21.150',
    change: '+0,65%',
    isPositive: true,
    sparkline: [20800, 20920, 21010, 21090, 21120, 21150],
  },
  {
    ticker: 'IFIX',
    name: 'IFIX (FIIs)',
    category: 'INDICES',
    value: '3.320',
    change: '-0,15%',
    isPositive: false,
    sparkline: [3360, 3350, 3340, 3332, 3325, 3320],
  },
  {
    ticker: 'CDI',
    name: 'CDI Over Anual',
    category: 'JUROS',
    value: '13,15',
    change: 'Estável',
    isPositive: true,
    unit: '% a.a.',
    sparkline: [11.65, 12.15, 12.65, 13.00, 13.15],
  },
  {
    ticker: 'SELIC',
    name: 'Selic Meta',
    category: 'JUROS',
    value: '13,25',
    change: '+100 bps',
    isPositive: true,
    unit: '% a.a.',
    sparkline: [11.75, 12.25, 12.75, 13.00, 13.25],
  },
  {
    ticker: 'IPCA',
    name: 'IPCA 12M',
    category: 'INDICES',
    value: '4,83',
    change: '+0,41%',
    isPositive: false,
    unit: '% a.a.',
    sparkline: [4.18, 4.30, 4.42, 4.60, 4.83],
  },
  {
    ticker: 'USDBRL',
    name: 'Dólar (USD/BRL)',
    category: 'CAMBIO',
    value: '5,82',
    change: '+0,45%',
    isPositive: true,
    sparkline: [5.68, 5.72, 5.76, 5.79, 5.80, 5.82],
  },
  {
    ticker: 'EURBRL',
    name: 'Euro (EUR/BRL)',
    category: 'CAMBIO',
    value: '6,28',
    change: '+0,25%',
    isPositive: true,
    sparkline: [6.18, 6.20, 6.23, 6.25, 6.26, 6.28],
  },
  {
    ticker: 'DI27',
    name: 'DI Jan 2027',
    category: 'JUROS',
    value: '15,10',
    change: '+8 bps',
    isPositive: true,
    unit: '% a.a.',
    sparkline: [14.70, 14.82, 14.95, 15.02, 15.06, 15.10],
  },
  {
    ticker: 'DI29',
    name: 'DI Jan 2029',
    category: 'JUROS',
    value: '15,35',
    change: '+5 bps',
    isPositive: true,
    unit: '% a.a.',
    sparkline: [15.05, 15.15, 15.22, 15.28, 15.31, 15.35],
  },
  {
    ticker: 'US10Y',
    name: 'US Treasury 10Y',
    category: 'JUROS',
    value: '4,45',
    change: '+4 bps',
    isPositive: true,
    unit: '% a.a.',
    sparkline: [4.32, 4.36, 4.40, 4.42, 4.44, 4.45],
  },
  {
    ticker: 'GOLD',
    name: 'Ouro (USD/oz)',
    category: 'COMMODITIES',
    value: '2.735',
    change: '+0,8%',
    isPositive: true,
    sparkline: [2670, 2690, 2710, 2720, 2728, 2735],
  },
  {
    ticker: 'BRENT',
    name: 'Petróleo (Brent)',
    category: 'COMMODITIES',
    value: '73,80',
    change: '-0,7%',
    isPositive: false,
    sparkline: [75.8, 75.2, 74.6, 74.2, 73.8],
  },
  {
    ticker: 'BTC',
    name: 'Bitcoin (BTC/USD)',
    category: 'INDICES',
    value: '94.200',
    change: '+3,2%',
    isPositive: true,
    sparkline: [88400, 90200, 91800, 93100, 94200],
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
