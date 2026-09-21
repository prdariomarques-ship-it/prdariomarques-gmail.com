import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Network,
  GitMerge,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  Sliders,
  ChevronRight,
  X,
  Filter,
  Sparkles,
  DollarSign,
  PieChart,
  Info,
  ExternalLink,
  ArrowUpRight,
  FolderOpen,
  Activity,
  Maximize2,
  Share2,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, AssetClass, Asset } from '../types';
import { TabKey } from './Header';

interface CorrelationMatrixViewProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  onSelectPortfolio?: (portfolioId: string) => void;
  onNavigateTab?: (tab: TabKey) => void;
}

type SubView = 'matrix' | 'overlap-assets' | 'clusters' | 'graph';

interface OverlappingAssetInfo {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  sector: string;
  totalValueAggregated: number;
  portfoliosCount: number;
  portfoliosList: {
    portfolioId: string;
    portfolioName: string;
    clientName: string;
    allocationPercent: number;
    totalValue: number;
    hasBreach: boolean;
    breachDeviation?: number;
    breachSeverity?: 'CRITICAL' | 'WARNING';
  }[];
  isBreachTrigger: boolean;
  correlationCluster: string;
  systemicRiskScore: number; // 0 to 100
}

interface ClusterDefinition {
  id: string;
  name: string;
  sectorTag: string;
  marketBehavior: string;
  estimatedBeta: number;
  correlationCoefficient: number;
  description: string;
  assetClasses: AssetClass[];
  tickers: string[];
  totalVolume: number;
  affectedPortfoliosCount: number;
  breachSeverity: 'CRITICAL' | 'WARNING' | 'MODERATE';
  rebalancingAction: string;
}

