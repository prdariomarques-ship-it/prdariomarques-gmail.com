import React, { useMemo } from 'react';
import {
  Layers,
  TrendingUp,
  Landmark,
  Compass,
  Globe,
  Coins,
  Filter,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ComplianceAlert, Portfolio } from '../types';

export interface AssetClassFilterOption {
  id: string; // 'ALL' | 'Renda Variável' | 'Renda Fixa' | 'Multimercado' | 'Internacional' | 'Caixa'
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeBorder: string;
  activeBg: string;
  activeText: string;
}

export const ASSET_CLASS_OPTIONS: AssetClassFilterOption[] = [
  {
    id: 'ALL',
    label: 'Todas as Classes',
    shortLabel: 'Consolidado',
    description: 'Visão consolidada multi-ativos e mandatos globais',
    icon: Layers,
    accentColor: '#38bdf8', // Sky
    activeBorder: 'border-sky-500/50',
    activeBg: 'bg-sky-500/15',
    activeText: 'text-sky-300',
  },
  {
    id: 'Renda Variável',
    label: 'Ações / Renda Variável',
    shortLabel: 'Renda Variável',
    description: 'Ações B3, ETFs locais, Small Caps e Derivativos de Equities',
    icon: TrendingUp,
    accentColor: '#f43f5e', // Rose
    activeBorder: 'border-rose-500/50',
    activeBg: 'bg-rose-500/15',
    activeText: 'text-rose-300',
  },
  {
    id: 'Renda Fixa',
    label: 'Renda Fixa & Crédito',
    shortLabel: 'Renda Fixa',
    description: 'Títulos Públicos Federais (NTN-B, LFT), Debêntures e FIDCs',
    icon: Landmark,
    accentColor: '#06b6d4', // Cyan
    activeBorder: 'border-cyan-500/50',
    activeBg: 'bg-cyan-500/15',
    activeText: 'text-cyan-300',
  },
  {
    id: 'Multimercado',
    label: 'Fundos Multimercado',
    shortLabel: 'Multimercado',
    description: 'Estratégias Macro, Long & Short e Arbitragem Sistemática',
    icon: Compass,
    accentColor: '#8b5cf6', // Violet
    activeBorder: 'border-violet-500/50',
    activeBg: 'bg-violet-500/15',
    activeText: 'text-violet-300',
  },
  {
    id: 'Internacional',
    label: 'Ativos Globais & Offshore',
    shortLabel: 'Internacional',
    description: 'Exposição Cambial, BDRs Patrocinados e Carteiras Offshore',
    icon: Globe,
    accentColor: '#f59e0b', // Amber
    activeBorder: 'border-amber-500/50',
    activeBg: 'bg-amber-500/15',
    activeText: 'text-amber-300',
  },
  {
    id: 'Caixa',
    label: 'Caixa & Liquidez Imediata',
    shortLabel: 'Caixa',
    description: 'Compromissadas DI e Reserva de Rebalanceamento',
    icon: Coins,
    accentColor: '#10b981', // Emerald
    activeBorder: 'border-emerald-500/50',
    activeBg: 'bg-emerald-500/15',
    activeText: 'text-emerald-300',
  },
];

export function matchesAssetClass(itemAssetClass: string, filterClass: string): boolean {
  if (filterClass === 'ALL') return true;
  if (!itemAssetClass) return false;

  const a = itemAssetClass.toLowerCase();
  const f = filterClass.toLowerCase();

  if (f.includes('variável') || f.includes('açoes') || f.includes('acoes') || f.includes('equity') || f.includes('ações')) {
    return a.includes('variável') || a.includes('ações') || a.includes('acoes') || a.includes('equity');
  }
  if (f.includes('fixa') || f.includes('bond') || f.includes('crédito')) {
    return a.includes('fixa') || a.includes('bond') || a.includes('crédito');
  }
  if (f.includes('multimercado') || f.includes('hedge') || f.includes('macro')) {
    return a.includes('multimercado') || a.includes('hedge') || a.includes('macro');
  }
  if (f.includes('internacional') || f.includes('offshore') || f.includes('global') || f.includes('cambial')) {
    return a.includes('internacional') || a.includes('offshore') || a.includes('global') || a.includes('cambial');
  }
  if (f.includes('caixa') || f.includes('cash') || f.includes('liquidez')) {
    return a.includes('caixa') || a.includes('cash') || a.includes('liquidez');
  }
  return a === f;
}

interface AssetClassFilterBarProps {
  selectedAssetClass: string;
  onSelectAssetClass: (assetClass: string) => void;
  alerts: ComplianceAlert[];
  portfolios: Portfolio[];
}

