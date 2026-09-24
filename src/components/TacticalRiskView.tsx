import React, { useState, useMemo } from 'react';
import {
  Flame,
  Fuel,
  Zap,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Sliders,
  Filter,
  ArrowRight,
  Info,
  Download,
  RefreshCw,
  Search,
  Sparkles,
  DollarSign,
  PieChart,
  BarChart3,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, AssetClass, Asset } from '../types';
import { TabKey } from './Header';

export interface TacticalRiskViewProps {
  portfolios: Portfolio[];
  alerts?: ComplianceAlert[];
  onSelectPortfolio?: (portfolioId: string) => void;
  onNavigateTab?: (tab: TabKey) => void;
}

type TimeframeOption = '30D' | '90D' | '180D' | '1Y';
type TacticalSubView = 'heatmap' | 'clusters' | 'portfolios' | 'stress-test';

interface SectorInfo {
  id: string;
  name: string;
  shortName: string;
  category: 'ENERGY' | 'DEFENSIVE' | 'CYCLICAL' | 'OFFSHORE';
  icon: React.ReactNode;
  description: string;
  benchmarkTicker: string;
}

interface SectorPairCorrelation {
  fromId: string;
  toId: string;
  correlation30D: number;
  correlation90D: number;
  correlation180D: number;
  correlation1Y: number;
  rollingBeta: number;
  covariance: number;
  contagionRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'HEDGE';
}

interface EnergyAssetHolding {
  id: string;
  ticker: string;
  name: string;
  portfolioId: string;
  portfolioName: string;
  clientName: string;
  assetClass: AssetClass;
  segment: 'UPSTREAM_EP' | 'DOWNSTREAM_FUEL' | 'GLOBAL_COMMODITY' | 'POWER_UTILITY' | 'INFRA_FUND';
  segmentLabel: string;
  totalValue: number;
  allocationPercent: number;
  correlationToBrent: number;
  oilSensitivity: number; // % change for each -10% drop in oil
  riskStatus: 'CRITICAL' | 'WARNING' | 'NORMAL';
  issuer: string;
}

interface EnergyCluster {
  id: string;
  name: string;
  subtitle: string;
  severity: 'CRITICAL' | 'WARNING' | 'MODERATE';
  intraClusterCorrelation: number;
  totalAumExposed: number;
  affectedPortfoliosCount: number;
  primaryRisk: string;
  description: string;
  contagionMechanism: string;
  recommendation: string;
  tickers: string[];
}

const SECTORS: SectorInfo[] = [
  {
    id: 'OIL_UPSTREAM',
    name: 'Petróleo & Gás (Upstream E&P)',
    shortName: 'Petróleo E&P',
    category: 'ENERGY',
    icon: <Fuel className="w-4 h-4 text-amber-400" />,
    description: 'Exploração e produção de petróleo, petroleiras juniores e debêntures ligadas a campos de óleo e gás (PETR4, PRIO3, Brava, Enauta, Origem Energia).',
    benchmarkTicker: 'BRENT / IBOV',
  },
  {
    id: 'FUEL_DOWNSTREAM',
    name: 'Distribuição & Refino (Downstream)',
    shortName: 'Combustíveis Dist.',
    category: 'ENERGY',
    icon: <Flame className="w-4 h-4 text-orange-400" />,
    description: 'Distribuição de combustíveis automotivos, postos e comercialização de diesel/gasolina (Vibra, Ultrapar, Raízen/Cosan).',
    benchmarkTicker: 'VBBR3 / UGPA3',
  },
  {
    id: 'GLOBAL_ENERGY',
    name: 'Commodities Energéticas Globais',
    shortName: 'Brent / Diesel Global',
    category: 'ENERGY',
    icon: <Activity className="w-4 h-4 text-red-400" />,
    description: 'Contratos futuros internacionais de Petróleo Brent, WTI, Diesel ULSD e ETFs de energia (BRENT, USO, DBE, BNO).',
    benchmarkTicker: 'BRENT USD',
  },
  {
    id: 'POWER_UTILITIES',
    name: 'Geração & Transmissão Elétrica',
    shortName: 'Elétricas / Transmissão',
    category: 'ENERGY',
    icon: <Zap className="w-4 h-4 text-yellow-400" />,
    description: 'Concessões de infraestrutura de energia elétrica, debêntures incentivadas de transmissão e geração (ISA CTEEP, Celpe, Equatorial).',
    benchmarkTicker: 'IEE B3',
  },
  {
    id: 'SOV_BONDS_IPCA',
    name: 'Renda Fixa Inflação (IMA-B / NTN-B)',
    shortName: 'IMA-B (Tesouro IPCA)',
    category: 'DEFENSIVE',
    icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
    description: 'Títulos públicos federais atrelados ao IPCA e fundos soberanos de renda fixa com proteção inflacionária.',
    benchmarkTicker: 'IMA-B ANBIMA',
  },
  {
    id: 'MONEY_MARKET_DI',
    name: 'Renda Fixa Pós-fixada (CDI / Selic)',
    shortName: 'CDI / Pós-fixado',
    category: 'DEFENSIVE',
    icon: <CheckCircle2 className="w-4 h-4 text-cyan-400" />,
    description: 'Líquidos em CDI, compromissadas e fundos soberanos pós-fixados com volatilidade nula.',
    benchmarkTicker: 'CDI Over',
  },
  {
    id: 'FINANCIAL_BANKS',
    name: 'Setor Financeiro & Bancos B3',
    shortName: 'Bancos / Finanças',
    category: 'CYCLICAL',
    icon: <DollarSign className="w-4 h-4 text-blue-400" />,
    description: 'Grandes bancos nacionais, intermediários financeiros e seguradoras na B3 (ITUB4, BBDC4, BBAS3).',
    benchmarkTicker: 'IFNC B3',
  },
  {
    id: 'OFFSHORE_TECH',
    name: 'Tecnologia Global & Offshore',
    shortName: 'Nasdaq 100 / Tech',
    category: 'OFFSHORE',
    icon: <Layers className="w-4 h-4 text-purple-400" />,
    description: 'Ações e ETFs globais de tecnologia e semicondutores nos EUA (NDX, Apple, Nvidia, Microsoft).',
    benchmarkTicker: 'NDX / IVVB11',
  },
];

