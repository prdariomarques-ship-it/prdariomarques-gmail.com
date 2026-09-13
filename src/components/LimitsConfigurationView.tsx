import React, { useState, useMemo, useEffect } from 'react';
import {
  SlidersHorizontal,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Save,
  Info,
  TrendingUp,
  Globe,
  Layers,
  Coins,
  ShieldCheck,
  Scale,
  Sparkles,
  Activity,
  Check,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { AssetClass, AssetClassThresholdConfig, Portfolio, ComplianceAlert } from '../types';
import { ComplianceAgent } from '../server/complianceAgent';

interface LimitsConfigurationViewProps {
  portfolios: Portfolio[];
  onUpdateLimits: (configs: AssetClassThresholdConfig[], portfolioId?: string) => Promise<void>;
  onResetLimits: () => Promise<void>;
  currentAlerts?: ComplianceAlert[];
}

const ASSET_CLASS_DETAILS: Record<
  AssetClass,
  {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    normativeBase: string;
  }
> = {
  'Renda Variável': {
    icon: TrendingUp,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    description: 'Ações B3, ETFs de índice (BOVA11, SMAL11), BDRs Nível I e Fundos de Ações.',
    normativeBase: 'Mandato IPS Bilateral & CVM 175',
  },
  'Renda Fixa': {
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Títulos públicos federais (NTN-B, LFT), debêntures incentivadas, CDBs e CRIs/CRAs.',
    normativeBase: 'Res. CMN 4.963 & Código ANBIMA',
  },
  Internacional: {
    icon: Globe,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'ETFs globais (IVVB11, ACWI), fundos offshore classe 332 e recibos de custódia externa.',
    normativeBase: 'Resolução CVM 175 Anexo I (Teto Geral 20%)',
  },
  Multimercado: {
    icon: Layers,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Fundos Macro, quantitativos, long & short e arbitragem de taxas de juros.',
    normativeBase: 'Diretriz Interna do Comitê de Risco',
  },
  Caixa: {
    icon: Coins,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    description: 'Operações compromissadas overnight com lastro soberano e depósitos à vista.',
    normativeBase: 'Gestão de Liquidez & Disponibilidades',
  },
};

const DEFAULT_CONFIGS: AssetClassThresholdConfig[] = [
  {
    assetClass: 'Renda Variável',
    minPercent: 10,
    targetPercent: 25,
    maxPercent: 35,
    warningTolerancePP: 2.0,
    criticalTolerancePP: 5.0,
    warningTriggerPercent: 33.0,
    criticalTriggerPercent: 40.0,
    sourceDescription: 'Mandato Bilateral IPS & CVM 175',
    notes: 'Ações B3, ETFs locais, BDRs',
  },
  {
    assetClass: 'Renda Fixa',
    minPercent: 40,
    targetPercent: 50,
    maxPercent: 65,
    warningTolerancePP: 3.0,
    criticalTolerancePP: 5.0,
    warningTriggerPercent: 62.0,
    criticalTriggerPercent: 70.0,
    sourceDescription: 'Resolução CMN 4.963 / ANBIMA',
    notes: 'Títulos públicos federais, Debêntures incentivadas, CDBs',
  },
  {
    assetClass: 'Internacional',
    minPercent: 0,
    targetPercent: 15,
    maxPercent: 20,
    warningTolerancePP: 2.0,
    criticalTolerancePP: 5.0,
    warningTriggerPercent: 18.0,
    criticalTriggerPercent: 25.0,
    sourceDescription: 'Resolução CVM 175 Anexo I (Teto Geral 20%)',
    notes: 'ETFs globais, fundos offshore 332, ADRs',
  },
  {
    assetClass: 'Multimercado',
    minPercent: 0,
    targetPercent: 10,
    maxPercent: 15,
    warningTolerancePP: 2.0,
    criticalTolerancePP: 3.0,
    warningTriggerPercent: 13.0,
    criticalTriggerPercent: 18.0,
    sourceDescription: 'Diretriz Interna de Risco & Alocação',
    notes: 'Fundos Macro, Quantitativos, Long & Short',
  },
  {
    assetClass: 'Caixa',
    minPercent: 2,
    targetPercent: 5,
    maxPercent: 10,
    warningTolerancePP: 1.0,
    criticalTolerancePP: 2.0,
    warningTriggerPercent: 9.0,
    criticalTriggerPercent: 12.0,
    sourceDescription: 'Gestão de Liquidez & Disponibilidades',
    notes: 'Operações compromissadas overnight, CDI diário',
  },
];

export const LimitsConfigurationView: React.FC<LimitsConfigurationViewProps> = ({
  portfolios,
  onUpdateLimits,
  onResetLimits,
  currentAlerts = [],
}) => {
  const [configs, setConfigs] = useState<AssetClassThresholdConfig[]>(DEFAULT_CONFIGS);
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Inicializa configs a partir da carteira selecionada ou padrão global
  useEffect(() => {
    if (selectedScope === 'all') {
      // Puxa do primeiro portfólio ou default
      if (portfolios.length > 0 && portfolios[0].mandateLimits.length > 0) {
        const merged = DEFAULT_CONFIGS.map((def) => {
          const found = portfolios[0].mandateLimits.find((m) => m.assetClass === def.assetClass);
          if (found) {
            return {
              assetClass: def.assetClass,
              minPercent: found.minPercent,
              targetPercent: found.targetPercent,
              maxPercent: found.maxPercent,
              warningTolerancePP: found.warningTolerancePP ?? def.warningTolerancePP,
              criticalTolerancePP: found.criticalTolerancePP ?? found.tolerancePP ?? def.criticalTolerancePP,
              warningTriggerPercent:
                found.warningTriggerPercent ?? (found.maxPercent - (found.warningTolerancePP ?? 2.0)),
              criticalTriggerPercent:
                found.criticalTriggerPercent ?? (found.maxPercent + (found.tolerancePP ?? 5.0)),
              sourceDescription: def.sourceDescription,
              notes: def.notes,
            };
          }
          return def;
        });
        setConfigs(merged);
      }
    } else {
      const port = portfolios.find((p) => p.id === selectedScope);
      if (port && port.mandateLimits.length > 0) {
        const portConfigs = DEFAULT_CONFIGS.map((def) => {
          const found = port.mandateLimits.find((m) => m.assetClass === def.assetClass);
          if (found) {
            return {
              assetClass: def.assetClass,
              minPercent: found.minPercent,
              targetPercent: found.targetPercent,
              maxPercent: found.maxPercent,
              warningTolerancePP: found.warningTolerancePP ?? def.warningTolerancePP,
              criticalTolerancePP: found.criticalTolerancePP ?? found.tolerancePP ?? def.criticalTolerancePP,
              warningTriggerPercent:
                found.warningTriggerPercent ?? (found.maxPercent - (found.warningTolerancePP ?? 2.0)),
              criticalTriggerPercent:
                found.criticalTriggerPercent ?? (found.maxPercent + (found.tolerancePP ?? 5.0)),
              sourceDescription: def.sourceDescription,
              notes: def.notes,
            };
          }
          return def;
        });
        setConfigs(portConfigs);
      }
    }
  }, [selectedScope, portfolios]);

  // Altera um campo específico de uma classe de ativos
  const handleConfigChange = (
    assetClass: AssetClass,
    field: keyof AssetClassThresholdConfig,
    value: number
  ) => {
    setConfigs((prev) =>
      prev.map((item) => {
        if (item.assetClass !== assetClass) return item;

        const updated = { ...item, [field]: value };

        // Sincroniza campos dependentes para consistência visual imediata
        if (field === 'maxPercent' || field === 'warningTolerancePP') {
          const max = field === 'maxPercent' ? value : updated.maxPercent;
          const warnTol = field === 'warningTolerancePP' ? value : updated.warningTolerancePP;
          updated.warningTriggerPercent = Math.max(0, Math.round((max - warnTol) * 10) / 10);
        }
        if (field === 'maxPercent' || field === 'criticalTolerancePP') {
          const max = field === 'maxPercent' ? value : updated.maxPercent;
          const critTol = field === 'criticalTolerancePP' ? value : updated.criticalTolerancePP;
          updated.criticalTriggerPercent = Math.round((max + critTol) * 10) / 10;
        }
        if (field === 'warningTriggerPercent') {
          updated.warningTolerancePP = Math.max(0, Math.round((updated.maxPercent - value) * 10) / 10);
        }
        if (field === 'criticalTriggerPercent') {
          updated.criticalTolerancePP = Math.max(0, Math.round((value - updated.maxPercent) * 10) / 10);
        }

        return updated;
      })
    );
  };

  // Aplica Presets Regulatórios / de Mercado
  const applyPreset = (presetName: 'cvm175' | 'anbima' | 'high_tolerance') => {
    if (presetName === 'cvm175') {
      // Sensibilidade estrita: Warning imediato a 1 p.p., Critical com 3 p.p.
      setConfigs((prev) =>
        prev.map((c) => ({
          ...c,
          warningTolerancePP: 1.0,
          criticalTolerancePP: 3.0,
          warningTriggerPercent: Math.max(0, Math.round((c.maxPercent - 1.0) * 10) / 10),
          criticalTriggerPercent: Math.round((c.maxPercent + 3.0) * 10) / 10,
        }))
      );
    } else if (presetName === 'anbima') {
      // Padrão de mercado: Warning a 2 p.p., Critical a 5 p.p.
      setConfigs((prev) =>
        prev.map((c) => ({
          ...c,
          warningTolerancePP: 2.0,
          criticalTolerancePP: 5.0,
          warningTriggerPercent: Math.max(0, Math.round((c.maxPercent - 2.0) * 10) / 10),
          criticalTriggerPercent: Math.round((c.maxPercent + 5.0) * 10) / 10,
        }))
      );
    } else if (presetName === 'high_tolerance') {
      // Tolerância ampla para private wealth: Warning a 3 p.p., Critical a 8 p.p.
      setConfigs((prev) =>
        prev.map((c) => ({
          ...c,
          warningTolerancePP: 3.0,
          criticalTolerancePP: 8.0,
          warningTriggerPercent: Math.max(0, Math.round((c.maxPercent - 3.0) * 10) / 10),
          criticalTriggerPercent: Math.round((c.maxPercent + 8.0) * 10) / 10,
        }))
      );
    }
  };

  // Simulação de Impacto em Tempo Real
  // Avalia quantas carteiras ficariam em Warning e Critical com as configs atuais
  const impactSimulation = useMemo(() => {
    let projectedCritical = 0;
    let projectedWarning = 0;

    // Clona as carteiras para teste sandbox em memória
    const targetPortfolios = selectedScope === 'all'
      ? portfolios
      : portfolios.filter((p) => p.id === selectedScope);

    for (const port of targetPortfolios) {
      // Cria cópia com os novos limites aplicados
      const clonedPort = JSON.parse(JSON.stringify(port)) as Portfolio;
      for (const cfg of configs) {
        const limit = clonedPort.mandateLimits.find((l) => l.assetClass === cfg.assetClass);
        if (limit) {
          limit.minPercent = cfg.minPercent;
          limit.targetPercent = cfg.targetPercent;
          limit.maxPercent = cfg.maxPercent;
          limit.warningTolerancePP = cfg.warningTolerancePP;
          limit.criticalTolerancePP = cfg.criticalTolerancePP;
          limit.tolerancePP = cfg.criticalTolerancePP;
          limit.warningTriggerPercent = cfg.warningTriggerPercent;
          limit.criticalTriggerPercent = cfg.criticalTriggerPercent;
        }
      }

      const simulatedAlerts = ComplianceAgent.evaluatePortfolio(clonedPort);
      for (const a of simulatedAlerts) {
        if (a.severity === 'CRITICAL') projectedCritical++;
        else if (a.severity === 'WARNING') projectedWarning++;
      }
    }

    const currentCritical = currentAlerts.filter((a) => a.severity === 'CRITICAL').length;
    const currentWarning = currentAlerts.filter((a) => a.severity === 'WARNING').length;

    return {
      currentCritical,
      currentWarning,
      projectedCritical,
      projectedWarning,
      diffCritical: projectedCritical - currentCritical,
      diffWarning: projectedWarning - currentWarning,
    };
  }, [configs, portfolios, selectedScope, currentAlerts]);

  // Salva no backend
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateLimits(configs, selectedScope === 'all' ? undefined : selectedScope);
      setSaveFeedback('Limites e parâmetros de alerta salvos com sucesso!');
      setTimeout(() => setSaveFeedback(null), 4000);
    } catch (e) {
      console.error('Erro ao salvar parâmetros:', e);
      setSaveFeedback('Erro ao persistir configurações. Tente novamente.');
      setTimeout(() => setSaveFeedback(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Restaura padrões regulatórios
  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onResetLimits();
      setConfigs(JSON.parse(JSON.stringify(DEFAULT_CONFIGS)));
      setSaveFeedback('Parâmetros restaurados para os padrões regulatórios (CVM 175 & ANBIMA).');
      setTimeout(() => setSaveFeedback(null), 4000);
    } catch (e) {
      console.error('Erro ao restaurar padrões:', e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div id="limits-configuration-view" className="space-y-6">
      {/* Header Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Configuração de Limites &amp; Tolerâncias de Risco
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    CVM 175 &amp; ANBIMA
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calibração manual dos percentuais que disparam os alertas de Warning (Atenção) e Critical (Desenquadramento) por classe de ativos.
                </p>
              </div>
            </div>
          </div>

          {/* Scope Selector & Quick Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Escopo:</span>
              <select
                id="limit-scope-selector"
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="bg-slate-900 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Todas as Carteiras (Diretriz Global)</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.clientName})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
              title="Salvar alterações e recalcular alertas em tempo real"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Gravando...' : 'Salvar Limites'}</span>
            </button>

            <button
              onClick={handleReset}
              disabled={isResetting}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Restaurar valores de referência regulatórios"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Padrões</span>
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {saveFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{saveFeedback}</span>
            </div>
          </div>
        )}

        {/* Presets & Impact Simulator Ribbon */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Modelos Pré-definidos:</span>
            <button
              onClick={() => applyPreset('cvm175')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              🏛️ CVM 175 Estrito
            </button>
            <button
              onClick={() => applyPreset('anbima')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              📊 Padrão ANBIMA
            </button>
            <button
              onClick={() => applyPreset('high_tolerance')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              ⚡ Alta Tolerância (Family Office)
            </button>
          </div>

          {/* Live Impact Preview */}
          <div className="flex items-center gap-3 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Impacto Projetado:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-slate-300">
                Críticos:{' '}
                <strong className="text-rose-400 font-mono font-bold">
                  {impactSimulation.projectedCritical}
                </strong>
                {impactSimulation.diffCritical !== 0 && (
                  <span
                    className={`ml-1 text-[10px] font-mono ${
                      impactSimulation.diffCritical > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    ({impactSimulation.diffCritical > 0 ? `+${impactSimulation.diffCritical}` : impactSimulation.diffCritical})
                  </span>
                )}
              </span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-300">
                Warning:{' '}
                <strong className="text-amber-400 font-mono font-bold">
                  {impactSimulation.projectedWarning}
                </strong>
                {impactSimulation.diffWarning !== 0 && (
                  <span
                    className={`ml-1 text-[10px] font-mono ${
                      impactSimulation.diffWarning > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    ({impactSimulation.diffWarning > 0 ? `+${impactSimulation.diffWarning}` : impactSimulation.diffWarning})
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda Explicativa de Zonas */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-300">
            <strong>Como funcionam os limites:</strong> O nível <strong>Warning</strong> sinaliza proximidade da fronteira de risco; o nível <strong>Critical</strong> indica violação material que exige intervenção e rebalanceamento formal.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Normal (Em conformidade)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-300">Warning (Gatilho de Atenção)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-slate-300">Critical (Desenquadramento)</span>
          </div>
        </div>
      </div>

      {/* Grid de Configuração por Classe de Ativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configs.map((cfg) => {
          const details = ASSET_CLASS_DETAILS[cfg.assetClass];
          const Icon = details.icon;

          // Calcula percentuais das faixas para a barra visual
          // Barra de 0 a 100%
          const minW = Math.max(0, cfg.minPercent);
          const warnThreshold = cfg.warningTriggerPercent ?? (cfg.maxPercent - cfg.warningTolerancePP);
          const critThreshold = cfg.criticalTriggerPercent ?? (cfg.maxPercent + cfg.criticalTolerancePP);

          return (
            <div
              key={cfg.assetClass}
              id={`limit-card-${cfg.assetClass.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-5 transition"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${details.bgColor} border ${details.borderColor}`}>
                    <Icon className={`w-5 h-5 ${details.color}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {cfg.assetClass}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{details.description}</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-slate-400 border border-slate-800">
                  {details.normativeBase}
                </span>
              </div>

              {/* VISUAL SPECTRUM / ZONAS BAR */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Espectro de Alocação &amp; Gatilhos</span>
                  <span className="text-cyan-400 font-bold">
                    Teto Max: {cfg.maxPercent.toFixed(1)}%
                  </span>
                </div>

                {/* Multi-segmented Visual Bar */}
                <div className="relative w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                  {/* Normal/Safe zone */}
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, warnThreshold))}%` }}
                    className="h-full bg-emerald-500/40 border-r border-emerald-400/50"
                    title={`Zona Normal (0% a ${warnThreshold.toFixed(1)}%)`}
                  />
                  {/* Warning zone */}
                  <div
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100 - warnThreshold, critThreshold - warnThreshold)
                      )}%`,
                    }}
                    className="h-full bg-amber-500/50 border-r border-amber-400/60"
                    title={`Zona Warning (${warnThreshold.toFixed(1)}% a ${critThreshold.toFixed(1)}%)`}
                  />
                  {/* Critical zone */}
                  <div
                    style={{
                      width: `${Math.max(0, 100 - Math.min(100, critThreshold))}%`,
                    }}
                    className="h-full bg-rose-500/60"
                    title={`Zona Crítica (> ${critThreshold.toFixed(1)}%)`}
                  />
                </div>

                {/* Legendas de Marcadores Numéricos na Barra */}
                <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
                  <span className="text-emerald-400 font-semibold">
                    Seguro: &lt; {warnThreshold.toFixed(1)}%
                  </span>
                  <span className="text-amber-400 font-semibold">
                    Warning: ≥ {warnThreshold.toFixed(1)}%
                  </span>
                  <span className="text-rose-400 font-semibold">
                    Critical: ≥ {critThreshold.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* CONTROLES NUMÉRICOS & SLIDERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* 1. GATILHO WARNING */}
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-amber-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Gatilho Warning</span>
                    </div>
                    <span className="text-amber-400 font-mono font-bold text-xs bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                      {warnThreshold.toFixed(1)}%
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight">
                    Dispara alerta de <strong>Atenção</strong> quando a exposição atingir este percentual.
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Percentual de disparo:</span>
                      <span className="font-mono text-slate-300 font-bold">{warnThreshold.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min={Math.max(1, cfg.minPercent)}
                      max={cfg.maxPercent}
                      step={0.5}
                      value={warnThreshold}
                      onChange={(e) =>
                        handleConfigChange(
                          cfg.assetClass,
                          'warningTriggerPercent',
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Tolerância de proximidade em p.p. */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] text-[10px]">
                    <span className="text-slate-400">Margem antes do teto:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={15}
                        step={0.5}
                        value={cfg.warningTolerancePP}
                        onChange={(e) =>
                          handleConfigChange(
                            cfg.assetClass,
                            'warningTolerancePP',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-amber-300 text-[11px] focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-slate-500 font-mono">p.p.</span>
                    </div>
                  </div>
                </div>

                {/* 2. GATILHO CRITICAL */}
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-rose-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Gatilho Critical</span>
                    </div>
                    <span className="text-rose-400 font-mono font-bold text-xs bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
                      {critThreshold.toFixed(1)}%
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight">
                    Dispara alerta <strong>Crítico</strong> exigindo rebalanceamento fiduciário imediato.
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Percentual de disparo:</span>
                      <span className="font-mono text-slate-300 font-bold">{critThreshold.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min={cfg.maxPercent}
                      max={cfg.maxPercent + 15}
                      step={0.5}
                      value={critThreshold}
                      onChange={(e) =>
                        handleConfigChange(
                          cfg.assetClass,
                          'criticalTriggerPercent',
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Tolerância de excesso em p.p. */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] text-[10px]">
                    <span className="text-slate-400">Excesso tolerado:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0.5}
                        max={20}
                        step={0.5}
                        value={cfg.criticalTolerancePP}
                        onChange={(e) =>
                          handleConfigChange(
                            cfg.assetClass,
                            'criticalTolerancePP',
                            parseFloat(e.target.value) || 0.5
                          )
                        }
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-rose-300 text-[11px] focus:outline-none focus:border-rose-500"
                      />
                      <span className="text-slate-500 font-mono">p.p.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIMITES BASE DA CARTEIRA: MIN / META / MAX */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Limites Estruturais de Mandato IPS (% do Patrimônio Líquido):
                </span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Piso Mínimo</span>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <input
                        type="number"
                        min={0}
                        max={cfg.targetPercent}
                        step={1}
                        value={cfg.minPercent}
                        onChange={(e) =>
                          handleConfigChange(
                            cfg.assetClass,
                            'minPercent',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono font-bold text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-slate-500 font-mono text-xs">%</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Meta Alvo</span>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <input
                        type="number"
                        min={cfg.minPercent}
                        max={cfg.maxPercent}
                        step={1}
                        value={cfg.targetPercent}
                        onChange={(e) =>
                          handleConfigChange(
                            cfg.assetClass,
                            'targetPercent',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono font-bold text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
                      />
                      <span className="text-slate-500 font-mono text-xs">%</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Teto Máximo</span>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <input
                        type="number"
                        min={cfg.targetPercent}
                        max={100}
                        step={1}
                        value={cfg.maxPercent}
                        onChange={(e) =>
                          handleConfigChange(
                            cfg.assetClass,
                            'maxPercent',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono font-bold text-rose-300 text-xs focus:outline-none focus:border-rose-500"
                      />
                      <span className="text-slate-500 font-mono text-xs">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUADRO DE GOVERNANÇA & REGISTRO DE TRILHA DE AUDITORIA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Governança Regulatória &amp; Trilha de Auditoria (Compliance Audit Trail)
          </h4>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          As parametrizações manuais de limites e sensibilidade de alerta têm reflexo direto no monitoramento contínuo de mandatos fiduciários. Qualquer alteração que afrouxe tolerâncias acima dos tetos estipulados pela <strong>Resolução CVM 175 (Anexo I)</strong> ou pela <strong>Resolução CMN nº 4.963/2021</strong> para investidores institucionais e RPPS não anula a exigência legal de desenquadramento passivo no prazo regulamentar.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1 font-mono">
          <span>• Protocolo Normativo: AUD-PARAM-2026</span>
          <span>• Versão do Algoritmo: FlowCore Sentinel v1.4</span>
          <span>• Auditoria: Registro em log assinado digitalmente</span>
        </div>
      </div>
    </div>
  );
};