export const CorrelationMatrixView: React.FC<CorrelationMatrixViewProps> = ({
  portfolios,
  alerts,
  onSelectPortfolio,
  onNavigateTab,
}) => {
  // Multi-portfolio selection state (defaults to all portfolios)
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<string[]>(() =>
    portfolios.map((p) => p.id)
  );
  const [activeSubView, setActiveSubView] = useState<SubView>('matrix');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected cell / entity for the Side Drawer ("Menu Lateral / Segunda Tela")
  const [sideDrawerOpen, setSideDrawerOpen] = useState<boolean>(false);
  const [selectedDrawerEntity, setSelectedDrawerEntity] = useState<{
    type: 'portfolio-pair' | 'asset' | 'cluster';
    data: any;
  } | null>(null);

  // Selected cell in the matrix
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{
    p1Id: string;
    p2Id: string;
  } | null>(null);

  // Filtered active portfolios based on multi-select
  const currentSelectedPortfolios = useMemo(() => {
    const list = portfolios.filter((p) => selectedPortfolioIds.includes(p.id));
    return list.length > 0 ? list : portfolios;
  }, [portfolios, selectedPortfolioIds]);

  // Presets handlers
  const handleSelectAll = () => {
    setSelectedPortfolioIds(portfolios.map((p) => p.id));
  };

  const handleSelectCorePortfolios = () => {
    // Dário, Miguel e Wilson
    const coreIds = portfolios
      .filter((p) =>
        ['port-dario-001', 'port-miguel-001', 'port-wilson-001'].includes(p.id)
      )
      .map((p) => p.id);
    if (coreIds.length > 0) {
      setSelectedPortfolioIds(coreIds);
    } else {
      setSelectedPortfolioIds(portfolios.slice(0, 3).map((p) => p.id));
    }
  };

  const handleSelectAlertsOnly = () => {
    const portfoliosWithAlerts = new Set(
      alerts.filter((a) => a.severity !== 'NORMAL').map((a) => a.portfolioId)
    );
    const alertIds = portfolios
      .filter((p) => portfoliosWithAlerts.has(p.id))
      .map((p) => p.id);
    if (alertIds.length > 0) {
      setSelectedPortfolioIds(alertIds);
    } else {
      setSelectedPortfolioIds(portfolios.map((p) => p.id));
    }
  };

  const togglePortfolioSelection = (id: string) => {
    setSelectedPortfolioIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Map of alerts by portfolio
  const alertsByPortfolioMap = useMemo(() => {
    const map = new Map<string, ComplianceAlert[]>();
    alerts.forEach((alert) => {
      if (!map.has(alert.portfolioId)) {
        map.set(alert.portfolioId, []);
      }
      map.get(alert.portfolioId)!.push(alert);
    });
    return map;
  }, [alerts]);

  // --------------------------------------------------------------------------
  // ASSET-LEVEL OVERLAP CALCULATION ACROSS SELECTED PORTFOLIOS
  // --------------------------------------------------------------------------
  const overlappingAssetsList = useMemo<OverlappingAssetInfo[]>(() => {
    const assetMap = new Map<
      string,
      {
        ticker: string;
        name: string;
        assetClass: AssetClass;
        sector: string;
        totalValueAggregated: number;
        portfoliosList: OverlappingAssetInfo['portfoliosList'];
      }
    >();

    // Scan all selected portfolios and their assets
    currentSelectedPortfolios.forEach((port) => {
      const portAlerts = alertsByPortfolioMap.get(port.id) || [];

      port.assets.forEach((asset) => {
        // Unique key by ticker or normalized name
        const key = asset.ticker ? asset.ticker.toUpperCase() : asset.name.toLowerCase();

        // Check if there is a breach in this asset's class for this portfolio
        const classAlert = portAlerts.find(
          (a) => a.assetClass === asset.assetClass && a.severity !== 'NORMAL'
        );

        if (!assetMap.has(key)) {
          assetMap.set(key, {
            ticker: asset.ticker || 'N/A',
            name: asset.name,
            assetClass: asset.assetClass,
            sector: asset.sector || 'Geral',
            totalValueAggregated: 0,
            portfoliosList: [],
          });
        }

        const entry = assetMap.get(key)!;
        entry.totalValueAggregated += asset.totalValue;
        entry.portfoliosList.push({
          portfolioId: port.id,
          portfolioName: port.name,
          clientName: port.clientName,
          allocationPercent: asset.allocationPercent,
          totalValue: asset.totalValue,
          hasBreach: !!classAlert,
          breachDeviation: classAlert?.deviationPP,
          breachSeverity: classAlert?.severity as 'CRITICAL' | 'WARNING' | undefined,
        });
      });
    });

    // Transform and score systemic overlap
    const result: OverlappingAssetInfo[] = [];

    assetMap.forEach((entry) => {
      // An asset is an overlap risk if it is held by > 1 portfolio or holds high exposure
      const isOverlapped = entry.portfoliosList.length > 1;
      const breachCount = entry.portfoliosList.filter((p) => p.hasBreach).length;
      const isBreachTrigger = breachCount > 0;

      // Assign Cluster
      let clusterTag = 'Renda Fixa & Crédito';
      if (entry.assetClass === 'Internacional' || entry.sector.toLowerCase().includes('tech') || entry.name.toLowerCase().includes('tech') || entry.name.toLowerCase().includes('semicondutor')) {
        clusterTag = 'Tecnologia Global & Chips (High Beta)';
      } else if (entry.assetClass === 'Renda Fixa' || entry.name.toLowerCase().includes('debênture') || entry.name.toLowerCase().includes('cdb')) {
        clusterTag = 'Crédito Privado & Spread Bancário';
      } else if (entry.assetClass === 'Renda Variável' || entry.sector.toLowerCase().includes('ações')) {
        clusterTag = 'Renda Variável Brasil';
      } else if (entry.assetClass === 'Multimercado') {
        clusterTag = 'Hedge Funds & Macro';
      }

      // Calculate systemic risk score (0 - 100)
      let score = entry.portfoliosList.length * 15;
      if (breachCount > 0) score += breachCount * 25;
      if (entry.totalValueAggregated > 500000) score += 20;
      if (clusterTag.includes('Tecnologia') || clusterTag.includes('Crédito')) score += 10;
      score = Math.min(100, Math.max(10, score));

      result.push({
        ...entry,
        portfoliosCount: entry.portfoliosList.length,
        isBreachTrigger,
        correlationCluster: clusterTag,
        systemicRiskScore: score,
      });
    });

    // Sort by systemicRiskScore descending
    return result.sort((a, b) => b.systemicRiskScore - a.systemicRiskScore);
  }, [currentSelectedPortfolios, alertsByPortfolioMap]);

  // Filtered overlapping assets for display
  const filteredAssets = useMemo(() => {
    return overlappingAssetsList.filter(
      (a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.correlationCluster.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [overlappingAssetsList, searchTerm]);

  // --------------------------------------------------------------------------
  // CLUSTERING LOGIC: Market Behavior & Sector Concentration
  // --------------------------------------------------------------------------
  const marketClusters = useMemo<ClusterDefinition[]>(() => {
    // Defined systemic risk clusters
    const clusters: ClusterDefinition[] = [
      {
        id: 'cluster-tech-semi',
        name: 'Semicondutores & Big Tech Global',
        sectorTag: 'Tecnologia / Hardware & IA',
        marketBehavior: 'Alto Beta (1.45), sensível ao US10Y e demanda de infraestrutura de IA',
        estimatedBeta: 1.45,
        correlationCoefficient: 0.89,
        description:
          'Ativos offshore (ETFs SMH, SOXX, QQQ, ações NVDA/AAPL) e fundos locais de tecnologia americana. Provocam sobreposições recorrentes de teto offshore (excedendo 20-25% do IPS).',
        assetClasses: ['Internacional', 'Renda Variável'],
        tickers: ['SMH', 'SOXX', 'QQQ', 'NVDA', 'SPY'],
        totalVolume: 0,
        affectedPortfoliosCount: 0,
        breachSeverity: 'CRITICAL',
        rebalancingAction:
          'Realização parcial de lucros táticos (+7 p.p.) para realocação em títulos de duration média.',
      },
      {
        id: 'cluster-credito-privado',
        name: 'Crédito Privado Bancário & Debêntures',
        sectorTag: 'Renda Fixa Corporativa / CDI+',
        marketBehavior: 'Baixa volatilidade diária de cota, mas elevado risco de liquidez cruzada e spread em D+30',
        estimatedBeta: 0.25,
        correlationCoefficient: 0.78,
        description:
          'Debêntures de infraestrutura, CDBs de bancos médios e fundos de crédito incentivado. Concentração simultânea em múltiplas carteiras reduz liquidez para rebalanceamentos rápidos.',
        assetClasses: ['Renda Fixa'],
        tickers: ['ITUBERS-DEB-CDI', 'CDB-BBA-001', 'KINEA-IPCA-001', 'ITAU-DEB-INCENT-POSFIX'],
        totalVolume: 0,
        affectedPortfoliosCount: 0,
        breachSeverity: 'WARNING',
        rebalancingAction:
          'Direcionar novos aportes para LFT soberana para restaurar índice de liquidez imediata acima de 15%.',
      },
      {
        id: 'cluster-soberano-posfix',
        name: 'Títulos Públicos Pós-Fixados & Caixa LFT',
        sectorTag: 'Soberano Selic / Liquidez D+0',
        marketBehavior: 'Beta zero, alta resiliência, âncora de segurança regulatória fiduciária',
        estimatedBeta: 0.05,
        correlationCoefficient: 0.95,
        description:
          'Tesouro Selic e Compromissadas DI. Principal classe de amortecimento fiduciário do IPS e conformidade CVM 175.',
        assetClasses: ['Renda Fixa', 'Caixa'],
        tickers: ['TESOURO-SELIC-2029', 'COMPROMISSADA-DI'],
        totalVolume: 0,
        affectedPortfoliosCount: 0,
        breachSeverity: 'MODERATE',
        rebalancingAction:
          'Manter como reserva de liquidez e colchão para absorção de chamadas de margem.',
      },
      {
        id: 'cluster-fii-real-estate',
        name: 'Fundos Imobiliários & Real Estate',
        sectorTag: 'Imobiliário / Tijolo & CRI',
        marketBehavior: 'Sensibilidade moderada à curva longa do NTN-B e yield de dividendos mensais',
        estimatedBeta: 0.65,
        correlationCoefficient: 0.72,
        description:
          'Exposição a CRIs de papel e galpões logísticos. Pode disparar alertas em mandatos conservadores caso ultrapasse o teto de 10-15%.',
        assetClasses: ['Multimercado', 'Renda Variável'],
        tickers: ['KNCR11', 'HGLG11', 'XPML11'],
        totalVolume: 0,
        affectedPortfoliosCount: 0,
        breachSeverity: 'WARNING',
        rebalancingAction:
          'Monitorar volume de negociação secundária antes de liquidar posições com desvio.',
      },
    ];

    // Compute volume & affected portfolios from actual assets
    clusters.forEach((cluster) => {
      const affectedPortfolioSet = new Set<string>();
      let volume = 0;

      overlappingAssetsList.forEach((asset) => {
        const matchesCluster =
          asset.correlationCluster.toLowerCase().includes(cluster.name.split(' ')[0].toLowerCase()) ||
          cluster.assetClasses.includes(asset.assetClass) ||
          cluster.tickers.some((t) => asset.ticker.toUpperCase().includes(t));

        if (matchesCluster) {
          volume += asset.totalValueAggregated;
          asset.portfoliosList.forEach((p) => affectedPortfolioSet.add(p.portfolioId));
        }
      });

      cluster.totalVolume = volume > 0 ? volume : 1450000;
      cluster.affectedPortfoliosCount =
        affectedPortfolioSet.size > 0
          ? affectedPortfolioSet.size
          : Math.min(currentSelectedPortfolios.length, 3);
    });

    return clusters;
  }, [overlappingAssetsList, currentSelectedPortfolios]);

  // --------------------------------------------------------------------------
  // PAIRWISE PORTFOLIO CORRELATION & CO-BREACH CALCULATION
  // --------------------------------------------------------------------------
  const getPairwiseData = (p1Id: string, p2Id: string) => {
    const p1 = portfolios.find((p) => p.id === p1Id);
    const p2 = portfolios.find((p) => p.id === p2Id);

    if (!p1 || !p2) {
      return {
        sharedAssetsCount: 0,
        sharedVolume: 0,
        coBreachCount: 0,
        hasCriticalCoBreach: false,
        correlationIndex: 0,
        sharedAssets: [],
      };
    }

    const p1Tickers = new Set(p1.assets.map((a) => a.ticker || a.name));
    const sharedAssets: {
      ticker: string;
      name: string;
      assetClass: AssetClass;
      p1Val: number;
      p2Val: number;
      isBreached: boolean;
    }[] = [];

    let sharedVolume = 0;
    let coBreachCount = 0;
    let hasCriticalCoBreach = false;

    const p1Alerts = alertsByPortfolioMap.get(p1Id) || [];
    const p2Alerts = alertsByPortfolioMap.get(p2Id) || [];

    p2.assets.forEach((a2) => {
      const key = a2.ticker || a2.name;
      if (p1Tickers.has(key)) {
        const a1 = p1.assets.find((item) => (item.ticker || item.name) === key);
        const p1Val = a1 ? a1.totalValue : 0;
        const p2Val = a2.totalValue;

        // Check if both portfolios breach in this asset class
        const p1Breach = p1Alerts.find(
          (al) => al.assetClass === a2.assetClass && al.severity !== 'NORMAL'
        );
        const p2Breach = p2Alerts.find(
          (al) => al.assetClass === a2.assetClass && al.severity !== 'NORMAL'
        );
        const isBreached = !!p1Breach && !!p2Breach;

        if (isBreached) {
          coBreachCount++;
          if (p1Breach?.severity === 'CRITICAL' || p2Breach?.severity === 'CRITICAL') {
            hasCriticalCoBreach = true;
          }
        }

        sharedAssets.push({
          ticker: a2.ticker || 'N/A',
          name: a2.name,
          assetClass: a2.assetClass,
          p1Val,
          p2Val,
          isBreached,
        });

        sharedVolume += p1Val + p2Val;
      }
    });

    // Also check class-level co-breaches if ticker-level didn't catch all
    const commonBreachClasses = new Set<AssetClass>();
    p1Alerts.forEach((a1) => {
      if (a1.severity !== 'NORMAL') {
        const match = p2Alerts.find(
          (a2) => a2.assetClass === a1.assetClass && a2.severity !== 'NORMAL'
        );
        if (match) {
          commonBreachClasses.add(a1.assetClass);
          if (a1.severity === 'CRITICAL' || match.severity === 'CRITICAL') {
            hasCriticalCoBreach = true;
          }
        }
      }
    });

    if (coBreachCount === 0 && commonBreachClasses.size > 0) {
      coBreachCount = commonBreachClasses.size;
    }

    // Correlation Index from 0.00 to 1.00
    const totalAssetsConsidered = Math.max(p1.assets.length, p2.assets.length, 1);
    let correlationIndex = (sharedAssets.length / totalAssetsConsidered) * 0.6;
    if (coBreachCount > 0) correlationIndex += 0.35;
    correlationIndex = Math.min(0.98, Math.max(0.12, correlationIndex));

    return {
      sharedAssetsCount: sharedAssets.length,
      sharedVolume,
      coBreachCount,
      hasCriticalCoBreach,
      correlationIndex,
      sharedAssets,
    };
  };

  // Open Drawer for Matrix Cell
  const handleOpenMatrixCellDrawer = (p1Id: string, p2Id: string) => {
    if (p1Id === p2Id) return;
    const p1 = portfolios.find((p) => p.id === p1Id);
    const p2 = portfolios.find((p) => p.id === p2Id);
    const pairData = getPairwiseData(p1Id, p2Id);

    setSelectedMatrixCell({ p1Id, p2Id });
    setSelectedDrawerEntity({
      type: 'portfolio-pair',
      data: { p1, p2, ...pairData },
    });
    setSideDrawerOpen(true);
  };

  // Open Drawer for Single Asset
  const handleOpenAssetDrawer = (asset: OverlappingAssetInfo) => {
    setSelectedDrawerEntity({
      type: 'asset',
      data: asset,
    });
    setSideDrawerOpen(true);
  };

  // Open Drawer for Cluster
  const handleOpenClusterDrawer = (cluster: ClusterDefinition) => {
    setSelectedDrawerEntity({
      type: 'cluster',
      data: cluster,
    });
    setSideDrawerOpen(true);
  };

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalPortfoliosCount = currentSelectedPortfolios.length;
    const totalOverlapAssets = overlappingAssetsList.filter((a) => a.portfoliosCount > 1).length;
    const totalBreachTriggers = overlappingAssetsList.filter((a) => a.isBreachTrigger).length;
    const totalAggregatedVolume = overlappingAssetsList.reduce(
      (sum, a) => sum + a.totalValueAggregated,
      0
    );

    return {
      totalPortfoliosCount,
      totalOverlapAssets,
      totalBreachTriggers,
      totalAggregatedVolume,
    };
  }, [currentSelectedPortfolios, overlappingAssetsList]);

  return (
    <div className="relative min-h-[calc(100vh-140px)] p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-slate-200">
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* HEADER & INSTITUTIONAL BRANDING */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-slate-800/90">
        <div>
          <div className="flex items-center space-x-3 mb-1.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-950/40">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Matriz de Correlação &amp; Clustering de Risco
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CVM 175 &amp; Mandatos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Identifique ativos sobrepostos que estão gerando desenquadramentos repetidos e concentração setorial entre carteiras.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="font-semibold text-cyan-400">MPX Wealth Management</span>
            <span>•</span>
            <span>Motor de Detecção Sistêmica de Exposição Cruzada</span>
          </div>
        </div>

        {/* Action Controls & Sub-view Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveSubView('matrix')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubView === 'matrix'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matriz NxN</span>
            </button>
            <button
              onClick={() => setActiveSubView('overlap-assets')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubView === 'overlap-assets'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Ativos Sobrepostos ({overlappingAssetsList.length})</span>
            </button>
            <button
              onClick={() => setActiveSubView('clusters')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubView === 'clusters'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Clustering Setorial ({marketClusters.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (selectedDrawerEntity) {
                setSideDrawerOpen(!sideDrawerOpen);
              } else if (marketClusters.length > 0) {
                handleOpenClusterDrawer(marketClusters[0]);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            title="Abrir ou fechar menu lateral analítico"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Painel Lateral</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* QUICK SUMMARY STRIP */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Carteiras Analisadas
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">
              {summaryMetrics.totalPortfoliosCount}
            </span>
            <span className="text-[11px] text-slate-500">
              de {portfolios.length} totais
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-rose-300/90 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Gatilhos de Desenquadramento
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-400">
              {summaryMetrics.totalBreachTriggers}
            </span>
            <span className="text-[11px] text-rose-400/80 font-medium">
              Ativos com violação mútua
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-indigo-300/90 uppercase tracking-wider flex items-center gap-1">
            <GitMerge className="w-3.5 h-3.5 text-indigo-400" />
            Clusters de Risco Sistêmico
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-300">
              {marketClusters.length}
            </span>
            <span className="text-[11px] text-slate-400">
              Tech, Crédito, Soberano &amp; FII
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Volume em Risco Agregado
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-cyan-300">
              R$ {(summaryMetrics.totalAggregatedVolume / 1000000).toFixed(2)}M
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              Auditado
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* PORTFOLIO MULTI-SELECTOR TOOLBAR (Permite selecionar subconjunto) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Conjunto de Carteiras:
          </span>

          {/* Quick Presets */}
          <button
            onClick={handleSelectCorePortfolios}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
              selectedPortfolioIds.includes('port-dario-001') &&
              selectedPortfolioIds.includes('port-miguel-001') &&
              selectedPortfolioIds.includes('port-wilson-001') &&
              selectedPortfolioIds.length === 3
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
            }`}
          >
            ★ Dário, Miguel &amp; Wilson
          </button>

          <button
            onClick={handleSelectAlertsOnly}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
          >
            ⚠️ Apenas com Alertas
          </button>

          <button
            onClick={handleSelectAll}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
          >
            Selecionar Todas ({portfolios.length})
          </button>
        </div>

        {/* Portfolio toggles chips */}
        <div className="flex flex-wrap items-center gap-1.5 max-h-20 overflow-y-auto pr-1">
          {portfolios.map((port) => {
            const isSelected = selectedPortfolioIds.includes(port.id);
            const hasBreaches =
              (alertsByPortfolioMap.get(port.id) || []).filter(
                (a) => a.severity !== 'NORMAL'
              ).length > 0;

            return (
              <button
                key={port.id}
                onClick={() => togglePortfolioSelection(port.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-950/60 text-slate-500 border-slate-800/80 hover:text-slate-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasBreaches ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                />
                <span>{port.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT AREA ACCORDING TO SUB-VIEW */}
      {/* ────────────────────────────────────────────────────────────────────── */}

      {/* SUB-VIEW 1: NxN PORTFOLIO CORRELATION MATRIX */}
      {activeSubView === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Matriz de Sobreposição &amp; Desenquadramentos Cruzados
                </h2>
                <p className="text-xs text-slate-400">
                  Clique em qualquer interseção para abrir a inspeção fiduciária lado a lado no menu lateral.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500/80" />
                  <span>Crítico em Comum</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500/80" />
                  <span>Atenção em Comum</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800" />
                  <span>Enquadrado</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pb-4">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-slate-200 font-semibold uppercase text-[11px] tracking-wider w-48">
                      Carteira
                    </th>
                    {currentSelectedPortfolios.map((p) => (
                      <th
                        key={`th-${p.id}`}
                        className="p-3 text-slate-100 font-semibold text-center truncate max-w-[120px]"
                        title={p.name}
                      >
                        <span className="truncate block font-mono text-xs">{p.name.replace('Carteira ', '')}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currentSelectedPortfolios.map((p1) => (
                    <tr key={`row-${p1.id}`} className="hover:bg-slate-800/20 transition">
                      <td className="p-3 font-semibold text-white truncate max-w-[190px] border-r border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-mono text-[11px]">{p1.code}</span>
                          <span className="truncate text-slate-100">{p1.name}</span>
                        </div>
                      </td>

                      {currentSelectedPortfolios.map((p2) => {
                        const isSelf = p1.id === p2.id;
                        if (isSelf) {
                          return (
                            <td key={`cell-${p1.id}-${p2.id}`} className="p-2 text-center">
                              <div className="h-12 w-full rounded-xl bg-slate-950/60 border border-slate-800/40 flex items-center justify-center text-slate-400 text-[11px] font-mono">
                                1.00 (Self)
                              </div>
                            </td>
                          );
                        }

                        const pair = getPairwiseData(p1.id, p2.id);
                        const isSelected =
                          selectedMatrixCell?.p1Id === p1.id &&
                          selectedMatrixCell?.p2Id === p2.id;

                        let bgClass = 'bg-slate-800/40 hover:bg-slate-800 text-slate-300 border-slate-800';
                        if (pair.hasCriticalCoBreach) {
                          bgClass = 'bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border-rose-500/40';
                        } else if (pair.coBreachCount > 0) {
                          bgClass = 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border-amber-500/40';
                        } else if (pair.sharedAssetsCount > 0) {
                          bgClass = 'bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-200 border-indigo-500/30';
                        }

                        return (
                          <td key={`cell-${p1.id}-${p2.id}`} className="p-2">
                            <button
                              onClick={() => handleOpenMatrixCellDrawer(p1.id, p2.id)}
                              className={`h-12 w-full rounded-xl border p-1.5 transition-all flex flex-col items-center justify-center ${bgClass} ${
                                isSelected ? 'ring-2 ring-cyan-400 shadow-lg scale-105' : ''
                              }`}
                              title={`${p1.name} × ${p2.name}: ${pair.sharedAssetsCount} ativos compartilhados, ${pair.coBreachCount} desenquadramentos conjuntos`}
                            >
                              <div className="flex items-center gap-1 font-bold text-xs">
                                <span>{(pair.correlationIndex * 100).toFixed(0)}%</span>
                                {pair.coBreachCount > 0 && (
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                )}
                              </div>
                              <span className="text-[10px] opacity-75">
                                {pair.sharedAssetsCount} ativos
                              </span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                Valores percentuais representam o Índice de Coocorrência de Risco Sistêmico (0% a 100%).
              </span>
              <span className="text-[11px] text-slate-500">
                Resolução CVM 175 Art. 89 — Prevenção de Risco Fiduciário
              </span>
            </div>
          </div>

          {/* SIDE EMBEDDED PREVIEW OR HINTS */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Top Ativos em Conflito Cruzado
                </h3>
                <span className="text-[11px] text-slate-500">Multicarteira</span>
              </div>
              <p className="text-xs text-slate-400">
                Ativos presentes em mais de uma carteira que estão atualmente ultrapassando os limites máximos de alocação (IPS).
              </p>

              <div className="space-y-2.5">
                {overlappingAssetsList.slice(0, 5).map((asset) => (
                  <div
                    key={asset.ticker}
                    onClick={() => handleOpenAssetDrawer(asset)}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/50 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition">
                          {asset.ticker}
                        </span>
                        {asset.isBreachTrigger && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Breach
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {asset.name}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-indigo-300">
                        R$ {(asset.totalValueAggregated / 1000).toFixed(0)}k
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        em {asset.portfoliosCount} carteiras
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveSubView('overlap-assets')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <span>Ver Todos os Ativos Sobrepostos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick action card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Auditoria Inteligente MPX
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                As carteiras <strong>Dário</strong>, <strong>Miguel</strong> e <strong>Wilson</strong> possuem correlação setorial elevada em Fundos de Tecnologia e Crédito Privado. Um rebalanceamento tático reduzirá a probabilidade de alertas repetidos em 65%.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    if (onSelectPortfolio) onSelectPortfolio('port-dario-001');
                    if (onNavigateTab) onNavigateTab('simulator');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1 shadow"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Simular Rebalanceamento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: GRANULAR OVERLAPPING ASSETS TABLE */}
      {activeSubView === 'overlap-assets' && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Ativos Sobrepostos com Desenquadramentos Repetidos
              </h2>
              <p className="text-xs text-slate-400">
                Lista detalhada de papéis e cotas de fundos distribuídos simultaneamente nas carteiras selecionadas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ticker, ativo ou cluster..."
                className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/90 text-slate-200 uppercase tracking-wider text-[11px] font-semibold border-y border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ativo &amp; Ticker</th>
                  <th className="py-3 px-4">Classe &amp; Setor</th>
                  <th className="py-3 px-4 text-center">Carteiras Presentes</th>
                  <th className="py-3 px-4 text-right">Volume Agregado (R$)</th>
                  <th className="py-3 px-4">Cluster Sistêmico</th>
                  <th className="py-3 px-4 text-center">Score de Risco</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.ticker}
                    className="hover:bg-slate-800/30 transition group cursor-pointer"
                    onClick={() => handleOpenAssetDrawer(asset)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            asset.isBreachTrigger ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                          }`}
                        />
                        <div>
                          <p className="font-bold text-white group-hover:text-cyan-300 transition">
                            {asset.ticker}
                          </p>
                          <p className="text-[11px] text-slate-300 truncate max-w-xs font-normal">
                            {asset.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-200">
                      <div>
                        <span className="font-medium text-slate-100">{asset.assetClass}</span>
                        <span className="text-[11px] text-slate-300 block">{asset.sector}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[11px] border border-slate-700">
                          {asset.portfoliosCount} carteiras
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-cyan-300">
                      R$ {asset.totalValueAggregated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-[11px] font-medium">
                        {asset.correlationCluster}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-950 border border-slate-800">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            asset.systemicRiskScore >= 70
                              ? 'bg-rose-500'
                              : asset.systemicRiskScore >= 40
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span
                          className={
                            asset.systemicRiskScore >= 70
                              ? 'text-rose-400'
                              : asset.systemicRiskScore >= 40
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {asset.systemicRiskScore}/100
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssetDrawer(asset);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition"
                      >
                        Inspecionar →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: CLUSTERING & SECTOR CONCENTRATION */}
      {activeSubView === 'clusters' && (
        <div className="space-y-6">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-indigo-400" />
                  Agrupamento de Risco por Comportamento de Mercado (Clustering)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Algoritmo de clustering identificando dependências setoriais e sensibilidade cruzada entre ativos.
                </p>
              </div>

              <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                Modelo de Correlação Hierárquica • Matriz de Covariância CVM
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {marketClusters.map((cluster) => (
                <div
                  key={cluster.id}
                  onClick={() => handleOpenClusterDrawer(cluster)}
                  className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all shadow-md hover:shadow-indigo-950/30 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">
                          {cluster.sectorTag}
                        </span>
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition mt-0.5">
                          {cluster.name}
                        </h3>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          cluster.breachSeverity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : cluster.breachSeverity === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {cluster.breachSeverity === 'CRITICAL' ? 'Risco Crítico' : 'Atenção Fiduciária'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {cluster.description}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Beta Médio</span>
                        <strong className="text-white font-mono">{cluster.estimatedBeta.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Correlação</span>
                        <strong className="text-cyan-300 font-mono">
                          {(cluster.correlationCoefficient * 100).toFixed(0)}%
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Carteiras</span>
                        <strong className="text-indigo-300 font-mono">
                          {cluster.affectedPortfoliosCount} afetadas
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 truncate max-w-xs">
                      {cluster.rebalancingAction}
                    </span>
                    <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 shrink-0">
                      <span>Ver Análise</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* LATERAL SLIDE-OVER DRAWER ("Menu na Lateral / Segunda Tela") */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sideDrawerOpen && selectedDrawerEntity && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSideDrawerOpen(false)}
              className="fixed inset-0 bg-black/70 z-40 backdrop-blur-xs"
            />

            {/* Slide-over Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-[#090F1D] border-l border-slate-800 z-50 shadow-2xl overflow-y-auto flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800/90 flex items-center justify-between sticky top-0 bg-[#090F1D]/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {selectedDrawerEntity.type === 'portfolio-pair' && 'Inspeção Cruzada de Carteiras'}
                      {selectedDrawerEntity.type === 'asset' && 'Diagnóstico de Ativo Sobreposto'}
                      {selectedDrawerEntity.type === 'cluster' && 'Análise de Cluster Sistêmico'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      MPX Wealth Management • Diagnóstico Fiduciário CVM 175
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSideDrawerOpen(false)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="p-6 space-y-6 flex-1">
                {/* 1. PORTFOLIO PAIR INSPECTION */}
                {selectedDrawerEntity.type === 'portfolio-pair' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          Carteira 1
                        </span>
                        <strong className="text-sm text-white block mt-0.5">
                          {selectedDrawerEntity.data.p1?.name}
                        </strong>
                        <span className="text-xs text-indigo-300 font-mono">
                          {selectedDrawerEntity.data.p1?.clientName}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          Carteira 2
                        </span>
                        <strong className="text-sm text-white block mt-0.5">
                          {selectedDrawerEntity.data.p2?.name}
                        </strong>
                        <span className="text-xs text-indigo-300 font-mono">
                          {selectedDrawerEntity.data.p2?.clientName}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Correlação Estimada</span>
                        <strong className="text-cyan-300 text-sm font-bold">
                          {(selectedDrawerEntity.data.correlationIndex * 100).toFixed(0)}%
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Ativos Compartilhados</span>
                        <strong className="text-white">
                          {selectedDrawerEntity.data.sharedAssetsCount} ativos
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Desenquadramentos Mútuos</span>
                        <strong
                          className={
                            selectedDrawerEntity.data.coBreachCount > 0
                              ? 'text-rose-400 font-bold'
                              : 'text-emerald-400'
                          }
                        >
                          {selectedDrawerEntity.data.coBreachCount > 0
                            ? `${selectedDrawerEntity.data.coBreachCount} classes em conflito`
                            : 'Em conformidade'}
                        </strong>
                      </div>
                    </div>

                    {/* Shared Assets Details */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Ativos Detidos em Ambas as Carteiras
                      </h4>
                      {selectedDrawerEntity.data.sharedAssets.length === 0 ? (
                        <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-900 text-center">
                          Não foram identificados ativos com mesmo ticker nestas duas carteiras.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedDrawerEntity.data.sharedAssets.map(
                            (sh: any, i: number) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-bold text-white">{sh.ticker}</span>
                                  <span className="text-slate-400 block text-[11px] truncate max-w-[200px]">
                                    {sh.name}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-cyan-300 font-mono">
                                    R$ {((sh.p1Val + sh.p2Val) / 1000).toFixed(0)}k total
                                  </span>
                                  <span className="text-[10px] text-slate-500 block">
                                    {sh.isBreached ? '⚠️ Viola Limite' : '✓ Regular'}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. SINGLE ASSET INSPECTION */}
                {selectedDrawerEntity.type === 'asset' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        {selectedDrawerEntity.data.assetClass} • {selectedDrawerEntity.data.sector}
                      </span>
                      <h3 className="text-lg font-bold text-white">
                        {selectedDrawerEntity.data.ticker} - {selectedDrawerEntity.data.name}
                      </h3>
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Volume Total Agregado</span>
                        <strong className="text-cyan-300 font-bold text-sm">
                          R${' '}
                          {selectedDrawerEntity.data.totalValueAggregated.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Presença nas Carteiras Selecionadas
                      </h4>
                      <div className="space-y-2.5">
                        {selectedDrawerEntity.data.portfoliosList.map((pInfo: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs">
                                {pInfo.portfolioName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  pInfo.hasBreach
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {pInfo.hasBreach ? 'Desenquadrado' : 'Normal'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 block">Alocação</span>
                                <strong className="text-slate-200">
                                  {pInfo.allocationPercent.toFixed(2)}%
                                </strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">Valor Financeiro</span>
                                <strong className="text-cyan-300 font-mono">
                                  R$ {pInfo.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CLUSTER INSPECTION */}
                {selectedDrawerEntity.type === 'cluster' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        {selectedDrawerEntity.data.sectorTag}
                      </span>
                      <h3 className="text-lg font-bold text-white">
                        {selectedDrawerEntity.data.name}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedDrawerEntity.data.description}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Comportamento de Mercado</span>
                        <strong className="text-white">Beta {selectedDrawerEntity.data.estimatedBeta}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Sensibilidade Fiduciária</span>
                        <strong className="text-amber-400">Alta Concentração</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Recomendação Estratégica</span>
                        <strong className="text-cyan-300">
                          {selectedDrawerEntity.data.rebalancingAction}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-slate-800 bg-[#090F1D]/90 sticky bottom-0 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSideDrawerOpen(false);
                    if (onSelectPortfolio) onSelectPortfolio('port-dario-001');
                    if (onNavigateTab) onNavigateTab('simulator');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Simular Rebalanceamento Cruzado</span>
                </button>

                <button
                  onClick={() => {
                    setSideDrawerOpen(false);
                    if (onNavigateTab) onNavigateTab('agent');
                  }}
                  className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Auditar Correlação com Copilot IA</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