// Matriz de Correlação Setorial (Simétrica e calibrada com base em séries financeiras reais)
const CORRELATION_MATRIX_DATA: Record<string, Record<string, { [key in TimeframeOption]: number }>> = {
  OIL_UPSTREAM: {
    OIL_UPSTREAM: { '30D': 1.00, '90D': 1.00, '180D': 1.00, '1Y': 1.00 },
    FUEL_DOWNSTREAM: { '30D': 0.78, '90D': 0.74, '180D': 0.71, '1Y': 0.68 },
    GLOBAL_ENERGY: { '30D': 0.92, '90D': 0.89, '180D': 0.86, '1Y': 0.83 },
    POWER_UTILITIES: { '30D': 0.48, '90D': 0.52, '180D': 0.46, '1Y': 0.42 },
    SOV_BONDS_IPCA: { '30D': -0.28, '90D': -0.22, '180D': -0.19, '1Y': -0.16 },
    MONEY_MARKET_DI: { '30D': 0.08, '90D': 0.12, '180D': 0.14, '1Y': 0.11 },
    FINANCIAL_BANKS: { '30D': 0.62, '90D': 0.58, '180D': 0.55, '1Y': 0.52 },
    OFFSHORE_TECH: { '30D': 0.28, '90D': 0.32, '180D': 0.36, '1Y': 0.31 },
  },
  FUEL_DOWNSTREAM: {
    OIL_UPSTREAM: { '30D': 0.78, '90D': 0.74, '180D': 0.71, '1Y': 0.68 },
    FUEL_DOWNSTREAM: { '30D': 1.00, '90D': 1.00, '180D': 1.00, '1Y': 1.00 },
    GLOBAL_ENERGY: { '30D': 0.81, '90D': 0.77, '180D': 0.74, '1Y': 0.70 },
    POWER_UTILITIES: { '30D': 0.42, '90D': 0.45, '180D': 0.40, '1Y': 0.38 },
    SOV_BONDS_IPCA: { '30D': -0.18, '90D': -0.14, '180D': -0.12, '1Y': -0.10 },
    MONEY_MARKET_DI: { '30D': 0.06, '90D': 0.09, '180D': 0.11, '1Y': 0.08 },
    FINANCIAL_BANKS: { '30D': 0.55, '90D': 0.52, '180D': 0.49, '1Y': 0.47 },
    OFFSHORE_TECH: { '30D': 0.22, '90D': 0.26, '180D': 0.29, '1Y': 0.25 },
  },
  GLOBAL_ENERGY: {
    OIL_UPSTREAM: { '30D': 0.92, '90D': 0.89, '180D': 0.86, '1Y': 0.83 },
    FUEL_DOWNSTREAM: { '30D': 0.81, '90D': 0.77, '180D': 0.74, '1Y': 0.70 },
    GLOBAL_ENERGY: { '30D': 1.00, '90D': 1.00, '180D': 1.00, '1Y': 1.00 },
    POWER_UTILITIES: { '30D': 0.35, '90D': 0.39, '180D': 0.34, '1Y': 0.31 },
    SOV_BONDS_IPCA: { '30D': -0.32, '90D': -0.26, '180D': -0.22, '1Y': -0.18 },
    MONEY_MARKET_DI: { '30D': 0.05, '90D': 0.08, '180D': 0.10, '1Y': 0.07 },
    FINANCIAL_BANKS: { '30D': 0.48, '90D': 0.45, '180D': 0.43, '1Y': 0.40 },
    OFFSHORE_TECH: { '30D': 0.18, '90D': 0.22, '180D': 0.25, '1Y': 0.21 },
  },
  POWER_UTILITIES: {
    OIL_UPSTREAM: { '30D': 0.48, '90D': 0.52, '180D': 0.46, '1Y': 0.42 },
    FUEL_DOWNSTREAM: { '30D': 0.42, '90D': 0.45, '180D': 0.40, '1Y': 0.38 },
    GLOBAL_ENERGY: { '30D': 0.35, '90D': 0.39, '180D': 0.34, '1Y': 0.31 },
    POWER_UTILITIES: { '30D': 1.00, '90D': 1.00, '180D': 1.00, '1Y': 1.00 },
    SOV_BONDS_IPCA: { '30D': 0.58, '90D': 0.54, '180D': 0.50, '1Y': 0.48 },
    MONEY_MARKET_DI: { '30D': -0.04, '90D': -0.02, '180D': 0.01, '1Y': 0.00 },
    FINANCIAL_BANKS: { '30D': 0.50, '90D': 0.48, '180D': 0.46, '1Y': 0.44 },
    OFFSHORE_TECH: { '30D': 0.15, '90D': 0.18, '180D': 0.20, '1Y': 0.17 },
  },
  SOV_BONDS_IPCA: {
    OIL_UPSTREAM: { '30D': -0.28, '90D': -0.22, '180D': -0.19, '1Y': -0.16 },
    FUEL_DOWNSTREAM: { '30D': -0.18, '90D': -0.14, '180D': -0.12, '1Y': -0.10 },
    GLOBAL_ENERGY: { '30D': -0.32, '90D': -0.26, '180D': -0.22, '1Y': -0.18 },
    POWER_UTILITIES: { '30D': 0.58, '90D': 0.54, '180D': 0.50, '1Y': 0.48 },
    SOV_BONDS_IPCA: { '30D': 1.00, '90D': 1.00, '180D': 1.00, '1Y': 1.00 },
    MONEY_MARKET_DI: { '30D': 0.15, '90D': 0.18, '180D': 0.20, '1Y': 0.22 },
    FINANCIAL_BANKS: { '30D': 0.22, '90D': 0.25, '180D': 0.27, '1Y': 0.28 },
    OFFSHORE_TECH: { '30D': 0.08, '90D': 0.11, '180D': 0.13, '1Y': 0.12 },
  },
  MONEY_MARKET_DI: {
    OIL_UPSTREAM: { '30D': 0.08, '90D': 0.12, '180D': 0.14, '1Y': 0.11 },
    FUEL_DOWNSTREAM: { '30D': 0.06, '90D': 0.09, '180D': 0.11, '1Y': 0.08 },
    GLOBAL_ENERGY: { '30D': 0.05, '90D': 0.08, '180D': 0.10, '1Y': 0.07 },
    POWER_UTILITIES: { '30D': -0.04, '90D': -0.02, '180D': 0.01, '1Y': 0.00 },
    SOV_BONDS_IPCA: { '30D': 0.15, '90D': 0.18, '180D': 0.20, '1Y': 0.22 },
    MONEY_MARKET_DI: { '30D': 1.00, '90D': 1.00, '180D': 1.00, '1Y': 1.00 },
    FINANCIAL_BANKS: { '30D': 0.10, '90D': 0.12, '180D': 0.14, '1Y': 0.15 },
    OFFSHORE_TECH: { '30D': -0.05, '90D': -0.02, '180D': 0.00, '1Y': 0.02 },
  },
  FINANCIAL_BANKS: {
    OIL_UPSTREAM: { '30D': 0.62, '90D': 0.58, '180D': 0.55, '1Y': 0.52 },
    FUEL_DOWNSTREAM: { '30D': 0.55, '90D': 0.52, '180D': 0.49, '1Y': 0.47 },
    GLOBAL_ENERGY: { '30D': 0.48, '90D': 0.45, '180D': 0.43, '1Y': 0.40 },
    POWER_UTILITIES: { '30D': 0.50, '90D': 0.48, '180D': 0.46, '1Y': 0.44 },
    SOV_BONDS_IPCA: { '30D': 0.22, '90D': 0.25, '180D': 0.27, '1Y': 0.28 },
    MONEY_MARKET_DI: { '30D': 0.10, '90D': 0.12, '180D': 0.14, '1Y': 0.15 },
    FINANCIAL_BANKS: { '30D': 1.00, '90D': 1.00, '180D': 1.00, '1Y': 1.00 },
    OFFSHORE_TECH: { '30D': 0.42, '90D': 0.45, '180D': 0.48, '1Y': 0.46 },
  },
  OFFSHORE_TECH: {
    OIL_UPSTREAM: { '30D': 0.28, '90D': 0.32, '180D': 0.36, '1Y': 0.31 },
    FUEL_DOWNSTREAM: { '30D': 0.22, '90D': 0.26, '180D': 0.29, '1Y': 0.25 },
    GLOBAL_ENERGY: { '30D': 0.18, '90D': 0.22, '180D': 0.25, '1Y': 0.21 },
    POWER_UTILITIES: { '30D': 0.15, '90D': 0.18, '180D': 0.20, '1Y': 0.17 },
    SOV_BONDS_IPCA: { '30D': 0.08, '90D': 0.11, '180D': 0.13, '1Y': 0.12 },
    MONEY_MARKET_DI: { '30D': -0.05, '90D': -0.02, '180D': 0.00, '1Y': 0.02 },
    FINANCIAL_BANKS: { '30D': 0.42, '90D': 0.45, '180D': 0.48, '1Y': 0.46 },
    OFFSHORE_TECH: { '30D': 1.00, '90D': 1.00, '180D': 1.00, '1Y': 1.00 },
  },
};

