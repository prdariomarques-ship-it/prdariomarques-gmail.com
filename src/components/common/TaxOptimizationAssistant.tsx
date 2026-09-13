import React, { useState } from 'react';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Scale,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Percent,
  Calculator,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import {
  Portfolio,
  AssetClass,
  RebalanceOrder,
  TaxStrategy,
  TaxEfficiencyAnalysis,
} from '../../types';
import {
  analyzeTaxStrategies,
  getStrategyMetadata,
} from '../../utils/taxOptimizer';
import { AIInsightCard } from './AIInsightCard';

export interface TaxOptimizationAssistantProps {
  portfolio: Portfolio;
  onApplyTaxOptimizedOrders: (orders: RebalanceOrder[], strategyApplied: TaxStrategy) => void;
}

export const TaxOptimizationAssistant: React.FC<TaxOptimizationAssistantProps> = ({
  portfolio,
  onApplyTaxOptimizedOrders,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<TaxStrategy>('TAX_LOSS_HARVESTING');
  const [showAssetDetails, setShowAssetDetails] = useState<boolean>(true);
  const [showTaxEducation, setShowTaxEducation] = useState<boolean>(false);
  const [justApplied, setJustApplied] = useState<boolean>(false);

  // Identifica a classe de ativos com maior desenquadramento positivo (excedente) para otimização
  const totalVal = portfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);
  const classesWithExcess = portfolio.mandateLimits
    .map((limit) => {
      const classAssets = portfolio.assets.filter((a) => a.assetClass === limit.assetClass);
      const classVal = classAssets.reduce((s, a) => s + a.totalValue, 0);
      const currentPct = totalVal > 0 ? (classVal / totalVal) * 100 : 0;
      const excessPct = currentPct - limit.targetPercent;
      const excessBRL = excessPct > 0 ? (excessPct / 100) * totalVal : 0;
      return {
        assetClass: limit.assetClass,
        currentPct,
        targetPct: limit.targetPercent,
        maxPct: limit.maxPercent,
        excessBRL,
      };
    })
    .filter((c) => c.excessBRL > 0)
    .sort((a, b) => b.excessBRL - a.excessBRL);

  // Se houver classe excedente, otimiza para a maior (geralmente Renda Variável ou Internacional);
  // se não houver desenquadramento crítico, simula sobre a classe Renda Variável como padrão demonstrativo
  const primaryExcess = classesWithExcess.length > 0
    ? classesWithExcess[0]
    : {
        assetClass: 'Renda Variável' as AssetClass,
        currentPct: 35,
        targetPct: 25,
        maxPct: 35,
        excessBRL: totalVal * 0.1,
      };

  const analyses = analyzeTaxStrategies(
    portfolio,
    primaryExcess.assetClass,
    primaryExcess.excessBRL
  );

  const currentAnalysis = analyses[selectedStrategy];
  const naiveAnalysis = analyses['PRO_RATA_BALANCED'];
  const hasTaxSavings = currentAnalysis.taxSavingsVsNaiveBRL > 0;

  const handleApply = () => {
    onApplyTaxOptimizedOrders(currentAnalysis.proposedOrders, selectedStrategy);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 3000);
  };

  return (
    <div
      id="tax-optimization-assistant"
      className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-lg shadow-emerald-950/20 backdrop-blur-xl space-y-5"
    >
      {/* ------------------------------------------------------------- */}
      {/* Header: Assistente de Eficiência e Otimização Fiscal           */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Assistente de Otimização Fiscal (Tax-Smart Rebalance)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                RFB Compliance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Minimiza o imposto sobre ganho de capital e aproveita créditos fiscais ao reenquadrar a classe{' '}
              <strong className="text-emerald-300">{primaryExcess.assetClass}</strong>.
            </p>
          </div>
        </div>

        {/* Action Button: Aplicar ao Simulador */}
        <button
          onClick={handleApply}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
            justApplied
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 hover:shadow-emerald-900/50'
          }`}
        >
          {justApplied ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Ordens Fiscais Aplicadas!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Aplicar Sugestão Fiscal às Boletas</span>
            </>
          )}
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Strategy Selection Cards Grid                                 */}
      {/* ------------------------------------------------------------- */}
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
          Selecione a Estratégia Tributária:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Strategy 1: Tax-Loss Harvesting */}
          <button
            type="button"
            onClick={() => setSelectedStrategy('TAX_LOSS_HARVESTING')}
            className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
              selectedStrategy === 'TAX_LOSS_HARVESTING'
                ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Tax-Loss Harvesting
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Zero IR
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Vende posições com prejuízo acumulado, gerando créditos tributários futuros.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-emerald-300 font-semibold">
              IR Estimado: R$ {analyses.TAX_LOSS_HARVESTING.totalEstimatedTaxBRL.toLocaleString('pt-BR')}
            </div>
          </button>

          {/* Strategy 2: Menor Ganho de Capital */}
          <button
            type="button"
            onClick={() => setSelectedStrategy('MINIMUM_CAPITAL_GAIN')}
            className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
              selectedStrategy === 'MINIMUM_CAPITAL_GAIN'
                ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/40 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5 text-cyan-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Menor Ganho Capital
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  Menor DARF
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Prioriza ativos isentos e menor ganho percentual para diminuir imposto imediato.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-cyan-300 font-semibold">
              IR Estimado: R$ {analyses.MINIMUM_CAPITAL_GAIN.totalEstimatedTaxBRL.toLocaleString('pt-BR')}
            </div>
          </button>

          {/* Strategy 3: Isenção R$ 20k/mês */}
          <button
            type="button"
            onClick={() => setSelectedStrategy('B3_20K_EXEMPTION')}
            className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
              selectedStrategy === 'B3_20K_EXEMPTION'
                ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/40 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5 text-amber-400">
                  <Award className="w-3.5 h-3.5" />
                  Isenção R$ 20k/mês
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  B3 PF
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Calibra o volume de vendas de ações até R$ 20.000 para isenção total de IR na faixa.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-amber-300 font-semibold">
              IR Estimado: R$ {analyses.B3_20K_EXEMPTION.totalEstimatedTaxBRL.toLocaleString('pt-BR')}
            </div>
          </button>

          {/* Strategy 4: Pro-Rata Naive (Benchmark) */}
          <button
            type="button"
            onClick={() => setSelectedStrategy('PRO_RATA_BALANCED')}
            className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
              selectedStrategy === 'PRO_RATA_BALANCED'
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-300">
                  <Scale className="w-3.5 h-3.5" />
                  Venda Proporcional
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                  Padrão
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Venda ingênua ponderada pelo patrimônio, sem calibragem fiscal.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-slate-400 font-semibold">
              IR Estimado: R$ {analyses.PRO_RATA_BALANCED.totalEstimatedTaxBRL.toLocaleString('pt-BR')}
            </div>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Prescriptive Fiduciary Insight: 6 Mandatory Pillars           */}
      {/* ------------------------------------------------------------- */}
      <AIInsightCard
        id={`tax-insight-${selectedStrategy}`}
        insight={{
          what: `Otimização fiscal via ${currentAnalysis.strategyLabel}: desinvestimento sugerido de R$ ${currentAnalysis.totalSellAmountBRL.toLocaleString(
            'pt-BR'
          )} na classe ${primaryExcess.assetClass} gerando ${
            currentAnalysis.taxSavingsVsNaiveBRL > 0
              ? `economia estimada de R$ ${currentAnalysis.taxSavingsVsNaiveBRL.toLocaleString('pt-BR')} vs. rebalanceamento ingênuo`
              : 'alinhamento patrimonial sem sobrecusto tributário'
          }.`,
          why: `${getStrategyMetadata(selectedStrategy).description} ${
            currentAnalysis.totalHarvestedLossBRL > 0
              ? `Realiza R$ ${currentAnalysis.totalHarvestedLossBRL.toLocaleString(
                  'pt-BR'
                )} em prejuízos fiscais compensáveis perante a Receita Federal.`
              : `Seleciona lotes com menor ganho acumulado ou isentos para mitigar a base de cálculo da DARF.`
          }`,
          impact: `Imposto final projetado em R$ ${currentAnalysis.totalEstimatedTaxBRL.toLocaleString(
            'pt-BR'
          )} (alíquota efetiva de ${currentAnalysis.effectiveTaxRatePercent}%), preservando capital líquido para o titular ${
            portfolio.clientName
          } sem violar a política interna da gestora.`,
          action: `Aplicar a cesta de ${
            currentAnalysis.proposedOrders.filter((o) => o.action === 'SELL').length
          } ordens tributárias otimizadas nas boletas de rebalanceamento do simulador.`,
          confidence: 96,
          source:
            'Instrução Normativa RFB nº 1.585/2015 (art. 64) • Lei nº 11.033/2004 • Resolução CVM 175',
        }}
        title={`Estratégia Fiscal • ${currentAnalysis.strategyLabel}`}
        subtitle={`Titular: ${portfolio.clientName} • Classe Foco: ${primaryExcess.assetClass}`}
        category="OPPORTUNITY"
        severity="INFO"
        ruleSource="POLITICA_INTERNA"
        rule_source="POLITICA_INTERNA"
        policyId="POL-TX-01"
        policy_id="POL-TX-01"
        portfolioName={portfolio.name}
        clientName={portfolio.clientName}
        onApplyAction={handleApply}
        actionLabel={justApplied ? 'Ordens Aplicadas!' : 'Aplicar ao Simulador'}
        collapsible={true}
        defaultExpanded={true}
      />

      {/* ------------------------------------------------------------- */}
      {/* Fiscal Metrics KPI Summary Grid                              */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Sell Volume */}
        <div className="p-3 bg-slate-950/90 rounded-xl border border-white/[0.06]">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Volume de Venda Sugerido
          </span>
          <strong className="text-lg font-mono font-extrabold text-white">
            R$ {currentAnalysis.totalSellAmountBRL.toLocaleString('pt-BR')}
          </strong>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {currentAnalysis.proposedOrders.filter((o) => o.action === 'SELL').length} ordens de alienação
          </span>
        </div>

        {/* Realized Capital Gain / Harvested Loss */}
        <div className="p-3 bg-slate-950/90 rounded-xl border border-white/[0.06]">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            {currentAnalysis.totalHarvestedLossBRL > 0 ? 'Prejuízo Fiscal Gerado' : 'Ganho de Capital Realizado'}
          </span>
          <strong
            className={`text-lg font-mono font-extrabold ${
              currentAnalysis.totalHarvestedLossBRL > 0 ? 'text-cyan-400' : 'text-slate-200'
            }`}
          >
            {currentAnalysis.totalHarvestedLossBRL > 0
              ? `R$ ${currentAnalysis.totalHarvestedLossBRL.toLocaleString('pt-BR')}`
              : `R$ ${currentAnalysis.totalCapitalGainBRL.toLocaleString('pt-BR')}`}
          </strong>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {currentAnalysis.totalHarvestedLossBRL > 0 ? 'Crédito p/ abater lucros futuros' : 'Base tributável estimada'}
          </span>
        </div>

        {/* Estimated Tax Due (IR) */}
        <div
          className={`p-3 rounded-xl border ${
            currentAnalysis.totalEstimatedTaxBRL === 0
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-amber-950/20 border-amber-500/30'
          }`}
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block text-slate-300">
            Imposto Estimado (IR)
          </span>
          <strong
            className={`text-lg font-mono font-extrabold ${
              currentAnalysis.totalEstimatedTaxBRL === 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            R$ {currentAnalysis.totalEstimatedTaxBRL.toLocaleString('pt-BR')}
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Alíquota efetiva: {currentAnalysis.effectiveTaxRatePercent}%
          </span>
        </div>

        {/* Tax Savings vs Naive */}
        <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/40">
          <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider block">
            Economia vs. Venda Padrão
          </span>
          <strong className="text-lg font-mono font-extrabold text-emerald-300">
            R$ {currentAnalysis.taxSavingsVsNaiveBRL.toLocaleString('pt-BR')}
          </strong>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5">
            Comparativo vs Venda Ingênua (R$ {naiveAnalysis.totalEstimatedTaxBRL.toLocaleString('pt-BR')} IR)
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Portfolio Asset Tax X-Ray Table                               */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAssetDetails(!showAssetDetails)}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <span>Raio-X Tributário dos Ativos da Classe ({currentAnalysis.assetTaxBreakdown.length})</span>
            {showAssetDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setShowTaxEducation(!showTaxEducation)}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 font-mono"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ver Regras RFB e Isenção</span>
          </button>
        </div>

        {/* Educational Explainer */}
        {showTaxEducation && (
          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Fundamentos da Otimização Fiscal no Mercado Brasileiro (Instrução CVM &amp; RFB)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>
                <strong className="text-slate-200">Tax-Loss Harvesting (Compensação de Perdas):</strong> Prejuízos apurados em alienações de renda variável podem ser compensados com ganhos líquidos auferidos no próprio mês ou nos meses subsequentes em operações da mesma espécie (art. 64 da IN RFB nº 1.585/2015).
              </li>
              <li>
                <strong className="text-slate-200">Isenção de R$ 20.000 (Ações na B3):</strong> Para pessoas físicas, são isentos de IR os ganhos líquidos auferidos em operações no mercado à vista de ações cujas alienações no mês não excedam R$ 20.000 (art. 3º, inciso I da Lei nº 11.033/2004).
              </li>
              <li>
                <strong className="text-slate-200">Debêntures e Títulos Incentivados:</strong> Rendimentos e ganhos de capital em debêntures de infraestrutura (Lei nº 12.431/2006), CRI, CRA e LCI/LCA possuem alíquota zero de imposto de renda para investidores pessoa física.
              </li>
            </ul>
          </div>
        )}

        {showAssetDetails && (
          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Ativo</th>
                  <th className="p-3 text-right">Qtd</th>
                  <th className="p-3 text-right">Preço Médio</th>
                  <th className="p-3 text-right">Preço Atual</th>
                  <th className="p-3 text-right">Resultado Não Realizado</th>
                  <th className="p-3 text-center">Classificação Fiscal</th>
                  <th className="p-3 text-right">Venda Sugerida</th>
                  <th className="p-3 text-right">IR Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/40 text-slate-200 text-xs">
                {currentAnalysis.assetTaxBreakdown.map((asset) => {
                  const isLoss = asset.unrealizedGainLossBRL < 0;
                  const isExempt = asset.isTaxExempt || asset.taxClassification === 'ISENTO_20K';
                  const isSelling = asset.suggestedSellQty > 0;

                  return (
                    <tr
                      key={asset.assetId}
                      className={`hover:bg-slate-900/60 transition ${
                        isSelling ? 'bg-emerald-950/10' : ''
                      }`}
                    >
                      <td className="p-3">
                        <strong className="text-white font-bold">{asset.ticker}</strong>
                        <span className="text-[10px] text-slate-500 block">{asset.name}</span>
                      </td>
                      <td className="p-3 text-right text-slate-300">
                        {asset.quantityHeld.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 text-right text-slate-300">
                        R$ {asset.averagePrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-white font-semibold">
                        R$ {asset.currentPrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`font-bold ${
                            isLoss ? 'text-cyan-400' : 'text-amber-400'
                          }`}
                        >
                          {isLoss ? '' : '+'}
                          {asset.unrealizedGainLossPercent.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {isLoss ? '-R$' : '+R$'}{' '}
                          {Math.abs(asset.unrealizedGainLossBRL).toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                            asset.taxClassification === 'PREJUIZO_COMPENSAVEL'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              : asset.taxClassification === 'ISENTO_20K'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : asset.taxClassification === 'ISENTO_LEGAL'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {asset.taxClassification === 'PREJUIZO_COMPENSAVEL'
                            ? 'Crédito Prejuízo'
                            : asset.taxClassification === 'ISENTO_20K'
                            ? 'Isenção R$ 20k'
                            : asset.taxClassification === 'ISENTO_LEGAL'
                            ? 'Isento Lei 12.431'
                            : 'Tributável (15%)'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {isSelling ? (
                          <>
                            <strong className="text-emerald-400 font-bold">
                              {asset.suggestedSellQty.toLocaleString('pt-BR')} un.
                            </strong>
                            <span className="text-[10px] text-slate-400 block">
                              R$ {asset.suggestedSellAmountBRL.toLocaleString('pt-BR')}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {isSelling ? (
                          asset.estimatedTaxBRL === 0 ? (
                            <span className="text-emerald-400 font-bold text-[11px]">R$ 0,00</span>
                          ) : (
                            <span className="text-amber-400 font-bold text-[11px]">
                              R$ {asset.estimatedTaxBRL.toLocaleString('pt-BR')}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
