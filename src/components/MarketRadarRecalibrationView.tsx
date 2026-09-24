import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Flame,
  Globe,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  DollarSign,
  Fuel,
  Truck,
  CheckCircle2,
  FileText,
  Printer,
  X,
  Layers,
  ChevronRight,
  Info,
  Activity,
  Zap,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import { Portfolio, AssetClass } from '../types';
import { TabKey } from './Header';
import {
  ENERGY_SHOCK_DIAGNOSTIC,
  ENERGY_RADAR_ASSETS,
  SECTOR_RADAR_RECOMMENDATIONS,
  EnergyRadarAsset,
  SectorRadarAllocation,
} from '../data/energyRadarData';

interface MarketRadarRecalibrationViewProps {
  portfolios: Portfolio[];
  selectedPortfolioId?: string;
  onSelectPortfolio?: (portfolioId: string) => void;
  onNavigateTab?: (tab: TabKey) => void;
  onStartRebalance?: (portfolioId: string) => void;
  currency?: 'USD' | 'BRL';
}

type RecommendationFilter = 'ALL' | 'OVERWEIGHT' | 'NEUTRAL' | 'UNDERWEIGHT';
type CategoryFilter = 'ALL' | 'ETFS' | 'EQUITIES' | 'FIXED_INCOME';
type CalibrationIntensity = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';