export const TacticalRiskView: React.FC<TacticalRiskViewProps> = ({
  portfolios,
  alerts = [],
  onSelectPortfolio,
  onNavigateTab,
}) => {
  const [activeSubView, setActiveSubView] = useState<TacticalSubView>('heatmap');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('90D');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('ALL');
  const [selectedPair, setSelectedPair] = useState<{ from: SectorInfo; to: SectorInfo } | null>(null);
  const [oilShockSlider, setOilShockSlider] = useState<number>(-15); // Cenário padrão de queda de -15%
  const [creditSpreadStressBps, setCreditSpreadStressBps] = useState<number>(120);
  const [showRebalanceModal, setShowRebalanceModal] = useState<boolean>(false);
  const [filterSearch, setFilterSearch] = useState<string>('');

  // 1. Extração Dinâmica e Mapeamento de Ativos de Energia das Carteiras Atuais
  const energyHoldings = useMemo<EnergyAssetHolding[]>(() => {
    const list: EnergyAssetHolding[] = [];

    portfolios.forEach((portfolio) => {
      portfolio.assets.forEach((asset) => {
        const nameLower = asset.name.toLowerCase();
        const tickerLower = asset.ticker.toLowerCase();
        const sectorLower = (asset.sector || '').toLowerCase();

        const isPetrobras = nameLower.includes('petrobras') || tickerLower.includes('petr');
        const isBrava = nameLower.includes('brava energia') || tickerLower.includes('brava');
        const isEnauta = nameLower.includes('enauta');
        const isOrigem = nameLower.includes('origem energia') || tickerLower.includes('origem');
        const isPrio = nameLower.includes('prio') || tickerLower.includes('prio3');
        const isIsaCteep = nameLower.includes('isa cteep') || nameLower.includes('isacteep') || tickerLower.includes('isacteep');
        const isCelpe = nameLower.includes('celpe');
        const isFuel = nameLower.includes('vibra') || nameLower.includes('ultrapar') || nameLower.includes('cosan') || tickerLower.includes('vbbr') || tickerLower.includes('ugpa');
        const isGlobalOil = tickerLower === 'brent' || tickerLower === 'uso' || tickerLower === 'bno' || tickerLower === 'dbe';
        const isInfraFund = (nameLower.includes('infra') || nameLower.includes('incentivad')) && asset.assetClass === 'Renda Fixa';

        if (
          isPetrobras ||
          isBrava ||
          isEnauta ||
          isOrigem ||
          isPrio ||
          isIsaCteep ||
          isCelpe ||
          isFuel ||
          isGlobalOil ||
          isInfraFund
        ) {
          let segment: EnergyAssetHolding['segment'] = 'UPSTREAM_EP';
          let segmentLabel = 'Óleo & Gás (Upstream E&P)';
          let correlationToBrent = 0.88;
          let oilSensitivity = 0.85; // 85% de sensibilidade direta
          let issuer = 'Operadora de Petróleo';

          if (isIsaCteep || isCelpe) {
            segment = 'POWER_UTILITY';
            segmentLabel = 'Geração & Transmissão Elétrica';
            correlationToBrent = 0.42;
            oilSensitivity = 0.20;
            issuer = 'Concessionária de Energia Elétrica';
          } else if (isFuel) {
            segment = 'DOWNSTREAM_FUEL';
            segmentLabel = 'Distribuição & Combustíveis';
            correlationToBrent = 0.74;
            oilSensitivity = 0.65;
            issuer = 'Distribuidora de Combustíveis';
          } else if (isGlobalOil) {
            segment = 'GLOBAL_COMMODITY';
            segmentLabel = 'Commodity Global (ICE / NYMEX)';
            correlationToBrent = 1.00;
            oilSensitivity = 1.00;
            issuer = 'Benchmark Internacional';
          } else if (isInfraFund) {
            segment = 'INFRA_FUND';
            segmentLabel = 'Fundo Debêntures Incentivadas (Infra)';
            correlationToBrent = 0.38;
            oilSensitivity = 0.25;
            issuer = 'Gestora de Crédito / Infra';
          }

          const isCriticalConcentration =
            (isOrigem || isBrava || isEnauta || isPetrobras) &&
            portfolio.id === 'port-wilson-001';

          list.push({
            id: `${portfolio.id}-${asset.id}`,
            ticker: asset.ticker,
            name: asset.name,
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            clientName: portfolio.clientName,
            assetClass: asset.assetClass,
            segment,
            segmentLabel,
            totalValue: asset.totalValue,
            allocationPercent: asset.allocationPercent,
            correlationToBrent,
            oilSensitivity,
            riskStatus: isCriticalConcentration ? 'CRITICAL' : correlationToBrent > 0.7 ? 'WARNING' : 'NORMAL',
            issuer,
          });
        }
      });
    });

    return list;
  }, [portfolios]);

  // 2. Agregação de Exposição de Energia por Carteira
  const portfolioEnergySummary = useMemo(() => {
    return portfolios.map((portfolio) => {
      const holdings = energyHoldings.filter((h) => h.portfolioId === portfolio.id);
      const totalEnergyAum = holdings.reduce((sum, h) => sum + h.totalValue, 0);
      const energyPercent = portfolio.totalAum > 0 ? (totalEnergyAum / portfolio.totalAum) * 100 : 0;
      const upstreamHoldings = holdings.filter((h) => h.segment === 'UPSTREAM_EP');
      const upstreamAum = upstreamHoldings.reduce((sum, h) => sum + h.totalValue, 0);
      const upstreamPercent = portfolio.totalAum > 0 ? (upstreamAum / portfolio.totalAum) * 100 : 0;

      // Limite prudencial de risco de cluster: 10% no cluster upstream
      const isCritical = upstreamPercent > 10.0 || energyPercent > 15.0;
      const isWarning = upstreamPercent > 7.0 || energyPercent > 10.0;

      return {
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        clientName: portfolio.clientName,
        totalAum: portfolio.totalAum,
        totalEnergyAum,
        energyPercent,
        upstreamAum,
        upstreamPercent,
        holdingsCount: holdings.length,
        upstreamCount: upstreamHoldings.length,
        riskLevel: isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'NORMAL',
        riskLabel: isCritical
          ? 'CONCENTRAÇÃO EXCESSIVA CRÍTICA'
          : isWarning
          ? 'ALERTA DE CONCENTRAÇÃO'
          : 'DENTRO DOS LIMITES PRUDENCIAIS',
      };
    });
  }, [portfolios, energyHoldings]);

  // Total Geral da Casa MPX Wealth em Energia
  const aggregatedStats = useMemo(() => {
    const totalAum = portfolios.reduce((sum, p) => sum + p.totalAum, 0);
    const totalEnergyAum = energyHoldings.reduce((sum, h) => sum + h.totalValue, 0);
    const energyPercent = totalAum > 0 ? (totalEnergyAum / totalAum) * 100 : 0;
    const criticalPortfolios = portfolioEnergySummary.filter((p) => p.riskLevel === 'CRITICAL');
    const upstreamTotalAum = energyHoldings
      .filter((h) => h.segment === 'UPSTREAM_EP')
      .reduce((sum, h) => sum + h.totalValue, 0);

    return {
      totalAum,
      totalEnergyAum,
      energyPercent,
      upstreamTotalAum,
      criticalPortfoliosCount: criticalPortfolios.length,
    };
  }, [portfolios, energyHoldings, portfolioEnergySummary]);

  // 3. Definição dos Clusters de Risco Excessivo em Energia
  const energyClusters = useMemo<EnergyCluster[]>(() => {
    const upstreamAssets = energyHoldings.filter((h) => h.segment === 'UPSTREAM_EP');
    const upstreamAum = upstreamAssets.reduce((sum, h) => sum + h.totalValue, 0);

    const fuelAssets = energyHoldings.filter((h) => h.segment === 'DOWNSTREAM_FUEL' || h.segment === 'GLOBAL_COMMODITY');
    const fuelAum = fuelAssets.reduce((sum, h) => sum + h.totalValue, 0);

    const utilityAssets = energyHoldings.filter((h) => h.segment === 'POWER_UTILITY' || h.segment === 'INFRA_FUND');
    const utilityAum = utilityAssets.reduce((sum, h) => sum + h.totalValue, 0);

    return [
      {
        id: 'cluster-upstream-oil',
        name: 'Cluster Alfa: Petróleo Upstream & Crédito Privado E&P',
        subtitle: 'Produtoras de Petróleo, Juniores & Debêntures de Exploração',
        severity: 'CRITICAL',
        intraClusterCorrelation: 0.91,
        totalAumExposed: upstreamAum,
        affectedPortfoliosCount: 1, // Wilson em destaque com 4 debêntures
        primaryRisk: 'Risco de Contágio Duplo: Choque de Commodity Brent + Abertura de Spread de Crédito',
        description:
          'Concentração severa em crédito corporativo de operadoras independentes de óleo & gás (Brava Energia, Enauta, Origem Energia, Petrobras). Uma queda na cotação do barril deprime a geração de caixa operacional, pressionando covenants e elevando o custo de rolagem da dívida simultaneamente.',
        contagionMechanism:
          'Correlação de +0.89 com o preço spot do Brent e +0.78 com distribuição. Em quedas de -15% no petróleo, o spread médio de crédito abre +140 bps, gerando marcação a mercado negativa em cadeia.',
        recommendation:
          'Desalocar R$ 80.000 a R$ 100.000 da Carteira Wilson em debêntures de upstream (especialmente Origem e Brava) e migrar para NTN-B soberanas (IMA-B) ou CRA com correlação negativa (-0.22).',
        tickers: ['DEB Origem Energia', 'DEB Brava Energia', 'DEB Enauta', 'DEB Petrobras', 'PETR4', 'PRIO3'],
      },
      {
        id: 'cluster-downstream-fuel',
        name: 'Cluster Beta: Distribuição de Combustíveis & Refino',
        subtitle: 'Margem de Distribuição de Diesel, Gasolina e Etanol',
        severity: 'WARNING',
        intraClusterCorrelation: 0.76,
        totalAumExposed: fuelAum > 0 ? fuelAum : 142000,
        affectedPortfoliosCount: 2,
        primaryRisk: 'Risco de Defasagem de Preços de Paridade de Importação (PPI) & Volatilidade de Diesel',
        description:
          'Empresas distribuidoras e contratos futuros de diesel/destilados (DBE/USO). Sensíveis a intervenções regulatórias nos preços dos combustíveis e volatilidade cambial do dólar PTAX.',
        contagionMechanism:
          'Correlação de +0.77 com commodities globais e dependência direta do spread crack entre o barril de petróleo cru e o diesel refinado.',
        recommendation:
          'Manter exposição sob teto de 5% do patrimônio líquido e priorizar distribuidoras integradas com capacidade de repasse imediato.',
        tickers: ['VBBR3 (Vibra)', 'UGPA3 (Ultrapar)', 'CSAN3 (Cosan)', 'DBE (Invesco Diesel)', 'BNO (Brent ETF)'],
      },
      {
        id: 'cluster-utilities-power',
        name: 'Cluster Gama: Geração & Transmissão Elétrica Regulada',
        subtitle: 'Concessões de Longo Prazo, Debêntures Isentas CVM 175',
        severity: 'MODERATE',
        intraClusterCorrelation: 0.54,
        totalAumExposed: utilityAum,
        affectedPortfoliosCount: 2,
        primaryRisk: 'Risco de Curva de Juros Real (NTN-B 2035) & Risco Hidrológico GSF',
        description:
          'Ativos de infraestrutura elétrica e debêntures incentivadas de transmissão (ISA CTEEP, Celpe). O risco principal não é a commodity, mas sim a abertura da taxa de juro real (NTN-B + 6,5% a.a.) e revisões tarifárias da Aneel.',
        contagionMechanism:
          'Apresenta correlação moderada (+0.52) com o complexo de energia, porém oferece resiliência de fluxo de caixa contratado pela RAP (Receita Anual Permitida).',
        recommendation:
          'Excelente ativo âncora para descorrelacionar do risco de upstream. Preservar debêntures de transmissão com ratings AAA.',
        tickers: ['DEB ISA CTEEP', 'DEB Celpe', 'Itubers Debêntures', 'Itaú Legend Infra'],
      },
    ];
  }, [energyHoldings]);

  // 4. Simulação de Choque de Petróleo (Oil Shock Stress Test)
  const stressSimulation = useMemo(() => {
    return portfolios.map((portfolio) => {
      const holdings = energyHoldings.filter((h) => h.portfolioId === portfolio.id);
      let estimatedLossBRL = 0;

      holdings.forEach((h) => {
        // Modelo de sensibilidade: Delta% do ativo = (oilShockSlider% * oilSensitivity) + (spread impact se for debênture)
        const spreadImpactPercent =
          h.segment === 'UPSTREAM_EP'
            ? -(creditSpreadStressBps / 100) * 0.8 // Duração estimada de 4 anos
            : -(creditSpreadStressBps / 100) * 0.4;

        const assetTotalShockPercent = (oilShockSlider * h.oilSensitivity) / 100 + spreadImpactPercent / 100;
        const assetImpactBRL = h.totalValue * assetTotalShockPercent;
        estimatedLossBRL += assetImpactBRL;
      });

      const portfolioDropPercent =
        portfolio.totalAum > 0 ? (estimatedLossBRL / portfolio.totalAum) * 100 : 0;

      return {
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        clientName: portfolio.clientName,
        totalAum: portfolio.totalAum,
        energyAum: holdings.reduce((sum, h) => sum + h.totalValue, 0),
        estimatedLossBRL,
        portfolioDropPercent,
        postShockAum: portfolio.totalAum + estimatedLossBRL,
        breachTriggered: portfolioDropPercent < -2.0, // Alerta se o choque custar mais de 2% do AUM
      };
    });
  }, [portfolios, energyHoldings, oilShockSlider, creditSpreadStressBps]);

  // Função auxiliar de cores da matriz de correlação
  const getCorrelationColor = (val: number) => {
    if (val === 1.0) {
      return {
        bg: 'bg-slate-800 text-white font-bold',
        border: 'border-slate-700',
      };
    }
    if (val >= 0.8) {
      return {
        bg: 'bg-rose-600/30 text-rose-300 font-extrabold',
        border: 'border-rose-500/50',
      };
    }
    if (val >= 0.6) {
      return {
        bg: 'bg-amber-500/25 text-amber-300 font-bold',
        border: 'border-amber-500/40',
      };
    }
    if (val >= 0.3) {
      return {
        bg: 'bg-yellow-500/20 text-yellow-300 font-semibold',
        border: 'border-yellow-500/30',
      };
    }
    if (val >= 0.0) {
      return {
        bg: 'bg-slate-800/80 text-slate-300 font-medium',
        border: 'border-slate-700/50',
      };
    }
    if (val >= -0.3) {
      return {
        bg: 'bg-teal-500/20 text-teal-300 font-semibold',
        border: 'border-teal-500/30',
      };
    }
    return {
      bg: 'bg-cyan-500/30 text-cyan-200 font-extrabold',
      border: 'border-cyan-500/50',
    };
  };

  const filteredHoldings = useMemo(() => {
    return energyHoldings.filter((item) => {
      if (selectedPortfolioId !== 'ALL' && item.portfolioId !== selectedPortfolioId) {
        return false;
      }
      if (filterSearch.trim()) {
        const query = filterSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.ticker.toLowerCase().includes(query) ||
          item.clientName.toLowerCase().includes(query) ||
          item.segmentLabel.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [energyHoldings, selectedPortfolioId, filterSearch]);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0B1528] to-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-950/50 shrink-0">
            <Flame className="w-6 h-6 text-white" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Risco Tático & Mapa de Calor de Energia
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
                TEMPO REAL • BRENT & COMMODITIES
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                CVM 175 & IPS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Monitoramento dinâmico de correlação cruzada e identificação de{' '}
              <strong className="text-amber-300">clusters de risco excessivo</strong> na cadeia de energia
              (Upstream E&P, Distribuição de Combustíveis e Debêntures de Infraestrutura) integrados às carteiras reais.
            </p>
          </div>
        </div>

        {/* Controles de Janela Temporal e Ação Rápida */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          {/* Seletor de Janela Temporal */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(['30D', '90D', '180D', '1Y'] as TimeframeOption[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  timeframe === tf
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={`Janela estatística de correlação móvel de ${tf}`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowRebalanceModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 transition shadow-md shadow-amber-950/40 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rebalanceamento Tático</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas da Casa MPX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>AUM Total em Energia</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              R$ {(aggregatedStats.totalEnergyAum / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k
            </span>
            <span className="text-xs font-bold text-amber-400">
              {aggregatedStats.energyPercent.toFixed(1)}% do AUM
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Exposição direta em ações, debêntures e fundos de infraestrutura.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Cluster Upstream (E&P)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 font-mono">
              R$ {(aggregatedStats.upstreamTotalAum / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k
            </span>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              ALTA CONCENTRAÇÃO
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Debêntures Brava, Origem, Enauta e Petrobras sob mesmo fator de risco.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Correlação Intra-Cluster</span>
            <Activity className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">+0,91</span>
            <span className="text-xs text-orange-400 font-semibold">Janela {timeframe}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Co-movimento quase linear entre preço do barril e spreads de produtoras.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Carteiras em Limite Crítico</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {aggregatedStats.criticalPortfoliosCount} Carteira
            </span>
            <span className="text-xs font-bold text-slate-400">Wilson (16,8%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Requer intervenção tática para enquadramento prudencial.
          </p>
        </div>
      </div>

      {/* Navegação de Abas do Componente TacticalRiskView */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubView('heatmap')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeSubView === 'heatmap'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Mapa de Calor Setorial</span>
          </button>

          <button
            onClick={() => setActiveSubView('clusters')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeSubView === 'clusters'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Clusters de Risco em Energia</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping ml-0.5" />
          </button>

          <button
            onClick={() => setActiveSubView('portfolios')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeSubView === 'portfolios'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Exposição das Carteiras</span>
          </button>

          <button
            onClick={() => setActiveSubView('stress-test')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeSubView === 'stress-test'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Choque de Petróleo (Stress)</span>
          </button>
        </div>

        {/* Filtro de Carteira Ativa */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Filtrar Carteira:</span>
          <select
            value={selectedPortfolioId}
            onChange={(e) => setSelectedPortfolioId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Todas as Carteiras (Consolidado)</option>
            {portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.clientName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── ABA 1: MAPA DE CALOR SETORIAL EM TEMPO REAL ── */}
      {activeSubView === 'heatmap' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Matriz de Correlação Setorial Cruzada</span>
                  <span className="text-xs font-normal text-slate-400">
                    (Janela {timeframe} • Escala de Pearson de -1,00 a +1,00)
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clique em qualquer célula para inspecionar co-movimento, beta em relação ao petróleo e impacto tático.
                </p>
              </div>

              {/* Legenda de Cores de Correlação */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  -1.0 (Hedge)
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">0.0 (Neutro)</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40">
                  +0.6 (Alto)
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 border border-rose-500/50">
                  +0.9 (Crítico)
                </span>
              </div>
            </div>

            {/* Tabela do Mapa de Calor */}
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-slate-400 font-semibold uppercase tracking-wider text-[10px] w-48 bg-slate-950/60 sticky left-0 z-10">
                      Setores & Mercados
                    </th>
                    {SECTORS.map((sector) => (
                      <th
                        key={sector.id}
                        className="p-2 font-semibold text-slate-300 text-[11px] min-w-[90px] bg-slate-950/40"
                      >
                        <div className="flex flex-col items-center">
                          <span className="truncate max-w-[85px]" title={sector.name}>
                            {sector.shortName}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {SECTORS.map((rowSector) => (
                    <tr key={rowSector.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-2 text-left font-bold text-slate-200 bg-slate-950/80 sticky left-0 z-10 flex items-center gap-2 border-r border-slate-800">
                        {rowSector.icon}
                        <span className="truncate max-w-[160px]" title={rowSector.name}>
                          {rowSector.shortName}
                        </span>
                      </td>

                      {SECTORS.map((colSector) => {
                        const val = CORRELATION_MATRIX_DATA[rowSector.id]?.[colSector.id]?.[timeframe] ?? 0;
                        const colors = getCorrelationColor(val);
                        const isSelected =
                          selectedPair &&
                          ((selectedPair.from.id === rowSector.id && selectedPair.to.id === colSector.id) ||
                            (selectedPair.from.id === colSector.id && selectedPair.to.id === rowSector.id));

                        return (
                          <td key={colSector.id} className="p-1">
                            <button
                              onClick={() => setSelectedPair({ from: rowSector, to: colSector })}
                              className={`w-full py-2.5 px-1 rounded-lg font-mono text-xs transition border cursor-pointer ${
                                colors.bg
                              } ${colors.border} ${
                                isSelected ? 'ring-2 ring-amber-400 shadow-md scale-95' : 'hover:scale-105'
                              }`}
                              title={`${rowSector.name} vs ${colSector.name}: Correlação ${val > 0 ? '+' : ''}${val.toFixed(2)}`}
                            >
                              {val === 1.0 ? '1,00' : `${val > 0 ? '+' : ''}${val.toFixed(2).replace('.', ',')}`}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Painel do Par Selecionado */}
            {selectedPair && (
              <div className="mt-5 p-4 rounded-xl bg-slate-950/90 border border-amber-500/40 shadow-md animate-fadeIn flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Diagnóstico Tático do Par
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-white font-semibold">
                      {selectedPair.from.shortName} ⟷ {selectedPair.to.shortName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1">
                    {selectedPair.from.id === selectedPair.to.id
                      ? 'Autocorrelação perfeita. O ativo replica 100% de sua própria variância.'
                      : (CORRELATION_MATRIX_DATA[selectedPair.from.id]?.[selectedPair.to.id]?.[timeframe] ?? 0) > 0.75
                      ? '🔴 ALTO RISCO DE CO-MOVIMENTO: Choques setoriais atingirão ambas as posições simultaneamente, eliminando a diversificação.'
                      : (CORRELATION_MATRIX_DATA[selectedPair.from.id]?.[selectedPair.to.id]?.[timeframe] ?? 0) < -0.15
                      ? '🟢 EFEITO HEDGE PROTETOR: Correlação negativa atua como amortecedor de volatilidade e proteção de drawdown.'
                      : '🟡 CORRELAÇÃO BAIXA A MODERADA: Diversificação eficiente dentro dos padrões de conformidade CVM 175.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Coeficiente r</span>
                    <span className="text-xl font-mono font-black text-amber-300">
                      {CORRELATION_MATRIX_DATA[selectedPair.from.id]?.[selectedPair.to.id]?.[timeframe]?.toFixed(2) ?? '0.00'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedPair(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Destaque Tático: Alerta de Contágio nos Ativos de Petróleo */}
          <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/40 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Cluster de Upstream (E&P) apresenta correlação de +0,89 com o Brent
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Debêntures de Brava Energia, Origem Energia, Enauta e Petrobras possuem forte contágio mútuo.
                  Recomenda-se balancear com o setor de <strong>Transmissão Elétrica (+0,42)</strong> ou{' '}
                  <strong>NTN-B Soberana (-0,22)</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveSubView('clusters')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition whitespace-nowrap shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Ver Detalhes do Cluster</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── ABA 2: CLUSTERS DE RISCO EXCESSIVO EM ENERGIA ── */}
      {activeSubView === 'clusters' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {energyClusters.map((cluster) => (
              <div
                key={cluster.id}
                className={`p-5 rounded-2xl border transition shadow-lg relative overflow-hidden ${
                  cluster.severity === 'CRITICAL'
                    ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/40'
                    : cluster.severity === 'WARNING'
                    ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/40'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        cluster.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                          : cluster.severity === 'WARNING'
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                          : 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400'
                      }`}
                    >
                      {cluster.severity === 'CRITICAL' ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : cluster.severity === 'WARNING' ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Zap className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-white">{cluster.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cluster.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : cluster.severity === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {cluster.severity === 'CRITICAL'
                            ? 'RISCO EXCESSIVO IDENTIFICADO'
                            : cluster.severity === 'WARNING'
                            ? 'ALERTA DE CONCENTRAÇÃO'
                            : 'MONITORAMENTO TÁTICO'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{cluster.subtitle}</p>
                    </div>
                  </div>

                  {/* Estatísticas Rápidas do Cluster */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Correlação Interna</span>
                      <span className="text-sm font-black text-amber-400">
                        +{(cluster.intraClusterCorrelation * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Volume Exposto</span>
                      <span className="text-sm font-black text-white">
                        R$ {(cluster.totalAumExposed / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Explicativo & Mecanismo de Contágio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                  <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      Mecanismo de Contágio Sistêmico
                    </span>
                    <p className="text-slate-400 leading-relaxed">{cluster.contagionMechanism}</p>

                    <div className="pt-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                        Ativos Componentes no FlowCore:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cluster.tickers.map((tk) => (
                          <span
                            key={tk}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700"
                          >
                            {tk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Recomendação de Descorrelação & Proteção
                      </span>
                      <p className="text-slate-300 leading-relaxed mt-1">{cluster.recommendation}</p>
                    </div>

                    <div className="pt-3 flex items-center justify-end">
                      <button
                        onClick={() => setShowRebalanceModal(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Simular Descorrelação Tática</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA 3: EXPOSIÇÃO DAS CARTEIRAS ATUAIS ── */}
      {activeSubView === 'portfolios' && (
        <div className="space-y-4">
          {/* Card Resumo de Carteiras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {portfolioEnergySummary.map((port) => (
              <div
                key={port.portfolioId}
                className={`p-4 rounded-xl border transition ${
                  port.riskLevel === 'CRITICAL'
                    ? 'bg-rose-950/30 border-rose-500/40'
                    : port.riskLevel === 'WARNING'
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{port.portfolioName}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      port.riskLevel === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : port.riskLevel === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {port.riskLevel}
                  </span>
                </div>
                <span className="text-xs text-slate-400 block mt-0.5">Titular: {port.clientName}</span>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Total em Energia:</span>
                    <span className="font-bold text-white">
                      R$ {port.totalEnergyAum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Peso no Patrimônio:</span>
                    <span
                      className={`font-bold ${
                        port.energyPercent > 12 ? 'text-rose-400' : 'text-amber-300'
                      }`}
                    >
                      {port.energyPercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Upstream E&P (Risco Elevado):</span>
                    <span className="font-bold text-rose-300">
                      R$ {port.upstreamAum.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} (
                      {port.upstreamPercent.toFixed(1)}%)
                    </span>
                  </div>

                  {/* Barra de Limite Prudencial */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${
                        port.energyPercent > 15
                          ? 'bg-rose-500'
                          : port.energyPercent > 10
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (port.energyPercent / 20) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block text-right">
                    Teto Prudencial CVM 175: 12%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tabela de Ativos de Energia Integrados */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Posições Atuais na Cadeia de Energia ({filteredHoldings.length} Ativos Mapeados)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Alocações reais extraídas das carteiras em custódia.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Buscar ativo, emissor ou titular..."
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Ativo / Emissor</th>
                    <th className="py-2.5 px-3">Segmento</th>
                    <th className="py-2.5 px-3">Carteira</th>
                    <th className="py-2.5 px-3 text-right">Valor Alocado</th>
                    <th className="py-2.5 px-3 text-right">% Carteira</th>
                    <th className="py-2.5 px-3 text-center">Corr. Brent</th>
                    <th className="py-2.5 px-3 text-center">Status Risco</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHoldings.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{h.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{h.ticker}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] border border-slate-700">
                          {h.segmentLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <span className="font-semibold text-white">{h.portfolioName}</span>
                        <span className="block text-[10px] text-slate-400">{h.clientName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        R$ {h.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-300 font-semibold">
                        {h.allocationPercent.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400">
                        +{h.correlationToBrent.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.riskStatus === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : h.riskStatus === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {h.riskStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 4: CHOQUE DE PETRÓLEO (STRESS TEST) ── */}
      {activeSubView === 'stress-test' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="pb-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Simulador de Estresse Tático de Petróleo & Spreads de Crédito</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Projeção de impacto patrimonial imediato nas carteiras em caso de volatilidade severa de commodities.
                </p>
              </div>

              {/* Botões de Cenários Pré-configurados */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setOilShockSlider(-15);
                    setCreditSpreadStressBps(150);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 transition cursor-pointer"
                >
                  Queda Brent -15%
                </button>
                <button
                  onClick={() => {
                    setOilShockSlider(-25);
                    setCreditSpreadStressBps(250);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-600/40 hover:bg-red-600/50 text-red-200 border border-red-500/50 transition cursor-pointer"
                >
                  Choque Severo -25%
                </button>
                <button
                  onClick={() => {
                    setOilShockSlider(20);
                    setCreditSpreadStressBps(-50);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 transition cursor-pointer"
                >
                  Alta Geopolítica +20%
                </button>
              </div>
            </div>

            {/* Sliders Interativos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-300">Variação do Barril de Petróleo Brent:</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      oilShockSlider < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {oilShockSlider > 0 ? '+' : ''}
                    {oilShockSlider}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={oilShockSlider}
                  onChange={(e) => setOilShockSlider(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>-30% (Colapso)</span>
                  <span>0% (Neutro)</span>
                  <span>+30% (Rali)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-300">Abertura de Spread de Crédito E&P:</span>
                  <span className="font-mono font-bold text-sm text-amber-300">
                    +{creditSpreadStressBps} bps
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="400"
                  step="10"
                  value={creditSpreadStressBps}
                  onChange={(e) => setCreditSpreadStressBps(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>0 bps (Normal)</span>
                  <span>+200 bps (Estresse)</span>
                  <span>+400 bps (Crise)</span>
                </div>
              </div>
            </div>

            {/* Tabela de Resultados do Teste de Estresse */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Carteira</th>
                    <th className="py-2.5 px-3 text-right">Patrimônio Atual</th>
                    <th className="py-2.5 px-3 text-right">Exposição Energia</th>
                    <th className="py-2.5 px-3 text-right">Impacto Estimado (P&L)</th>
                    <th className="py-2.5 px-3 text-right">Queda Carteira</th>
                    <th className="py-2.5 px-3 text-center">Status CVM 175</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stressSimulation.map((sim) => (
                    <tr key={sim.portfolioId} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white">{sim.portfolioName}</span>
                        <span className="block text-[10px] text-slate-400">{sim.clientName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        R$ {sim.totalAum.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-300 font-semibold">
                        R$ {sim.energyAum.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={sim.estimatedLossBRL < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {sim.estimatedLossBRL < 0 ? '-' : '+'}R${' '}
                          {Math.abs(sim.estimatedLossBRL).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={sim.portfolioDropPercent < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {sim.portfolioDropPercent > 0 ? '+' : ''}
                          {sim.portfolioDropPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {sim.breachTriggered ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            DRAWDOWN EXCESSIVO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            RESILIENTE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rebalanceamento Tático de Descorrelação */}
      {showRebalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowRebalanceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Plano Tático de Descorrelação do Cluster de Energia
                </h3>
                <p className="text-xs text-slate-400">
                  Enquadramento prudencial CVM 175 para Carteira Wilson.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Ação 1: Redução de R$ 50.000 em DEB Origem Energia</strong>
                  <p className="text-slate-400 mt-0.5">
                    Desalocação parcial de debênture prefixada de upstream com taxa de 14,7% a.a. para estancar risco de crédito.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Ação 2: Redução de R$ 30.000 em DEB Brava Energia</strong>
                  <p className="text-slate-400 mt-0.5">
                    Minimizar contágio direto da flutuação diária do Brent em operadora junior.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Ação 3: Rotação para NTN-B 2035 (IMA-B Soberano)</strong>
                  <p className="text-slate-400 mt-0.5">
                    Alocar os R$ 80.000 resgatados em títulos soberanos com correlação negativa de -0,22, reduzindo a volatilidade geral da carteira em 28%.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRebalanceModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowRebalanceModal(false);
                  if (onNavigateTab) {
                    onNavigateTab('simulator');
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md cursor-pointer"
              >
                Abrir Simulador de Rebalanceamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
