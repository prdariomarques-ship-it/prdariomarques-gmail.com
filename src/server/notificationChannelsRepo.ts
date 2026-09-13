import {
  NotificationChannelSettings,
  SecondaryDispatchLog,
  ComplianceAlert,
} from '../types';

// Configurações padrão do usuário para canais secundários
let currentSettings: NotificationChannelSettings = {
  email: {
    enabled: true,
    recipient: 'PrDariomarques@gmail.com',
    sendOnCriticalOnly: true,
    includeReportAttachment: true,
  },
  sms: {
    enabled: true,
    phoneNumber: '+55 (11) 98765-4321',
    sendOnCriticalOnly: true,
  },
  inAppAudio: true,
  updatedAt: new Date().toISOString(),
};

// Histórico em memória dos despachos de canais secundários
let dispatchLogs: SecondaryDispatchLog[] = [
  {
    id: 'disp-init-01',
    channel: 'EMAIL',
    recipient: 'PrDariomarques@gmail.com',
    status: 'SENT',
    subjectOrTitle: '[FLOWCORE ALERTA CRÍTICO] Carteira Alpha Privada (PORT-001) - Desenquadramento CVM 175',
    bodyPreview:
      'Alerta Crítico: Renda Variável atingiu 43.5% (limite máx de 35.0%, desvio +8.5 p.p.). Excesso de R$ 510.000 detectado pelo Sentinel. Ação fiduciária: Realizar venda parcial para rebalancear.',
    sentAt: new Date(Date.now() - 3600000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    alertId: 'alert-001',
    portfolioName: 'Carteira Alpha Privada',
    severity: 'CRITICAL',
  },
  {
    id: 'disp-init-02',
    channel: 'SMS',
    recipient: '+55 (11) 98765-4321',
    status: 'SENT',
    subjectOrTitle: 'FLOWCORE SMS URGENTE: PORT-001',
    bodyPreview:
      'URGENTE: Carteira Alpha Privada excedeu teto de Renda Variável (+8.5 p.p. / R$ 510k). Acesse o portal FlowCore para rebalanceamento.',
    sentAt: new Date(Date.now() - 3600000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    alertId: 'alert-001',
    portfolioName: 'Carteira Alpha Privada',
    severity: 'CRITICAL',
  },
];

export function getNotificationSettingsRepo(): NotificationChannelSettings {
  return { ...currentSettings };
}

export function updateNotificationSettingsRepo(
  newSettings: Partial<NotificationChannelSettings>
): NotificationChannelSettings {
  currentSettings = {
    ...currentSettings,
    ...newSettings,
    email: {
      ...currentSettings.email,
      ...(newSettings.email || {}),
    },
    sms: {
      ...currentSettings.sms,
      ...(newSettings.sms || {}),
    },
    updatedAt: new Date().toISOString(),
  };
  return { ...currentSettings };
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
    if (settings.email.enabled && (!settings.email.sendOnCriticalOnly || alert.severity === 'CRITICAL')) {
      const emailLog: SecondaryDispatchLog = {
        id: `disp-email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        channel: 'EMAIL',
        recipient: settings.email.recipient,
        status: 'SENT',
        subjectOrTitle: `[FLOWCORE URGENTE] ${alert.portfolioName} - Desenquadramento em ${alert.assetClass}`,
        bodyPreview: `Alerta Crítico: ${alert.message}. Alocação atual: ${alert.currentPercent.toFixed(
          1
        )}% (Teto ${alert.maxPercent.toFixed(1)}%). Excesso financeiro apurado: R$ ${alert.excessValueBRL.toLocaleString(
          'pt-BR'
        )}. Recomendação: ${alert.suggestedAction}.`,
        sentAt: timeFormatted,
        alertId: alert.id,
        portfolioName: alert.portfolioName,
        severity: alert.severity,
      };
      dispatchLogs.unshift(emailLog);
      newLogs.push(emailLog);
    }

    if (settings.sms.enabled && (!settings.sms.sendOnCriticalOnly || alert.severity === 'CRITICAL')) {
      const smsLog: SecondaryDispatchLog = {
        id: `disp-sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        channel: 'SMS',
        recipient: settings.sms.phoneNumber,
        status: 'SENT',
        subjectOrTitle: `FLOWCORE SMS: ${alert.portfolioName}`,
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
  channel: 'EMAIL' | 'SMS' | 'ALL',
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
    const targetEmail = testRecipient || settings.email.recipient;
    const log: SecondaryDispatchLog = {
      id: `disp-test-email-${Date.now()}`,
      channel: 'EMAIL',
      recipient: targetEmail,
      status: 'SENT',
      subjectOrTitle: '[TESTE FLOWCORE] Verificação de Canal Secundário de E-mail de Compliance',
      bodyPreview: `Teste de canal secundário para o gestor de conformidade. Monitoramento Sentinel CVM 175 conectado com sucesso. Destinatário: ${targetEmail}. Relatórios em anexo: ${settings.email.includeReportAttachment ? 'Habilitado' : 'Desabilitado'}.`,
      sentAt: timeFormatted,
      portfolioName: 'Carteira de Teste Sentinel',
      severity: 'CRITICAL',
    };
    dispatchLogs.unshift(log);
    dispatched.push(log);
  }

  if (channel === 'SMS' || channel === 'ALL') {
    const targetSms = testRecipient || settings.sms.phoneNumber;
    const log: SecondaryDispatchLog = {
      id: `disp-test-sms-${Date.now()}`,
      channel: 'SMS',
      recipient: targetSms,
      status: 'SENT',
      subjectOrTitle: 'FLOWCORE SMS TESTE',
      bodyPreview: `[FLOWCORE TESTE] Canal SMS verificado com sucesso para ${targetSms}. Alertas críticos de desenquadramento serão entregues em tempo real.`,
      sentAt: timeFormatted,
      portfolioName: 'Carteira de Teste Sentinel',
      severity: 'CRITICAL',
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
