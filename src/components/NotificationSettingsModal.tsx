import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Smartphone,
  Volume2,
  VolumeX,
  BellRing,
  Check,
  Send,
  Trash2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Info,
  RefreshCw,
} from 'lucide-react';
import { NotificationChannelSettings, SecondaryDispatchLog } from '../types';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationChannelSettings;
  onSaveSettings: (newSettings: NotificationChannelSettings) => Promise<void>;
  dispatchLogs: SecondaryDispatchLog[];
  onRefreshLogs: () => Promise<void>;
  onClearLogs: () => Promise<void>;
  onTestDispatch: (channel: 'EMAIL' | 'SMS' | 'ALL', recipient?: string) => Promise<{ success: boolean; message: string }>;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings: initialSettings,
  onSaveSettings,
  dispatchLogs,
  onRefreshLogs,
  onClearLogs,
  onTestDispatch,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'CHANNELS' | 'LOGS'>('CHANNELS');
  const [settings, setSettings] = useState<NotificationChannelSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingChannel, setTestingChannel] = useState<'EMAIL' | 'SMS' | 'ALL' | null>(null);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Falha ao salvar configurações:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (channel: 'EMAIL' | 'SMS' | 'ALL') => {
    setTestingChannel(channel);
    setTestFeedback(null);
    try {
      const recipient =
        channel === 'EMAIL'
          ? settings.email.recipient
          : channel === 'SMS'
          ? settings.sms.phoneNumber
          : undefined;
      const res = await onTestDispatch(channel, recipient);
      setTestFeedback(res.message);
      await onRefreshLogs();
      setTimeout(() => setTestFeedback(null), 5000);
    } catch (err) {
      setTestFeedback('Falha ao despachar notificação de teste.');
    } finally {
      setTestingChannel(null);
    }
  };

  return (
    <div
      id="notification-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Canais Secundários de Alerta
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Sentinel CVM 175
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure notificações automáticas via E-mail e SMS para desenquadramentos críticos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-5 pt-2">
          <button
            onClick={() => setActiveSubTab('CHANNELS')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeSubTab === 'CHANNELS'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Configurações dos Canais</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
              {(settings.email.enabled ? 1 : 0) + (settings.sms.enabled ? 1 : 0)} ativos
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('LOGS');
              onRefreshLogs();
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeSubTab === 'LOGS'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Histórico de Despachos</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
              {dispatchLogs.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {testFeedback && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{testFeedback}</span>
              </div>
              <button
                onClick={() => setTestFeedback(null)}
                className="text-emerald-400 hover:text-emerald-200 text-[11px]"
              >
                Fechar
              </button>
            </div>
          )}

          {activeSubTab === 'CHANNELS' ? (
            <>
              {/* Channel 1: E-MAIL */}
              <div
                className={`p-4 rounded-xl border transition ${
                  settings.email.enabled
                    ? 'bg-slate-900/90 border-slate-700'
                    : 'bg-slate-950/40 border-slate-800 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                        settings.email.enabled
                          ? 'bg-sky-500/20 border-sky-500/30 text-sky-400'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Alertas via E-mail
                        {settings.email.enabled && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            ATIVO
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Dispara comunicados detalhados de violação regulatória para o e-mail cadastrado
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.email.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, enabled: e.target.checked },
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {settings.email.enabled && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        E-mail de Destino do Gestor / Compliance:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={settings.email.recipient}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, recipient: e.target.value },
                            })
                          }
                          placeholder="gestor@asset.com.br"
                          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          onClick={() => handleTest('EMAIL')}
                          disabled={testingChannel === 'EMAIL'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer disabled:opacity-50"
                          title="Disparar e-mail de teste agora"
                        >
                          <Send className={`w-3 h-3 ${testingChannel === 'EMAIL' ? 'animate-spin' : ''}`} />
                          <span>{testingChannel === 'EMAIL' ? 'Enviando...' : 'Testar E-mail'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email.sendOnCriticalOnly}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, sendOnCriticalOnly: e.target.checked },
                            })
                          }
                          className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Notificar apenas para desenquadramentos de severidade <strong>CRÍTICA</strong></span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email.includeReportAttachment}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, includeReportAttachment: e.target.checked },
                            })
                          }
                          className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="flex items-center gap-1">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Incluir sumário da carteira em anexo CSV (UTF-8)</span>
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Channel 2: SMS */}
              <div
                className={`p-4 rounded-xl border transition ${
                  settings.sms.enabled
                    ? 'bg-slate-900/90 border-slate-700'
                    : 'bg-slate-950/40 border-slate-800 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                        settings.sms.enabled
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Alertas via SMS
                        {settings.sms.enabled && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ATIVO
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Mensagens instantâneas de texto no celular com resumo de desvio e excesso financeiro
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.sms.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sms: { ...settings.sms, enabled: e.target.checked },
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {settings.sms.enabled && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Número de Celular com DDD / DDI:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={settings.sms.phoneNumber}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sms: { ...settings.sms, phoneNumber: e.target.value },
                            })
                          }
                          placeholder="+55 (11) 98765-4321"
                          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          onClick={() => handleTest('SMS')}
                          disabled={testingChannel === 'SMS'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer disabled:opacity-50"
                          title="Disparar SMS de teste agora"
                        >
                          <Send className={`w-3 h-3 ${testingChannel === 'SMS' ? 'animate-spin' : ''}`} />
                          <span>{testingChannel === 'SMS' ? 'Enviando...' : 'Testar SMS'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.sms.sendOnCriticalOnly}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sms: { ...settings.sms, sendOnCriticalOnly: e.target.checked },
                            })
                          }
                          className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Notificar apenas para desenquadramentos de severidade <strong>CRÍTICA</strong></span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* In-App Audio & Visual summary banner */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Sinal Sonoro no Terminal:</span>
                    <p className="text-[11px] text-slate-400">Duplo tom harmônico em novos desenquadramentos</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                  Habilitado
                </span>
              </div>
            </>
          ) : (
            /* Tab 2: Dispatch Logs */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Registros de auditoria de disparos para canais secundários (E-mail e SMS)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onRefreshLogs}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1"
                    title="Atualizar registros"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Atualizar</span>
                  </button>
                  {dispatchLogs.length > 0 && (
                    <button
                      onClick={onClearLogs}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition text-xs flex items-center gap-1"
                      title="Limpar histórico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>
              </div>

              {dispatchLogs.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                  <Info className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Nenhum despacho secundário registrado até o momento.</p>
                  <button
                    onClick={() => handleTest('ALL')}
                    className="mt-2 text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    Disparar teste de verificação
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {dispatchLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.channel === 'EMAIL'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {log.channel}
                          </span>
                          <span className="font-mono text-slate-300">{log.recipient}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {log.sentAt}
                        </span>
                      </div>

                      <p className="font-semibold text-slate-200">{log.subjectOrTitle}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{log.bodyPreview}</p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                        <span className="text-slate-400">{log.portfolioName || 'Monitoramento Geral'}</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Entregue
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={() => handleTest('ALL')}
            disabled={testingChannel !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Envia teste imediato para todos os canais configurados"
          >
            <Send className={`w-3.5 h-3.5 ${testingChannel === 'ALL' ? 'animate-spin' : ''}`} />
            <span>{testingChannel === 'ALL' ? 'Enviando...' : 'Testar Todos os Canais'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              id="save-notification-settings-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Salvo!</span>
                </>
              ) : (
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
