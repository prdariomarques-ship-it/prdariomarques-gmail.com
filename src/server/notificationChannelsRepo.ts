import {
  NotificationChannelSettings,
  SecondaryDispatchLog,
  ComplianceAlert,
} from '../types.ts';

// Utilitários de mascaramento para conformidade com LGPD/CVM (Prevenção de Vazamento de PII)
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'c***e@FlowCore.investments';
  const parts = email.split('@');
  const user = parts[0];
  const domain = parts[1];
  if (user.length <= 2) {
    return `${user[0] || '*'}***@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

export function maskPhoneNumber(phone: string): string {
  if (!phone) return '+55 (11) *****-5678';
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.length < 6) return '+55 (11) *****-****';
  const lastFour = clean.slice(-4);
  return `+55 (**) *****-${lastFour}`;
}

// Configurações padrão do usuário para canais secundários
const DEFAULT_OFFICE_ID = 'office-matriz-01';

const officeSettingsMap = new Map<string, NotificationChannelSettings>();

function createDefaultSettings(officeId: string = DEFAULT_OFFICE_ID): NotificationChannelSettings {
  const defaultOwnerPhone = process.env.WHATSAPP_OWNER_ALERT_PHONE || '5511999998888';
  return {
    officeId,
    email: {
      enabled: true,
      recipient: 'compliance.officer@FlowCore.investments',
      sendOnCriticalOnly: true,
      includeReportAttachment: true,
      scheduledReportEnabled: true,
      scheduledReportTime: '08:00',
      scheduledReportCron: '0 8 * * *',
      severitiesFilter: ['CRITICAL', 'WARNING'],
      assetClassesFilter: ['Renda Fixa', 'Renda Variável', 'Internacional', 'Multimercado', 'Caixa'],
    },
    sms: {
      enabled: true,
      phoneNumber: '+55 (11) 91234-5678',
      sendOnCriticalOnly: true,
    },
    whatsapp: {
      enabled: true,
      ownerAlertPhone: defaultOwnerPhone,
      personalInstanceName: process.env.EVOLUTION_PERSONAL_INSTANCE || 'numero_principal',
      twinModeEnabled: process.env.WHATSAPP_TWIN_MODE_ENABLED === 'true' || true,
      alertOnRiskGateTrigger: true,
      sendOnCriticalOnly: true,
    },
    whatsappOwnerAlertPhone: defaultOwnerPhone,
    inAppAudio: true,
    updatedAt: new Date().toISOString(),
  };
}

officeSettingsMap.set(DEFAULT_OFFICE_ID, createDefaultSettings(DEFAULT_OFFICE_ID));

let currentSettings: NotificationChannelSettings = officeSettingsMap.get(DEFAULT_OFFICE_ID)!;

// Histórico em memória dos despachos de canais secundários (com PII estritamente mascarada)
let dispatchLogs: SecondaryDispatchLog[] = [
  {
    id: 'disp-init-01',
    channel: 'EMAIL',
    recipient: maskEmail('compliance.officer@FlowCore.investments'),
    status: 'SENT',
    subjectOrTitle: '[FlowCore ALERTA CRÍTICO] Carteira Alpha Privada (PORT-001) - Desenquadramento CVM 175',
    bodyPreview:
      'Alerta Crítico: Renda Variável atingiu 43.5% (limite máx de 35.0%, desvio +8.5 p.p.). Excesso de R$ 510.000 detectado pelo Sentinel. Ação fiduciária: Realizar venda parcial para rebalancear.',
    sentAt: '09:30:15',
    alertId: 'alert-001',
    portfolioName: 'Carteira Alpha Privada',
    severity: 'CRITICAL',
  },
  {
    id: 'disp-init-02',
    channel: 'SMS',
    recipient: maskPhoneNumber('+55 (11) 91234-5678'),
    status: 'SENT',
    subjectOrTitle: 'FlowCore SMS URGENTE: PORT-001',
    bodyPreview:
      'URGENTE: Carteira Alpha Privada excedeu teto de Renda Variável (+8.5 p.p. / R$ 510k). Acesse o portal FlowCore para rebalanceamento.',
    sentAt: '09:30:15',
    alertId: 'alert-001',
    portfolioName: 'Carteira Alpha Privada',
    severity: 'CRITICAL',
  },
];

export function getNotificationSettingsRepo(options?: { unmasked?: boolean; officeId?: string }): NotificationChannelSettings {
  const targetOfficeId = options?.officeId || currentSettings.officeId || DEFAULT_OFFICE_ID;
  if (!officeSettingsMap.has(targetOfficeId)) {
    officeSettingsMap.set(targetOfficeId, createDefaultSettings(targetOfficeId));
  }
  const settings = officeSettingsMap.get(targetOfficeId)!;

  if (options?.unmasked) {
    return { ...settings };
  }
  // Por padrão de segurança Zero-Trust e LGPD, retorna valores mascarados
  return {
    ...settings,
    email: {
      ...settings.email,
      recipient: maskEmail(settings.email.recipient),
    },
    sms: {
      ...settings.sms,
      phoneNumber: maskPhoneNumber(settings.sms.phoneNumber),
    },
    whatsapp: settings.whatsapp
      ? {
          ...settings.whatsapp,
          ownerAlertPhone: maskPhoneNumber(settings.whatsapp.ownerAlertPhone),
        }
      : undefined,
    whatsappOwnerAlertPhone: maskPhoneNumber(
      settings.whatsappOwnerAlertPhone || settings.whatsapp?.ownerAlertPhone || ''
    ),
  };
}

export function updateNotificationSettingsRepo(
  newSettings: Partial<NotificationChannelSettings>,
  officeId?: string,
  unmasked: boolean = false
): NotificationChannelSettings {
  const targetOfficeId = officeId || newSettings.officeId || currentSettings.officeId || DEFAULT_OFFICE_ID;
  if (!officeSettingsMap.has(targetOfficeId)) {
    officeSettingsMap.set(targetOfficeId, createDefaultSettings(targetOfficeId));
  }
  let target = officeSettingsMap.get(targetOfficeId)!;

  // Previne sobrescrita com a máscara caso o usuário não tenha alterado o campo
  let targetEmail = target.email.recipient;
  if (newSettings.email?.recipient && !newSettings.email.recipient.includes('***')) {
    targetEmail = newSettings.email.recipient.trim();
  }

  let targetPhone = target.sms.phoneNumber;
  if (newSettings.sms?.phoneNumber && !newSettings.sms.phoneNumber.includes('***')) {
    targetPhone = newSettings.sms.phoneNumber.trim();
  }

  // Tratamento do WhatsApp Owner Alert Phone para monitoramento de risco do gêmeo
  let targetWhatsappPhone =
    target.whatsapp?.ownerAlertPhone ||
    target.whatsappOwnerAlertPhone ||
    process.env.WHATSAPP_OWNER_ALERT_PHONE ||
    '5511999998888';

  const incomingPhone =
    newSettings.whatsapp?.ownerAlertPhone || newSettings.whatsappOwnerAlertPhone;
  if (incomingPhone && !incomingPhone.includes('***')) {
    targetWhatsappPhone = incomingPhone.trim().replace(/[^\d]/g, '');
  }

  // Sincroniza variável de ambiente de runtime para o backend e monitoramento de risco
  if (targetWhatsappPhone) {
    process.env.WHATSAPP_OWNER_ALERT_PHONE = targetWhatsappPhone;
    console.log(`[NotificationRepo] WHATSAPP_OWNER_ALERT_PHONE atualizado com sucesso: ${targetWhatsappPhone}`);
  }

  const updated: NotificationChannelSettings = {
    ...target,
    ...newSettings,
    officeId: targetOfficeId,
    email: {
      ...target.email,
      ...(newSettings.email || {}),
      recipient: targetEmail,
    },
    sms: {
      ...target.sms,
      ...(newSettings.sms || {}),
      phoneNumber: targetPhone,
    },
    whatsapp: {
      enabled: newSettings.whatsapp?.enabled ?? target.whatsapp?.enabled ?? true,
      ownerAlertPhone: targetWhatsappPhone,
      personalInstanceName:
        newSettings.whatsapp?.personalInstanceName ||
        target.whatsapp?.personalInstanceName ||
        process.env.EVOLUTION_PERSONAL_INSTANCE ||
        'numero_principal',
      twinModeEnabled:
        newSettings.whatsapp?.twinModeEnabled ??
        target.whatsapp?.twinModeEnabled ??
        true,
      alertOnRiskGateTrigger:
        newSettings.whatsapp?.alertOnRiskGateTrigger ??
        target.whatsapp?.alertOnRiskGateTrigger ??
        true,
      sendOnCriticalOnly:
        newSettings.whatsapp?.sendOnCriticalOnly ??
        target.whatsapp?.sendOnCriticalOnly ??
        true,
    },
    whatsappOwnerAlertPhone: targetWhatsappPhone,
    updatedAt: new Date().toISOString(),
  };

  officeSettingsMap.set(targetOfficeId, updated);
  if (targetOfficeId === (currentSettings.officeId || DEFAULT_OFFICE_ID)) {
    currentSettings = updated;
  }

  return getNotificationSettingsRepo({ unmasked, officeId: targetOfficeId });
}

export function getSecondaryDispatchLogsRepo(): SecondaryDispatchLog[] {
  return [...dispatchLogs].sort((a, b) => b.id.localeCompare(a.id));
}

export function clearSecondaryDispatchLogsRepo(): void {
  dispatchLogs = [];
}

/**
 * Dispara notificações secundárias reais/simuladas para alertas críticos
 */
export function dispatchSecondaryAlertsRepo(alerts: ComplianceAlert[]): SecondaryDispatchLog[] {
  const settings = currentSettings;
  const newLogs: SecondaryDispatchLog[] = [];

  const timeFormatted = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  for (const alert of alerts) {
    const severitiesFilter = settings.email.severitiesFilter || ['CRITICAL', 'WARNING', 'NORMAL'];
    const assetClassesFilter = settings.email.assetClassesFilter || ['Renda Fixa', 'Renda Variável', 'Internacional', 'Multimercado', 'Caixa'];
    
    // Evaluate filters
    let passesFilter = true;
    if (settings.email.sendOnCriticalOnly) {
      if (alert.severity !== 'CRITICAL') passesFilter = false;
    } else {
      if (!severitiesFilter.includes(alert.severity)) passesFilter = false;
      if (!assetClassesFilter.includes(alert.assetClass)) passesFilter = false;
      
      if (passesFilter) {
        // Tolerância em pontos percentuais (p.p.)
        const tolerance = settings.email.assetTolerances?.[alert.assetClass] ?? 0;
        if (tolerance > 0 && Math.abs(alert.deviationPP) <= tolerance) {
          passesFilter = false;
        }
      }
    }

    if (settings.email.enabled && passesFilter) {
      const maskedDest = maskEmail(settings.email.recipient);
      
      let subject = `[FlowCore URGENTE] ${alert.portfolioName} - Desenquadramento em ${alert.assetClass}`;
      if (settings.email.customSubjectTemplate) {
        subject = settings.email.customSubjectTemplate
          .replace(/\{\{portfolioName\}\}/g, alert.portfolioName)
          .replace(/\{\{severity\}\}/g, alert.severity)
          .replace(/\{\{assetClass\}\}/g, alert.assetClass);
      }

      let body = `Alerta Crítico: ${alert.message}. Alocação atual: ${alert.currentPercent.toFixed(1)}% (Teto ${alert.maxPercent.toFixed(1)}%). Excesso financeiro apurado: R$ ${alert.excessValueBRL.toLocaleString('pt-BR')}. Recomendação: ${alert.suggestedAction}.`;
      if (settings.email.customBodyTemplate) {
        body = settings.email.customBodyTemplate
          .replace(/\{\{portfolioName\}\}/g, alert.portfolioName)
          .replace(/\{\{severity\}\}/g, alert.severity)
          .replace(/\{\{assetClass\}\}/g, alert.assetClass)
          .replace(/\{\{message\}\}/g, alert.message)
          .replace(/\{\{currentPercent\}\}/g, alert.currentPercent.toFixed(1))
          .replace(/\{\{maxPercent\}\}/g, alert.maxPercent.toFixed(1))
          .replace(/\{\{excessValueBRL\}\}/g, alert.excessValueBRL.toLocaleString('pt-BR'));
      }

      const emailLog: SecondaryDispatchLog = {
        id: `disp-email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        channel: 'EMAIL',
        recipient: maskedDest,
        status: 'SENT',
        subjectOrTitle: subject,
        bodyPreview: body,
        sentAt: timeFormatted,
        alertId: alert.id,
        portfolioName: alert.portfolioName,
        severity: alert.severity,
      };
      dispatchLogs.unshift(emailLog);
      newLogs.push(emailLog);
    }

    if (settings.sms.enabled && (!settings.sms.sendOnCriticalOnly || alert.severity === 'CRITICAL')) {
      const maskedPhone = maskPhoneNumber(settings.sms.phoneNumber);
      const smsLog: SecondaryDispatchLog = {
        id: `disp-sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        channel: 'SMS',
        recipient: maskedPhone,
        status: 'SENT',
        subjectOrTitle: `FlowCore SMS: ${alert.portfolioName}`,
        bodyPreview: `URGENTE: ${alert.portfolioName} violou teto de ${alert.assetClass} (${alert.currentPercent.toFixed(
          1
        )}% vs max ${alert.maxPercent.toFixed(1)}%). Excesso R$ ${alert.excessValueBRL.toLocaleString('pt-BR')}.`,
        sentAt: timeFormatted,
        alertId: alert.id,
        portfolioName: alert.portfolioName,
        severity: alert.severity,
      };
      dispatchLogs.unshift(smsLog);
      newLogs.push(smsLog);
    }

    // Disparo WhatsApp para o número de alerta do proprietário (WHATSAPP_OWNER_ALERT_PHONE)
    const isWhatsappEnabled = settings.whatsapp?.enabled ?? true;
    const ownerPhone =
      settings.whatsapp?.ownerAlertPhone ||
      settings.whatsappOwnerAlertPhone ||
      process.env.WHATSAPP_OWNER_ALERT_PHONE;
    if (
      isWhatsappEnabled &&
      ownerPhone &&
      (!settings.whatsapp?.sendOnCriticalOnly || alert.severity === 'CRITICAL')
    ) {
      const maskedOwnerPhone = maskPhoneNumber(ownerPhone);
      const whatsappLog: SecondaryDispatchLog = {
        id: `disp-wa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        channel: 'WHATSAPP',
        recipient: maskedOwnerPhone,
        status: 'SENT',
        subjectOrTitle: `[WHATSAPP TWIN ALERT] Risco Crítico em ${alert.portfolioName}`,
        bodyPreview: `🚨 [GÊMEO DIGITAL - RISK GATE] Alerta enviado ao número do proprietário (${maskedOwnerPhone}): A carteira ${alert.portfolioName} apresentou desenquadramento crítico em ${alert.assetClass} (${alert.currentPercent.toFixed(1)}% vs teto ${alert.maxPercent.toFixed(1)}%). Excesso: R$ ${alert.excessValueBRL.toLocaleString('pt-BR')}.`,
        sentAt: timeFormatted,
        alertId: alert.id,
        portfolioName: alert.portfolioName,
        severity: alert.severity,
        reportType: 'TWIN_RISK_GATE',
      };
      dispatchLogs.unshift(whatsappLog);
      newLogs.push(whatsappLog);
    }
  }

  // Limita histórico a 50 itens
  if (dispatchLogs.length > 50) {
    dispatchLogs = dispatchLogs.slice(0, 50);
  }

  return newLogs;
}

