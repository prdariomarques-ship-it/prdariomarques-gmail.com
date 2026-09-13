import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Landmark,
  Pickaxe,
  Cpu,
  ShieldCheck,
  Building2,
  Factory,
  Wheat,
  Compass,
  Coins,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Sliders,
  X,
  Filter,
  ArrowUpRight,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { Portfolio, ComplianceAlert } from '../types';
import {
  computePortfolioSectorHeatmap,
  SectorHeatmapGroup,
  AssetHeatmapItem,
  SECTORS_CATALOG,
} from '../utils/sectorRiskData';

/**
 * Componente de Seta Animada de Tendência de Risco (Subindo / Descendo)
 * Exibe a direção de variação do risco de exposição do ativo desde a última varredura.
 * - Subindo (UP): Aumento de exposição/risco -> Seta vermelha animada subindo em loop suave
 * - Descendo (DOWN): Redução/arrefecimento de exposição ao risco -> Seta verde animada descendo em loop suave
 * - Estável (STABLE): Variação neutra
 */
interface RiskTrendArrowProps {
  direction?: 'UP' | 'DOWN' | 'STABLE';
  deltaPP?: number;
  size?: 'xs' | 'sm' | 'md';
  showDelta?: boolean;
  showText?: boolean;
  badge?: boolean;
  className?: string;
}

export const RiskTrendArrow: React.FC<RiskTrendArrowProps> = ({
  direction = 'STABLE',
  deltaPP,
  size = 'xs',
  showDelta = true,
  showText = false,
  badge = true,
  className = '',
}) => {
  const isUp = direction === 'UP';
  const isDown = direction === 'DOWN';

  if (!isUp && !isDown) {
    return (
      <span
        title="Exposição estável desde a última varredura fiduciária"
        className={`inline-flex items-center gap-0.5 text-slate-500 font-mono text-[9px] ${className}`}
      >
        <Minus className="w-2.5 h-2.5 opacity-60" />
        {showDelta && <span className="opacity-75">0.0%</span>}
      </span>
    );
  }

  // Em gestão de compliance e risco:
  // UP (Subindo): Risco/exposição do ativo subiu desde a última varredura (Pressão no teto)
  // DOWN (Descendo): Risco/exposição recuou desde a última varredura (Arrefecimento de risco)
  const isHigherRisk = isUp;
  const colorText = isHigherRisk ? 'text-rose-400' : 'text-emerald-400';
  const colorBg = isHigherRisk
    ? 'bg-rose-500/15 border-rose-500/35 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
    : 'bg-emerald-500/15 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.15)]';

  const iconDimension = size === 'xs' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  const textDimension = size === 'xs' ? 'text-[9px]' : size === 'md' ? 'text-xs' : 'text-[10px]';

  const tooltipTitle = isUp
    ? `Exposição ao risco SUBIU ${deltaPP !== undefined ? (deltaPP > 0 ? `+${deltaPP.toFixed(2)} p.p.` : `${deltaPP.toFixed(2)} p.p.`) : ''} desde a última varredura regulatória`
    : `Exposição ao risco RECUOU ${deltaPP !== undefined ? (deltaPP < 0 ? `${deltaPP.toFixed(2)} p.p.` : `-${deltaPP.toFixed(2)} p.p.`) : ''} desde a última varredura regulatória`;

  const formattedValue = deltaPP !== undefined
    ? isUp
      ? deltaPP > 0 ? `+${deltaPP.toFixed(1)}%` : `${deltaPP.toFixed(1)}%`
      : deltaPP < 0 ? `${deltaPP.toFixed(1)}%` : `-${deltaPP.toFixed(1)}%`
    : '';

  return (
    <span
      title={tooltipTitle}
      className={`inline-flex items-center gap-1 font-mono font-bold leading-none select-none transition-all ${
        badge ? `px-1.5 py-0.5 rounded border ${colorBg}` : ''
      } ${colorText} ${className}`}
    >
      <motion.span
        className="inline-flex items-center justify-center shrink-0"
        animate={
          isUp
            ? {
                y: [0, -3, 0],
                transition: {
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'easeInOut',
                },
              }
            : {
                y: [0, 3, 0],
                transition: {
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'easeInOut',
                },
              }
        }
      >
        {isUp ? (
          <TrendingUp className={`${iconDimension} stroke-[2.5]`} />
        ) : (
          <TrendingDown className={`${iconDimension} stroke-[2.5]`} />
        )}
      </motion.span>

      {showDelta && formattedValue && (
        <span className={`${textDimension} tracking-tight font-extrabold`}>
          {formattedValue}
        </span>
      )}

      {showText && (
        <span className="text-[9px] font-medium opacity-80 uppercase tracking-tighter">
          {isUp ? 'risco subiu' : 'risco recuou'}
        </span>
      )}
    </span>
  );
};

