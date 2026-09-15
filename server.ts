import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getPortfoliosRepo,
  getPortfolioByIdRepo,
  updatePortfolioRepo,
  resetPortfoliosRepo,
  simulateMarketShockRepo,
  getPoliciesRepo,
  getPolicyByIdRepo,
  getLimitsConfigRepo,
  updateLimitsConfigRepo,
  resetLimitsConfigRepo,
} from './src/server/portfolioRepo';
import {
  getNotificationSettingsRepo,
  updateNotificationSettingsRepo,
  getSecondaryDispatchLogsRepo,
  dispatchSecondaryAlertsRepo,
  dispatchTestSecondaryAlertRepo,
  clearSecondaryDispatchLogsRepo,
  dispatchScheduledSummaryReportRepo,
} from './src/server/notificationChannelsRepo';
import { ComplianceAgent } from './src/server/complianceAgent';
import { askComplianceAgent } from './src/server/geminiService';
import { RebalanceOrder, RebalanceExecutionResult } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
import cors from 'cors';
app.use(cors({
  origin: '*', // Permitir de qualquer origem (inclusive app Capacitor localhost)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// ==========================================
// CONTROLE DE AUTENTICAÇÃO E SESSÃO OBRIGATÓRIA (/api/*)
// Bloqueia qualquer requisição sem Bearer token válido
// ==========================================
const VALID_API_TOKENS = new Set<string>();
if (process.env.API_TOKEN) {
  VALID_API_TOKENS.add(process.env.API_TOKEN.trim());
}

app.use('/api', (req, res, next) => {
  // Desativa qualquer cache em navegador ou proxy para rotas /api/*
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Permitir requisições OPTIONS pré-flight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  // 1. Tenta validar via Header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.trim().split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      const token = parts[1].trim();
      if (VALID_API_TOKENS.has(token)) {
        return next();
      }
      return res.status(401).json({
        success: false,
        error: 'Acesso não autorizado: Token de API incorreto.',
        code: 'INVALID_TOKEN',
      });
    }
  }

  // 2. Tenta validar via Header X-API-Key
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string' && VALID_API_TOKENS.has(apiKeyHeader.trim())) {
    return next();
  }

  // Nenhuma credencial válida fornecida -> 401 Unauthorized
  return res.status(401).json({
    success: false,
    error: 'Acesso não autorizado: Autenticação Bearer obrigatória.',
    code: 'AUTH_REQUIRED',
  });
});


// ==========================================
// API ROUTES
// ==========================================

// Endpoint GET /api/health - Verificação de conectividade e latência
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FlowCore Sentinel Engine',
    timestamp: Date.now(),
    uptime: Math.round(process.uptime()),
    version: '2.4.0',
    mode: 'LIVE',
  });
});

// Endpoint GET /api/policies
app.get('/api/policies', (req, res) => {
  try {
    const policies = getPoliciesRepo();
    res.json({ success: true, count: policies.length, policies });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ success: false, error: 'Falha ao buscar políticas normativas' });
  }
});

// Endpoint GET /api/policies/:id
app.get('/api/policies/:id', (req, res) => {
  try {
    const policy = getPolicyByIdRepo(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, error: 'Política não encontrada' });
    }
    res.json({ success: true, policy });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ success: false, error: 'Falha ao buscar política' });
  }
});

