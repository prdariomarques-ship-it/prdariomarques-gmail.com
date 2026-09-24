import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  X,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Trash2,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  Clock,
} from 'lucide-react';
import { MarketAsset } from '../../data/wealthCopilotData';
import { PriceAlert, PriceAlertType, parseAssetPrice, formatAssetPrice } from '../../utils/priceAlerts';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAsset: MarketAsset | null;
  allAssets: MarketAsset[];
  alerts: PriceAlert[];
  onAddAlert: (params: {
    ticker: string;
    assetName: string;
    targetPrice: number;
    initialPrice: number;
    type: PriceAlertType;
    note?: string;
    soundEnabled?: boolean;
  }) => void;
  onRemoveAlert: (id: string) => void;
  onToggleAlertActive: (id: string) => void;
  onResetAlert: (id: string) => void;
  onSimulateTrigger: (ticker: string) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  selectedAsset,
  allAssets,
  alerts,
  onAddAlert,
  onRemoveAlert,
  onToggleAlertActive,
  onResetAlert,
  onSimulateTrigger,
}) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'LIST'>('NEW');
  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [alertType, setAlertType] = useState<PriceAlertType>('TAKE_PROFIT');
  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ativo atualmente selecionado para criação do alerta
  const asset = useMemo(() => {
    if (currentTicker) {
      const found = allAssets.find((a) => a.ticker.toUpperCase() === currentTicker.toUpperCase());
      if (found) return found;
    }
    return selectedAsset || allAssets[0] || null;
  }, [currentTicker, selectedAsset, allAssets]);

  const currentPriceNumeric = useMemo(() => {
    return asset ? parseAssetPrice(asset.value) : 0;
  }, [asset]);

  // Sincroniza ticker quando modal abre ou selectedAsset muda
  useEffect(() => {
    if (selectedAsset) {
      setCurrentTicker(selectedAsset.ticker);
    } else if (allAssets.length > 0 && !currentTicker) {
      setCurrentTicker(allAssets[0].ticker);
    }
  }, [selectedAsset, allAssets]);

  // Recalcula o preço-alvo sugerido quando o tipo ou ativo muda
  useEffect(() => {
    if (currentPriceNumeric > 0) {
      const defaultDeltaPct = alertType === 'TAKE_PROFIT' ? 0.03 : -0.03;
      const suggested = currentPriceNumeric * (1 + defaultDeltaPct);
      setTargetPriceInput(formatDefaultTargetInput(suggested, asset?.unit));
    }
  }, [alertType, currentPriceNumeric, asset?.unit]);

  if (!isOpen || !asset) return null;

  function formatDefaultTargetInput(num: number, unit?: string): string {
    if (num >= 1000) {
      return Math.round(num).toString();
    }
    return num.toFixed(2);
  }

  // Atalhos percentuais rápidos
  const applyQuickDelta = (deltaPct: number) => {
    if (!currentPriceNumeric) return;
    const calculated = currentPriceNumeric * (1 + deltaPct / 100);
    setTargetPriceInput(formatDefaultTargetInput(calculated, asset.unit));
    if (deltaPct > 0) {
      setAlertType('TAKE_PROFIT');
    } else {
      setAlertType('STOP_LOSS');
    }
  };

  const parsedTargetPrice = parseFloat(targetPriceInput.replace(',', '.'));
  const isInputValid = !isNaN(parsedTargetPrice) && parsedTargetPrice > 0;

  // Variação calculada entre preço atual e alvo
  const deltaFromCurrent = isInputValid && currentPriceNumeric > 0
    ? ((parsedTargetPrice - currentPriceNumeric) / currentPriceNumeric) * 100
    : 0;

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInputValid || !asset) return;

    onAddAlert({
      ticker: asset.ticker,
      assetName: asset.name,
      targetPrice: parsedTargetPrice,
      initialPrice: currentPriceNumeric,
      type: alertType,
      note: note.trim() || undefined,
      soundEnabled,
    });

    setSuccessMessage(`Alerta de ${alertType === 'TAKE_PROFIT' ? 'Take-Profit' : 'Stop-Loss'} ativo para ${asset.ticker}!`);
    setTimeout(() => {
      setSuccessMessage(null);
      setActiveTab('LIST');
    }, 1200);
  };

  // Alertas deste ativo e globais
  const assetAlerts = alerts.filter((a) => a.ticker.toUpperCase() === asset.ticker.toUpperCase());
  const activeAlertsCount = alerts.filter((a) => a.active && !a.triggered).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Configurar Alerta de Preço</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold font-mono">
                  Stop-Loss / Take-Profit
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Vigilância contínua no Market Ticker com disparos in-app imediatos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas: Novo Alerta vs Meus Alertas */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('NEW')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'NEW'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Novo Alerta
          </button>
          <button
            onClick={() => setActiveTab('LIST')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'LIST'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>Alertas Cadastrados</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {alerts.length}
            </span>
          </button>
        </div>

        {/* Conteúdo da Aba NOVO ALERTA */}
        {activeTab === 'NEW' && (
          <form onSubmit={handleSaveAlert} className="p-6 space-y-4">
            {/* Seletor de Ativo do Ticker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Ativo do Feed de Mercado
              </label>
              <select
                value={asset.ticker}
                onChange={(e) => setCurrentTicker(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-hidden focus:border-cyan-500 transition"
              >
                {allAssets.map((a) => (
                  <option key={a.ticker} value={a.ticker}>
                    {a.ticker} • {a.name} ({a.category}) — {a.value} {a.unit || ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Card com Cotação Atual */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Cotação ao Vivo
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-black text-white font-mono font-bold">
                    {asset.value}
                    {asset.unit && <span className="text-xs text-slate-400 ml-1">{asset.unit}</span>}
                  </span>
                  <span
                    className={`inline-flex items-center text-xs font-bold font-mono ${
                      asset.isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {asset.isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                    )}
                    {asset.change}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Categoria</span>
                <span className="text-xs font-bold text-cyan-300 font-mono">{asset.category}</span>
              </div>
            </div>

            {/* Tipo de Alerta: Take-Profit vs Stop-Loss */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Estratégia do Gatilho
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAlertType('TAKE_PROFIT')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    alertType === 'TAKE_PROFIT'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      Take-Profit
                    </span>
                    {alertType === 'TAKE_PROFIT' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-300 mt-1">
                    Dispara quando o preço subir para &ge; alvo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAlertType('STOP_LOSS')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    alertType === 'STOP_LOSS'
                      ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4" />
                      Stop-Loss
                    </span>
                    {alertType === 'STOP_LOSS' && (
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-300 mt-1">
                    Dispara quando o preço cair para &le; limite
                  </span>
                </button>
              </div>
            </div>

            {/* Preço Alvo e Variação */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Preço Limite do Alerta
                </label>
                {isInputValid && (
                  <span
                    className={`text-xs font-mono font-bold ${
                      deltaFromCurrent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {deltaFromCurrent > 0 ? `+${deltaFromCurrent.toFixed(2)}%` : `${deltaFromCurrent.toFixed(2)}%`}{' '}
                    vs preço atual
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={targetPriceInput}
                  onChange={(e) => setTargetPriceInput(e.target.value)}
                  placeholder="Ex: 130000 ou 5.75"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-hidden focus:border-cyan-500"
                  required
                />
              </div>

              {/* Botões de atalho percentuais rápidos */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">Atalhos:</span>
                {[-10, -5, -2, 2, 5, 10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyQuickDelta(pct)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                      pct < 0
                        ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Nota Operacional / Estratégia de Portfólio */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Anotação Fiduciária / Ação no Portfólio (Opcional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Rebalancear mandatos moderados se romper resistência"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {/* Toggle de Som */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span className="text-xs text-slate-300 font-medium">Aviso sonoro no disparo</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition cursor-pointer ${
                  soundEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* Mensagem de sucesso */}
            {successMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isInputValid}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-cyan-950/40 transition flex items-center gap-2 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Ativar Alerta</span>
              </button>
            </div>
          </form>
        )}

        {/* Conteúdo da Aba LISTA DE ALERTAS */}
        {activeTab === 'LIST' && (
          <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Alertas Monitorados ({alerts.length})
              </span>
              <span className="text-[11px] text-slate-400">
                {activeAlertsCount} ativos • {alerts.length - activeAlertsCount} disparados/pausados
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Bell className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">Nenhum alerta cadastrado no momento.</p>
                <button
                  onClick={() => setActiveTab('NEW')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 text-xs font-bold hover:bg-cyan-600/30 transition cursor-pointer"
                >
                  Criar Primeiro Alerta
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((al) => {
                  const isTp = al.type === 'TAKE_PROFIT';
                  return (
                    <div
                      key={al.id}
                      className={`p-3.5 rounded-xl border transition ${
                        al.triggered
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : al.active
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-slate-950/50 border-slate-800/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                              isTp
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {isTp ? 'TAKE-PROFIT' : 'STOP-LOSS'}
                          </span>
                          <span className="text-sm font-bold text-white font-mono">{al.ticker}</span>
                          <span className="text-xs text-slate-400 truncate max-w-[120px]">
                            {al.assetName}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {al.triggered ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              DISPARADO
                            </span>
                          ) : al.active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              ATIVO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                              PAUSADO
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dados de Preço */}
                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Alvo</span>
                          <span className="font-bold text-white">
                            {formatAssetPrice(al.targetPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Atual</span>
                          <span className="font-semibold text-slate-300">
                            {formatAssetPrice(al.currentPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Distância</span>
                          <span
                            className={`font-semibold ${
                              al.targetPrice >= al.currentPrice ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {(
                              ((al.targetPrice - al.currentPrice) / (al.currentPrice || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      </div>

                      {al.note && (
                        <p className="text-[10px] text-slate-400 mt-1.5 italic">
                          Nota: {al.note}
                        </p>
                      )}

                      {/* Ações do Alerta */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/60 text-[10px]">
                        <div className="flex items-center gap-2">
                          {al.triggered ? (
                            <button
                              onClick={() => onResetAlert(al.id)}
                              className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Reativar Monitoramento
                            </button>
                          ) : (
                            <button
                              onClick={() => onToggleAlertActive(al.id)}
                              className="text-slate-400 hover:text-white cursor-pointer"
                            >
                              {al.active ? 'Pausar' : 'Ativar'}
                            </button>
                          )}

                          {/* Botão de Teste / Simulação */}
                          {!al.triggered && (
                            <button
                              onClick={() => onSimulateTrigger(al.ticker)}
                              className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer font-medium ml-2"
                              title="Simular disparo imediato deste alerta para validação in-app"
                            >
                              <Zap className="w-3 h-3" />
                              Simular Disparo
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => onRemoveAlert(al.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                          title="Excluir alerta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
