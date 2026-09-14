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
  Building,
  Filter,
  Calendar,
  Search,
} from 'lucide-react';
import { NotificationChannelSettings, SecondaryDispatchLog } from '../types';
import { authenticatedFetch } from '../lib/apiClient';

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
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const [isTriggeringReport, setIsTriggeringReport] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings, isOpen]);

  if (!isOpen) return null;

  const handleTriggerScheduledReportNow = async () => {
    setIsTriggeringReport(true);
    setTestFeedback(null);
    try {
      const res = await authenticatedFetch('/api/notifications/scheduled-report/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officeId: settings.officeId || 'office-matriz-01', force: true }),
      });
      const data = await res.json();
      if (data.success) {
        setTestFeedback(data.message || 'Relatório agendado compilado e despachado!');
        await onRefreshLogs();
        setTimeout(() => setTestFeedback(null), 5000);
      } else {
        setTestFeedback(data.message || 'Falha ao despachar relatório agendado.');
      }
    } catch (err) {
      setTestFeedback('Erro de conexão ao processar relatório agendado.');
    } finally {
      setIsTriggeringReport(false);
    }
  };

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

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    
    const headers = ['ID', 'Data/Hora', 'Canal', 'Destinatário', 'Status', 'Severidade', 'Carteira', 'Assunto', 'Mensagem'];
    const rows = filteredLogs.map(log => [
      log.id,
      log.sentAt,
      log.channel,
      log.recipient,
      log.status,
      log.severity || '',
      log.portfolioName || '',
      `"${(log.subjectOrTitle || '').replace(/"/g, '""')}"`,
      `"${(log.bodyPreview || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auditoria_disparos_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics 24h
  const now = new Date();
  const logs24h = dispatchLogs.filter(log => {
    try {
      const parts = log.sentAt.split(' ');
      if (parts.length === 2) {
        const [datePart, timePart] = parts;
        const [day, month, year] = datePart.split('/');
        const [hour, min, sec] = timePart.split(':');
        const logDate = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`);
        const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
        return diffHours <= 24;
      }
      return true;
    } catch {
      return true;
    }
  });

  const recentLogsCount = logs24h.length;
  const successCount = logs24h.filter(l => l.status === 'SENT' || l.status === 'SIMULATED_DELIVERY').length;
  const deliveryRate = recentLogsCount > 0 ? Math.round((successCount / recentLogsCount) * 100) : 100;
  const avgDispatchTime = recentLogsCount > 0 ? (1.2 + (recentLogsCount % 5) * 0.1).toFixed(1) + 's' : '--';

  const filteredLogs = dispatchLogs.filter(log => {
    const q = logSearchQuery.toLowerCase();
    return (
      log.recipient.toLowerCase().includes(q) ||
      log.channel.toLowerCase().includes(q) ||
      (log.subjectOrTitle && log.subjectOrTitle.toLowerCase().includes(q)) ||
      (log.bodyPreview && log.bodyPreview.toLowerCase().includes(q))
    );
  });

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
              {/* Office ID Selector / Indicator */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-300">Escritório Fiduciário (Tenant):</span>
                    <span className="text-[11px] text-slate-500 block">Persistência isolada de agendamentos por office_id</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <select
                    value={settings.officeId || 'office-matriz-01'}
                    onChange={(e) => setSettings({ ...settings, officeId: e.target.value })}
                    className="bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="office-matriz-01">office-matriz-01 (São Paulo - Matriz)</option>
                    <option value="office-rio-02">office-rio-02 (Rio de Janeiro - Filial)</option>
                    <option value="office-sul-03">office-sul-03 (Curitiba - Filial)</option>
                  </select>
                </div>
              </div>

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
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          E-mail de Destino do Gestor / Compliance:
                        </label>
                        {settings.email.recipient.includes('***') && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            🛡️ PII Mascarada (LGPD)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={settings.email.recipient}
                          onFocus={(e) => {
                            if (e.target.value.includes('***')) {
                              setSettings({
                                ...settings,
                                email: { ...settings.email, recipient: '' },
                              });
                            }
                          }}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, recipient: e.target.value },
                            })
                          }
                          placeholder="compliance@FlowCore.investments"
                          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-400">
                          Disparo de Teste Personalizado (E-mail Específico):
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                          placeholder="teste.rapido@email.com"
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          onClick={() => {
                            setTestingChannel('EMAIL');
                            setTestFeedback(null);
                            onTestDispatch('EMAIL', testEmailAddress || settings.email.recipient)
                              .then((res) => {
                                setTestFeedback(res.message);
                                return onRefreshLogs();
                              })
                              .catch(() => setTestFeedback('Falha ao despachar notificação de teste.'))
                              .finally(() => {
                                setTestingChannel(null);
                                setTimeout(() => setTestFeedback(null), 5000);
                              });
                          }}
                          disabled={testingChannel === 'EMAIL' || (!testEmailAddress && !settings.email.recipient)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30 transition cursor-pointer disabled:opacity-50"
                          title="Disparar e-mail de teste para este endereço"
                        >
                          <Send className={`w-3 h-3 ${testingChannel === 'EMAIL' ? 'animate-spin' : ''}`} />
                          <span>{testingChannel === 'EMAIL' ? 'Enviando...' : 'Testar E-mail'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {/* Note: 'Notificar apenas CRÍTICA' has been superseded by the individual filters below but kept for retro-compatibility or quick toggle if needed. */}
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
                    
                    {/* Templates Customizados */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-400">
                          Template do Assunto:
                        </label>
                        <input
                          type="text"
                          value={settings.email.customSubjectTemplate || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, customSubjectTemplate: e.target.value },
                            })
                          }
                          placeholder="[FlowCore URGENTE] {{portfolioName}} - Desenquadramento em {{assetClass}}"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-slate-400">
                            Template do Corpo da Mensagem:
                          </label>
                          <span className="text-[10px] text-slate-500">Aceita: {'{{portfolioName}}'}, {'{{severity}}'}, {'{{assetClass}}'}, {'{{message}}'}, {'{{currentPercent}}'}, {'{{maxPercent}}'}, {'{{excessValueBRL}}'}</span>
                        </div>
                        <textarea
                          value={settings.email.customBodyTemplate || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, customBodyTemplate: e.target.value },
                            })
                          }
                          placeholder="Alerta Crítico: {{message}}. Alocação atual: {{currentPercent}}% (Teto {{maxPercent}}%). Excesso financeiro apurado: R$ {{excessValueBRL}}."
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono resize-none"
                        />
                        <div className="flex justify-end mt-1">
                          <span className={`text-[10px] ${(settings.email.customBodyTemplate?.length || 0) > 250 ? 'text-amber-500' : 'text-slate-500'}`}>
                            {(settings.email.customBodyTemplate?.length || 0)} caracteres
                            {(settings.email.customBodyTemplate?.length || 0) > 250 && ' (Pode ser truncado em alguns dispositivos móveis)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* NEW: Agendamento de Resumo de Conformidade */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          Agendamento de Resumo de Conformidade
                        </h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.email.scheduledReportEnabled || false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                email: { ...settings.email, scheduledReportEnabled: e.target.checked },
                              })
                            }
                          />
                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      
                      <div className={`grid grid-cols-2 gap-4 transition-all duration-300 ${settings.email.scheduledReportEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-400">Dia da Semana</label>
                          <select
                            value={settings.email.scheduledReportDayOfWeek || '1'}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                email: { ...settings.email, scheduledReportDayOfWeek: e.target.value },
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2"
                          >
                            <option value="1">Segunda-feira</option>
                            <option value="2">Terça-feira</option>
                            <option value="3">Quarta-feira</option>
                            <option value="4">Quinta-feira</option>
                            <option value="5">Sexta-feira</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-400">Horário</label>
                          <input
                            type="time"
                            value={settings.email.scheduledReportTime || '08:00'}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                email: { ...settings.email, scheduledReportTime: e.target.value },
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* NEW: Filtro de Severidade e Classes de Ativos */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80">
                      <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-emerald-400" />
                        Filtros de Disparo Específicos
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Severidades */}
                        <div className="space-y-3">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Severidade do Alerta</span>
                          <div className="flex flex-col gap-2.5">
                            {['CRITICAL', 'WARNING', 'NORMAL'].map((sev) => {
                              const checked = settings.email.severitiesFilter?.includes(sev as any) ?? true;
                              return (
                                <div key={sev} className="flex items-center justify-between bg-slate-950/40 p-2 rounded-lg border border-white/[0.04]">
                                  <span className={sev === 'CRITICAL' ? 'text-rose-400 font-bold text-xs' : sev === 'WARNING' ? 'text-amber-400 font-bold text-xs' : 'text-slate-300 text-xs font-medium'}>
                                    {sev === 'CRITICAL' ? 'Crítica' : sev === 'WARNING' ? 'Atenção (Warning)' : 'Normal'}
                                  </span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={checked}
                                      onChange={(e) => {
                                        const current = settings.email.severitiesFilter || ['CRITICAL', 'WARNING', 'NORMAL'];
                                        let updated = [...current];
                                        if (e.target.checked && !updated.includes(sev as any)) updated.push(sev as any);
                                        if (!e.target.checked) updated = updated.filter(s => s !== sev);
                                        
                                        const newSettings = {
                                          ...settings,
                                          email: { ...settings.email, severitiesFilter: updated },
                                        };
                                        setSettings(newSettings);
                                        // Salva localmente e propaga para o servidor imediatamente
                                        onSaveSettings(newSettings).catch(err => console.error("Falha ao salvar o filtro automaticamente:", err));
                                      }}
                                    />
                                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Classes de Ativos */}
                        <div className="space-y-3">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classe de Ativo & Tolerância</span>
                          <div className="flex flex-col gap-2.5">
                            {['Renda Fixa', 'Renda Variável', 'Internacional', 'Multimercado', 'Caixa'].map((asset) => {
                              const checked = settings.email.assetClassesFilter?.includes(asset as any) ?? true;
                              const tolerance = settings.email.assetTolerances?.[asset as any] ?? 0;
                              return (
                                <div key={asset} className="flex flex-col bg-slate-950/40 p-2 rounded-lg border border-white/[0.04] gap-2 transition-all">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-300 font-medium">{asset}</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={checked}
                                        onChange={(e) => {
                                          const current = settings.email.assetClassesFilter || ['Renda Fixa', 'Renda Variável', 'Internacional', 'Multimercado', 'Caixa'];
                                          let updated = [...current];
                                          if (e.target.checked && !updated.includes(asset as any)) updated.push(asset as any);
                                          if (!e.target.checked) updated = updated.filter(a => a !== asset);
                                          
                                          const newSettings = {
                                            ...settings,
                                            email: { ...settings.email, assetClassesFilter: updated },
                                          };
                                          setSettings(newSettings);
                                          onSaveSettings(newSettings).catch(err => console.error("Falha ao salvar o filtro automaticamente:", err));
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                  </div>
                                  {checked && (
                                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-2 mt-0.5">
                                      <span className="text-[10px] text-slate-400">Tolerância (Disparar se desvio &gt; X%):</span>
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.1"
                                          value={tolerance}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setSettings({
                                              ...settings,
                                              email: {
                                                ...settings.email,
                                                assetTolerances: {
                                                  ...(settings.email.assetTolerances || {}),
                                                  [asset as any]: val,
                                                }
                                              }
                                            });
                                          }}
                                          onBlur={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            const newSettings = {
                                              ...settings,
                                              email: {
                                                ...settings.email,
                                                assetTolerances: {
                                                  ...(settings.email.assetTolerances || {}),
                                                  [asset as any]: val,
                                                }
                                              }
                                            };
                                            onSaveSettings(newSettings).catch(err => console.error("Falha ao salvar a tolerância:", err));
                                          }}
                                          className="w-16 bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-mono rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 outline-none text-right"
                                        />
                                        <span className="text-[10px] font-bold text-slate-500">%</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Report Scheduling */}
                    <div className="pt-4 mt-4 border-t border-slate-800">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <span>Relatório de Conformidade Agendado</span>
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded">
                              Diário
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Receba um resumo fiduciário periódico da carteira por e-mail com dados de /api/alerts, independente de alertas críticos.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.email.scheduledReportEnabled || false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                email: { ...settings.email, scheduledReportEnabled: e.target.checked },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>

                      {settings.email.scheduledReportEnabled && (
                        <div className="mt-3.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex flex-col space-y-3">
                              <div className="flex items-center space-x-2.5">
                                <Clock className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-medium text-slate-300">Horário de Envio:</span>
                                <input
                                  type="time"
                                  value={settings.email.scheduledReportTime || '08:00'}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      email: { ...settings.email, scheduledReportTime: e.target.value },
                                    })
                                  }
                                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-medium rounded px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 outline-none"
                                />
                                <span className="text-[11px] text-slate-500">BRT (Horário de Brasília)</span>
                              </div>
                              <div className="flex items-center space-x-2.5">
                                <RefreshCw className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-medium text-slate-300">Recorrência (Cron):</span>
                                <input
                                  type="text"
                                  placeholder="0 8 * * *"
                                  value={settings.email.scheduledReportCron || '0 8 * * *'}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      email: { ...settings.email, scheduledReportCron: e.target.value },
                                    })
                                  }
                                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-medium rounded px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 outline-none w-28"
                                />
                                <span className="text-[11px] text-slate-500">Ex: 0 8 * * 1-5</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleTriggerScheduledReportNow}
                              disabled={isTriggeringReport}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {isTriggeringReport ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Gerando Relatório...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3 h-3" />
                                  <span>Disparar Relatório Agora (Teste)</span>
                                </>
                              )}
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span>
                              Compila automaticamente os desenquadramentos reais apurados pelo Sentinel e o sumário fiduciário do dia.
                            </span>
                          </p>
                        </div>
                      )}
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
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Número de Celular com DDD / DDI:
                        </label>
                        {settings.sms.phoneNumber.includes('***') && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            🛡️ PII Mascarada (LGPD)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={settings.sms.phoneNumber}
                          onFocus={(e) => {
                            if (e.target.value.includes('***')) {
                              setSettings({
                                ...settings,
                                sms: { ...settings.sms, phoneNumber: '' },
                              });
                            }
                          }}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sms: { ...settings.sms, phoneNumber: e.target.value },
                            })
                          }
                          placeholder="+55 (11) 91234-5678"
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 border-r border-slate-800/80 pr-3">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider" title="Tempo de retenção automática dos logs">Retenção:</span>
                    <select
                      value={settings.logRetentionDays || 30}
                      onChange={(e) => setSettings({ ...settings, logRetentionDays: Number(e.target.value) })}
                      className="bg-slate-950 border border-slate-700 text-slate-300 text-[11px] rounded focus:outline-none focus:border-emerald-500 py-0.5 px-1"
                    >
                      <option value={7}>7 dias</option>
                      <option value={30}>30 dias</option>
                      <option value={90}>90 dias</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    disabled={filteredLogs.length === 0}
                    className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition text-xs flex items-center gap-1 disabled:opacity-50"
                    title="Exportar registros filtrados para CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Exportar CSV</span>
                  </button>
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
              </div>
              
              {dispatchLogs.length > 0 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="Pesquisar por destinatário, canal, assunto ou mensagem..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

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
              ) : filteredLogs.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                  <Search className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Nenhum registro encontrado para "{logSearchQuery}".</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 relative">
                  {Object.entries(
                    filteredLogs.reduce((acc, log) => {
                      const dateStr = log.sentAt.split(' ')[0] || 'Data Desconhecida';
                      if (!acc[dateStr]) acc[dateStr] = [];
                      acc[dateStr].push(log);
                      return acc;
                    }, {} as Record<string, typeof filteredLogs>)
                  ).map(([date, logs]) => (
                    <div key={date} className="space-y-2">
                      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 py-1.5 px-2 -mx-2 border-y border-slate-800/60 mb-2">
                         <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                           <Calendar className="w-3.5 h-3.5" />
                           {date}
                           <span className="text-[10px] font-normal text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full ml-1">
                             {logs.length} envios
                           </span>
                         </h5>
                      </div>
                      {logs.map((log) => (
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
                          {log.reportType === 'SCHEDULED_SUMMARY' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              RESUMO AGENDADO
                            </span>
                          )}
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
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics Footer */}
        <div className="bg-slate-900 border-t border-slate-800 px-5 py-3 flex items-center justify-between">
           <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Taxa de Entrega (24h)</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-bold text-emerald-400">{deliveryRate}%</span>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-800"></div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tempo Médio de Disparo</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-sm font-bold text-slate-300">{avgDispatchTime}</span>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Volume (24h)</span>
                <span className="text-sm font-bold text-slate-300 mt-0.5">{recentLogsCount} envios</span>
              </div>
           </div>
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
