import { Portfolio, ComplianceAlert, AlertComplianceSnapshot } from '../types';

/**
 * Generates the 30-day compliance snapshots (D-29 to D-0) based on current live portfolios and alerts.
 * Ensures consistent data between the Recharts visualization and CSV exports.
 */
export function generateThirtyDayComplianceSnapshots(
  portfolios: Portfolio[],
  alerts: ComplianceAlert[]
): AlertComplianceSnapshot[] {
  const today = new Date();
  const snapshots: AlertComplianceSnapshot[] = [];
  const totalP = Math.max(1, portfolios.length);

  const normalPortfoliosCount = portfolios.filter((p) => p.status === 'NORMAL').length;
  const currentCriticals = alerts.filter((a) => a.severity === 'CRITICAL');
  const currentWarnings = alerts.filter((a) => a.severity === 'WARNING');
  const currentCompliant = normalPortfoliosCount;
  const currentRate = Number(((currentCompliant / totalP) * 100).toFixed(1));
  const currentExcess = alerts.reduce((sum, a) => sum + a.excessValueBRL, 0);

  // 30 regulatory and market context events mapped historically
  const historicalContexts: {
    [offset: number]: {
      event: string;
      compliantDelta: number;
      critDelta: number;
      warnCount: number;
    };
  } = {
    29: { event: 'Início do mês regulatório e conferência de enquadramento CVM 175', compliantDelta: 1, critDelta: -1, warnCount: 1 },
    28: { event: 'Estabilidade em renda fixa e conformidade alta', compliantDelta: 1, critDelta: -1, warnCount: 0 },
    27: { event: 'Movimentação cambial pontual com leve desvio em ativos offshore', compliantDelta: 0, critDelta: 0, warnCount: 2 },
    26: { event: 'Divulgação da ata do Copom e reprecificação de NTN-B', compliantDelta: 0, critDelta: 0, warnCount: 1 },
    25: { event: 'Reunião do comitê de investimentos para revisão de limites', compliantDelta: 1, critDelta: -1, warnCount: 1 },
    24: { event: 'Leve estresse em juros futuros e oscilação de duration', compliantDelta: 0, critDelta: 0, warnCount: 2 },
    23: { event: 'Aportes em fundos multimercados macro', compliantDelta: 1, critDelta: -1, warnCount: 1 },
    22: { event: 'Encerramento de quinzena com 100% de mandatos revisados', compliantDelta: 1, critDelta: -1, warnCount: 0 },
    21: { event: 'Ajuste de margem de garantia em derivativos na B3', compliantDelta: 0, critDelta: 0, warnCount: 2 },
    20: { event: 'Rali em ações de commodities; drift em renda variável', compliantDelta: -1, critDelta: 1, warnCount: 2 },
    19: { event: 'Emissão de notificações preventivas para rebalanceamento', compliantDelta: -1, critDelta: 1, warnCount: 2 },
    18: { event: 'Execução de ordens de corte de exposição excedente', compliantDelta: 0, critDelta: 0, warnCount: 2 },
    17: { event: 'Volatilidade internacional em índices globais (S&P 500)', compliantDelta: 0, critDelta: 0, warnCount: 3 },
    16: { event: 'Conformidade plena retomada em fundos de pensão parceiros', compliantDelta: 1, critDelta: -1, warnCount: 1 },
    15: { event: 'Fechamento quinzenal de auditoria interna', compliantDelta: 1, critDelta: -1, warnCount: 1 },
    14: { event: 'Início de novo ciclo quinzenal de mandatos', compliantDelta: 1, critDelta: -1, warnCount: 1 },
    13: { event: 'Estabilidade nas taxas DI de curto e médio prazo', compliantDelta: 1, critDelta: -1, warnCount: 0 },
    12: { event: 'Entrada de novos cotistas e liquidação D+1', compliantDelta: 0, critDelta: 0, warnCount: 1 },
    11: { event: 'Leve desvio em títulos de crédito privado (debêntures incentivadas)', compliantDelta: 0, critDelta: 0, warnCount: 2 },
    10: { event: 'Revalidação de enquadramento em ativos ilíquidos', compliantDelta: 0, critDelta: 0, warnCount: 2 },
    9: { event: 'Ajuste de carteiras institucionais frente ao benchmark IPCA+', compliantDelta: 1, critDelta: -1, warnCount: 1 },
    8: { event: 'Mercado de capitais positivo e limites folgados', compliantDelta: 1, critDelta: -1, warnCount: 1 },
    7: { event: 'Comitê semanal de compliance e governança', compliantDelta: 1, critDelta: -1, warnCount: 1 },
    6: { event: 'Abertura de ciclo fiduciário semanal', compliantDelta: 1, critDelta: -1, warnCount: 1 },
    5: { event: 'Mercado estável e conformidade elevada', compliantDelta: 1, critDelta: -1, warnCount: 1 },
    4: { event: 'Oscilação cambial USD/BRL gerou atenção fiduciária', compliantDelta: 0, critDelta: 0, warnCount: 2 },
    3: { event: 'Rali em renda variável gerou drift acima do teto mandatório', compliantDelta: -1, critDelta: 1, warnCount: 2 },
    2: { event: 'Comitê de risco e emissão de alertas aos assessores', compliantDelta: -1, critDelta: 1, warnCount: 1 },
    1: { event: 'Início de rebalanceamento tático automatizado', compliantDelta: 0, critDelta: 0, warnCount: currentWarnings.length },
  };

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const fullDateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const weekdayStr = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const dayLabel = i === 0 ? 'Hoje' : `${weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1)} ${dateStr}`;

    if (i === 0) {
      snapshots.push({
        date: dateStr,
        fullDate: fullDateStr,
        dayLabel: 'Hoje',
        timestamp: d.getTime(),
        totalPortfolios: totalP,
        compliantPortfolios: currentCompliant,
        criticalAlerts: currentCriticals.length,
        warningAlerts: currentWarnings.length,
        complianceRate: currentRate,
        totalExcessBRL: currentExcess,
        marketContext: 'Aferição em tempo real pelo motor Sentinel CVM 175',
      });
    } else {
      const hist = historicalContexts[i];
      const compliantCount = Math.min(
        totalP,
        Math.max(1, currentCompliant + (hist ? hist.compliantDelta : 0))
      );
      const rate = Number(((compliantCount / totalP) * 100).toFixed(1));
      const critCount = Math.max(0, currentCriticals.length + (hist ? hist.critDelta : 0));
      const warnCount = hist ? hist.warnCount : 1;
      const excess = Math.max(
        0,
        currentExcess * (critCount > 0 ? critCount / Math.max(1, currentCriticals.length) : 0.4)
      );

      snapshots.push({
        date: dateStr,
        fullDate: fullDateStr,
        dayLabel,
        timestamp: d.getTime(),
        totalPortfolios: totalP,
        compliantPortfolios: compliantCount,
        criticalAlerts: critCount,
        warningAlerts: warnCount,
        complianceRate: rate,
        totalExcessBRL: excess,
        marketContext: hist?.event || 'Snapshot fiduciário regular CVM 175',
      });
    }
  }

  return snapshots;
}