export const MarketRadarRecalibrationView: React.FC<MarketRadarRecalibrationViewProps> = ({
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onNavigateTab,
  onStartRebalance,
  currency = 'BRL',
}) => {
  // Estado da carteira ativa
  const [activePortfolioId, setActivePortfolioId] = useState<string>(
    selectedPortfolioId || portfolios[0]?.id || 'port-dario-001'
  );

  // Filtros de ativos do radar
  const [recFilter, setRecFilter] = useState<RecommendationFilter>('ALL');
  const [catFilter, setCatFilter] = useState<CategoryFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Intensidade da recalibração tática
  const [intensity, setIntensity] = useState<CalibrationIntensity>('MODERATE');

  // Modal de Parecer Fiduciário Formal
  const [showOpinionModal, setShowOpinionModal] = useState<boolean>(false);

  // Simulação de estresse de choque de diesel
  const [dieselStressLevel, setDieselStressLevel] = useState<15 | 30>(15);

  // Carteira selecionada no momento
  const selectedPortfolio = useMemo(() => {
    return portfolios.find((p) => p.id === activePortfolioId) || portfolios[0];
  }, [portfolios, activePortfolioId]);

  // Filtragem dos ativos do Radar
  const filteredAssets = useMemo(() => {
    return ENERGY_RADAR_ASSETS.filter((asset) => {
      // Filtro de Recomendação
      if (recFilter !== 'ALL' && asset.recommendation !== recFilter) {
        return false;
      }
      // Filtro de Categoria
      if (catFilter === 'ETFS' && !asset.category.startsWith('ETF_')) {
        return false;
      }
      if (catFilter === 'EQUITIES' && !asset.category.startsWith('EQUITY_')) {
        return false;
      }
      if (catFilter === 'FIXED_INCOME' && asset.category !== 'FIXED_INCOME') {
        return false;
      }
      // Busca por texto
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          asset.ticker.toLowerCase().includes(query) ||
          asset.name.toLowerCase().includes(query) ||
          asset.thesis.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [recFilter, catFilter, searchTerm]);

  // Contadores de Recomendações
  const overCount = ENERGY_RADAR_ASSETS.filter((a) => a.recommendation === 'OVERWEIGHT').length;
  const neutralCount = ENERGY_RADAR_ASSETS.filter((a) => a.recommendation === 'NEUTRAL').length;
  const underCount = ENERGY_RADAR_ASSETS.filter((a) => a.recommendation === 'UNDERWEIGHT').length;

  // Multiplicador de intensidade dos tilts
  const intensityMultiplier = useMemo(() => {
    switch (intensity) {
      case 'CONSERVATIVE':
        return 0.5;
      case 'AGGRESSIVE':
        return 1.5;
      case 'MODERATE':
      default:
        return 1.0;
    }
  }, [intensity]);

  // Análise da Carteira Selecionada contra o Choque de Energia
  const portfolioAnalysis = useMemo(() => {
    if (!selectedPortfolio) {
      return {
        totalAum: 0,
        energyHedgeWeight: 0,
        vulnerableWeight: 0,
        vulnerabilityScore: 50,
        status: 'MODERATE',
        currentBreakdown: {
          'Renda Fixa': 0,
          'Renda Variável': 0,
          'Internacional': 0,
          'Multimercado': 0,
          'Caixa': 0,
        },
        recalibratedBreakdown: {
          'Renda Fixa': 0,
          'Renda Variável': 0,
          'Internacional': 0,
          'Multimercado': 0,
          'Caixa': 0,
        },
        suggestedOrders: [],
      };
    }

    const totalAum = selectedPortfolio.totalAum || 1;
    const currentBreakdown: Record<AssetClass, number> = {
      'Renda Fixa': 0,
      'Renda Variável': 0,
      'Internacional': 0,
      'Multimercado': 0,
      'Caixa': selectedPortfolio.cashBalance || 0,
    };

    let energyDirectTotal = 0;
    let vulnerableTotal = 0;

    (selectedPortfolio.assets || []).forEach((asset) => {
      if (currentBreakdown[asset.assetClass] !== undefined) {
        currentBreakdown[asset.assetClass] += asset.totalValue || 0;
      }

      // Detecção de ativos de energia / hedge
      const ticker = (asset.ticker || '').toUpperCase();
      const name = (asset.name || '').toUpperCase();

      if (
        ticker.includes('XLE') ||
        ticker.includes('USO') ||
        ticker.includes('BNO') ||
        ticker.includes('PETR') ||
        ticker.includes('PRIO') ||
        ticker.includes('ENAUTA') ||
        ticker.includes('ORIGEM') ||
        ticker.includes('IPCA') ||
        name.includes('IPCA') ||
        name.includes('PETROBRAS')
      ) {
        energyDirectTotal += asset.totalValue || 0;
      }

      // Detecção de ativos vulneráveis a combustível / pré-fixado
      if (
        ticker.includes('RAIL') ||
        ticker.includes('RODO') ||
        ticker.includes('PRE') ||
        name.includes('PRE') ||
        name.includes('RODOVIAS') ||
        name.includes('LOGISTICA')
      ) {
        vulnerableTotal += asset.totalValue || 0;
      }
    });

    const energyHedgeWeight = (energyDirectTotal / totalAum) * 100;
    const vulnerableWeight = (vulnerableTotal / totalAum) * 100;

    // Cálculo do Score de Vulnerabilidade (0 a 100)
    // Alta vulnerabilidade se tiver muito pré-fixado/logística e pouca energia/IPCA
    let vulnerabilityScore = 50 + vulnerableWeight * 1.2 - energyHedgeWeight * 0.8;
    vulnerabilityScore = Math.max(15, Math.min(95, Math.round(vulnerabilityScore)));

    let status = 'MODERADO';
    if (vulnerabilityScore > 65) status = 'ALTA VULNERABILIDADE';
    else if (vulnerabilityScore < 40) status = 'BLINDAGEM ELEVADA';

    // Recalibração de Alocação com base nos Tilts Setoriais
    // Tilts táticos recomendados
    const tiltInternacionalCommodities = 4.0 * intensityMultiplier; // + Commodities de Energia
    const tiltRendaFixaIPCA = 3.0 * intensityMultiplier; // + IPCA+
    const tiltRendaFixaPre = -4.5 * intensityMultiplier; // - Pré-fixados
    const tiltRendaVariavelSensivel = -2.5 * intensityMultiplier; // - Logística
    const tiltCaixa = -(
      tiltInternacionalCommodities +
      tiltRendaFixaIPCA +
      tiltRendaFixaPre +
      tiltRendaVariavelSensivel
    );

    // Breakdown recalibrado
    const curRF = (currentBreakdown['Renda Fixa'] / totalAum) * 100;
    const curRV = (currentBreakdown['Renda Variável'] / totalAum) * 100;
    const curInt = (currentBreakdown['Internacional'] / totalAum) * 100;
    const curMM = (currentBreakdown['Multimercado'] / totalAum) * 100;
    const curCaixa = (currentBreakdown['Caixa'] / totalAum) * 100;

    // Novos percentuais
    const recInt = Math.max(0, curInt + tiltInternacionalCommodities);
    const recRF = Math.max(0, curRF + (tiltRendaFixaIPCA + tiltRendaFixaPre));
    const recRV = Math.max(0, curRV + tiltRendaVariavelSensivel);
    const recMM = curMM;
    const recCaixa = Math.max(1, 100 - (recInt + recRF + recRV + recMM));

    const recalibratedBreakdown = {
      'Renda Fixa': recRF,
      'Renda Variável': recRV,
      'Internacional': recInt,
      'Multimercado': recMM,
      'Caixa': recCaixa,
    };

    // Ordens táticas sugeridas
    const suggestedOrders = [
      {
        action: 'COMPRA' as const,
        ticker: 'BNO / USO / DBE',
        name: 'Cesta de ETFs Internacionais de Energia & Petróleo',
        deltaBRL: (totalAum * (tiltInternacionalCommodities / 100)),
        deltaPct: `+${tiltInternacionalCommodities.toFixed(1)}%`,
        reason: 'Hedge direto contra choque de destilados, restrição russa e prêmio no diesel global.',
        badge: 'OVERWEIGHT',
      },
      {
        action: 'COMPRA' as const,
        ticker: 'NTN-B 2035',
        name: 'Tesouro IPCA+ 2035 (Hedge de Inflação Soberano)',
        deltaBRL: (totalAum * (tiltRendaFixaIPCA / 100)),
        deltaPct: `+${tiltRendaFixaIPCA.toFixed(1)}%`,
        reason: 'Blindagem do poder de compra contra repasse do custo de frete aos alimentos e ao IPCA.',
        badge: 'OVERWEIGHT',
      },
      {
        action: 'VENDA' as const,
        ticker: 'PRE-2029 / LTN',
        name: 'Renda Fixa Pré-fixada de Média/Longa Duration',
        deltaBRL: (totalAum * (Math.abs(tiltRendaFixaPre) / 100)),
        deltaPct: `${tiltRendaFixaPre.toFixed(1)}%`,
        reason: 'Evitar marcação a mercado negativa com abertura na curva de juros decorrente da inflação.',
        badge: 'UNDERWEIGHT',
      },
      {
        action: 'VENDA' as const,
        ticker: 'RAIL3 / Logística',
        name: 'Ações de Transporte de Carga & Logística Rodoviária',
        deltaBRL: (totalAum * (Math.abs(tiltRendaVariavelSensivel) / 100)),
        deltaPct: `${tiltRendaVariavelSensivel.toFixed(1)}%`,
        reason: 'Compressão severa de margens operacionais provocada pela disparada do preço do diesel.',
        badge: 'UNDERWEIGHT',
      },
    ];

    return {
      totalAum,
      energyHedgeWeight,
      vulnerableWeight,
      vulnerabilityScore,
      status,
      currentBreakdown,
      recalibratedBreakdown,
      suggestedOrders,
    };
  }, [selectedPortfolio, intensityMultiplier]);

  const handleSelectPortfolioChange = (id: string) => {
    setActivePortfolioId(id);
    if (onSelectPortfolio) onSelectPortfolio(id);
  };

  const handleSendToSimulator = () => {
    if (onStartRebalance) {
      onStartRebalance(activePortfolioId);
    } else if (onNavigateTab) {
      onNavigateTab('simulator');
    }
  };

  return (
    <div className="space-y-6 text-slate-100 pb-12 animate-fadeIn">
      {/* 1. Header do Radar de Mercado & Energia */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-rose-600 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-rose-950/40 border border-rose-500/40">
            <Fuel className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Radar de Mercado &amp; Recalibração Tática
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                🚨 ALERTA CHOQUE DIESEL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Classificação fiduciária <strong>Overweight</strong>, <strong>Neutro</strong> e <strong>Underweight</strong> para recalibração de carteiras • Diretrizes CVM 175 &amp; IPS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowOpinionModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 shadow-md transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Parecer Fiduciário Formal</span>
          </button>

          <button
            onClick={handleSendToSimulator}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Simulador de Rebalanceamento</span>
          </button>
        </div>
      </div>

      {/* 2. Banner de Diagnóstico Geopolítico & Choque do Diesel por Dário Marques */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#120B1C] via-[#0E1528] to-[#0A1220] border border-rose-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚨</span>
              <h2 className="text-base font-extrabold text-white tracking-wide">
                ALERTA NO MERCADO DE ENERGIA: ZONA DE ATENÇÃO NO DIESEL GLOBAL
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Análise:</span>
              <span className="text-amber-400 font-bold">Dário Marques</span>
              <span>•</span>
              <span className="font-mono">23/09/2026</span>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            O mercado global de diesel entrou em uma zona de atenção crítica. O problema não reside apenas no petróleo bruto: o diesel é um produto refinado, fundamental para caminhões, agricultura, transporte, logística e máquinas pesadas. Por isso, a escassez de oferta afeta diretamente o frete e contamina a inflação de alimentos e bens de consumo.
          </p>

          {/* Os 3 Pilares Geopolíticos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {ENERGY_SHOCK_DIAGNOSTIC.geopoliticalPillars.map((pillar) => (
              <div
                key={pillar.country}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{pillar.flag}</span>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {pillar.country}
                    </h3>
                    <span className="text-[11px] text-amber-400 font-medium">
                      {pillar.headline}
                    </span>
                  </div>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {pillar.bulletPoints.map((bp, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-400 shrink-0 font-bold">•</span>
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* O Ponto Mais Sensível: O Brasil */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🇧🇷</span>
              <strong className="text-rose-300 text-sm font-bold">
                E o Brasil? Aqui está o ponto mais sensível do sistema
              </strong>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-rose-500/20">
                <span className="text-slate-400 block text-[11px]">Dependência de Importação</span>
                <span className="text-xl font-black text-rose-400 font-mono">~25%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">do consumo nacional é importado</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-rose-500/20">
                <span className="text-slate-400 block text-[11px]">Origem EUA (Setembro)</span>
                <span className="text-xl font-black text-amber-400 font-mono">~80%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">do diesel importado veio dos EUA</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-rose-500/20">
                <span className="text-slate-400 block text-[11px]">Fornecimento Russo</span>
                <span className="text-xl font-black text-slate-400 font-mono">Quase 0%</span>
                <span className="text-[10px] text-rose-400 block mt-0.5">Rússia saiu da equação de suprimento</span>
              </div>
            </div>
          </div>

          {/* Cadeia de Transmissão Macroeconômica Interativa */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Cadeia de Transmissão de Impacto nos Investimentos
              </span>
              <span className="text-[11px] text-slate-400">
                Transmissão direta da escassez física aos ativos de risco
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {ENERGY_SHOCK_DIAGNOSTIC.transmissionChain.map((step) => (
                <div
                  key={step.step}
                  className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{step.icon}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-bold">
                        #{step.step}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-bold text-white line-clamp-2">
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-3">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Matriz Fiduciária de Overweight, Neutro e Underweight */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">
                Matriz Tática de Alocação: Overweight, Neutro &amp; Underweight
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Radar de Recomendações
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Diretrizes de recalibração para antecipar os desdobramentos de oferta, câmbio e inflação.
            </p>
          </div>

          {/* Filtros de Recomendação */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setRecFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                recFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({ENERGY_RADAR_ASSETS.length})
            </button>
            <button
              onClick={() => setRecFilter('OVERWEIGHT')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
                recFilter === 'OVERWEIGHT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Overweight ({overCount})
            </button>
            <button
              onClick={() => setRecFilter('NEUTRAL')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
                recFilter === 'NEUTRAL'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              Neutro ({neutralCount})
            </button>
            <button
              onClick={() => setRecFilter('UNDERWEIGHT')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
                recFilter === 'UNDERWEIGHT'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Underweight ({underCount})
            </button>
          </div>
        </div>

        {/* Resumo Rápido das Recomendações Setoriais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                  OVERWEIGHT (Sobreponderar)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  Tilt +3.0% a +5.0%
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                ETFs de Petróleo &amp; Commodities (USO, BNO, DBO, DBE, DBC, PDBC) + NTN-B IPCA+
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Hedge primordial contra a inflação global e proteção do poder de compra fiduciário.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <span className="text-base font-black">=</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                  NEUTRO (Manter Neutro)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                  Tilt 0.0%
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Gás Natural (UNG, UNL), Distribuição de Combustíveis (UGPA3)
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Estoques de gás confortáveis nos EUA; choque concentrado em destilados médios.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-rose-400 uppercase tracking-wide">
                  UNDERWEIGHT (Subponderar)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                  Tilt -3.5% a -5.0%
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Transporte &amp; Logística de Cargas (RAIL3) + Renda Fixa Pré-fixada Longa (PRE 2029+)
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Compressão de margem operacional pelo diesel e risco de marcação a mercado nos juros.
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtro de Categoria */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por ticker, ETF, tese ou ativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <span className="text-slate-400 font-medium">Classe:</span>
            <div className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800 gap-1">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'ETFS', label: 'ETFs Internacionais' },
                { id: 'EQUITIES', label: 'Ações Brasil' },
                { id: 'FIXED_INCOME', label: 'Renda Fixa' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCatFilter(c.id as any)}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    catFilter === c.id
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de Ativos & ETFs do Radar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const isOver = asset.recommendation === 'OVERWEIGHT';
            const isNeutral = asset.recommendation === 'NEUTRAL';
            const isUnder = asset.recommendation === 'UNDERWEIGHT';

            const badgeBg = isOver
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : isNeutral
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

            const cardBorder = isOver
              ? 'border-emerald-500/30 hover:border-emerald-500/60'
              : isNeutral
              ? 'border-amber-500/30 hover:border-amber-500/60'
              : 'border-rose-500/30 hover:border-rose-500/60';

            return (
              <div
                key={asset.ticker}
                className={`p-4 rounded-xl bg-[#0E1626] border shadow-lg transition flex flex-col justify-between ${cardBorder}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-white">
                          {asset.ticker}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black border uppercase tracking-wider ${badgeBg}`}>
                          {asset.recommendation}
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold text-slate-300 line-clamp-1 mt-0.5">
                        {asset.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {asset.issuer} • {asset.categoryLabel}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black font-mono text-white block">
                        {asset.price}
                      </span>
                      <span
                        className={`text-[11px] font-bold inline-flex items-center gap-0.5 ${
                          asset.isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {asset.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {asset.change24h}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed my-2.5">
                    {asset.thesis}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {asset.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs mt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tilt Sugerido</span>
                    <strong
                      className={`font-mono text-xs ${
                        isOver ? 'text-emerald-400' : isUnder ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {asset.suggestedTiltPct > 0 ? `+${asset.suggestedTiltPct.toFixed(1)}%` : `${asset.suggestedTiltPct.toFixed(1)}%`}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Sensibilidade Diesel</span>
                    <span className="text-[11px] font-bold text-slate-300">
                      {asset.sensitivityToDiesel.replace('_', ' ')}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (onStartRebalance) onStartRebalance(activePortfolioId);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition border border-slate-700 cursor-pointer"
                    title="Simular no Rebalanceador"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Motor de Recalibração de Carteira (Recalibrate Portfolio Engine) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#091120] via-[#0E1628] to-[#0B1322] border border-blue-500/40 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-black text-white tracking-tight">
                Recalibrar Carteira a partir do Radar Macroeconômico
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simule o impacto dos tilts de Overweight e Underweight diretamente no portfólio selecionado.
            </p>
          </div>

          {/* Seletor de Carteira */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold">Carteira:</span>
            <select
              value={activePortfolioId}
              onChange={(e) => handleSelectPortfolioChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}) — {currency === 'USD' ? `$ ${(p.totalAum / 5.82 / 1000).toFixed(0)}k` : `R$ ${(p.totalAum / 1000).toFixed(0)}k`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diagnóstico da Carteira contra o Choque de Energia */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Patrimônio Líquido Total</span>
            <span className="text-2xl font-black text-white font-mono">
              {currency === 'USD'
                ? `$ ${(portfolioAnalysis.totalAum / 5.82).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                : `R$ ${portfolioAnalysis.totalAum.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
            </span>
            <span className="text-[10px] text-cyan-400 block mt-1 font-semibold">
              {selectedPortfolio?.profile} • Mandato {selectedPortfolio?.assignedPolicyId}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Exposição Atual em Energia / IPCA+</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {portfolioAnalysis.energyHedgeWeight.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400">do AUM</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Recomendado Radar: <strong className="text-emerald-300">12.0% a 18.0%</strong>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Exposição a Ativos Vulneráveis</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400 font-mono">
                {portfolioAnalysis.vulnerableWeight.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400">do AUM</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Pré-fixados longos e logística sensível a frete
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Índice de Vulnerabilidade</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-amber-400 font-mono">
                  {portfolioAnalysis.vulnerabilityScore} / 100
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {portfolioAnalysis.status}
                </span>
              </div>
            </div>
            {/* Mini barra de vulnerabilidade */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${portfolioAnalysis.vulnerabilityScore}%`,
                  background: 'linear-gradient(to right, #10B981, #F59E0B, #EF4444)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Intensidade da Recalibração Tática */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800 gap-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Intensidade da Intervenção Tática de Mercado
            </h3>
            <p className="text-[11px] text-slate-400">
              Ajuste a magnitude dos tilts táticos sobre a carteira {selectedPortfolio?.name}.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {[
              { id: 'CONSERVATIVE', label: 'Conservador (±1.5%)', desc: 'Banda estreita' },
              { id: 'MODERATE', label: 'Moderado (±3.5%)', desc: 'Recomendado Dário' },
              { id: 'AGGRESSIVE', label: 'Agressivo (±5.5%)', desc: 'Choque Severo' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setIntensity(lvl.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  intensity === lvl.id
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comparativo de Alocação Antes vs. Depois da Recalibração */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Projeção de Alocação: Atual vs. Recalibrada pelo Radar
            </h3>
            <span className="text-xs text-slate-400">
              Valores calculados sobre o patrimônio de {selectedPortfolio?.name}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-2.5 font-semibold">Classe de Ativo</th>
                  <th className="pb-2.5 font-semibold">Alocação Atual</th>
                  <th className="pb-2.5 font-semibold">Alocação Recalibrada</th>
                  <th className="pb-2.5 font-semibold">Delta Proposto</th>
                  <th className="pb-2.5 font-semibold">Volume Financeiro (R$)</th>
                  <th className="pb-2.5 font-semibold">Diretriz do Radar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {[
                  {
                    className: 'Internacional / Commodities',
                    curVal: (portfolioAnalysis.currentBreakdown['Internacional'] / portfolioAnalysis.totalAum) * 100,
                    recVal: portfolioAnalysis.recalibratedBreakdown['Internacional'],
                    driver: 'Aumento de ETFs USO, BNO, DBE e DBC',
                    isOver: true,
                  },
                  {
                    className: 'Renda Fixa (Total)',
                    curVal: (portfolioAnalysis.currentBreakdown['Renda Fixa'] / portfolioAnalysis.totalAum) * 100,
                    recVal: portfolioAnalysis.recalibratedBreakdown['Renda Fixa'],
                    driver: 'Migração tática de Pré-fixados para IPCA+ (NTN-B)',
                    isOver: false,
                  },
                  {
                    className: 'Renda Variável Brasil',
                    curVal: (portfolioAnalysis.currentBreakdown['Renda Variável'] / portfolioAnalysis.totalAum) * 100,
                    recVal: portfolioAnalysis.recalibratedBreakdown['Renda Variável'],
                    driver: 'Redução em logística/rodovias (RAIL3); manter PETR4/PRIO3',
                    isOver: false,
                  },
                  {
                    className: 'Multimercado',
                    curVal: (portfolioAnalysis.currentBreakdown['Multimercado'] / portfolioAnalysis.totalAum) * 100,
                    recVal: portfolioAnalysis.recalibratedBreakdown['Multimercado'],
                    driver: 'Manutenção da alocação de fundos macro',
                    isOver: null,
                  },
                  {
                    className: 'Caixa & Liquidez Diária',
                    curVal: (portfolioAnalysis.currentBreakdown['Caixa'] / portfolioAnalysis.totalAum) * 100,
                    recVal: portfolioAnalysis.recalibratedBreakdown['Caixa'],
                    driver: 'Ajuste de caixa para absorção e execução de ordens',
                    isOver: null,
                  },
                ].map((item, idx) => {
                  const deltaPct = item.recVal - item.curVal;
                  const deltaBRL = (portfolioAnalysis.totalAum * (deltaPct / 100));

                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 pr-3 font-sans font-bold text-slate-200">
                        {item.className}
                      </td>
                      <td className="py-3 pr-3 text-slate-400 font-semibold">
                        {item.curVal.toFixed(1)}%
                      </td>
                      <td className="py-3 pr-3 text-white font-black text-sm">
                        {item.recVal.toFixed(1)}%
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`font-black inline-flex items-center gap-1 ${
                            deltaPct > 0.05
                              ? 'text-emerald-400'
                              : deltaPct < -0.05
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {deltaPct > 0.05 ? '+' : ''}
                          {deltaPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-300">
                        {deltaBRL >= 0 ? '+' : ''}
                        {currency === 'USD'
                          ? `$ ${(deltaBRL / 5.82).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                          : `R$ ${deltaBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                      </td>
                      <td className="py-3 font-sans text-xs text-slate-400">
                        {item.driver}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Book de Ordens Táticas Sugeridas */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Book de Execução Tática Sugerida (Rebalanceamento do Choque)
            </h3>
            <span className="text-xs text-slate-400">
              4 ordens fiduciárias calculadas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {portfolioAnalysis.suggestedOrders.map((ord, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
                        ord.action === 'COMPRA'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {ord.action}
                    </span>
                    <span className="font-mono font-black text-white text-xs">
                      {ord.ticker}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        ord.badge === 'OVERWEIGHT'
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-rose-950 text-rose-400'
                      }`}
                    >
                      {ord.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    {ord.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {ord.reason}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-white block font-mono">
                    {currency === 'USD'
                      ? `$ ${(ord.deltaBRL / 5.82).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                      : `R$ ${ord.deltaBRL.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      ord.action === 'COMPRA' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {ord.deltaPct}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé de Ações Fiduciárias */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Recalibração em total conformidade com a <strong>Resolução CVM 175</strong> e mandato <strong>{selectedPortfolio?.assignedPolicyId}</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOpinionModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              Exportar Parecer Formal
            </button>
            <button
              onClick={handleSendToSimulator}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-cyan-950/50 transition cursor-pointer"
            >
              <span>Aplicar no Simulador de Rebalanceamento</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Modal do Parecer Fiduciário Formal assinado por Dário Marques */}
      {showOpinionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0D1526] border border-slate-700 rounded-2xl max-w-3xl w-full p-6 text-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => setShowOpinionModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho Institucional do Parecer */}
            <div className="border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                    FC
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">FlowCore Conformidade Fiduciária</h3>
                    <span className="text-[10px] text-slate-400">Comitê de Alocação Macroeconômica &amp; CVM 175</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">DOC-RADAR-2026-0923</span>
              </div>
              <h2 className="text-lg font-black text-white">
                PARECER TÁTICO: ALERTA NO MERCADO DE ENERGIA &amp; CHOQUE GLOBAL DO DIESEL
              </h2>
              <p className="text-xs text-amber-400 font-semibold mt-0.5">
                Diretrizes de Recalibração de Carteiras: Overweight, Neutro &amp; Underweight
              </p>
            </div>

            {/* Corpo do Documento */}
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <strong className="text-white block mb-1">1. Contexto Geopolítico &amp; Físico do Refino</strong>
                <p>
                  O mercado global de diesel entrou em uma zona de atenção crítica com a conjunção de dois choques de oferta:
                  a <strong>Rússia</strong> restringindo as exportações de diesel após ataques ucranianos reduzirem sua capacidade de refino (extensão até o final de outubro reportada pela Reuters); e os <strong>Estados Unidos</strong> debatendo limites de exportação face aos preços recordes internos de combustíveis.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <strong className="text-white block mb-1">2. Vulnerabilidade Estrutural do Brasil</strong>
                <p>
                  O Brasil importa aproximadamente <strong>25% do diesel que consome</strong> e, no mês de setembro, cerca de <strong>80% do volume importado teve origem nos Estados Unidos</strong>. A saída da Rússia como fornecedor a desconto deixa o país exposto a reajustes imediatos no mercado externo, impactando frete rodoviário, máquinas agrícolas e gerando pressão inflacionária direta no IPCA.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <strong className="text-white block mb-1">3. Decisão de Alocação Fiduciária</strong>
                <ul className="space-y-1 mt-1 text-slate-300">
                  <li>
                    <strong className="text-emerald-400">OVERWEIGHT (+):</strong> ETFs de Petróleo &amp; Commodities energéticas (USO, BNO, DBO, USL, OILK, DBE, DBC, PDBC) e Renda Fixa IPCA+ (NTN-B).
                  </li>
                  <li>
                    <strong className="text-amber-400">NEUTRO (=):</strong> Gás Natural (UNG, UNL) e distribuição de combustíveis.
                  </li>
                  <li>
                    <strong className="text-rose-400">UNDERWEIGHT (-):</strong> Transporte rodoviário, frotas e logística de cargas (RAIL3) e Renda Fixa Pré-fixada longa (PRE 2029+).
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <strong className="text-white block mb-1">4. Recomendações aos Gestores &amp; Family Offices</strong>
                <p>
                  Não se trata de recomendação especulativa de compra isolada, mas de um <em>radar estratégico fiduciário</em> para entender a rotação de capital global diante de restrições severas de oferta. A recalibração tática protege o patrimônio dos clientes contra a perda de poder de compra e preserva os índices de conformidade regulatória.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Dário Marques</span>
                  <span className="text-[11px] text-slate-400">Head de Estratégia Macro &amp; Conformidade Fiduciária</span>
                  <span className="text-[10px] text-cyan-400 block font-mono">FlowCore Wealth Management</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Autenticação Digital CVM 175</span>
                  <span className="text-[10px] text-emerald-400 font-mono">VERIFIED_FIDUCIARY_SIG</span>
                </div>
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Salvar PDF</span>
              </button>
              <button
                onClick={() => setShowOpinionModal(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer"
              >
                Fechar Parecer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
