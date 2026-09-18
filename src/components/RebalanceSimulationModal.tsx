import React from 'react';
import { X, ArrowRightLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Portfolio } from '../types';

interface RebalanceSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: Portfolio;
}

export const RebalanceSimulationModal: React.FC<RebalanceSimulationModalProps> = ({
  isOpen,
  onClose,
  portfolio,
}) => {
  if (!isOpen) return null;

  // Calculate current totals
  const classTotals: Record<string, number> = {
    'Renda Fixa': 0,
    'Renda Variável': 0,
    'Internacional': 0,
    'Multimercado': 0,
    'Caixa': 0,
  };

  for (const a of portfolio.assets) {
    if (classTotals[a.assetClass] !== undefined) {
      classTotals[a.assetClass] += a.totalValue;
    }
  }

  const totalVal = portfolio.assets.reduce((s, a) => s + a.totalValue, 0);

  // Calculate deltas
  const simulationSteps = portfolio.mandateLimits.map((limit) => {
    const currentVal = classTotals[limit.assetClass] || 0;
    const targetVal = totalVal * (limit.targetPercent / 100);
    const delta = targetVal - currentVal;
    
    return {
      assetClass: limit.assetClass,
      currentVal,
      targetVal,
      delta,
      type: delta > 0 ? 'BUY' : delta < 0 ? 'SELL' : 'HOLD',
    };
  }).filter(step => Math.abs(step.delta) > 1); // filter out tiny floating point differences

  // The total traded volume is the sum of all absolute deltas divided by 2 
  // (since every buy is funded by a sell, assuming total AUM stays constant).
  const totalVolume = simulationSteps.reduce((sum, step) => sum + Math.abs(step.delta), 0) / 2;
  
  // Estimated costs (e.g. 0.031% B3 fees + brokerage average)
  const estimatedCosts = totalVolume * 0.00031; 

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Simulador de Rebalanceamento</h2>
              <p className="text-xs text-slate-400">Plano de execução para adequação ao mandato (Target)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Summary Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-lg">
              <span className="text-xs text-slate-500 block mb-1">Patrimônio Base (AUM)</span>
              <strong className="text-lg font-bold text-white">
                R$ {totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-lg">
              <span className="text-xs text-slate-500 block mb-1">Volume Negociado Estimado</span>
              <strong className="text-lg font-bold text-blue-400">
                R$ {totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-lg">
              <span className="text-xs text-slate-500 block mb-1">Custos Estimados (B3 0,031%)</span>
              <strong className="text-lg font-bold text-rose-400">
                R$ {estimatedCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* Orders Table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Ordens Sugeridas por Classe</h3>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/80 text-xs uppercase text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Ativo / Classe</th>
                    <th className="px-4 py-3">Ação</th>
                    <th className="px-4 py-3 text-right">Atual (R$)</th>
                    <th className="px-4 py-3 text-right">Target (R$)</th>
                    <th className="px-4 py-3 text-right">Ordem (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {simulationSteps.map((step) => (
                    <tr key={step.assetClass} className="hover:bg-slate-800/20">
                      <td className="px-4 py-3 font-medium text-slate-300">{step.assetClass}</td>
                      <td className="px-4 py-3">
                        {step.type === 'BUY' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                            <TrendingUp className="w-3.5 h-3.5" /> COMPRAR
                          </span>
                        ) : step.type === 'SELL' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-400/10 px-2 py-1 rounded">
                            <TrendingDown className="w-3.5 h-3.5" /> VENDER
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                            MANTER
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {step.currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {step.targetVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${step.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {step.type === 'BUY' ? '+' : ''}{step.delta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {simulationSteps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        A carteira já encontra-se perfeitamente alocada no Target.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
            <DollarSign className="w-5 h-5 text-blue-400 shrink-0" />
            <p className="text-xs text-blue-200/70 leading-relaxed">
              <strong>Nota sobre Custos:</strong> Os custos transacionais são uma estimativa baseada nas taxas padrões de negociação da B3 para o volume projetado. Custos de corretagem, impostos e slippage não estão totalmente inclusos e podem variar dependendo da mesa de operações e liquidez do mercado no momento da execução.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              alert('Integração com Mesa de Operações (OMS) não configurada nesta versão.');
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition"
          >
            Aprovar Ordens (Enviar para Mesa)
          </button>
        </div>
      </div>
    </div>
  );
};
