import React, { useState, useMemo } from 'react';
import {
  Coins,
  Droplets,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Layers,
  Banknote,
  Percent,
} from 'lucide-react';
import { Portfolio } from '../types';
import { calculateConsolidatedLiquidity } from '../utils/liquidityData';

interface ImmediateLiquidityIndexCardProps {
  portfolios: Portfolio[];
  onSelectPortfolio?: (portfolioId: string) => void;
  onStartRebalance?: (portfolioId: string) => void;
  className?: string;
}

export const ImmediateLiquidityIndexCard: React.FC<ImmediateLiquidityIndexCardProps> = ({
  portfolios,
  onSelectPortfolio,
  onStartRebalance,
  className = '',
}) => {
  const [showPortfolioBreakdown, setShowPortfolioBreakdown] = useState<boolean>(false);
  const [showDetailedTiers, setShowDetailedTiers] = useState<boolean>(false);

  // Calcula os dados de liquidez consolidada
  const liquiditySummary = useMemo(() => {
    return calculateConsolidatedLiquidity(portfolios);
  }, [portfolios]);

  const {
    totalAum,
    d0ValueBRL,
    d0Percent,
    d1PlusValueBRL,
    d1PlusPercent,
    minimumRequiredD0Percent,
    excessD0ValueBRL,
    liquidityStatus,
    liquidityStatusText,
    coverageDaysEst,
    tiers,
    portfolioBreakdown,
  } = liquiditySummary;

  const isD0Healthy = d0Percent >= minimumRequiredD0Percent;

  return (
    <div
      id="card-immediate-liquidity-index"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 transition ${className}`}
    >
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">
                Índice de Liquidez Imediata
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                (Portfólio Consolidado)
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isD0Healthy
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {isD0Healthy ? (
                  <>
                    <ShieldCheck className="w-2.5 h-2.5 mr-1 text-emerald-400" />
                    Colchão Prudencial Adequado
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-2.5 h-2.5 mr-1 text-amber-400" />
                    Abaixo da Meta Prudencial
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Proporção de ativos com disponibilidade financeira em <strong className="text-emerald-400">D+0</strong> (liquidez imediata) versus <strong className="text-cyan-400">D+1 ou superior</strong>.
            </p>
          </div>
        </div>

        {/* Botão de Toggle por Carteira */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            id="toggle-liquidity-tiers-btn"
            onClick={() => setShowDetailedTiers(!showDetailedTiers)}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showDetailedTiers ? 'Resumo D+0/D+1+' : 'Faixas Detalhadas'}</span>
          </button>
          <button
            id="toggle-portfolio-liquidity-btn"
            onClick={() => setShowPortfolioBreakdown(!showPortfolioBreakdown)}
            className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>{showPortfolioBreakdown ? 'Ocultar Carteiras' : 'Ver por Carteira'}</span>
            {showPortfolioBreakdown ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Grid Comparativo Principal: D+0 vs. D+1 ou Superior */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BLOCO D+0 (LIQUIDEZ IMEDIATA) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 rounded-2xl p-4.5 space-y-3 group hover:border-emerald-500/50 transition shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Coins className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  Liquidez Imediata (D+0)
                </span>
                <span className="block text-[10px] text-slate-400">Resgate e liquidação no mesmo dia</span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              DISPONÍVEL HOJE
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <div className="text-3xl font-black text-emerald-400 tracking-tight font-mono">
                {d0Percent}%
              </div>
              <div className="text-xs text-slate-300 font-semibold mt-0.5">
                R$ {(d0ValueBRL / 1000000).toFixed(2)}M <span className="text-slate-500 font-normal">de R$ {(totalAum / 1000000).toFixed(2)}M</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Meta Mínima IPS</span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {minimumRequiredD0Percent.toFixed(1)}%
              </span>
              <span className={`text-[10px] block font-bold ${excessD0ValueBRL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {excessD0ValueBRL >= 0 ? `+R$ ${(excessD0ValueBRL / 1000).toFixed(0)}k folga` : `-R$ ${(Math.abs(excessD0ValueBRL) / 1000).toFixed(0)}k déficit`}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between text-xs text-slate-300">
            <span className="text-[11px] text-slate-400">Composição Principal:</span>
            <span className="font-semibold text-emerald-300 text-[11px]">
              Caixa Livre D+0 & Títulos Selic Resgate Imediato
            </span>
          </div>
        </div>

        {/* BLOCO D+1 OU SUPERIOR (LIQUIDEZ PROGRAMADA & ESTRUTURADA) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-950/30 via-slate-950 to-slate-950 border border-cyan-500/25 rounded-2xl p-4.5 space-y-3 group hover:border-cyan-500/45 transition shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                  D+1 ou Superior (D+1+)
                </span>
                <span className="block text-[10px] text-slate-400">Liquidação a partir de 1 dia útil</span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              ALOCAÇÃO ESTRUTURAL
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <div className="text-3xl font-black text-cyan-400 tracking-tight font-mono">
                {d1PlusPercent}%
              </div>
              <div className="text-xs text-slate-300 font-semibold mt-0.5">
                R$ {(d1PlusValueBRL / 1000000).toFixed(2)}M <span className="text-slate-500 font-normal">de R$ {(totalAum / 1000000).toFixed(2)}M</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Horizonte Médio</span>
              <span className="text-xs font-mono font-bold text-slate-200">
                D+2 a D+30
              </span>
              <span className="text-[10px] block text-cyan-400/90 font-medium">
                Renda Fixa, Ações & FIIs
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-cyan-500/15 flex items-center justify-between text-xs text-slate-300">
            <span className="text-[11px] text-slate-400">Objetivo Fiduciário:</span>
            <span className="font-semibold text-cyan-300 text-[11px]">
              Geração de Carrego (Carry), Alpha & Proteção Inflacionária
            </span>
          </div>
        </div>
      </div>

      {/* Barra Proporcional de Liquidez (Stacked Visual Bar) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Distribuição Proporcional da Liquidez do Portfólio
            </span>
            <span className="text-slate-400 text-[10px]">
              (Base Total: R$ {(totalAum / 1000000).toFixed(2)}M)
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium text-[11px]">
                D+0: <strong className="text-emerald-400">{d0Percent}%</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-slate-300 font-medium text-[11px]">
                D+1+: <strong className="text-cyan-400">{d1PlusPercent}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="relative h-6 w-full bg-slate-800 rounded-lg overflow-hidden flex shadow-inner">
          {/* Segmento D+0 */}
          <div
            style={{ width: `${Math.max(5, Math.min(95, d0Percent))}%` }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 flex items-center justify-center text-[11px] font-black text-slate-950 transition-all duration-500 group relative"
            title={`D+0 (Liquidez Imediata): ${d0Percent}% (R$ ${(d0ValueBRL / 1000000).toFixed(2)}M)`}
          >
            <span className="truncate px-1.5">D+0 ({d0Percent}%)</span>
          </div>

          {/* Segmento D+1 ou Superior */}
          <div
            style={{ width: `${Math.max(5, Math.min(95, d1PlusPercent))}%` }}
            className="h-full bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-600 flex items-center justify-center text-[11px] font-black text-white transition-all duration-500 group relative"
            title={`D+1 ou Superior: ${d1PlusPercent}% (R$ ${(d1PlusValueBRL / 1000000).toFixed(2)}M)`}
          >
            <span className="truncate px-1.5">D+1 ou Superior ({d1PlusPercent}%)</span>
          </div>

          {/* Marcador de Linha da Meta Prudencial (10% D+0) */}
          <div
            style={{ left: `${minimumRequiredD0Percent}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
            title={`Meta Mínima Regulamentar IPS: ${minimumRequiredD0Percent}%`}
          />
        </div>

        {/* Legenda inferior da barra */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-amber-400 inline-block" />
            <span>Linha de Meta Mínima de Segurança: <strong>10.0% em D+0</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-300">
              Cobertura estimada: <strong className="text-emerald-400">~{coverageDaysEst} dias</strong> de fluxo de saques sem necessidade de vendas forçadas
            </span>
          </div>
        </div>
      </div>

      {/* Faixas Detalhadas de Liquidação (Expansível ou Exibição Opcional) */}
      {showDetailedTiers && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Detalhamento das Faixas de Liquidez (D+0 até D+30+)
            </h4>
            <span className="text-[11px] text-slate-400">5 faixas regulatórias de liquidação</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {tiers.map((tier) => {
              const isD0 = tier.id === 'd0';
              return (
                <div
                  key={tier.id}
                  className="p-3 rounded-xl border transition flex flex-col justify-between space-y-2"
                  style={{
                    backgroundColor: tier.bgColor,
                    borderColor: tier.borderColor,
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span style={{ color: tier.color }}>{tier.name}</span>
                      <span className="text-white font-mono">{tier.percentage}%</span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-medium mt-0.5">
                      {tier.timeframe}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-white font-mono">
                      R$ {(tier.valueBRL / 1000000).toFixed(2)}M
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                      {tier.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabela de Liquidez por Carteira Individual */}
      {showPortfolioBreakdown && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-400" />
              Índice de Liquidez por Carteira Monitorada
            </h4>
            <span className="text-[11px] text-slate-400">
              {portfolioBreakdown.length} carteiras avaliadas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-2 font-medium">Carteira & Titular</th>
                  <th className="py-2 px-2 font-medium text-right">AUM Total</th>
                  <th className="py-2 px-2 font-medium text-center">Liquidez D+0 (%)</th>
                  <th className="py-2 px-2 font-medium text-right">Volume D+0 (R$)</th>
                  <th className="py-2 px-2 font-medium text-center">D+1 ou Superior (%)</th>
                  <th className="py-2 px-2 font-medium text-center">Diagnóstico</th>
                  <th className="py-2 px-2 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {portfolioBreakdown.map((item) => {
                  const isCrit = item.liquidityStatus === 'CRITICAL';
                  const isWarn = item.liquidityStatus === 'WARNING';
                  const isNorm = item.liquidityStatus === 'ADEQUATE';

                  return (
                    <tr
                      key={item.portfolioId}
                      className="hover:bg-slate-900/60 transition group"
                    >
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-white group-hover:text-emerald-400 transition">
                          {item.portfolioName}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.clientName}</div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-200">
                        R$ {(item.totalAum / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs border ${
                            isCrit
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : isWarn
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {item.d0Percent}%
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-400 font-semibold">
                        R$ {(item.d0Value / 1000).toFixed(0)}k
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-cyan-300 font-bold">
                        {item.d1PlusPercent}%
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCrit
                              ? 'text-rose-400 bg-rose-500/10'
                              : isWarn
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-emerald-400 bg-emerald-500/10'
                          }`}
                        >
                          {item.statusLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onSelectPortfolio && (
                            <button
                              onClick={() => onSelectPortfolio(item.portfolioId)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-medium transition"
                              title="Inspecionar Carteira"
                            >
                              Inspecionar
                            </button>
                          )}
                          {onStartRebalance && (isCrit || isWarn) && (
                            <button
                              onClick={() => onStartRebalance(item.portfolioId)}
                              className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-bold transition flex items-center gap-1"
                              title="Rebalancear Liquidez"
                            >
                              <Sliders className="w-3 h-3 text-emerald-400" />
                              <span>Ajustar Caixa</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