interface PortfolioSectorRiskHeatmapProps {
  portfolios: Portfolio[];
  alerts?: ComplianceAlert[];
  selectedPortfolioId?: string;
  onSelectPortfolio?: (portfolioId: string) => void;
  onStartRebalance?: (portfolioId: string) => void;
  onForceScan?: () => Promise<void> | void;
  isScanning?: boolean;
}

type RiskFilter = 'ALL' | 'ALERT_OR_BREACH' | 'BREACH_ONLY' | 'SAFE_ONLY';

export const PortfolioSectorRiskHeatmap: React.FC<PortfolioSectorRiskHeatmapProps> = ({
  portfolios,
  alerts = [],
  selectedPortfolioId: initialSelectedPortfolioId,
  onSelectPortfolio,
  onStartRebalance,
  onForceScan,
  isScanning = false,
}) => {
  // Estado da carteira ativa
  const [activePortfolioId, setActivePortfolioId] = useState<string>(() => {
    if (initialSelectedPortfolioId && portfolios.some((p) => p.id === initialSelectedPortfolioId)) {
      return initialSelectedPortfolioId;
    }
    // Preferência pela primeira carteira com alerta crítico, senão a primeira
    const crit = portfolios.find((p) => p.status === 'CRITICAL');
    return crit ? crit.id : portfolios[0]?.id || '';
  });

  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');
  const [selectedAssetModal, setSelectedAssetModal] = useState<AssetHeatmapItem | null>(null);
  const [selectedSectorModal, setSelectedSectorModal] = useState<SectorHeatmapGroup | null>(null);
  const [isLocalScanning, setIsLocalScanning] = useState<boolean>(false);

  const isScanningActive = isScanning || isLocalScanning;

  const handleTriggerScan = async () => {
    setIsLocalScanning(true);
    try {
      if (onForceScan) {
        await onForceScan();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    } finally {
      setTimeout(() => setIsLocalScanning(false), 400);
    }
  };

  // Sincroniza se a prop mudar
  const currentPortfolio = useMemo(() => {
    return portfolios.find((p) => p.id === activePortfolioId) || portfolios[0];
  }, [portfolios, activePortfolioId]);

  // Executa o cálculo de calor setorial e proximidade regulatória
  const heatmapData = useMemo(() => {
    if (!currentPortfolio) {
      return {
        sectors: [],
        totalAssets: 0,
        totalBreachesCount: 0,
        totalNearLimitCount: 0,
        highestRiskSectorName: 'N/A',
        highestRiskSectorAlloc: 0,
        portfolioRiskScore: 0,
      };
    }
    return computePortfolioSectorHeatmap(currentPortfolio);
  }, [currentPortfolio]);

  // Setores filtrados de acordo com a seleção de risco
  const filteredSectors = useMemo(() => {
    return heatmapData.sectors.filter((sector) => {
      if (riskFilter === 'ALL') return true;
      if (riskFilter === 'ALERT_OR_BREACH') {
        return sector.riskStatus === 'CRITICAL' || sector.riskStatus === 'WARNING' || sector.hasNearLimitAssets;
      }
      if (riskFilter === 'BREACH_ONLY') {
        return sector.riskStatus === 'CRITICAL' || sector.hasBreaches;
      }
      if (riskFilter === 'SAFE_ONLY') {
        return sector.riskStatus === 'SAFE' && !sector.hasNearLimitAssets;
      }
      return true;
    });
  }, [heatmapData.sectors, riskFilter]);

  // Helper para renderizar ícone de setor
  const renderSectorIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'flame':
        return <Flame className={className} />;
      case 'landmark':
        return <Landmark className={className} />;
      case 'pickaxe':
        return <Pickaxe className={className} />;
      case 'cpu':
        return <Cpu className={className} />;
      case 'shield':
        return <ShieldCheck className={className} />;
      case 'building':
        return <Building2 className={className} />;
      case 'factory':
        return <Factory className={className} />;
      case 'wheat':
        return <Wheat className={className} />;
      case 'compass':
        return <Compass className={className} />;
      case 'coins':
      default:
        return <Coins className={className} />;
    }
  };

  const handleSelectPortfolioChange = (id: string) => {
    setActivePortfolioId(id);
    if (onSelectPortfolio) {
      onSelectPortfolio(id);
    }
  };

  if (!currentPortfolio) {
    return null;
  }

  return (
    <div
      id="portfolio-sector-risk-heatmap"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5"
    >
      {/* CABEÇALHO DO MAPA DE CALOR: Título, Subtítulo e Seletor de Carteira */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Mapa de Calor de Risco Setorial & Proximidade Regulatória
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  CVM 175 • CMN 4.963 • IPS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualização matricial de concentração por setor econômico. Identifica ativos em zona de estresse regulatório (&gt;80% do teto prudencial) sujeitos a desenquadramento passivo.
              </p>
            </div>
          </div>
        </div>

        {/* Seletores Superiores: Carteira Ativa & Filtros de Risco */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Carteira */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400 font-medium">Carteira:</span>
            <select
              id="heatmap-portfolio-selector"
              value={activePortfolioId}
              onChange={(e) => handleSelectPortfolioChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name} ({p.profile} • {p.status === 'CRITICAL' ? '🔴 Crítico' : p.status === 'WARNING' ? '🟡 Atenção' : '🟢 Enquadrada'})
                </option>
              ))}
            </select>
          </div>

          {/* Botão de Varredura Fiduciária CVM 175 */}
          <button
            id="heatmap-trigger-scan-btn"
            onClick={handleTriggerScan}
            disabled={isScanningActive}
            title="Executar varredura fiduciária regulatória CVM 175 e atualizar calor setorial"
            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isScanningActive
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 cursor-wait'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isScanningActive ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>{isScanningActive ? 'Varrendo Risco...' : 'Executar Varredura'}</span>
          </button>

          {/* Botão de Rebalanceamento Rápido da Carteira Selecionada */}
          {onStartRebalance && (
            <button
              onClick={() => onStartRebalance(currentPortfolio.id)}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition border border-emerald-500/50 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5" />
              <span>Simular Rebalanceamento</span>
            </button>
          )}
        </div>
      </div>

      {/* BANNER ANIMADO DE VARREDURA FIDUCIÁRIA ATIVA */}
      {isScanningActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-cyan-200 overflow-hidden"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
            <span className="font-medium">
              Varredura de risco em execução: recalculando exposições dos ativos e transicionando as células de calor suavemente...
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-bold shrink-0">
            CVM 175 • CMN 4.963
          </span>
        </motion.div>
      )}

      {/* METRIC CHIPS / TELEMETRIA EM TEMPO REAL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Chip 1: Ativos Próximos do Limite */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Ativos Próximos do Teto</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-xl font-extrabold font-mono ${
                  heatmapData.totalNearLimitCount > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {heatmapData.totalNearLimitCount}
              </span>
              <span className="text-[11px] text-slate-500">de {heatmapData.totalAssets} ativos</span>
            </div>
          </div>
          <div
            className={`p-2 rounded-lg border ${
              heatmapData.totalNearLimitCount > 0
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Chip 2: Ativos Desenquadrados */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Violações de Limite (Emissor)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-xl font-extrabold font-mono ${
                  heatmapData.totalBreachesCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {heatmapData.totalBreachesCount}
              </span>
              <span className="text-[11px] text-slate-500">
                {heatmapData.totalBreachesCount > 0 ? 'urgente' : 'em conformidade'}
              </span>
            </div>
          </div>
          <div
            className={`p-2 rounded-lg border ${
              heatmapData.totalBreachesCount > 0
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Chip 3: Setor com Maior Exposição */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="overflow-hidden">
            <span className="text-[11px] text-slate-400 font-medium block">Maior Concentração Setorial</span>
            <div className="flex items-baseline gap-1.5 mt-0.5 truncate">
              <span className="text-sm font-bold text-white truncate" title={heatmapData.highestRiskSectorName}>
                {heatmapData.highestRiskSectorName}
              </span>
              <span className="text-xs font-extrabold text-cyan-400 font-mono">
                {heatmapData.highestRiskSectorAlloc.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0 ml-2">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        {/* Chip 4: Score Fiduciário da Carteira */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Índice de Risco Fiduciário</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-xl font-extrabold font-mono ${
                  heatmapData.portfolioRiskScore >= 75
                    ? 'text-rose-400'
                    : heatmapData.portfolioRiskScore >= 45
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {heatmapData.portfolioRiskScore}/100
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {heatmapData.portfolioRiskScore >= 75
                  ? 'Alto Risco'
                  : heatmapData.portfolioRiskScore >= 45
                  ? 'Atenção'
                  : 'Controlado'}
              </span>
            </div>
          </div>
          <div
            className={`p-2 rounded-lg border ${
              heatmapData.portfolioRiskScore >= 75
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                : heatmapData.portfolioRiskScore >= 45
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* FILTROS DE RISCO & LEGENDA INTERATIVA DO MAPA DE CALOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs">
        {/* Filtros em Pill */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" />
            Filtrar:
          </span>
          <button
            onClick={() => setRiskFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer ${
              riskFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
            }`}
          >
            Todos os Setores ({heatmapData.sectors.length})
          </button>
          <button
            onClick={() => setRiskFilter('ALERT_OR_BREACH')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1 cursor-pointer ${
              riskFilter === 'ALERT_OR_BREACH'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-amber-300 bg-slate-900/50'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Zona de Alerta & Limites ({heatmapData.totalNearLimitCount + heatmapData.totalBreachesCount})</span>
          </button>
          <button
            onClick={() => setRiskFilter('BREACH_ONLY')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1 cursor-pointer ${
              riskFilter === 'BREACH_ONLY'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-rose-300 bg-slate-900/50'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Desenquadrados ({heatmapData.totalBreachesCount})</span>
          </button>
          <button
            onClick={() => setRiskFilter('SAFE_ONLY')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1 cursor-pointer ${
              riskFilter === 'SAFE_ONLY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300 bg-slate-900/50'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Conformes</span>
          </button>
        </div>

        {/* Legenda de Calor & Tendência Anti-slop */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-300">Intensidade de Calor:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              &lt;60% Teto (Seguro)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              60-80% (Moderado)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              &gt;80% (Próximo do Teto)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              &gt;100% (Violação CVM)
            </span>
          </div>

          {/* Legenda de Setas de Tendência Pós-Varredura */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800 text-[10px]">
            <span className="font-semibold text-slate-300">Tendência vs Última Varredura:</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono font-bold">
              <motion.span
                animate={{ y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="inline-flex"
              >
                <TrendingUp className="w-2.5 h-2.5" />
              </motion.span>
              Risco subiu
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
              <motion.span
                animate={{ y: [0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="inline-flex"
              >
                <TrendingDown className="w-2.5 h-2.5" />
              </motion.span>
              Risco recuou
            </span>
          </div>
        </div>
      </div>

      {/* MATRIZ DO MAPA DE CALOR SETORIAL (TREEMAP / BENTO CLUSTERS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSectors.map((sector) => {
          const isCriticalSector = sector.riskStatus === 'CRITICAL';
          const isWarningSector = sector.riskStatus === 'WARNING';
          const hasBreachAsset = sector.criticalAssetsCount > 0;
          const hasNearLimitAsset = sector.warningAssetsCount > 0;

          return (
            <motion.div
              key={sector.sectorId}
              layout
              initial={false}
              animate={{
                backgroundColor: isCriticalSector
                  ? 'rgba(76, 5, 25, 0.45)'
                  : isWarningSector
                  ? 'rgba(69, 26, 3, 0.35)'
                  : 'rgba(15, 23, 42, 0.85)',
                borderColor: isCriticalSector
                  ? 'rgba(244, 63, 94, 0.5)'
                  : isWarningSector
                  ? 'rgba(245, 158, 11, 0.4)'
                  : 'rgba(30, 41, 59, 0.8)',
                boxShadow: isCriticalSector
                  ? '0 8px 30px rgba(244, 63, 94, 0.15)'
                  : isWarningSector
                  ? '0 8px 24px rgba(245, 158, 11, 0.12)'
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
              }}
              transition={{
                duration: 0.8,
                ease: [0.25, 0.1, 0.25, 1.0],
              }}
              className="relative rounded-2xl border p-4 flex flex-col justify-between"
            >
              {/* Topo do Cluster Setorial: Nome, Ícone e Alocação */}
              <div>
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
                  <div className="flex items-center space-x-2.5">
                    <motion.div
                      animate={{
                        backgroundColor: isCriticalSector
                          ? 'rgba(244, 63, 94, 0.2)'
                          : isWarningSector
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(16, 185, 129, 0.2)',
                        borderColor: isCriticalSector
                          ? 'rgba(244, 63, 94, 0.3)'
                          : isWarningSector
                          ? 'rgba(245, 158, 11, 0.3)'
                          : 'rgba(16, 185, 129, 0.3)',
                        color: isCriticalSector ? '#fda4af' : isWarningSector ? '#fde68a' : '#6ee7b7',
                      }}
                      transition={{ duration: 0.75, ease: 'easeInOut' }}
                      className="p-2 rounded-xl border text-white"
                    >
                      {renderSectorIcon(sector.iconName, 'w-4 h-4')}
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-white leading-tight">
                          {sector.name}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                        {sector.regulatoryReference}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge do Setor */}
                  <div className="text-right shrink-0">
                    <motion.span
                      animate={{
                        backgroundColor: isCriticalSector
                          ? 'rgba(244, 63, 94, 0.2)'
                          : isWarningSector
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(16, 185, 129, 0.15)',
                        borderColor: isCriticalSector
                          ? 'rgba(244, 63, 94, 0.4)'
                          : isWarningSector
                          ? 'rgba(245, 158, 11, 0.4)'
                          : 'rgba(16, 185, 129, 0.3)',
                        color: isCriticalSector ? '#fecdd3' : isWarningSector ? '#fef3c7' : '#a7f3d0',
                      }}
                      transition={{ duration: 0.75, ease: 'easeInOut' }}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-wide border"
                    >
                      {isCriticalSector ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse mr-1" />
                          DESENQUADRADO
                        </>
                      ) : isWarningSector ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" />
                          PRÓXIMO AO LIMITE
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                          CONFORME
                        </>
                      )}
                    </motion.span>
                    <div className="text-[11px] font-mono text-slate-300 font-bold mt-1">
                      R$ {(sector.totalValueBRL / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
                    </div>
                  </div>
                </div>

                {/* Régua de Concentração Setorial vs Teto Regulatório */}
                <div className="mt-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <span>Exposição Setorial:</span>
                      <strong className="text-white font-bold">{sector.allocationPercent.toFixed(1)}%</strong>
                      <RiskTrendArrow
                        direction={sector.sectorRiskTrendDirection}
                        deltaPP={sector.sectorRiskTrendDeltaPP}
                        size="xs"
                      />
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Teto Regulatório:{' '}
                      <strong className="text-cyan-300 font-bold">{sector.sectorRegulatoryLimit.toFixed(1)}%</strong>
                    </span>
                  </div>

                  {/* Barra de Progresso com animação suave framer-motion */}
                  <div className="relative w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      animate={{
                        width: `${Math.min(100, sector.sectorUtilizationRatio)}%`,
                        backgroundColor: sector.allocationPercent > sector.sectorRegulatoryLimit
                          ? '#f43f5e'
                          : sector.sectorUtilizationRatio >= 80
                          ? '#f59e0b'
                          : '#10b981',
                      }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span>{sector.sectorUtilizationRatio.toFixed(0)}% do teto setorial consumido</span>
                      <RiskTrendArrow
                        direction={sector.sectorRiskTrendDirection}
                        deltaPP={sector.sectorRiskTrendDeltaPP}
                        size="xs"
                        showDelta={false}
                        badge={false}
                      />
                    </span>
                    <span className={sector.sectorGapToLimitPP > 0 ? 'text-rose-300 font-bold' : 'text-slate-400'}>
                      {sector.sectorGapToLimitPP > 0
                        ? `Excesso: +${sector.sectorGapToLimitPP.toFixed(1)} p.p.`
                        : `Margem: ${Math.abs(sector.sectorGapToLimitPP).toFixed(1)} p.p. livres`}
                    </span>
                  </div>
                </div>
              </div>

              {/* SUB-GRADE DE ATIVOS DENTRO DO SETOR: Visualização das Células de Calor Individuais */}
              <div className="mt-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold px-0.5">
                  <span>Ativos Alocados ({sector.assets.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Toque no ativo para diagnóstico fiduciário
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sector.assets.map((asset) => {
                    const isAssetCrit = asset.riskStatus === 'CRITICAL';
                    const isAssetWarn = asset.riskStatus === 'WARNING';
                    const isAssetClose = asset.isCloseToLimit;

                    return (
                      <motion.button
                        key={asset.id}
                        onClick={() => setSelectedAssetModal(asset)}
                        layout
                        initial={false}
                        animate={{
                          backgroundColor: isAssetCrit
                            ? 'rgba(76, 5, 25, 0.55)'
                            : isAssetWarn
                            ? 'rgba(69, 26, 3, 0.45)'
                            : 'rgba(2, 6, 23, 0.75)',
                          borderColor: isAssetCrit
                            ? 'rgba(244, 63, 94, 0.65)'
                            : isAssetWarn
                            ? 'rgba(245, 158, 11, 0.55)'
                            : 'rgba(30, 41, 59, 0.85)',
                          boxShadow: isAssetCrit
                            ? '0 0 16px rgba(244, 63, 94, 0.25)'
                            : isAssetWarn
                            ? '0 0 12px rgba(245, 158, 11, 0.18)'
                            : '0 0 0px rgba(0, 0, 0, 0)',
                        }}
                        transition={{
                          duration: 0.75,
                          ease: [0.25, 0.1, 0.25, 1.0],
                        }}
                        whileHover={{ scale: 1.015, transition: { duration: 0.15 } }}
                        whileTap={{ scale: 0.99 }}
                        className="group relative p-2.5 rounded-xl border text-left cursor-pointer flex flex-col justify-between"
                      >
                        {/* Top: Ticker & Alocação */}
                        <div className="flex items-center justify-between gap-1 w-full">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white font-mono group-hover:text-cyan-300 transition">
                              {asset.ticker}
                            </span>
                            {isAssetClose && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-black tracking-tight uppercase ${
                                  isAssetCrit
                                    ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50 animate-pulse'
                                    : 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                                }`}
                              >
                                {isAssetCrit ? 'Violou Teto' : 'Próx. Limite'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-extrabold font-mono text-white">
                              {asset.allocationPercent.toFixed(1)}%
                            </span>
                            <RiskTrendArrow
                              direction={asset.riskTrendDirection}
                              deltaPP={asset.riskTrendDeltaPP}
                              size="xs"
                            />
                          </div>
                        </div>

                        {/* Nome resumido */}
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 w-full" title={asset.name}>
                          {asset.name}
                        </div>

                        {/* Medidor de Limite de Emissor Individual */}
                        <div className="mt-2 w-full space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Teto Emissor: {asset.regulatoryLimitPercent.toFixed(0)}%</span>
                            <span
                              className={`flex items-center gap-1 ${
                                isAssetCrit
                                  ? 'text-rose-300 font-bold'
                                  : isAssetWarn
                                  ? 'text-amber-300 font-bold'
                                  : 'text-slate-400'
                              }`}
                            >
                              <span>{asset.utilizationRatio.toFixed(0)}% do limite</span>
                              <RiskTrendArrow
                                direction={asset.riskTrendDirection}
                                deltaPP={asset.riskTrendDeltaPP}
                                size="xs"
                                showDelta={false}
                                badge={false}
                              />
                            </span>
                          </div>

                          {/* Mini progress bar de calor com animação suave */}
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              animate={{
                                width: `${Math.min(100, asset.utilizationRatio)}%`,
                                backgroundColor: isAssetCrit
                                  ? '#f43f5e'
                                  : isAssetWarn
                                  ? '#fbbf24'
                                  : '#34d399',
                              }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                          </div>

                          {/* Folga ou Excesso em R$ */}
                          <div className="text-[10px] font-mono flex items-center justify-between pt-0.5">
                            <span className="text-slate-500">
                              R$ {(asset.totalValue / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
                            </span>
                            <span
                              className={
                                isAssetCrit
                                  ? 'text-rose-300 font-semibold'
                                  : isAssetWarn
                                  ? 'text-amber-300 font-medium'
                                  : 'text-emerald-400/80'
                              }
                            >
                              {asset.gapToLimitPP > 0
                                ? `+${asset.gapToLimitPP.toFixed(1)} p.p.`
                                : `Folga: ${Math.abs(asset.gapToLimitPP).toFixed(1)} p.p.`}
                            </span>
                          </div>
                        </div>

                        {/* Action affordance */}
                        <div className="mt-2 pt-1 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-cyan-400 opacity-80 group-hover:opacity-100 transition w-full">
                          <span>Diagnóstico fiduciário</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* MODAL / DRAWER DE DIAGNÓSTICO DO ATIVO SELECIONADO */}
      {selectedAssetModal && (
        <div
          id="asset-regulatory-diagnostic-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white font-mono">{selectedAssetModal.ticker}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedAssetModal.assetClass}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      selectedAssetModal.riskStatus === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : selectedAssetModal.riskStatus === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {selectedAssetModal.riskStatus === 'CRITICAL'
                      ? 'Violou Limite CVM'
                      : selectedAssetModal.riskStatus === 'WARNING'
                      ? 'Próximo do Teto Normativo'
                      : 'Margem Segura'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-300 mt-0.5">{selectedAssetModal.name}</h4>
              </div>

              <button
                onClick={() => setSelectedAssetModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Fechar diagnóstico"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fundamentação Regulatória & Base Legal */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">Enquadramento & Base Normativa:</span>
                <span className="font-bold text-cyan-300 font-mono">{selectedAssetModal.regulatoryRule}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A Resolução CVM 175 (Anexo I) e o mandato IPS da carteira estabelecem que nenhum emissor individual ou papel privado deve exceder{' '}
                <strong className="text-white">{selectedAssetModal.regulatoryLimitPercent.toFixed(1)}% do Patrimônio Líquido</strong> para mitigar risco idiossincrático de crédito e liquidez.
              </p>
            </div>

            {/* Comparativo Numérico do Ativo */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block">Alocação Atual</span>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span
                    className={`text-lg font-black font-mono block ${
                      selectedAssetModal.riskStatus === 'CRITICAL'
                        ? 'text-rose-400'
                        : selectedAssetModal.riskStatus === 'WARNING'
                        ? 'text-amber-400'
                        : 'text-white'
                    }`}
                  >
                    {selectedAssetModal.allocationPercent.toFixed(2)}%
                  </span>
                  <RiskTrendArrow
                    direction={selectedAssetModal.riskTrendDirection}
                    deltaPP={selectedAssetModal.riskTrendDeltaPP}
                    size="sm"
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  R$ {(selectedAssetModal.totalValue / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block">Teto Regulatório</span>
                <span className="text-lg font-black font-mono text-cyan-400 mt-0.5 block">
                  {selectedAssetModal.regulatoryLimitPercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {selectedAssetModal.utilizationRatio.toFixed(1)}% utilizado
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block">
                  {selectedAssetModal.gapToLimitPP > 0 ? 'Excesso em Risco' : 'Folga até o Limite'}
                </span>
                <span
                  className={`text-lg font-black font-mono mt-0.5 block ${
                    selectedAssetModal.gapToLimitPP > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {selectedAssetModal.gapToLimitPP > 0
                    ? `+${selectedAssetModal.gapToLimitPP.toFixed(2)} p.p.`
                    : `${Math.abs(selectedAssetModal.gapToLimitPP).toFixed(2)} p.p.`}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {selectedAssetModal.gapToLimitPP > 0
                    ? `Excesso: R$ ${(
                        (selectedAssetModal.gapToLimitPP / 100) *
                        currentPortfolio.totalAum
                      ).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                    : 'Dentro da margem'}
                </span>
              </div>
            </div>

            {/* Dinâmica de Risco / Tendência pós-varredura */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-300 font-medium">
                  Comportamento vs Última Varredura Fiduciária:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RiskTrendArrow
                  direction={selectedAssetModal.riskTrendDirection}
                  deltaPP={selectedAssetModal.riskTrendDeltaPP}
                  size="sm"
                  showText={true}
                />
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedAssetModal.riskTrendDirection === 'UP'
                    ? `(+${Math.abs(selectedAssetModal.riskTrendDeltaPP).toFixed(2)} p.p. de exposição)`
                    : selectedAssetModal.riskTrendDirection === 'DOWN'
                    ? `(-${Math.abs(selectedAssetModal.riskTrendDeltaPP).toFixed(2)} p.p. de exposição)`
                    : '(Exposição estabilizada)'}
                </span>
              </div>
            </div>

            {/* Diagnóstico Prescritivo */}
            <div
              className={`p-3.5 rounded-xl border space-y-1.5 ${
                selectedAssetModal.riskStatus === 'CRITICAL'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : selectedAssetModal.riskStatus === 'WARNING'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Parecer do ComplianceAgent & Inteligência Prescritiva:</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                {selectedAssetModal.riskStatus === 'CRITICAL'
                  ? `Posição desenquadrada perante as regras fiduciárias. Uma valorização recente aumentou a participação acima do limite prudencial. Recomenda-se desinvestimento parcial de R$ ${(
                      (selectedAssetModal.gapToLimitPP / 100) *
                      currentPortfolio.totalAum
                    ).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} para mitigar apontamentos de auditoria.`
                  : selectedAssetModal.riskStatus === 'WARNING'
                  ? `Posição em zona amarela de atenção (&gt;80% do limite de emissor). Um movimento adicional de +${(
                      Math.abs(selectedAssetModal.gapToLimitPP) + 0.1
                    ).toFixed(1)} p.p. de valorização acionária provocará desenquadramento passivo. Sugere-se travar compras e programar rebalanceamento preventivo.`
                  : `Posição perfeitamente enquadrada nos parâmetros prudenciais da CVM e da gestora. Margem de segurança confortável de ${Math.abs(
                      selectedAssetModal.gapToLimitPP
                    ).toFixed(1)} p.p. livres.`}
              </p>
            </div>

            {/* Botões do Modal */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => setSelectedAssetModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Fechar
              </button>
              {onStartRebalance && (
                <button
                  onClick={() => {
                    const portId = currentPortfolio.id;
                    setSelectedAssetModal(null);
                    onStartRebalance(portId);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Simular Rebalanceamento ({currentPortfolio.name})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
