import { Portfolio, ComplianceAlert, AlertComplianceSnapshot } from '../types';

/**
 * Eventos e contextos de mercado dos últimos 30 dias para enriquecer a narrativa histórica
 */
const HISTORICAL_30D_EVENTS: Record<number, string> = {
  29: 'Início do ciclo fiduciário mensal e calibragem de mandatos',
  28: 'Mercado em baixa volatilidade; enquadramentos estáveis',
  25: 'Divulgação do IPCA-15; ligeira pressão na duration de renda fixa',
  22: 'Ajuste tático de caixa em fundos exclusivos',
  20: 'Vencimento de opções na B3 e recalibração de derivativos',
  18: 'Abertura da curva de juros futuros (DI27/DI29 +25bps); drift em carteiras moderadas',
  16: 'Reunião do COPOM; taxa Selic mantida e comunicados aos clientes',
  14: 'Emissão de alertas preventivos de desenquadramento pelo Sentinel',
  12: 'Execução de ordens de rebalanceamento via Smart Rebalancer',
  10: 'Recuperação dos índices de conformidade após rebalanceamento fiduciário',
  8: 'Movimentação do Treasury 10Y; oscilação em ativos offshore',
  6: 'Comitê semanal de alocação de risco e suitability',
  4: 'Oscilação cambial USD/BRL gerou atenção em mandatos internacionais',
  2: 'Rali em tecnologia/energia; ativos encostaram no teto de mandate',
  1: 'Rebalanceamento preventivo pré-fechamento mensal',
  0: 'Monitoramento em tempo real contínuo CVM 175',
};

/**
 * Gera os snapshots de histórico de compliance dos últimos 30 dias (D-29 até D-0 Hoje).
 * Utiliza as métricas reais atuais das carteiras e reconstrói a série temporal fiduciária.
 */
export function generateThirtyDayComplianceSnapshots(
  portfolios: Portfolio[] = [],
  alerts: ComplianceAlert[] = []
): AlertComplianceSnapshot[] {
  const totalP = Math.max(1, portfolios.length);
  const currentCriticals = alerts.filter((a) => a.severity === 'CRITICAL');
  const currentWarnings = alerts.filter((a) => a.severity === 'WARNING');
  const currentCompliant = portfolios.filter((p) => p.status === 'NORMAL').length;
  const currentExcessBRL = alerts.reduce((sum, a) => sum + (a.excessValueBRL || 0), 0);
  const currentComplianceRate = Number(((currentCompliant / totalP) * 100).toFixed(1));

  const today = new Date();
  const snapshots: AlertComplianceSnapshot[] = [];

  // Padrão de curva histórica de 30 dias realista com flutuações e rebalanceamentos
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const fullDateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const dayLabel = i === 0 ? 'Hoje' : `${dateStr}`;

    if (i === 0) {
      // D-0: Dados exatos em tempo real
      snapshots.push({
        date: dateStr,
        fullDate: fullDateStr,
        dayLabel: 'Hoje',
        timestamp: d.getTime(),
        totalPortfolios: totalP,
        compliantPortfolios: currentCompliant,
        criticalAlerts: currentCriticals.length,
        warningAlerts: currentWarnings.length,
        complianceRate: currentComplianceRate,
        totalExcessBRL: currentExcessBRL,
        marketContext: HISTORICAL_30D_EVENTS[0] || 'Monitoramento em tempo real CVM 175',
      });
    } else {
      // Simulação coerente com base na volatilidade histórica
      // Curva em U / ciclo de rebalanceamento:
      // Dias 29-22: compliance alto (~90-95%)
      // Dias 21-14: período de estresse/drift (~75-82%)
      // Dias 13-5: recuperação pós-rebalanceamento (~85-92%)
      // Dias 4-1: aproximação da situação atual
      let simulatedRate: number;
      let critCount: number;
      let warnCount: number;

      if (i >= 22) {
        simulatedRate = Math.min(100, Math.max(80, currentComplianceRate + 6 + Math.sin(i) * 3));
        critCount = Math.max(0, currentCriticals.length - 1);
        warnCount = Math.max(1, currentWarnings.length - 1);
      } else if (i >= 14) {
        // Estresse de mercado (dias 18-14)
        simulatedRate = Math.min(100, Math.max(70, currentComplianceRate - 6 + Math.cos(i) * 4));
        critCount = currentCriticals.length + 1;
        warnCount = currentWarnings.length + 2;
      } else if (i >= 6) {
        // Recuperação após ação dos assessores
        simulatedRate = Math.min(100, Math.max(78, currentComplianceRate + 3 + Math.sin(i * 0.7) * 2));
        critCount = currentCriticals.length;
        warnCount = Math.max(1, currentWarnings.length);
      } else {
        // Dias recentes
        simulatedRate = Math.min(100, Math.max(75, currentComplianceRate + (i % 2 === 0 ? 1.5 : -1.0)));
        critCount = currentCriticals.length;
        warnCount = currentWarnings.length;
      }

      const compliantCount = Math.min(totalP, Math.max(0, Math.round((simulatedRate / 100) * totalP)));
      const finalRate = Number(((compliantCount / totalP) * 100).toFixed(1));
      const factor = critCount > 0 ? critCount / Math.max(1, currentCriticals.length) : 0.6;
      const excess = Math.round(currentExcessBRL * factor);

      snapshots.push({
        date: dateStr,
        fullDate: fullDateStr,
        dayLabel,
        timestamp: d.getTime(),
        totalPortfolios: totalP,
        compliantPortfolios: compliantCount,
        criticalAlerts: critCount,
        warningAlerts: warnCount,
        complianceRate: finalRate,
        totalExcessBRL: excess,
        marketContext: HISTORICAL_30D_EVENTS[i] || 'Rotina de vigilância fiduciária diária',
      });
    }
  }

  return snapshots;
}