export const AssetClassFilterBar: React.FC<AssetClassFilterBarProps> = ({
  selectedAssetClass,
  onSelectAssetClass,
  alerts,
  portfolios,
}) => {
  // Aggregate real-time stats for each asset class
  const classStats = useMemo(() => {
    const stats: Record<
      string,
      {
        totalAlerts: number;
        criticalCount: number;
        warningCount: number;
        excessBRL: number;
      }
    > = {};

    ASSET_CLASS_OPTIONS.forEach((opt) => {
      stats[opt.id] = { totalAlerts: 0, criticalCount: 0, warningCount: 0, excessBRL: 0 };
    });

    alerts.forEach((alert) => {
      // Global
      stats.ALL.totalAlerts += 1;
      if (alert.severity === 'CRITICAL') stats.ALL.criticalCount += 1;
      else if (alert.severity === 'WARNING') stats.ALL.warningCount += 1;
      stats.ALL.excessBRL += alert.excessValueBRL;

      // Specific class
      ASSET_CLASS_OPTIONS.forEach((opt) => {
        if (opt.id !== 'ALL' && matchesAssetClass(alert.assetClass, opt.id)) {
          stats[opt.id].totalAlerts += 1;
          if (alert.severity === 'CRITICAL') stats[opt.id].criticalCount += 1;
          else if (alert.severity === 'WARNING') stats[opt.id].warningCount += 1;
          stats[opt.id].excessBRL += alert.excessValueBRL;
        }
      });
    });

    return stats;
  }, [alerts]);

  const currentOption = ASSET_CLASS_OPTIONS.find((o) => o.id === selectedAssetClass) || ASSET_CLASS_OPTIONS[0];

  return (
    <div
      id="asset-class-compliance-filter"
      className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 backdrop-blur-sm"
    >
      {/* Header bar with filter label and active description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                Filtro por Classe de Ativos
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Alocação & Enquadramento
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Isole as métricas de desenquadramento e séries históricas por classe para auditar conformidade com mandatos IPS e limites regulatórios CVM 175.
            </p>
          </div>
        </div>

        {selectedAssetClass !== 'ALL' && (
          <button
            onClick={() => onSelectAssetClass('ALL')}
            className="self-start sm:self-center px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>Limpar Filtro ({currentOption.shortLabel})</span>
          </button>
        )}
      </div>

      {/* Interactive Class Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {ASSET_CLASS_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedAssetClass === opt.id;
          const s = classStats[opt.id] || { totalAlerts: 0, criticalCount: 0, warningCount: 0, excessBRL: 0 };

          return (
            <button
              key={opt.id}
              onClick={() => onSelectAssetClass(opt.id)}
              className={`group relative p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? `${opt.activeBg} ${opt.activeBorder} ring-1 ring-white/10 shadow-md`
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Top Row: Icon + Indicator Badge */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSelected ? 'bg-white/10 text-white' : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {s.criticalCount > 0 ? (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    {s.criticalCount} Crítico
                  </span>
                ) : s.warningCount > 0 ? (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {s.warningCount} Atenção
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    Ok
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <div
                  className={`text-xs font-bold leading-snug truncate ${
                    isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}
                  title={opt.label}
                >
                  {opt.shortLabel}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                  {s.excessBRL > 0 ? (
                    <span className={s.criticalCount > 0 ? 'text-rose-300 font-semibold' : 'text-amber-300 font-medium'}>
                      R$ {(s.excessBRL / 1000).toFixed(0)}k em risco
                    </span>
                  ) : (
                    <span>Sem desenquadramento</span>
                  )}
                </div>
              </div>

              {/* Active Indicator dot */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Insight Summary Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentOption.accentColor }} />
          <span className="text-slate-300">
            Filtrando gráfico por:{' '}
            <strong className="text-white font-bold">{currentOption.label}</strong>
          </span>
          <span className="hidden md:inline text-slate-400">• {currentOption.description}</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono self-end sm:self-auto">
          {selectedAssetClass === 'ALL' ? (
            <span className="text-slate-400">
              Total de Infrações: <strong className="text-rose-400">{alerts.length} carteiras</strong>
            </span>
          ) : (
            <span className="text-slate-400">
              Infrações Ativas na Classe:{' '}
              <strong className={classStats[selectedAssetClass]?.totalAlerts > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {classStats[selectedAssetClass]?.totalAlerts || 0}
              </strong>
            </span>
          )}
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            Regra:{' '}
            <strong className="text-cyan-300 font-sans">
              {selectedAssetClass === 'Renda Variável'
                ? 'Teto IPS 35% CVM 175'
                : selectedAssetClass === 'Internacional'
                ? 'Teto Offshore 20%'
                : selectedAssetClass === 'Renda Fixa'
                ? 'Banda Mínima 40% DI'
                : selectedAssetClass === 'Multimercado'
                ? 'Teto Hedge 25%'
                : 'Conformidade Fiduciária'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
