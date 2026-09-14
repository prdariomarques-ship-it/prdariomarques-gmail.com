import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  FileCheck,
  Calculator,
} from 'lucide-react';
import {
  Portfolio,
  ComplianceAlert,
  RebalanceOrder,
  AssetClass,
  RebalanceExecutionResult,
  TaxStrategy,
} from '../types';
import { ComplianceAgent } from '../server/complianceAgent';
import { TaxOptimizationAssistant } from './TaxOptimizationAssistant';
import { authenticatedFetch } from '../lib/apiClient';

interface RebalanceSimulatorViewProps {
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onRebalanceExecuted: (result: RebalanceExecutionResult) => void;
}

export const RebalanceSimulatorView: React.FC<RebalanceSimulatorViewProps> = ({
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onRebalanceExecuted,
}) => {
  const currentPortfolio =
    portfolios.find((p) => p.id === selectedPortfolioId) || portfolios[0];

  const [orders, setOrders] = useState<RebalanceOrder[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<RebalanceExecutionResult | null>(null);
  const [showTaxAssistant, setShowTaxAssistant] = useState(true);
  const [appliedTaxStrategy, setAppliedTaxStrategy] = useState<TaxStrategy | null>(null);

  // New order form state
  const [newAssetId, setNewAssetId] = useState('');
  const [newAction, setNewAction] = useState<'BUY' | 'SELL'>('SELL');
  const [newQuantity, setNewQuantity] = useState<number>(100);

  // Load plan when portfolio changes or user clicks load
  const loadSuggestedPlan = async () => {
    if (!currentPortfolio) return;
    setIsLoadingPlan(true);
    setExecutionResult(null);
    try {
      const res = await authenticatedFetch(`/api/portfolios/${currentPortfolio.id}/rebalance-plan`);
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        // Fallback local se backend retornar não-JSON
        data = null;
      }

      if (data && data.success && data.orders) {
        setOrders(data.orders);
      } else {
        // Fallback via ComplianceAgent local
        const localPlan = ComplianceAgent.generateRebalancePlan(currentPortfolio);
        setOrders(localPlan);
      }
    } catch (err) {
      console.error('Error loading rebalance plan:', err);
      if (currentPortfolio) {
        setOrders(ComplianceAgent.generateRebalancePlan(currentPortfolio));
      }
    } finally {
      setIsLoadingPlan(false);
    }
  };

  useEffect(() => {
    loadSuggestedPlan();
  }, [selectedPortfolioId]);

  // Remove order
  const handleRemoveOrder = (index: number) => {
    setOrders((prev) => prev.filter((_, i) => i !== index));
  };

  // Add custom order
  const handleAddOrder = () => {
    if (!currentPortfolio || !newAssetId || newQuantity <= 0) return;
    const asset = currentPortfolio.assets.find((a) => a.id === newAssetId);
    if (!asset) return;

    const totalAmount = newQuantity * asset.currentPrice;
    const newOrder: RebalanceOrder = {
      assetId: asset.id,
      ticker: asset.ticker,
      assetClass: asset.assetClass,
      action: newAction,
      quantity: newQuantity,
      unitPrice: asset.currentPrice,
      totalAmountBRL: Math.round(totalAmount),
      reason: `Ajuste manual de ${newAction === 'SELL' ? 'venda' : 'compra'} pelo gestor`,
    };

    setOrders((prev) => [...prev, newOrder]);
    setNewQuantity(100);
  };

  // Calculate projected state after executing simulation orders
  const calculateProjectedState = () => {
    if (!currentPortfolio) return [];

    // Clone asset total values
    const projectedAssets = currentPortfolio.assets.map((a) => ({
      ...a,
      projectedTotal: a.totalValue,
    }));

    for (const order of orders) {
      const pAsset = projectedAssets.find((a) => a.id === order.assetId);
      if (pAsset) {
        if (order.action === 'SELL') {
          pAsset.projectedTotal = Math.max(0, pAsset.projectedTotal - order.totalAmountBRL);
        } else {
          pAsset.projectedTotal += order.totalAmountBRL;
        }
      }
    }

    const projectedTotalVal = projectedAssets.reduce((s, a) => s + a.projectedTotal, 0);

    return currentPortfolio.mandateLimits.map((limit) => {
      // Current allocation
      const currentClassAssets = currentPortfolio.assets.filter((a) => a.assetClass === limit.assetClass);
      const currentVal = currentClassAssets.reduce((s, a) => s + a.totalValue, 0);
      const currentTotalVal = currentPortfolio.assets.reduce((s, a) => s + a.totalValue, 0);
      const currentPct = currentTotalVal > 0 ? (currentVal / currentTotalVal) * 100 : 0;

      // Projected allocation
      const projClassAssets = projectedAssets.filter((a) => a.assetClass === limit.assetClass);
      const projVal = projClassAssets.reduce((s, a) => s + a.projectedTotal, 0);
      const projPct = projectedTotalVal > 0 ? (projVal / projectedTotalVal) * 100 : 0;

      // Status
      let projSeverity: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
      if (projPct > limit.maxPercent) {
        projSeverity = (projPct - limit.maxPercent) > 5.0 ? 'CRITICAL' : 'WARNING';
      } else if (projPct < limit.minPercent) {
        projSeverity = (limit.minPercent - projPct) > 5.0 ? 'CRITICAL' : 'WARNING';
      }

      return {
        assetClass: limit.assetClass,
        currentPct,
        projPct,
        targetPct: limit.targetPercent,
        maxPct: limit.maxPercent,
        minPct: limit.minPercent,
        projSeverity,
      };
    });
  };

  const projectedAllocations = calculateProjectedState();
  const willBeFullyCompliant = projectedAllocations.every((p) => p.projSeverity === 'NORMAL');

  // Execute Rebalance
  const handleExecuteRebalance = async () => {
    if (!currentPortfolio) return;
    setIsExecuting(true);
    try {
      const res = await authenticatedFetch(`/api/portfolios/${currentPortfolio.id}/rebalance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });
      const text = await res.text();
      let data: RebalanceExecutionResult | null = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
      if (data && data.success) {
        setExecutionResult(data);
        onRebalanceExecuted(data);
      }
    } catch (err) {
      console.error('Error executing rebalance:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const totalSellBRL = orders.filter((o) => o.action === 'SELL').reduce((s, o) => s + o.totalAmountBRL, 0);
  const totalBuyBRL = orders.filter((o) => o.action === 'BUY').reduce((s, o) => s + o.totalAmountBRL, 0);

  // Aplicação da sugestão gerada pelo Assistente de Otimização Fiscal
  const handleApplyTaxOptimizedOrders = (
    taxOrders: RebalanceOrder[],
    strategy: TaxStrategy
  ) => {
    setOrders(taxOrders);
    setAppliedTaxStrategy(strategy);
  };

  // Workflow step determination
  const currentStep = executionResult
    ? 8 // AUDIT
    : isExecuting
    ? 7 // EXECUTE
    : orders.length > 0 && willBeFullyCompliant
    ? 5 // APPROVE
    : orders.length > 0
    ? 4 // REVIEW
    : 3; // PROPOSE

  const workflowSteps = [
    { step: 1, label: 'DETECT', desc: 'Desvio CVM' },
    { step: 2, label: 'ANALYZE', desc: 'Excesso PP' },
    { step: 3, label: 'PROPOSE', desc: 'Ordens IA' },
    { step: 4, label: 'REVIEW', desc: 'Conferência' },
    { step: 5, label: 'APPROVE', desc: 'Gestor' },
    { step: 6, label: 'REVALIDATE', desc: 'Pré-check' },
    { step: 7, label: 'EXECUTE', desc: 'Simulação' },
    { step: 8, label: 'AUDIT', desc: 'Protocolo' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Simulation Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                Simulador de Rebalanceamento &amp; Protocolo de Segurança
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
                Simulação Controlada (Sandbox)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ciclo fiduciário completo: Análise de desvio, cálculo de boletas, pré-validação regulatória e registro em trilha de auditoria.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedPortfolioId}
              onChange={(e) => onSelectPortfolio(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.status === 'CRITICAL' ? '🔴 ' : p.status === 'WARNING' ? '🟡 ' : '🟢 '}
                  {p.name} (R$ {(p.totalAum / 1000000).toFixed(1)}M)
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowTaxAssistant(!showTaxAssistant)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border ${
                showTaxAssistant
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>Otimização Fiscal</span>
              {appliedTaxStrategy && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={loadSuggestedPlan}
              disabled={isLoadingPlan}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              title="Recarregar plano automatizado do ComplianceAgent"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPlan ? 'animate-spin' : ''}`} />
              <span>Sugerir Ordens IA</span>
            </button>
          </div>
        </div>

        {/* 8-Step Safety Lifecycle Stepper */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-2 flex items-center justify-between">
            <span>Ciclo Fiduciário de Rebalanceamento (Lifecycle de Segurança):</span>
            <span className="text-cyan-400 font-mono">Fase Atual: {workflowSteps[currentStep - 1]?.label}</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center">
            {workflowSteps.map((s) => {
              const isDone = currentStep > s.step;
              const isCurrent = currentStep === s.step;
              return (
                <div
                  key={s.step}
                  className={`p-2 rounded-lg border text-xs transition-all ${
                    isDone
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-cyan-500/20 border-cyan-400/60 text-white ring-1 ring-cyan-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-bold font-mono">
                    {s.step}. {s.label}
                  </div>
                  <div className="text-[9px] truncate opacity-80 mt-0.5">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explicit Simulation Notice Banner */}
        <div className="p-3 bg-cyan-950/20 rounded-xl border border-cyan-500/30 flex items-start gap-2.5 text-xs text-slate-300">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white font-semibold">Simulação de Segurança:</strong> As boletas geradas aqui são processadas em ambiente de modelagem fiduciária. O sistema recalcula o enquadramento CVM e emite o protocolo formal de auditoria, sem enviar ordens reais ao OMS de mercado sem a integração de corretora aprovada.
          </p>
        </div>
      </div>

      {/* Rebalance Execution Success Alert */}
      {executionResult && (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-5 text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Rebalanceamento Simulado e Registrado em Auditoria!</span>
            </div>
            {executionResult.auditProtocolId && (
              <span className="font-mono text-xs px-2.5 py-1 bg-slate-950 rounded border border-emerald-500/40 text-emerald-300">
                Protocolo: {executionResult.auditProtocolId}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {executionResult.auditLog}
          </p>
          <div className="flex items-center space-x-4 text-xs font-semibold text-emerald-300 pt-2 border-t border-emerald-800/40">
            <span>Status Anterior: <strong>{executionResult.previousSeverity}</strong></span>
            <span>➔</span>
            <span>Novo Status: <strong className="text-white bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">{executionResult.newSeverity}</strong></span>
            {executionResult.approvedBy && (
              <span className="text-slate-400">Aprovador: <strong className="text-white">{executionResult.approvedBy}</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Tax Optimization Assistant (Tax-Smart Rebalancing) */}
      {showTaxAssistant && currentPortfolio && (
        <TaxOptimizationAssistant
          portfolio={currentPortfolio}
          onApplyTaxOptimizedOrders={handleApplyTaxOptimizedOrders}
        />
      )}

      {/* Main Grid: Orders on Left, Live Projection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Order Book / Proposed Boletas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Boletas & Ordens da Simulação ({orders.length})
                  </h3>
                  {appliedTaxStrategy && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      🌿 Otimização Fiscal Ativa
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Total Venda: <strong className="text-rose-400">R$ {totalSellBRL.toLocaleString('pt-BR')}</strong> • Total Compra: <strong className="text-emerald-400">R$ {totalBuyBRL.toLocaleString('pt-BR')}</strong>
                </p>
              </div>

              <button
                onClick={() => {
                  setOrders([]);
                  setAppliedTaxStrategy(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 transition"
              >
                Limpar Ordens
              </button>
            </div>

            {/* Orders Table */}
            {orders.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                <Sliders className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-300">Nenhuma ordem adicionada ainda.</p>
                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={loadSuggestedPlan}
                    className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Sugestão Padrão IA
                  </button>
                  <button
                    onClick={() => setShowTaxAssistant(true)}
                    className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Otimizar com Assistente Fiscal
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {orders.map((order, idx) => {
                  const isSell = order.action === 'SELL';
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                        isSell
                          ? 'bg-rose-950/15 border-rose-800/30'
                          : 'bg-emerald-950/15 border-emerald-800/30'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold font-mono shrink-0 mt-0.5 ${
                            isSell
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {order.action === 'SELL' ? 'VENDA' : 'COMPRA'}
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <strong className="text-xs font-bold text-white font-mono">{order.ticker}</strong>
                            <span className="text-[11px] text-slate-400">({order.assetClass})</span>
                            {order.averagePrice && (
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                PM: R$ {order.averagePrice.toFixed(2)}
                              </span>
                            )}
                            {order.taxClassification && (
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                                  order.taxClassification === 'PREJUIZO_COMPENSAVEL'
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                    : order.taxClassification === 'ISENTO_20K'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : order.taxClassification === 'ISENTO_LEGAL'
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                {order.taxClassification === 'PREJUIZO_COMPENSAVEL'
                                  ? `Crédito: -R$ ${Math.abs(order.realizedGainLossBRL || 0).toLocaleString('pt-BR')}`
                                  : order.taxClassification === 'ISENTO_20K'
                                  ? 'Isenção R$ 20k'
                                  : order.taxClassification === 'ISENTO_LEGAL'
                                  ? 'Isento Lei 12.431'
                                  : `IR: R$ ${(order.estimatedTaxBRL || 0).toLocaleString('pt-BR')}`}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{order.reason}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-4 text-xs shrink-0 self-end sm:self-auto">
                        <div className="text-right font-mono">
                          <div className="text-white font-semibold">
                            {order.quantity.toLocaleString('pt-BR')} un. x R$ {order.unitPrice.toFixed(2)}
                          </div>
                          <div className={isSell ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                            R$ {order.totalAmountBRL.toLocaleString('pt-BR')}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveOrder(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition"
                          title="Remover ordem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Custom Order Manual Form */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Adicionar Ordem Manual:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <select
                  value={newAssetId}
                  onChange={(e) => setNewAssetId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione o Ativo...</option>
                  {currentPortfolio?.assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.ticker} - {a.assetClass}
                    </option>
                  ))}
                </select>

                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value as 'BUY' | 'SELL')}
                  className="bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="SELL">VENDA (Desinvestir)</option>
                  <option value="BUY">COMPRA (Aportar)</option>
                </select>

                <input
                  type="number"
                  placeholder="Quantidade"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                  min={1}
                  className="bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                />

                <button
                  onClick={handleAddOrder}
                  disabled={!newAssetId}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-400 border border-slate-700 rounded-lg font-semibold transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Before vs After Simulation */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Impacto Projetado (Antes vs Depois)
              </h3>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                  willBeFullyCompliant
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {willBeFullyCompliant ? '🟢 REENQUADRADA' : '🔴 AINDA EM DESVIO'}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Evolução das alocações da carteira com a aplicação das {orders.length} ordens:
            </p>

            {/* Projected Allocation Bars */}
            <div className="space-y-3.5">
              {projectedAllocations.map((alloc) => {
                const isCrit = alloc.projSeverity === 'CRITICAL';
                const isWarn = alloc.projSeverity === 'WARNING';
                const hasChanged = Math.abs(alloc.currentPct - alloc.projPct) > 0.05;

                return (
                  <div key={alloc.assetClass} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-white font-medium">{alloc.assetClass}</strong>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="text-slate-400">Teto: {alloc.maxPct}%</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400">Antes: {alloc.currentPct.toFixed(1)}%</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <strong
                          className={
                            isCrit
                              ? 'text-rose-400 font-bold'
                              : isWarn
                              ? 'text-amber-400 font-bold'
                              : 'text-emerald-400 font-bold'
                          }
                        >
                          Depois: {alloc.projPct.toFixed(1)}%
                        </strong>
                      </div>
                    </div>

                    {/* Comparative Visual Bar */}
                    <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (alloc.projPct / (alloc.maxPct * 1.3)) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Execute Button */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <button
                onClick={handleExecuteRebalance}
                disabled={isExecuting || orders.length === 0}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processando Ordens e Auditoria...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Efetivar Rebalanceamento & Gerar Recibo</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                Atualiza os dados no repositório de custódia e recalcula o status regulatório da carteira.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