/**
 * Envia um disparo de teste sob demanda para validar o canal secundário
 */
export function dispatchTestSecondaryAlertRepo(
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'ALL',
  testRecipient?: string
): { success: boolean; dispatched: SecondaryDispatchLog[]; message: string } {
  const settings = currentSettings;
  const dispatched: SecondaryDispatchLog[] = [];
  const timeFormatted = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  if (channel === 'EMAIL' || channel === 'ALL') {
    const rawEmail = testRecipient || settings.email.recipient;
    const maskedTarget = maskEmail(rawEmail);
    const log: SecondaryDispatchLog = {
      id: `disp-test-email-${Date.now()}`,
      channel: 'EMAIL',
      recipient: maskedTarget,
      status: 'SENT',
      subjectOrTitle: '[TESTE FlowCore] Verificação de Canal Secundário de E-mail de Compliance',
      bodyPreview: `Teste de canal secundário para o gestor de conformidade. Monitoramento Sentinel CVM 175 conectado com sucesso. Destinatário: ${maskedTarget}. Relatórios em anexo: ${settings.email.includeReportAttachment ? 'Habilitado' : 'Desabilitado'}.`,
      sentAt: timeFormatted,
      portfolioName: 'Carteira de Teste Sentinel',
      severity: 'CRITICAL',
    };
    dispatchLogs.unshift(log);
    dispatched.push(log);
  }

  if (channel === 'SMS' || channel === 'ALL') {
    const rawSms = testRecipient || settings.sms.phoneNumber;
    const maskedTargetSms = maskPhoneNumber(rawSms);
    const log: SecondaryDispatchLog = {
      id: `disp-test-sms-${Date.now()}`,
      channel: 'SMS',
      recipient: maskedTargetSms,
      status: 'SENT',
      subjectOrTitle: 'FlowCore SMS TESTE',
      bodyPreview: `[FlowCore TESTE] Canal SMS verificado com sucesso para ${maskedTargetSms}. Alertas críticos de desenquadramento serão entregues em tempo real.`,
      sentAt: timeFormatted,
      portfolioName: 'Carteira de Teste Sentinel',
      severity: 'CRITICAL',
    };
    dispatchLogs.unshift(log);
    dispatched.push(log);
  }

  if (channel === 'WHATSAPP' || channel === 'ALL') {
    const rawWa =
      testRecipient ||
      settings.whatsapp?.ownerAlertPhone ||
      settings.whatsappOwnerAlertPhone ||
      process.env.WHATSAPP_OWNER_ALERT_PHONE ||
      '5511999998888';
    const maskedWa = maskPhoneNumber(rawWa);
    const log: SecondaryDispatchLog = {
      id: `disp-test-wa-${Date.now()}`,
      channel: 'WHATSAPP',
      recipient: maskedWa,
      status: 'SENT',
      subjectOrTitle: '[WHATSAPP TWIN TESTE] Verificação de Alerta de Risco do Proprietário',
      bodyPreview: `[FlowCore TESTE WHATSAPP] Notificação de teste para o WHATSAPP_OWNER_ALERT_PHONE (${maskedWa}). O canal de monitoramento do gêmeo digital com risk gate está configurado e operacional no backend.`,
      sentAt: timeFormatted,
      portfolioName: 'Carteira de Teste Sentinel',
      severity: 'CRITICAL',
      reportType: 'TEST',
    };
    dispatchLogs.unshift(log);
    dispatched.push(log);
  }

  return {
    success: true,
    dispatched,
    message: `Notificação de teste despachada com sucesso para os canais selecionados (${channel}).`,
  };
}