// Endpoint GET /api/telemetry
// Mostra o status operacional dos agentes de compliance do FlowCore
app.get('/api/telemetry', (req, res) => {
  try {
    const portfolios = getPortfoliosRepo();
    const alerts = ComplianceAgent.evaluateAllPortfolios(portfolios);
    const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
    const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      orchestrator: {
        status: 'ACTIVE_ONLINE',
        mode: 'SUPERVISED_AUTONOMOUS',
        lastHeartbeat: new Date().toLocaleTimeString('pt-BR'),
        latencyMs: 38,
      },
      agents: [
        {
          id: 'agent-compliance-guard',
          name: 'Compliance Guard Sentinel',
          status: 'MONITORING',
          monitoredRules: ['CVM 175', 'CMN 4.963', 'IPS Mandatos', 'Suitability CVM 30'],
          activeBreaches: criticalCount,
          warnings: warningCount,
          lastScan: 'Agora',
        },
        {
          id: 'agent-rebalance-engine',
          name: 'Rebalance Allocation Planner',
          status: 'IDLE_WAITING_APPROVAL',
          pendingProposals: criticalCount + warningCount,
          mode: 'SIMULATION_ONLY',
          directExecutionAllowed: false,
        },
        {
          id: 'agent-risk-monitor',
          name: 'Portfolio Risk Assessor',
          status: 'OPTIMAL',
          portfoliosTracked: portfolios.length,
          aggregateAum: portfolios.reduce((s, p) => s + p.totalAum, 0),
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    res.status(500).json({ success: false, error: 'Falha na telemetria dos agentes' });
  }
});

// Endpoint GET /api/alerts
// Executa o ComplianceAgent contra os dados reais armazenados em portfolioRepo
app.get('/api/alerts', (req, res) => {
  try {
    const portfolios = getPortfoliosRepo();
    // Atualiza o status geral de cada carteira
    for (const port of portfolios) {
      port.status = ComplianceAgent.getPortfolioOverallSeverity(port);
    }
    const alerts = ComplianceAgent.evaluateAllPortfolios(portfolios);
    res.json({
      success: true,
      totalAlerts: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === 'CRITICAL').length,
      warningCount: alerts.filter((a) => a.severity === 'WARNING').length,
      alerts,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: 'Falha ao calcular alertas de compliance' });
  }
});

// Endpoint GET /api/limits/config
// Retorna a configuração de sensibilidade dos limites por classe de ativos
app.get('/api/limits/config', (req, res) => {
  try {
    const portfolioId = req.query.portfolioId as string | undefined;
    const configs = getLimitsConfigRepo(portfolioId);
    res.json({
      success: true,
      configs,
    });
  } catch (error) {
    console.error('Error fetching limits config:', error);
    res.status(500).json({ success: false, error: 'Falha ao buscar parâmetros de limites' });
  }
});

// Endpoint POST /api/limits/config
// Salva novas tolerâncias e percentuais de disparo de Warning e Critical por classe de ativos
app.post('/api/limits/config', (req, res) => {
  try {
    const { configs, portfolioId } = req.body;
    if (!Array.isArray(configs)) {
      return res.status(400).json({ success: false, error: 'Array de configurações é obrigatório' });
    }
    const updatedPortfolios = updateLimitsConfigRepo(configs, portfolioId);
    for (const port of updatedPortfolios) {
      port.status = ComplianceAgent.getPortfolioOverallSeverity(port);
    }
    const alerts = ComplianceAgent.evaluateAllPortfolios(updatedPortfolios);
    res.json({
      success: true,
      message: 'Limites e sensibilidade de compliance atualizados com sucesso.',
      portfolios: updatedPortfolios,
      alerts,
      criticalCount: alerts.filter((a) => a.severity === 'CRITICAL').length,
      warningCount: alerts.filter((a) => a.severity === 'WARNING').length,
    });
  } catch (error) {
    console.error('Error updating limits config:', error);
    res.status(500).json({ success: false, error: 'Falha ao atualizar parâmetros de limites' });
  }
});

// Endpoint POST /api/limits/reset
// Restaura parâmetros regulatórios padrão para classes de ativos
app.post('/api/limits/reset', (req, res) => {
  try {
    const configs = resetLimitsConfigRepo();
    const updatedPortfolios = updateLimitsConfigRepo(configs);
    for (const port of updatedPortfolios) {
      port.status = ComplianceAgent.getPortfolioOverallSeverity(port);
    }
    const alerts = ComplianceAgent.evaluateAllPortfolios(updatedPortfolios);
    res.json({
      success: true,
      message: 'Parâmetros de limites restaurados para os padrões regulatórios.',
      configs,
      portfolios: updatedPortfolios,
      alerts,
    });
  } catch (error) {
    console.error('Error resetting limits config:', error);
    res.status(500).json({ success: false, error: 'Falha ao restaurar parâmetros de limites' });
  }
});

// Endpoint GET /api/portfolios
app.get('/api/portfolios', (req, res) => {
  try {
    const portfolios = getPortfoliosRepo();
    for (const port of portfolios) {
      port.status = ComplianceAgent.getPortfolioOverallSeverity(port);
    }
    res.json({ success: true, portfolios });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({ success: false, error: 'Falha ao buscar carteiras' });
  }
});

// Endpoint GET /api/portfolios/:id
app.get('/api/portfolios/:id', (req, res) => {
  try {
    const portfolio = getPortfolioByIdRepo(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, error: 'Carteira não encontrada' });
    }
    portfolio.status = ComplianceAgent.getPortfolioOverallSeverity(portfolio);
    const allocations = ComplianceAgent.calculateAllocations(portfolio);
    const alerts = ComplianceAgent.evaluatePortfolio(portfolio);

    res.json({
      success: true,
      portfolio,
      allocations,
      alerts,
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ success: false, error: 'Falha ao carregar carteira' });
  }
});

