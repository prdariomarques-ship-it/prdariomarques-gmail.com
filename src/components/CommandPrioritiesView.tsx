import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Send,
  Sliders,
  Flame,
  PhoneCall,
  Clock,
  Activity,
  Layers,
  BarChart2,
} from 'lucide-react';
import { Portfolio, ComplianceAlert, DataMode } from '../types';
import { TabKey } from './Header';
import {
  INITIAL_MARKET_ASSETS,
  RECALIBRATION_EVENTS,
  OVERRIDE_EVENTS,
  CLIENTS_DIRECTORY,
  MarketAsset,
} from '../data/wealthCopilotData';

interface CommandPrioritiesViewProps {
  portfolios: Portfolio[];
  alerts: ComplianceAlert[];
  onNavigateTab: (tab: TabKey) => void;
  onSelectPortfolio: (portfolioId: string) => void;
  onStartRebalance?: (portfolioId: string) => void;
  dataMode?: DataMode;
}

export const CommandPrioritiesView: React.FC<CommandPrioritiesViewProps> = ({
  portfolios,
  alerts,
  onNavigateTab,
  onSelectPortfolio,
  onStartRebalance,
  dataMode = 'LIVE',
}) => {
  const [marketCategory, setMarketCategory] = useState<'INDICES' | 'CAMBIO' | 'COMMODITIES' | 'JUROS'>('INDICES');
  const [quickQuery, setQuickQuery] = useState('');
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);

  // Sparkline renderer
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

  const filteredMarket = INITIAL_MARKET_ASSETS.filter((item) => {
    if (marketCategory === 'INDICES') return item.category === 'INDICES';
    if (marketCategory === 'CAMBIO') return item.category === 'CAMBIO';
    if (marketCategory === 'COMMODITIES') return item.category === 'COMMODITIES';
    if (marketCategory === 'JUROS') return item.category === 'JUROS';
    return true;
  });

  const handleAskQuick = (questionText?: string) => {
    const q = questionText || quickQuery;
    if (!q.trim()) return;

    if (q.toLowerCase().includes('desenquadrado') || q.toLowerCase().includes('família')) {
      setQuickAnswer(
        'Família Silva possui 42% em Renda Variável (limite 30%). O excedente é de R$ 1.500.000, concentrado em ações de tecnologia e consumo.'
      );
    } else if (q.toLowerCase().includes('recalibração') || q.toLowerCase().includes('eventos')) {
      setQuickAnswer(
        'Identificados 6 eventos de recalibração tática: os principais são duration em juros longos (US10Y a 4,22%) e realização de lucros em tecnologia.'
      );
    } else {
      setQuickAnswer(
        'Todas as 27 carteiras foram checadas contra as matrizes de suitability e CVM 175. Três exigem contato preventivo hoje com os comitentes.'
      );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      {/* Top Banner with Howard Marks Quote */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Comando &amp; Prioridades Operacionais
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Recalibração tática, overrides e alocação de risco agregado.
          </p>
        </div>

        {/* Howard Marks Quote Card matching Screenshot 2 */}
        <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-right">
          <p className="text-xs text-slate-300 font-medium italic">
            "Disciplina hoje, tranquilidade amanhã."
          </p>
          <span className="text-[10px] text-cyan-400 font-semibold">— Howard Marks</span>
        </div>
      </div>

      {/* 4 KPI Metric Cards matching Screenshot 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 3 Alertas de Desenquadramento */}
        <div
          onClick={() => onNavigateTab('alerts')}
          className="group p-4 rounded-2xl bg-[#1A1218] border border-rose-500/40 hover:border-rose-500/80 shadow-lg cursor-pointer transition flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white">3</span>
                <span className="text-sm font-bold text-rose-300">
                  Alertas de Desenquadramento
                </span>
              </div>
              <p className="text-xs text-rose-400/80 mt-0.5">
                Revisão recomendada
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-400 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Card 2: 6 Carteiras em Recalibração */}
        <div
          onClick={() => onNavigateTab('simulator')}
          className="group p-4 rounded-2xl bg-[#1E1A11] border border-amber-500/40 hover:border-amber-500/80 shadow-lg cursor-pointer transition flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
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
          <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Card 3: 18 Carteiras saudáveis */}
        <div
          onClick={() => onNavigateTab('portfolios')}
          className="group p-4 rounded-2xl bg-[#0F1E17] border border-emerald-500/40 hover:border-emerald-500/80 shadow-lg cursor-pointer transition flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
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
          <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Card 4: 27 Total de clientes */}
        <div
          onClick={() => onNavigateTab('clients')}
          className="group p-4 rounded-2xl bg-[#0F1829] border border-blue-500/40 hover:border-blue-500/80 shadow-lg cursor-pointer transition flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
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
          <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* Main Row: Alertas de Desenquadramento | Inteligência de Mercado | Assistente IA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Table: Alertas de Desenquadramento (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Alertas de Desenquadramento
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Ver todos →
              </button>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-200 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Cliente</th>
                  <th className="pb-2 font-semibold text-center">Atual</th>
                  <th className="pb-2 font-semibold text-center">Limite</th>
                  <th className="pb-2 font-semibold text-right">Desvio</th>
                  <th className="pb-2 font-semibold text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr
                  onClick={() => onSelectPortfolio('port-001')}
                  className="hover:bg-slate-800/40 cursor-pointer transition group"
                >
                  <td className="py-2.5 font-medium text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div>
                      <p className="group-hover:text-rose-300 transition font-bold">
                        Família Silva
                      </p>
                      <span className="text-[11px] text-slate-300 font-medium">Renda Variável</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-slate-200 font-mono font-medium">42%</td>
                  <td className="py-2.5 text-center text-slate-300 font-mono font-medium">30%</td>
                  <td className="py-2.5 text-right font-bold text-rose-400">+12 p.p.</td>
                  <td className="py-2.5 text-right text-slate-400 group-hover:text-white">
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </td>
                </tr>

                <tr
                  onClick={() => onSelectPortfolio('port-002')}
                  className="hover:bg-slate-800/40 cursor-pointer transition group"
                >
                  <td className="py-2.5 font-medium text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div>
                      <p className="group-hover:text-amber-300 transition font-bold">
                        Rocha Investimentos
                      </p>
                      <span className="text-[11px] text-slate-300 font-medium">Crédito Privado</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-slate-200 font-mono font-medium">22%</td>
                  <td className="py-2.5 text-center text-slate-300 font-mono font-medium">15%</td>
                  <td className="py-2.5 text-right font-bold text-amber-400">+7 p.p.</td>
                  <td className="py-2.5 text-right text-slate-400 group-hover:text-white">
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </td>
                </tr>

                <tr
                  onClick={() => onSelectPortfolio('port-003')}
                  className="hover:bg-slate-800/40 cursor-pointer transition group"
                >
                  <td className="py-2.5 font-medium text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div>
                      <p className="group-hover:text-amber-300 transition font-bold">
                        Castro Family Office
                      </p>
                      <span className="text-[11px] text-slate-300 font-medium">Fundos Imobiliários</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-slate-200 font-mono font-medium">18%</td>
                  <td className="py-2.5 text-center text-slate-300 font-mono font-medium">12%</td>
                  <td className="py-2.5 text-right font-bold text-amber-400">+6 p.p.</td>
                  <td className="py-2.5 text-right text-slate-400 group-hover:text-white">
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-medium text-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <p className="font-semibold text-slate-200">Demais carteiras</p>
                      <span className="text-[11px] text-emerald-300 font-semibold">Em conformidade</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-slate-400 font-medium">—</td>
                  <td className="py-2.5 text-center text-slate-400 font-medium">—</td>
                  <td className="py-2.5 text-right text-slate-400 font-medium">—</td>
                  <td className="py-2.5 text-right text-slate-400">
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Center: Inteligência de Mercado com Abas (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Inteligência de Mercado
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('market')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Ver mais →
              </button>
            </div>

            {/* Sub-tabs matching Screenshot 2: Índices | Câmbio | Commodities | Juros */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-3 text-xs">
              {(
                [
                  { id: 'INDICES', label: 'Índices' },
                  { id: 'CAMBIO', label: 'Câmbio' },
                  { id: 'COMMODITIES', label: 'Commodities' },
                  { id: 'JUROS', label: 'Juros' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMarketCategory(tab.id)}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition text-center ${
                    marketCategory === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Table of selected market items */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-200 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Ativo</th>
                    <th className="pb-2 font-semibold text-center">Valor</th>
                    <th className="pb-2 font-semibold text-center">Variação</th>
                    <th className="pb-2 font-semibold text-right">Hoje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredMarket.map((item) => (
                    <tr key={item.ticker} className="hover:bg-slate-800/30">
                      <td className="py-2 text-slate-100 font-medium">
                        {item.name}
                      </td>
                      <td className="py-2 text-center text-slate-200 font-mono">
                        {item.value} {item.unit}
                      </td>
                      <td
                        className={`py-2 text-center font-bold font-mono ${
                          item.isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.change}
                      </td>
                      <td className="py-2 text-right pl-2">
                        {renderSparkline(item.sparkline, item.isPositive)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Assistente IA (3 cols) */}
        <div className="lg:col-span-3 p-4 rounded-2xl bg-gradient-to-b from-[#101A2D] to-[#0A111F] border border-blue-500/30 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Assistente IA
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('agent')}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Abrir ↗
              </button>
            </div>

            {/* Greeting Bubble */}
            <div className="p-3 rounded-xl bg-[#090F1C] border border-slate-800/80 mb-3 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-sm">
                DM
              </div>
              <div>
                <p className="text-xs text-slate-200 font-medium">Olá, Dário!</p>
                <p className="text-[11px] text-slate-400">Como posso te ajudar hoje?</p>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-1.5 mb-3">
              {[
                'Quais clientes estão desenquadrados?',
                'O que mudou no mercado hoje?',
                'Explique esse movimento do Treasury.',
                'Quais carteiras merecem atenção?',
                'Prepare um resumo para meu cliente.',
              ].map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskQuick(text)}
                  className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition flex items-center justify-between"
                >
                  <span className="truncate">{text}</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                </button>
              ))}
            </div>

            {quickAnswer && (
              <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-200 mb-2 leading-relaxed">
                {quickAnswer}
              </div>
            )}
          </div>

          <div className="relative mt-2">
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuick()}
              placeholder="Digite sua pergunta..."
              className="w-full bg-[#080D18] border border-slate-700/80 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleAskQuick()}
              className="absolute right-2 top-2 text-cyan-400 hover:text-cyan-300 p-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Lower Row (4 Columns matching Screenshot 2): Recalibração | Override | Prioridades do Dia | Risco Agregado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {/* Column 1: Recalibração (6 eventos) */}
        <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Recalibração
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">6 eventos</span>
            </div>

            <div className="space-y-2 mt-3">
              {RECALIBRATION_EVENTS.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {event.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{event.impact}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ml-2 ${
                      event.severity === 'Alta'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {event.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('simulator')}
            className="w-full mt-3 py-1.5 text-center text-xs font-medium text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition"
          >
            Abrir Simulador de Recalibração →
          </button>
        </div>

        {/* Column 2: Override (2 eventos) */}
        <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Override
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">2 eventos</span>
            </div>

            <div className="space-y-2 mt-3">
              {OVERRIDE_EVENTS.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.detail}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 shrink-0 ml-2">
                    {item.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="w-full mt-3 py-1.5 text-center text-xs font-medium text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-500/10 transition"
          >
            Revisar Teses de Override →
          </button>
        </div>

        {/* Column 3: Prioridades do Dia (7 clientes) */}
        <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Prioridades do Dia
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">7 clientes</span>
            </div>

            <div className="space-y-2 mt-3">
              <div
                onClick={() => onSelectPortfolio('port-001')}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-rose-300">
                    Falar com Família Silva
                  </p>
                  <p className="text-[10px] text-slate-400">Excesso de RV (+12 p.p.)</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </div>

              <div
                onClick={() => onSelectPortfolio('port-002')}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-amber-300">
                    Revisar posição do Rocha
                  </p>
                  <p className="text-[10px] text-slate-400">Crédito Privado (+7 p.p.)</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </div>

              <div
                onClick={() => onSelectPortfolio('port-003')}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-amber-300">
                    Acompanhar Castro Family
                  </p>
                  <p className="text-[10px] text-slate-400">Fundos Imobiliários (+6 p.p.)</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('clients')}
            className="w-full mt-3 py-1.5 text-center text-xs font-medium text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition"
          >
            Ver Diretório Completo de Clientes →
          </button>
        </div>

        {/* Column 4: Risco da Carteira Agregada */}
        <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Risco da Carteira Agregada
              </h4>
              <span className="text-[10px] text-cyan-400 font-semibold">CVM 175</span>
            </div>

            <div className="flex items-center gap-3 my-2">
              {/* Circular Gauge */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#1E293B" strokeWidth="10" />
                  {/* Gauge 62% score */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="10"
                    strokeDasharray="148 90"
                    strokeDashoffset="0"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] font-bold text-slate-300">Moderado</span>
                  <span className="text-xs font-black text-cyan-400">Score 6.2</span>
                </div>
              </div>

              {/* Asset Allocation Breakdown */}
              <div className="flex-1 space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Renda Fixa
                  </span>
                  <span className="font-bold text-white">52%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Renda Variável
                  </span>
                  <span className="font-bold text-white">24%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Multimercado
                  </span>
                  <span className="font-bold text-white">12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Alternativos
                  </span>
                  <span className="font-bold text-white">8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Internacional
                  </span>
                  <span className="font-bold text-white">4%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 text-center">
            Perfil de risco ponderado por AUM total sob gestão.
          </div>
        </div>
      </div>

      {/* Quote Banner on the bottom */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0E1626] to-[#080D18] border border-slate-800 flex items-center justify-between">
        <p className="text-xs text-slate-300 font-medium italic">
          "Tempo bem investido gera liberdade."
        </p>
        <span className="text-xs text-cyan-400 font-semibold">
          FlowCore Wealth Copilot • Inteligência de Decisão
        </span>
      </div>
    </div>
  );
};