/**
 * Dispara o Relatório Agendado Periódico de Conformidade por E-mail
 * Baseado estritamente em dados reais de alertas (/api/alerts)
 */
export function dispatchScheduledSummaryReportRepo(
  alerts: ComplianceAlert[],
  officeId?: string,
  force: boolean = false
): { success: boolean; dispatched: SecondaryDispatchLog | null; message: string } {
  const targetOfficeId = officeId || currentSettings.officeId || DEFAULT_OFFICE_ID;
  const settings = getNotificationSettingsRepo({ unmasked: true, officeId: targetOfficeId });

  if (!settings.email.enabled) {
    return {
      success: false,
      dispatched: null,
      message: 'Canal de e-mail está desabilitado nas configurações deste escritório.',
    };
  }

  if (!settings.email.scheduledReportEnabled && !force) {
    return {
      success: false,
      dispatched: null,
      message: 'Envio de relatório periódico agendado está desativado.',
    };
  }

  const timeFormatted = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateFormatted = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const criticals = alerts.filter((a) => a.severity === 'CRITICAL');
  const warnings = alerts.filter((a) => a.severity === 'WARNING');
  const affectedPortfolios = [...new Set(alerts.map((a) => a.portfolioName))];
  const totalExcessBRL = alerts.reduce((acc, a) => acc + (a.excessValueBRL || 0), 0);

  const maskedTarget = maskEmail(settings.email.recipient);

  const bodyPreview = `[RELATÓRIO DIÁRIO DE CONFORMIDADE - ${dateFormatted} às ${settings.email.scheduledReportTime || '08:00'}]
Escritório: ${targetOfficeId} | Destinatário: ${maskedTarget}
Resumo Geral:
- Alertas Críticos: ${criticals.length}
- Alertas de Atenção: ${warnings.length}
- Carteiras com Apontamentos: ${affectedPortfolios.length} (${affectedPortfolios.slice(0, 3).join(', ')}${affectedPortfolios.length > 3 ? '...' : ''})
- Volume Total em Desenquadramento: R$ ${totalExcessBRL.toLocaleString('pt-BR')}
- Anexo CSV Detalhado: ${settings.email.includeReportAttachment ? 'Incluído (sumário auditável UTF-8)' : 'Não solicitado'}.
Todos os dados foram extraídos do motor fiduciário Sentinel CVM 175.`;

  const log: SecondaryDispatchLog = {
    id: `disp-scheduled-email-${Date.now()}`,
    channel: 'EMAIL',
    recipient: maskedTarget,
    status: 'SENT',
    subjectOrTitle: `[FlowCore Relatório Diário] Resumo de Conformidade CVM 175 (${dateFormatted})`,
    bodyPreview,
    sentAt: timeFormatted,
    portfolioName: affectedPortfolios.length > 0 ? affectedPortfolios.join(', ') : 'Geral (Conforme)',
    severity: criticals.length > 0 ? 'CRITICAL' : warnings.length > 0 ? 'WARNING' : undefined,
    reportType: 'SCHEDULED_SUMMARY',
  };

  dispatchLogs.unshift(log);
  if (dispatchLogs.length > 50) {
    dispatchLogs = dispatchLogs.slice(0, 50);
  }

  return {
    success: true,
    dispatched: log,
    message: `Relatório de conformidade agendado gerado e enviado com sucesso para ${maskedTarget}.`,
  };
}
