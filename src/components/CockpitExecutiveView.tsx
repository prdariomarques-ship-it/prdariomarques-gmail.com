import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  Eye,
  EyeOff,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Send,
  MessageSquare,
  BarChart3,
  PieChart,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, DataMode } from '../types';
import { TabKey } from './Header';
import { DarioProfileCard } from './common/DarioProfileCard';
import { INITIAL_MARKET_ASSETS, CLIENTS_DIRECTORY, MarketAsset } from '../data/wealthCopilotData';

interface CockpitExecutiveViewProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  onNavigateTab: (tab: TabKey) => void;
  onSelectPortfolio: (portfolioId: string) => void;
  onStartRebalance?: (portfolioId: string) => void;
  dataMode?: DataMode;
  searchQuery?: string;
  onOpenAiQuery?: (query: string) => void;
}

export const CockpitExecutiveView: React.FC<CockpitExecutiveViewProps> = ({
  portfolios,
  alerts,
  onNavigateTab,
  onSelectPortfolio,
  onStartRebalance,
  dataMode = 'LIVE',
  searchQuery = '',
  onOpenAiQuery,
}) => {
  // Estado de Visualização Financeira
  const [currency, setCurrency] = useState<'USD' | 'BRL'>('USD');
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [activeTimeframe, setActiveTimeframe] = useState<'1D' | '1M' | '3M' | 'YTD' | '1A'>('YTD');

  // Widget do Assistente IA
  const [quickAiInput, setQuickAiInput] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Totais calculados
  const totalAumBRL = useMemo(() => {
    return portfolios.reduce((acc, p) => acc + p.totalAum, 0);
  }, [portfolios]);

  // Taxa de conversão estimada BRL/USD
  const usdRate = 5.16;
  const displayAum = useMemo(() => {
    if (currency === 'USD') {
      return '$17.1M';
    }
    return `R$ ${(totalAumBRL / 1_000_000).toFixed(1)}M`;
  }, [currency, totalAumBRL]);

  // Quick Prompt handlers para o Assistente IA
  const quickPrompts = [
    'Quais clientes estão desenquadrados?',
    'O que mudou no mercado hoje?',
    'Explique esse movimento do Treasury.',
    'Quais carteiras merecem atenção?',
    'Prepare um resumo para meu cliente.',
  ];

  const handleSendQuickAi = (promptText?: string) => {
    const text = promptText || quickAiInput;
    if (!text.trim()) return;

    setIsAiThinking(true);
    setAiResponse(null);

    setTimeout(() => {
      setIsAiThinking(false);
      if (text.toLowerCase().includes('desenquadrado') || text.toLowerCase().includes('clientes')) {
        setAiResponse(
          'Dário, temos 3 carteiras com desenquadramento ativo: Família Silva (+12 p.p. em Renda Variável), Rocha Investimentos (+7 p.p. em Crédito Privado) e Castro Family (+6 p.p. em FIIs). Recomendo priorizar o rebalanceamento da Família Silva para mitigar risco regulatório CVM 175.'
        );
      } else if (text.toLowerCase().includes('mercado') || text.toLowerCase().includes('mudou')) {
        setAiResponse(
          'O Ibovespa opera em 127.850 pts (-0,35%) com realização no setor financeiro. Em Nova York, Nasdaq avança a 21.150 pts (+0,65%) e S&P 500 em 5.980 pts. O Dólar opera cotado a R$ 5,82 (+0,45%), o CDI em 13,15% a.a. e a Selic Meta em 13,25% a.a.'
        );
      } else if (text.toLowerCase().includes('treasury')) {
        setAiResponse(
          'O rendimento da US 10Y opera em 4,45% a.a. refletindo dados de mercado de trabalho nos EUA, enquanto o DI futuro Jan 27 precifica 15,10% a.a., exigindo calibragem de duration nos mandatos de crédito privado e offshore.'
        );
      } else {
        setAiResponse(
          `Com base nos mandatos de seus 27 clientes e R$ ${(totalAumBRL / 1_000_000).toFixed(1)}M sob custódia: a conformidade global está em 94,2%. Recomenda-se acionar o simulador para executar os 3 rebalanceamentos pendentes.`
        );
      }
    }, 600);
  };

  // Sparkline SVG generator
  const renderSparkline = (data: number[], isPositive: boolean) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 70;
    const height = 24;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x},${y}`;
      })
      .join(' ');

    const strokeColor = isPositive ? '#10B981' : '#EF4444';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      {/* Top Greeting Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Bom dia, Dário!</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aqui está o que merece a sua atenção hoje.
          </p>
        </div>

        {/* Action button to switch to Command Mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('command-center')}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-cyan-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Ver Modo Comando Operacional</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Summary Status Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 3 Carteiras em Override */}
        <div
          onClick={() => onNavigateTab('alerts')}
          className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#1C131D] to-[#120D16] border border-rose-500/30 hover:border-rose-500/60 shadow-lg shadow-rose-950/20 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white">3</span>
                <span className="text-sm font-bold text-rose-300">
                  Carteiras em Override
                </span>
              </div>
              <p className="text-xs text-rose-400/80 mt-0.5">
                Revisão de tese recomendada
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-400/60 group-hover:text-rose-300 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Card 2: 6 Carteiras em Recalibração */}
        <div
          onClick={() => onNavigateTab('command-center')}
          className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#1F1C12] to-[#14120B] border border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-950/20 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white">6</span>
                <span className="text-sm font-bold text-amber-300">
                  Carteiras em Recalibração
                </span>
              </div>
              <p className="text-xs text-amber-400/80 mt-0.5">
                Ajustes sugeridos
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400/60 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Card 3: 18 Carteiras saudáveis */}
        <div
          onClick={() => onNavigateTab('portfolios')}
          className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#101E18] to-[#0A1410] border border-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-950/20 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white">18</span>
                <span className="text-sm font-bold text-emerald-300">
                  Carteiras saudáveis
                </span>
              </div>
              <p className="text-xs text-emerald-400/80 mt-0.5">
                Dentro da política de alocação
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-400/60 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Card 4: 27 Total de clientes */}
        <div
          onClick={() => onNavigateTab('clients')}
          className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#111A29] to-[#0B101A] border border-blue-500/30 hover:border-blue-500/60 shadow-lg shadow-blue-950/20 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white">27</span>
                <span className="text-sm font-bold text-blue-300">
                  Total de clientes
                </span>
              </div>
              <p className="text-xs text-blue-400/80 mt-0.5">
                Sob monitoramento
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-400/60 group-hover:text-blue-300 group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* Main Grid: Left Portrait Column + Analytic Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dário Marques Profile Card matching image */}
        <div className="lg:col-span-3 flex justify-center lg:justify-start">
          <DarioProfileCard
            quote="Estratégia transforma informação em liberdade."
            onOpenSettings={() => onNavigateTab('limits')}
          />
        </div>

        {/* Right Columns (lg:col-span-9): 3 Analytics Cards */}
        <div className="lg:col-span-9 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card A: Patrimônio Total */}
            <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-300">Patrimônio Total</span>
                    <button
                      onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                      className="text-slate-400 hover:text-white"
                      title={isBalanceHidden ? 'Exibir valor' : 'Ocultar valor'}
                    >
                      {isBalanceHidden ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'USD' | 'BRL')}
                    className="bg-slate-900 border border-slate-700/80 text-[11px] text-slate-300 rounded px-1.5 py-0.5 focus:outline-none"
                  >
                    <option value="USD">USD ▾</option>
                    <option value="BRL">BRL ▾</option>
                  </select>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {isBalanceHidden ? '••••••••' : displayAum}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>$2.2M (14,5%)</span>
                </div>
              </div>

              {/* Interactive SVG Chart Curve */}
              <div className="my-3 h-20 w-full relative">
                <svg
                  viewBox="0 0 240 80"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 65 Q 40 60, 70 52 T 140 45 T 180 32 T 240 10 L 240 80 L 0 80 Z"
                    fill="url(#equityGrad)"
                  />
                  <path
                    d="M 0 65 Q 40 60, 70 52 T 140 45 T 180 32 T 240 10"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="240" cy="10" r="4" fill="#38BDF8" className="animate-pulse" />
                </svg>
              </div>

              {/* Timeframe Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                {(['1D', '1M', '3M', 'YTD', '1A'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      activeTimeframe === tf
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Card B: Alocação por Classe de Ativos */}
            <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-2">
                <span>Alocação por Classe de Ativos</span>
                <ChevronRight className="w-4 h-4 text-slate-500 cursor-pointer" />
              </div>

              <div className="flex items-center justify-between gap-3 my-auto">
                {/* Center Donut SVG */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#1E293B" strokeWidth="12" />
                    {/* 42% Renda Fixa (Blue) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="12"
                      strokeDasharray="100 138"
                      strokeDashoffset="0"
                    />
                    {/* 22% Renda Variável (Yellow) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#EAB308"
                      strokeWidth="12"
                      strokeDasharray="52 186"
                      strokeDashoffset="-100"
                    />
                    {/* 15% Internacional (Teal) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="12"
                      strokeDasharray="36 202"
                      strokeDashoffset="-152"
                    />
                    {/* 10% Crédito Privado */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="12"
                      strokeDasharray="24 214"
                      strokeDashoffset="-188"
                    />
                    {/* 8% FIIs (Emerald) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="12"
                      strokeDasharray="19 219"
                      strokeDashoffset="-212"
                    />
                    {/* 3% Alternativos (Slate) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="12"
                      strokeDasharray="8 230"
                      strokeDashoffset="-231"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-black text-white tracking-tight">
                      $17.1M
                    </span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="flex-1 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      Renda Fixa
                    </span>
                    <span className="font-bold text-white">42%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Renda Variável
                    </span>
                    <span className="font-bold text-white">22%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      Invest. Internacionais
                    </span>
                    <span className="font-bold text-white">15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Crédito Privado
                    </span>
                    <span className="font-bold text-white">10%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Fundos Imobiliários
                    </span>
                    <span className="font-bold text-white">8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Alternativos
                    </span>
                    <span className="font-bold text-white">3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card C: Desempenho da Carteira */}
            <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-medium text-slate-300">Desempenho da Carteira</span>
                  <span className="text-[11px] bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded text-slate-300">
                    YTD ▾
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400 tracking-tight">
                    +15,4%
                  </span>
                </div>
                <span className="text-xs text-slate-300 font-medium">vs. 12,4% (CDI)</span>
              </div>

              {/* Dual Comparison Line Chart */}
              <div className="my-3 h-20 w-full relative">
                <svg
                  viewBox="0 0 240 80"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  {/* CDI Line (Blue) */}
                  <path
                    d="M 0 65 Q 60 58, 120 50 T 240 38"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                  {/* Carteira Line (Green) */}
                  <path
                    d="M 0 65 Q 50 55, 100 42 T 180 25 T 240 10"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <circle cx="240" cy="10" r="3.5" fill="#10B981" />
                  <text x="200" y="8" fill="#10B981" fontSize="9" fontWeight="bold">
                    +15,4%
                  </text>
                  <text x="205" y="44" fill="#60A5FA" fontSize="8" fontWeight="bold">
                    +12,4%
                  </text>
                </svg>
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Sua carteira</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>CDI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lower 3 Widgets Row: Alertas de Desenquadramento | Movimentos de Mercado | Assistente IA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Widget 1: Alertas de Desenquadramento */}
            <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Alertas de Desenquadramento
                    </h4>
                  </div>
                  <button
                    onClick={() => onNavigateTab('alerts')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Ver todos →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-200 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider">
                        <th className="pb-2 font-semibold">Cliente</th>
                        <th className="pb-2 font-semibold text-center">Atual</th>
                        <th className="pb-2 font-semibold text-center">Limite</th>
                        <th className="pb-2 font-semibold text-right">Desvio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr
                        onClick={() => {
                          onSelectPortfolio('port-miguel-001');
                          onNavigateTab('portfolios');
                        }}
                        className="hover:bg-slate-800/40 cursor-pointer transition group"
                      >
                        <td className="py-2.5 font-medium text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <div>
                            <p className="leading-none group-hover:text-rose-300 transition">
                              Carteira Miguel
                            </p>
                            <span className="text-[11px] text-slate-300 font-medium">Renda Variável</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-center text-slate-200 font-medium">42%</td>
                        <td className="py-2.5 text-center text-slate-300 font-medium">30%</td>
                        <td className="py-2.5 text-right font-bold text-rose-400">+12 p.p.</td>
                      </tr>

                      <tr
                        onClick={() => {
                          onSelectPortfolio('port-wilson-001');
                          onNavigateTab('portfolios');
                        }}
                        className="hover:bg-slate-800/40 cursor-pointer transition group"
                      >
                        <td className="py-2.5 font-medium text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <div>
                            <p className="leading-none group-hover:text-amber-300 transition">
                              Carteira Wilson
                            </p>
                            <span className="text-[11px] text-slate-300 font-medium">Crédito Privado</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-center text-slate-200 font-medium">22%</td>
                        <td className="py-2.5 text-center text-slate-300 font-medium">15%</td>
                        <td className="py-2.5 text-right font-bold text-amber-400">+7 p.p.</td>
                      </tr>

                      <tr
                        onClick={() => {
                          onSelectPortfolio('port-dario-001');
                          onNavigateTab('portfolios');
                        }}
                        className="hover:bg-slate-800/40 cursor-pointer transition group"
                      >
                        <td className="py-2.5 font-medium text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <div>
                            <p className="leading-none group-hover:text-amber-300 transition">
                              Carteira Dário
                            </p>
                            <span className="text-[11px] text-slate-300 font-medium">Internacional / Tech</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-center text-slate-200 font-medium">18%</td>
                        <td className="py-2.5 text-center text-slate-300 font-medium">12%</td>
                        <td className="py-2.5 text-right font-bold text-amber-400">+6 p.p.</td>
                      </tr>

                      <tr>
                        <td className="py-2 font-medium text-slate-200 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Demais carteiras</span>
                        </td>
                        <td className="py-2 text-center text-slate-400 font-medium">—</td>
                        <td className="py-2 text-center text-slate-400 font-medium">—</td>
                        <td className="py-2 text-right text-[11px] font-semibold text-emerald-400">
                          Em conformidade
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Widget 2: Movimentos de Mercado com Sparklines */}
            <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Movimentos de Mercado
                    </h4>
                  </div>
                  <button
                    onClick={() => onNavigateTab('market')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Ver mais →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-200 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider">
                        <th className="pb-1.5 font-semibold">Ativo</th>
                        <th className="pb-1.5 font-semibold text-center">Valor</th>
                        <th className="pb-1.5 font-semibold text-center">Variação</th>
                        <th className="pb-1.5 font-semibold text-right">Hoje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {INITIAL_MARKET_ASSETS.slice(0, 7).map((item) => (
                        <tr key={item.ticker} className="hover:bg-slate-800/30">
                          <td className="py-1.5 text-slate-100 font-medium">
                            <span className="truncate">{item.name}</span>
                          </td>
                          <td className="py-1.5 text-center text-slate-200 font-mono text-xs">
                            {item.value}
                          </td>
                          <td
                            className={`py-1.5 text-center font-semibold text-[11px] ${
                              item.isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.change}
                          </td>
                          <td className="py-1.5 text-right pl-2">
                            {renderSparkline(item.sparkline, item.isPositive)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Widget 3: Assistente IA (Wealth Copilot) */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#101A2D] to-[#0A111F] border border-blue-500/30 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Assistente IA
                    </h4>
                  </div>
                  <button
                    onClick={() => onNavigateTab('agent')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                  >
                    <span>Copilot</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Greeting Bubble */}
                <div className="p-3 rounded-xl bg-[#090F1C] border border-slate-800/80 mb-3 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-sm">
                    DM
                  </div>
                  <div>
                    <p className="text-xs text-slate-200 font-medium">
                      Olá, Dário!
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Como posso te ajudar hoje?
                    </p>
                  </div>
                </div>

                {/* Quick Prompts Chips matching screenshot */}
                <div className="space-y-1.5 mb-3">
                  {quickPrompts.slice(0, 4).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendQuickAi(prompt)}
                      className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition flex items-center justify-between group"
                    >
                      <span className="truncate">{prompt}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                    </button>
                  ))}
                </div>

                {/* Streaming Response Area if any */}
                {isAiThinking && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2 mb-2 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando mandatos e regras CVM 175...</span>
                  </div>
                )}
                {aiResponse && (
                  <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/40 text-xs text-slate-200 mb-2 leading-relaxed max-h-36 overflow-y-auto">
                    {aiResponse}
                  </div>
                )}
              </div>

              {/* Input field */}
              <div className="relative mt-2">
                <input
                  type="text"
                  value={quickAiInput}
                  onChange={(e) => setQuickAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendQuickAi()}
                  placeholder="Digite sua pergunta..."
                  className="w-full bg-[#080D18] border border-slate-700/80 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleSendQuickAi()}
                  className="absolute right-2 top-2 text-cyan-400 hover:text-cyan-300 p-1"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panoramic Inspirational Banner matching image */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#061224] via-[#0A1A33] to-[#040812] border border-blue-500/20 shadow-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Subtle decorative background waves / mountain ambient light */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(56,189,248,0.08),transparent_60%)] pointer-events-none" />

        <div className="relative z-10 space-y-1 text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Visão hoje.
          </h3>
          <h4 className="text-lg sm:text-xl font-medium text-slate-300">
            Tranquilidade sempre.
          </h4>
        </div>

        <div className="relative z-10 flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center p-2 shadow-md">
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12c3-4 6-4 9 0s6 4 9 0" />
                <path d="M2 16c3-4 6-4 9 0s6 4 9 0" opacity="0.6" />
                <path d="M2 8c3-4 6-4 9 0s6 4 9 0" opacity="0.3" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">
                FlowCore
              </span>
              <p className="text-xs text-cyan-400/90 font-medium">Wealth Copilot</p>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-slate-700/60" />

          <p className="hidden md:block text-xs text-slate-300 font-medium max-w-[200px] leading-snug">
            Mais tempo para o que realmente importa.
          </p>
        </div>
      </div>
    </div>
  );
};
