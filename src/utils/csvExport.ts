import { Portfolio, ComplianceAlert, AlertComplianceSnapshot } from '../types';

/**
 * Dispara o download de um arquivo CSV no navegador.
 */
function downloadBlob(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta o relatório consolidado de conformidade das carteiras para CSV.
 */
export function downloadPortfolioComplianceReportCSV(portfolios: Portfolio[] = [], alerts: ComplianceAlert[] = []) {
  const headers = [
    'ID Carteira',
    'Nome da Carteira',
    'Perfil Suitability',
    'Status Fiduciário',
    'Patrimônio Líquido (AUM)',
    'Total de Alertas',
    'Alertas Críticos',
    'Alertas de Atenção',
    'Excesso Total (R$)',
  ];

  const rows = portfolios.map((p) => {
    const pAlerts = alerts.filter((a) => a.portfolioId === p.id);
    const critCount = pAlerts.filter((a) => a.severity === 'CRITICAL').length;
    const warnCount = pAlerts.filter((a) => a.severity === 'WARNING').length;
    const excess = pAlerts.reduce((sum, a) => sum + (a.excessValueBRL || 0), 0);

    return [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.profile || ''}"`,
      `"${p.status}"`,
      p.totalAum.toFixed(2),
      pAlerts.length,
      critCount,
      warnCount,
      excess.toFixed(2),
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const filename = `relatorio_compliance_carteiras_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(csvContent, filename);
}

/**
 * Exporta o histórico de 30 dias de Compliance Score e eventos fiduciários para CSV.
 */
export function downloadThirtyDayComplianceHistoryCSV(
  snapshots: AlertComplianceSnapshot[] = [],
  portfolios: Portfolio[] = [],
  alerts: ComplianceAlert[] = []
) {
  const headers = [
    'Data',
    'Data Completa',
    'Compliance Score (%)',
    'Total de Carteiras',
    'Carteiras Conformes',
    'Alertas Críticos',
    'Alertas de Atenção',
    'Capital a Rebalancear (R$)',
    'Contexto / Evento de Mercado',
  ];

  const rows = snapshots.map((s) => [
    `"${s.date}"`,
    `"${s.fullDate}"`,
    s.complianceRate.toFixed(1),
    s.totalPortfolios,
    s.compliantPortfolios,
    s.criticalAlerts,
    s.warningAlerts,
    s.totalExcessBRL.toFixed(2),
    `"${(s.marketContext || '').replace(/"/g, '""')}"`,
  ].join(';'));

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const filename = `historico_compliance_30_dias_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(csvContent, filename);
}
