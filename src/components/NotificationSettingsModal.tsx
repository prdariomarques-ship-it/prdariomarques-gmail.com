import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Send,
  Save,
  AlertTriangle,
  Bot,
  Zap,
  Lock,
  Info,
  Phone,
  Check,
  ExternalLink,
  Plus,
  Copy,
} from 'lucide-react';
import {
  NotificationChannelSettings,
  SecondaryDispatchLog,
  WhatsAppChannelConfig,
} from '../types';

/**
 * Propriedades para o componente TextField / Input do WHATSAPP_OWNER_ALERT_PHONE
 */
export interface WhatsAppOwnerAlertPhoneTextFieldProps {
  value: string;
  onChange: (val: string) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  isValid: boolean;
  formattedPreview: string;
  onTestDispatch?: () => Promise<void>;
  isTesting?: boolean;
}

/**
 * Componente TextField / Input dedicado para o número WHATSAPP_OWNER_ALERT_PHONE (E.164)
 */
export const WhatsAppOwnerAlertPhoneTextField: React.FC<WhatsAppOwnerAlertPhoneTextFieldProps> = ({
  value,
  onChange,
  onSave,
  isSaving,
  isValid,
  formattedPreview,
  onTestDispatch,
  isTesting = false,
}) => {
  const [copied, setCopied] = useState(false);

  // Detecta se usuário digitou apenas DDD + número (ex: 11999998888) sem o DDI 55
  const rawDigits = value.replace(/[^\d]/g, '');
  const canPrependDdi55 =
    !rawDigits.startsWith('55') && (rawDigits.length === 10 || rawDigits.length === 11);

  const handlePrepend55 = () => {
    onChange(`55${rawDigits}`);
  };

  const handleCopy = () => {
    if (value) {
      navigator.clipboard?.writeText(rawDigits || value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg shadow-black/20">
      {/* Header do Campo com Título e Status de Validação */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <label
              htmlFor="WHATSAPP_OWNER_ALERT_PHONE"
              className="text-xs font-bold text-slate-200 uppercase tracking-wider block"
            >
              Telefone do Proprietário para Alertas (WHATSAPP_OWNER_ALERT_PHONE)
            </label>
            <span className="text-[11px] text-slate-400">
              Padrão internacional E.164 (somente dígitos, sem símbolos ou espaços)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors ${
              isValid
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            {isValid ? '✓ Formato E.164 Válido' : '⚠️ Requer 10 a 15 dígitos'}
          </span>
        </div>
      </div>

      {/* Input / TextField com Adornments e Ação de Salvamento Imediato */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <span className="text-xs font-mono font-bold text-emerald-400/80">+</span>
            </div>
            <input
              type="text"
              id="WHATSAPP_OWNER_ALERT_PHONE"
              name="WHATSAPP_OWNER_ALERT_PHONE"
              data-testid="whatsapp-owner-alert-phone-input"
              aria-label="Telefone do Proprietário para Alertas do WhatsApp (WHATSAPP_OWNER_ALERT_PHONE)"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="5511999998888"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-8 pr-28 py-3 text-sm font-mono text-white placeholder-slate-600 outline-none transition"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {value && (
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copiar número"
                  className="p-1 rounded text-slate-500 hover:text-slate-300 transition"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60">
                E.164
              </span>
            </div>
          </div>

          {/* Botão de Salvamento Imediato do Número */}
          <button
            type="button"
            id="save-whatsapp-owner-phone-btn"
            onClick={onSave}
            disabled={isSaving || !isValid}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            title="Salvar e persistir WHATSAPP_OWNER_ALERT_PHONE imediatamente na API"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Salvar Número</span>
          </button>
        </div>

        {/* Linha de Atalhos e Preview Dinâmico */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Visualização formatada:{' '}
                <strong className="font-mono text-emerald-300">
                  {formattedPreview}
                </strong>
              </span>
            </div>
          </div>

          {canPrependDdi55 && (
            <button
              type="button"
              onClick={handlePrepend55}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-800/60 flex items-center gap-1 transition"
              title="Adicionar DDI 55 (Brasil) automaticamente"
            >
              <Plus className="w-3 h-3" />
              <span>Inserir DDI +55 (Brasil)</span>
            </button>
          )}
        </div>
      </div>

      {/* Nota de Integração com o Risk Gate */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
        <span className="text-emerald-400 font-semibold">Destino Crítico de Compliance:</span> Este número recebe os alertas prioritários quando o <strong>Risk Gate</strong> do Gêmeo Digital intercepta perguntas e solicitações de alto risco regulatório ou desenquadramentos imediatos da CVM 175.
      </div>

      {/* Disparo de Teste do WhatsApp */}
      {onTestDispatch && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] text-slate-400">
            Valide a conectividade com o número <strong>{formattedPreview}</strong>:
          </span>
          <button
            type="button"
            onClick={onTestDispatch}
            disabled={isTesting || !isValid}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isTesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Testar Disparo no WhatsApp</span>
          </button>
        </div>
      )}
    </div>
  );
};

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationChannelSettings;
  onSaveSettings: (newSettings: NotificationChannelSettings) => Promise<void>;
  dispatchLogs: SecondaryDispatchLog[];
  onRefreshLogs: () => Promise<void>;
  onClearLogs: () => Promise<void>;
  onTestDispatch: (
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'ALL',
    recipient?: string
  ) => Promise<{ success: boolean; message: string }>;
}

type TabType = 'whatsapp' | 'email' | 'sms' | 'logs';

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  dispatchLogs,
  onRefreshLogs,
  onClearLogs,
  onTestDispatch,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('whatsapp');

  // Estado local para edição antes de persistir
  const [emailEnabled, setEmailEnabled] = useState(settings?.email?.enabled ?? true);
  const [emailRecipient, setEmailRecipient] = useState(settings?.email?.recipient ?? '');
  const [emailCriticalOnly, setEmailCriticalOnly] = useState(
    settings?.email?.sendOnCriticalOnly ?? true
  );
  const [emailAttachment, setEmailAttachment] = useState(
    settings?.email?.includeReportAttachment ?? true
  );

  const [smsEnabled, setSmsEnabled] = useState(settings?.sms?.enabled ?? true);
  const [smsPhone, setSmsPhone] = useState(settings?.sms?.phoneNumber ?? '');
  const [smsCriticalOnly, setSmsCriticalOnly] = useState(
    settings?.sms?.sendOnCriticalOnly ?? true
  );

  // WhatsApp e Gêmeo Digital (WHATSAPP_OWNER_ALERT_PHONE)
  const initialOwnerPhone =
    settings?.whatsapp?.ownerAlertPhone ||
    settings?.whatsappOwnerAlertPhone ||
    '5511999998888';

  const [whatsappEnabled, setWhatsappEnabled] = useState(
    settings?.whatsapp?.enabled ?? true
  );
  const [ownerAlertPhone, setOwnerAlertPhone] = useState(initialOwnerPhone);
  const [personalInstance, setPersonalInstance] = useState(
    settings?.whatsapp?.personalInstanceName || 'numero_principal'
  );
  const [twinModeEnabled, setTwinModeEnabled] = useState(
    settings?.whatsapp?.twinModeEnabled ?? true
  );
  const [alertOnRiskGate, setAlertOnRiskGate] = useState(
    settings?.whatsapp?.alertOnRiskGateTrigger ?? true
  );
  const [whatsappCriticalOnly, setWhatsappCriticalOnly] = useState(
    settings?.whatsapp?.sendOnCriticalOnly ?? true
  );

  // Estados de feedback de ação
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [logsFilter, setLogsFilter] = useState<'ALL' | 'WHATSAPP' | 'EMAIL' | 'SMS'>('ALL');

  // Sincroniza quando as props externas mudam
  useEffect(() => {
    if (settings) {
      setEmailEnabled(settings.email?.enabled ?? true);
      setEmailRecipient(settings.email?.recipient ?? '');
      setEmailCriticalOnly(settings.email?.sendOnCriticalOnly ?? true);
      setEmailAttachment(settings.email?.includeReportAttachment ?? true);

      setSmsEnabled(settings.sms?.enabled ?? true);
      setSmsPhone(settings.sms?.phoneNumber ?? '');
      setSmsCriticalOnly(settings.sms?.sendOnCriticalOnly ?? true);

      const phone =
        settings.whatsapp?.ownerAlertPhone ||
        settings.whatsappOwnerAlertPhone ||
        '5511999998888';
      setOwnerAlertPhone(phone);
      setWhatsappEnabled(settings.whatsapp?.enabled ?? true);
      setPersonalInstance(settings.whatsapp?.personalInstanceName || 'numero_principal');
      setTwinModeEnabled(settings.whatsapp?.twinModeEnabled ?? true);
      setAlertOnRiskGate(settings.whatsapp?.alertOnRiskGateTrigger ?? true);
      setWhatsappCriticalOnly(settings.whatsapp?.sendOnCriticalOnly ?? true);
    }
  }, [settings, isOpen]);

  // Formatação amigável do número E.164 para preview
  const formattedOwnerPhonePreview = useMemo(() => {
    const digitsOnly = ownerAlertPhone.replace(/[^\d]/g, '');
    if (!digitsOnly) return 'Nenhum número preenchido';
    if (digitsOnly.startsWith('55') && digitsOnly.length >= 12) {
      const ddd = digitsOnly.substring(2, 4);
      const rest = digitsOnly.substring(4);
      if (rest.length === 9) {
        return `+55 (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
      } else if (rest.length === 8) {
        return `+55 (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
      }
      return `+55 (${ddd}) ${rest}`;
    }
    return `+${digitsOnly}`;
  }, [ownerAlertPhone]);

  // Validação do padrão E.164 sem '+'
  const isOwnerPhoneValid = useMemo(() => {
    const clean = ownerAlertPhone.trim().replace(/[^\d]/g, '');
    return clean.length >= 10 && clean.length <= 15;
  }, [ownerAlertPhone]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Normaliza para E.164 puro sem '+'
      const sanitizedPhone = ownerAlertPhone.trim().replace(/[^\d]/g, '');

      const updatedWhatsApp: WhatsAppChannelConfig = {
        enabled: whatsappEnabled,
        ownerAlertPhone: sanitizedPhone || '5511999998888',
        personalInstanceName: personalInstance.trim() || 'numero_principal',
        twinModeEnabled: twinModeEnabled,
        alertOnRiskGateTrigger: alertOnRiskGate,
        sendOnCriticalOnly: whatsappCriticalOnly,
      };

      const updatedSettings: NotificationChannelSettings = {
        ...settings,
        email: {
          ...settings.email,
          enabled: emailEnabled,
          recipient: emailRecipient.trim(),
          sendOnCriticalOnly: emailCriticalOnly,
          includeReportAttachment: emailAttachment,
        },
        sms: {
          ...settings.sms,
          enabled: smsEnabled,
          phoneNumber: smsPhone.trim(),
          sendOnCriticalOnly: smsCriticalOnly,
        },
        whatsapp: updatedWhatsApp,
        whatsappOwnerAlertPhone: sanitizedPhone || '5511999998888',
        updatedAt: new Date().toISOString(),
      };

      await onSaveSettings(updatedSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err);
      setSaveError(err?.message || 'Falha ao salvar preferências no backend.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (channel: 'EMAIL' | 'SMS' | 'WHATSAPP') => {
    setIsTesting(true);
    setTestResult(null);
    try {
      let recipient: string | undefined;
      if (channel === 'WHATSAPP') {
        recipient = ownerAlertPhone.trim().replace(/[^\d]/g, '');
      } else if (channel === 'EMAIL') {
        recipient = emailRecipient.trim();
      } else if (channel === 'SMS') {
        recipient = smsPhone.trim();
      }

      const res = await onTestDispatch(channel, recipient);
      setTestResult(res);
      await onRefreshLogs();
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Erro de comunicação ao disparar teste.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const filteredLogs = dispatchLogs.filter((log) => {
    if (logsFilter === 'ALL') return true;
    return log.channel === logsFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#0B1120] border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header do Modal */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#0B1120] to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Canais de Notificação & Alerta Imediato
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CVM 175 & Risk Gate
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gerencie contingência secundária, alertas em tempo real e o número de alerta do proprietário do Gêmeo Digital.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Navegação entre Canais */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp (Gêmeo & Risk Gate)</span>
            {whatsappEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'email'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Mail className="w-4 h-4 text-sky-400" />
            <span>E-mail de Compliance</span>
            {emailEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('sms')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'sms'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>SMS de Urgência</span>
            {smsEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ml-auto ${
              activeTab === 'logs'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Histórico de Despachos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {dispatchLogs.length}
            </span>
          </button>
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: WHATSAPP (GÊMEO DIGITAL & WHATSAPP_OWNER_ALERT_PHONE) */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Card de Destaque do Gêmeo e Risk Gate */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/20 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      WhatsApp Twin Mode & Risk Gate Interceptor
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300">
                        Evolution API
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Quando o <strong>Risk Gate</strong> do gêmeo digital bloqueia uma resposta (situação de risco financeiro, consulta fiduciária sensível ou crise pessoal), o backend dispara um alerta prioritário diretamente para o <strong>WHATSAPP_OWNER_ALERT_PHONE</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappEnabled}
                      onChange={(e) => setWhatsappEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="text-xs font-semibold text-slate-200">
                    {whatsappEnabled ? 'Ativo' : 'Desativado'}
                  </span>
                </div>
              </div>

              {/* Seção Principal: Campo Dedicado WHATSAPP_OWNER_ALERT_PHONE (E.164) */}
              <WhatsAppOwnerAlertPhoneTextField
                value={ownerAlertPhone}
                onChange={setOwnerAlertPhone}
                onSave={handleSave}
                isSaving={isSaving}
                isValid={isOwnerPhoneValid}
                formattedPreview={formattedOwnerPhonePreview}
                onTestDispatch={() => handleTest('WHATSAPP')}
                isTesting={isTesting}
              />

              {/* Parâmetros Operacionais do Gêmeo Digital & Risk Gate */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Parâmetros Avançados de Instância & Triagem de Risco
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Instância Evolution */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                      Instância Pessoal (EVOLUTION_PERSONAL_INSTANCE)
                    </label>
                    <input
                      type="text"
                      value={personalInstance}
                      onChange={(e) => setPersonalInstance(e.target.value)}
                      placeholder="numero_principal"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 outline-none transition"
                    />
                    <p className="text-[10px] text-slate-500">
                      Nome exato da instância pessoal configurada no Evolution Manager.
                    </p>
                  </div>

                  {/* Modo Gêmeo Toggle */}
                  <div className="flex flex-col justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        WHATSAPP_TWIN_MODE_ENABLED
                      </span>
                      <input
                        type="checkbox"
                        checked={twinModeEnabled}
                        onChange={(e) => setTwinModeEnabled(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Separa o fluxo pessoal do fluxo comercial da loja.
                    </p>
                  </div>
                </div>

                {/* Opções de Disparo de Alerta */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertOnRiskGate}
                      onChange={(e) => setAlertOnRiskGate(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      Notificar proprietário imediatamente quando o <strong>Risk Gate</strong> bloquear uma resposta
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappCriticalOnly}
                      onChange={(e) => setWhatsappCriticalOnly(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      Disparar apenas em desenquadramentos fiduciários de severidade <strong>Crítica</strong>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: E-MAIL DE COMPLIANCE */}
          {activeTab === 'email' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-sky-950/20 border border-sky-500/30 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Canal Secundário de E-mail</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Envio automatizado de alertas de desenquadramento CVM 175 e atas de conformidade em anexo.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    E-mail do Gestor / Compliance Officer
                  </label>
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="compliance.officer@FlowCore.investments"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailCriticalOnly}
                      onChange={(e) => setEmailCriticalOnly(e.target.checked)}
                      className="rounded border-slate-700 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Disparar apenas em violações de severidade Crítica</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailAttachment}
                      onChange={(e) => setEmailAttachment(e.target.checked)}
                      className="rounded border-slate-700 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Anexar sumário auditável de desvios em CSV estruturado</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] text-slate-400">Valide o canal de e-mail:</span>
                  <button
                    onClick={() => handleTest('EMAIL')}
                    disabled={isTesting}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Testar Envio de E-mail</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SMS DE URGÊNCIA */}
          {activeTab === 'sms' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Canal de SMS de Urgência</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Envio de alertas instantâneos de contingência via operadora para situações sem internet.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Número de Celular para SMS
                  </label>
                  <input
                    type="text"
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="+55 (11) 91234-5678"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 outline-none transition"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsCriticalOnly}
                      onChange={(e) => setSmsCriticalOnly(e.target.checked)}
                      className="rounded border-slate-700 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Disparar SMS exclusivamente para violações Críticas</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] text-slate-400">Valide o canal SMS:</span>
                  <button
                    onClick={() => handleTest('SMS')}
                    disabled={isTesting}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Testar Disparo SMS</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTÓRICO DE DESPACHOS */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Filtrar Canal:</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {(['ALL', 'WHATSAPP', 'EMAIL', 'SMS'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setLogsFilter(filter)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          logsFilter === filter
                            ? 'bg-slate-800 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {filter === 'ALL'
                          ? 'Todos'
                          : filter === 'WHATSAPP'
                          ? 'WhatsApp'
                          : filter === 'EMAIL'
                          ? 'E-mail'
                          : 'SMS'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onRefreshLogs}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Recarregar registros"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onClearLogs}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs transition flex items-center gap-1"
                    title="Limpar histórico de despachos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar</span>
                  </button>
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60 text-slate-400 text-xs">
                  Nenhum despacho secundário registrado para o filtro selecionado.
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs space-y-1.5 transition hover:border-slate-700"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              log.channel === 'WHATSAPP'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : log.channel === 'EMAIL'
                                ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {log.channel}
                          </span>
                          <span className="font-semibold text-slate-200">
                            {log.subjectOrTitle}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {log.sentAt}
                        </span>
                      </div>

                      <p className="text-slate-300 font-mono text-[11px] bg-slate-950/70 p-2 rounded-lg border border-slate-800/70">
                        {log.bodyPreview}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>Destinatário: <strong className="text-slate-300">{log.recipient}</strong></span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Entregue com Sucesso
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback de Teste */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-fadeIn ${
                testResult.success
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
              <button
                onClick={() => setTestResult(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Feedback de Salvamento */}
          {saveSuccess && (
            <div className="p-3 rounded-xl border bg-emerald-950/60 border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Configurações salvas e variáveis sincronizadas no backend (incluindo <strong>WHATSAPP_OWNER_ALERT_PHONE</strong>).
              </span>
            </div>
          )}

          {saveError && (
            <div className="p-3 rounded-xl border bg-rose-950/60 border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
        </div>

        {/* Footer com Botões de Ação */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="text-xs text-slate-400 hidden sm:block">
            Todas as alterações são auditáveis pelo Sentinel e gravadas com Zero-Trust.
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              Fechar
            </button>

            <button
              id="save-notification-settings-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Salvar e Sincronizar Variáveis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