/**
 * Calculates aggregated statistics for a snapshot series
 */
export interface SinglePortfolioHistorySnapshot {
  date: string;
  dayLabel: string;
  timestamp: number;
  complianceRate: number;
}

/**
 * Generates a mock 30-day compliance history for a single portfolio.
 */
export function generateSinglePortfolioHistory(
  portfolio: Portfolio,
  alerts: ComplianceAlert[]
): SinglePortfolioHistorySnapshot[] {
  const today = new Date();
  const snapshots: SinglePortfolioHistorySnapshot[] = [];

  const portfolioAlerts = alerts.filter((a) => a.portfolioId === portfolio.id);
  const criticalCount = portfolioAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = portfolioAlerts.filter((a) => a.severity === 'WARNING').length;

  let currentRate = 100;
  if (criticalCount > 0) currentRate = Math.max(50, 100 - criticalCount * 15);
  else if (warningCount > 0) currentRate = Math.max(80, 100 - warningCount * 5);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const weekdayStr = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const dayLabel = i === 0 ? 'Hoje' : `${weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1)} ${dateStr}`;

    if (i === 0) {
      snapshots.push({
        date: dateStr,
        dayLabel,
        timestamp: d.getTime(),
        complianceRate: currentRate,
      });
    } else {
      // Create a sensible trend based on the current rate
      const noise = Math.sin(i) * 5 + (Math.random() * 4 - 2); // random noise
      let historicalRate = currentRate + i * 0.5 + noise; 
      
      // If it's a critical portfolio, maybe it used to be better
      if (currentRate < 100) {
        historicalRate = currentRate + Math.min(i, 15) * 0.8 + noise;
      }
      
      historicalRate = Math.min(100, Math.max(0, historicalRate));

      snapshots.push({
        date: dateStr,
        dayLabel,
        timestamp: d.getTime(),
        complianceRate: Number(historicalRate.toFixed(1)),
      });
    }
  }

  return snapshots;
}

/**
 * Calculates aggregated statistics for a snapshot series
 */
export function calculateCompliancePeriodStats(snapshots: AlertComplianceSnapshot[]) {
  if (snapshots.length === 0) {
    return {
      current: 0,
      initial: 0,
      delta: 0,
      avg: 0,
      min: 0,
      max: 0,
      daysAboveTarget: 0,
      pctDaysAboveTarget: 0,
    };
  }

  const current = snapshots[snapshots.length - 1].complianceRate;
  const initial = snapshots[0].complianceRate;
  const delta = Number((current - initial).toFixed(1));
  const sum = snapshots.reduce((acc, s) => acc + s.complianceRate, 0);
  const avg = Number((sum / snapshots.length).toFixed(1));
  const min = Math.min(...snapshots.map((s) => s.complianceRate));
  const max = Math.max(...snapshots.map((s) => s.complianceRate));
  const daysAboveTarget = snapshots.filter((s) => s.complianceRate >= 80).length;
  const pctDaysAboveTarget = Math.round((daysAboveTarget / snapshots.length) * 100);

  return {
    current,
    initial,
    delta,
    avg,
    min,
    max,
    daysAboveTarget,
    pctDaysAboveTarget,
  };
}