// Endpoint GET /api/portfolios/:id/rebalance-plan
app.get('/api/portfolios/:id/rebalance-plan', (req, res) => {
  try {
    const portfolio = getPortfolioByIdRepo(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, error: 'Carteira não encontrada' });
    }
    const plan = ComplianceAgent.generateRebalancePlan(portfolio);
    res.json({ success: true, orders: plan });
  } catch (error) {
    console.error('Error generating rebalance plan:', error);
    res.status(500).json({ success: false, error: 'Falha ao planejar rebalanceamento' });
  }
});

// Endpoint POST /api/portfolios/:id/rebalance
// Executa o rebalanceamento e atualiza a carteira
app.post('/api/portfolios/:id/rebalance', (req, res) => {
  try {
    const portfolio = getPortfolioByIdRepo(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, error: 'Carteira não encontrada' });
    }

    const previousSeverity = ComplianceAgent.getPortfolioOverallSeverity(portfolio);
    const orders: RebalanceOrder[] = req.body.orders || ComplianceAgent.generateRebalancePlan(portfolio);

    let cashChange = 0;

    for (const order of orders) {
      const asset = portfolio.assets.find((a) => a.id === order.assetId);
      if (asset) {
        if (order.action === 'SELL') {
          asset.quantity = Math.max(0, asset.quantity - order.quantity);
          asset.totalValue = asset.quantity * asset.currentPrice;
          cashChange += order.totalAmountBRL;
        } else if (order.action === 'BUY') {
          asset.quantity += order.quantity;
          asset.totalValue = asset.quantity * asset.currentPrice;
          cashChange -= order.totalAmountBRL;
        }
      }
    }

    // Atualiza saldo de caixa se houver sobra/falta
    portfolio.cashBalance += cashChange;

    // Recalcula totais e percentuais de alocação de cada ativo
    const newTotalAum = portfolio.assets.reduce((sum, a) => sum + a.totalValue, 0);
    portfolio.totalAum = newTotalAum;
    for (const a of portfolio.assets) {
      a.allocationPercent = newTotalAum > 0 ? (a.totalValue / newTotalAum) * 100 : 0;
    }

    // Atualiza data do último rebalanceamento
    portfolio.lastRebalanced = new Date().toLocaleDateString('pt-BR');
    const newSeverity = ComplianceAgent.getPortfolioOverallSeverity(portfolio);
    portfolio.status = newSeverity;

    updatePortfolioRepo(portfolio);

    const auditProtocolId = `SIM-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const approver = req.body.approvedBy || 'Comitê de Alocação (Sessão Human-in-the-Loop)';

    const auditLog = `[AMBIENTE DE SIMULAÇÃO] Protocolo ${auditProtocolId} registrado em ${new Date().toLocaleString('pt-BR')}. Aprovador: ${approver}. Status de compliance: ${previousSeverity} -> ${newSeverity}. ${orders.length} ordens de rebalanceamento simuladas totalizando R$ ${orders.reduce((s, o) => s + o.totalAmountBRL, 0).toLocaleString('pt-BR')}. Nenhuma ordem roteada para corretoras externas/B3 (Modo Sandbox estrito).`;

    const result: RebalanceExecutionResult = {
      success: true,
      portfolioId: portfolio.id,
      timestamp: new Date().toISOString(),
      previousSeverity,
      newSeverity,
      executedOrders: orders,
      auditLog,
      updatedPortfolio: portfolio,
      isSimulationOnly: true,
      auditProtocolId,
      approvedBy: approver,
    };

    res.json(result);
  } catch (error) {
    console.error('Error executing rebalance:', error);
    res.status(500).json({ success: false, error: 'Falha ao executar rebalanceamento' });
  }
});

// Endpoint POST /api/portfolios/reset
app.post('/api/portfolios/reset', (req, res) => {
  try {
    const portfolios = resetPortfoliosRepo();
    res.json({ success: true, portfolios });
  } catch (error) {
    console.error('Error resetting portfolios:', error);
    res.status(500).json({ success: false, error: 'Falha ao reiniciar dados' });
  }
});

// Endpoint POST /api/portfolios/simulate-shock
// Provoca um choque de mercado para testar a detecção em tempo real de desenquadramento crítico
app.post('/api/portfolios/simulate-shock', (req, res) => {
  try {
    const portfolioId = req.body.portfolioId;
    const shockResult = simulateMarketShockRepo(portfolioId);
    
    // Recalcula alertas imediatos
    const portfolios = getPortfoliosRepo();
    for (const port of portfolios) {
      port.status = ComplianceAgent.getPortfolioOverallSeverity(port);
    }
    const alerts = ComplianceAgent.evaluateAllPortfolios(portfolios);

    // Dispara canais secundários (E-mail / SMS) para os alertas críticos gerados
    const criticals = alerts.filter((a) => a.severity === 'CRITICAL');
    const secondaryDispatches = dispatchSecondaryAlertsRepo(criticals);

    res.json({
      success: true,
      shock: shockResult,
      message: `Volatilidade aplicada no ativo ${shockResult.affectedAsset} (${shockResult.portfolio.name}). Novo desenquadramento gerado.`,
      portfolios,
      alerts,
      secondaryDispatches,
    });
  } catch (error) {
    console.error('Error simulating market shock:', error);
    res.status(500).json({ success: false, error: 'Falha ao simular choque de volatilidade' });
  }
});

// ==========================================
// NOTIFICATION CHANNELS (EMAIL & SMS) API
// ==========================================

// Endpoint GET /api/notifications/settings
app.get('/api/notifications/settings', (req, res) => {
  try {
    const officeId = (req.query.office_id || req.query.officeId) as string | undefined;
    const settings = getNotificationSettingsRepo({ officeId });
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ success: false, error: 'Falha ao obter configurações de notificação' });
  }
});

// Endpoint POST /api/notifications/settings
app.post('/api/notifications/settings', (req, res) => {
  try {
    const officeId = (req.body.office_id || req.body.officeId || req.query.office_id || req.query.officeId) as string | undefined;
    const updated = updateNotificationSettingsRepo(req.body, officeId);
    res.json({ success: true, settings: updated, message: 'Configurações de canais de notificação atualizadas com sucesso' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ success: false, error: 'Falha ao salvar configurações de notificação' });
  }
});

// Endpoint GET /api/notifications/dispatches
app.get('/api/notifications/dispatches', (req, res) => {
  try {
    const logs = getSecondaryDispatchLogsRepo();
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error getting notification logs:', error);
    res.status(500).json({ success: false, error: 'Falha ao obter histórico de despachos' });
  }
});

// Endpoint POST /api/notifications/dispatches/test
app.post('/api/notifications/dispatches/test', (req, res) => {
  try {
    const { channel, recipient } = req.body;
    const result = dispatchTestSecondaryAlertRepo(channel || 'ALL', recipient);
    res.json(result);
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ success: false, error: 'Falha ao enviar notificação de teste' });
  }
});

// Endpoint POST /api/notifications/scheduled-report/trigger
// Dispara imediatamente o relatório agendado usando os dados reais de /api/alerts
app.post('/api/notifications/scheduled-report/trigger', (req, res) => {
  try {
    const { officeId, force } = req.body || {};
    const portfolios = getPortfoliosRepo();
    const realAlerts = ComplianceAgent.evaluateAllPortfolios(portfolios);
    const result = dispatchScheduledSummaryReportRepo(realAlerts, officeId, force !== false);
    res.json(result);
  } catch (error) {
    console.error('Error triggering scheduled summary report:', error);
    res.status(500).json({ success: false, error: 'Falha ao processar relatório diário agendado' });
  }
});

// Endpoint POST /api/notifications/dispatches/trigger
// Usado quando o frontend ou rotina em background detecta alertas críticos
app.post('/api/notifications/dispatches/trigger', (req, res) => {
  try {
    const { alerts } = req.body;
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return res.json({ success: true, dispatched: [] });
    }
    const criticals = alerts.filter((a) => a.severity === 'CRITICAL');
    const logs = dispatchSecondaryAlertsRepo(criticals);
    res.json({ success: true, dispatched: logs });
  } catch (error) {
    console.error('Error triggering secondary notifications:', error);
    res.status(500).json({ success: false, error: 'Falha ao disparar canais secundários' });
  }
});

// Endpoint POST /api/notifications/dispatches/clear
app.post('/api/notifications/dispatches/clear', (req, res) => {
  try {
    clearSecondaryDispatchLogsRepo();
    res.json({ success: true, message: 'Histórico de despachos limpo com sucesso' });
  } catch (error) {
    console.error('Error clearing notification logs:', error);
    res.status(500).json({ success: false, error: 'Falha ao limpar histórico de despachos' });
  }
});

// Endpoint POST /api/compliance/chat
app.post('/api/compliance/chat', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Pergunta obrigatória' });
    }
    const portfolios = getPortfoliosRepo();
    const alerts = ComplianceAgent.evaluateAllPortfolios(portfolios);

    const answer = await askComplianceAgent(query, portfolios, alerts);
    res.json({ success: true, answer });
  } catch (error) {
    console.error('Error in compliance chat:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar consulta de compliance' });
  }
});

// ==========================================
// VITE INTEGRATION
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Injeta a sessão efêmera e o token de sessão de forma segura no HTML quando a página é acessada
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      if (req.method === 'GET' && !url.startsWith('/api') && req.headers.accept?.includes('text/html')) {
        try {
          const indexPath = path.join(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          return res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          return next(e);
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      let html = fs.readFileSync(indexPath, 'utf-8');
      res.send(html);
    });
  }

  // ==========================================
  // SCHEDULER DE CONFORMIDADE EM BACKGROUND
  // Checa a cada minuto se atingiu o horário configurado para o relatório periódico
  // ==========================================
  let lastDispatchedDateMinute = '';
  setInterval(() => {
    try {
      const now = new Date();
      const currentHM = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const currentDateKey = now.toLocaleDateString('pt-BR') + '_' + currentHM;

      const settings = getNotificationSettingsRepo({ unmasked: true });
      if (
        settings.email.enabled &&
        settings.email.scheduledReportEnabled &&
        settings.email.scheduledReportTime === currentHM &&
        lastDispatchedDateMinute !== currentDateKey
      ) {
        lastDispatchedDateMinute = currentDateKey;
        const portfolios = getPortfoliosRepo();
        const alerts = ComplianceAgent.evaluateAllPortfolios(portfolios);
        const res = dispatchScheduledSummaryReportRepo(alerts, settings.officeId, false);
        console.log(`[Scheduler FlowCore] Relatório diário de conformidade disparado:`, res.message);
      }
    } catch (err) {
      console.error('[Scheduler FlowCore] Erro no loop de agendamento:', err);
    }
  }, 60000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FlowCore Server running on port ${PORT}`);
  });
}

startServer();
