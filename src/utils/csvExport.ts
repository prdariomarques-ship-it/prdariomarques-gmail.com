import { Portfolio, ComplianceAlert } from '../types';

/**
 * Escapes values for RFC 4180 compliant CSV output
 */
function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // If string contains comma, quote, or newline, escape quotes and wrap in quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Formats currency values for clean CSV export
 */
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Generates and downloads the comprehensive Portfolio Compliance Summary report in CSV format
 */
export function downloadPortfolioComplianceReportCSV(
  portfolios: Portfolio[],
  alerts: ComplianceAlert[]
): void {
  const totalAum = portfolios.reduce((sum, p) => sum + p.totalAum, 0);
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  const warningAlerts = alerts.filter((a) => a.severity === 'WARNING');
  const normalPortfolios = portfolios.filter((p) => p.status === 'NORMAL');
  const warningPortfolios = portfolios.filter((p) => p.status === 'WARNING');
  const criticalPortfolios = portfolios.filter((p) => p.status === 'CRITICAL');
  const totalExcessBRL = alerts.reduce((sum, a) => sum + a.excessValueBRL, 0);
  const complianceRate = portfolios.length > 0 ? (normalPortfolios.length / portfolios.length) * 100 : 0;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeFormatted = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');

  const rows: string[] = [];

  // =========================================================================
  // 1. EXECUTIVE SUMMARY HEADER
  // =========================================================================
  rows.push(['RELATÓRIO CONSOLIDADO DE CONFORMIDADE E ENQUADRAMENTO FIDUCIÁRIO (CVM / IPS)'].map(escapeCSV).join(','));
  rows.push(['FlowCore ComplianceAgent - Sistema de Monitoramento Contínuo de Mandatos'].map(escapeCSV).join(','));
  rows.push(['Data e Hora de Geração', timeFormatted].map(escapeCSV).join(','));
  rows.push(['Padrão Regulatório', 'Resolução CVM 175 / Código ANBIMA de Administração de Recursos de Terceiros'].map(escapeCSV).join(','));
  rows.push('');

  // KPI KPI Row
  rows.push(['=== INDICADORES GLOBAIS DE CONFORMIDADE ==='].map(escapeCSV).join(','));
  rows.push([
    'Métrica',
    'Valor Consolidado',
    'Detalhamento / Percentual',
  ].map(escapeCSV).join(','));
  rows.push([
    'Patrimônio sob Gestão (AUM Total)',
    `R$ ${formatCurrency(totalAum)}`,
    `${portfolios.length} carteiras administradas`,
  ].map(escapeCSV).join(','));
  rows.push([
    'Taxa de Conformidade da Casa',
    `${complianceRate.toFixed(1)}%`,
    `${normalPortfolios.length} de ${portfolios.length} carteiras enquadradas`,
  ].map(escapeCSV).join(','));
  rows.push([
    'Carteiras em Desenquadramento Crítico',
    `${criticalPortfolios.length}`,
    'Desvio superior a 5.0 p.p. do limite máximo',
  ].map(escapeCSV).join(','));
  rows.push([
    'Carteiras em Atenção (Tolerância)',
    `${warningPortfolios.length}`,
    'Desvio de até 5.0 p.p. dentro da margem de tolerância',
  ].map(escapeCSV).join(','));
  rows.push([
    'Total de Alertas de Compliance Ativos',
    `${alerts.length}`,
    `${criticalAlerts.length} críticos | ${warningAlerts.length} em atenção`,
  ].map(escapeCSV).join(','));
  rows.push([
    'Volume Financeiro Excedente a Rebalancear',
    `R$ ${formatCurrency(totalExcessBRL)}`,
    'Capital necessário para readequação aos tetos de mandato',
  ].map(escapeCSV).join(','));
  rows.push('');

  // =========================================================================
  // 2. PORTFOLIO COMPLIANCE SUMMARY (TABLE 1)
  // =========================================================================
  rows.push(['=== RESUMO DE CONFORMIDADE POR CARTEIRA ==='].map(escapeCSV).join(','));
  rows.push([
    'ID da Carteira',
    'Código',
    'Nome da Carteira',
    'Cliente / Titular',
    'Gestor / Assessor Responsável',
    'Perfil de Risco',
    'Benchmark',
    'AUM Total (BRL)',
    'Saldo Caixa (BRL)',
    'Status de Conformidade',
    'Qtd Alertas Ativos',
    'Alertas Críticos',
    'Alertas Atenção',
    'Classes Desenquadradas',
    'Excesso Total a Rebalancear (BRL)',
    'Origens das Regras Violadas',
    'Política de Investimento Vinculada',
    'Último Rebalanceamento',
  ].map(escapeCSV).join(','));

  portfolios.forEach((port) => {
    const portAlerts = alerts.filter((a) => a.portfolioId === port.id);
    const portCritical = portAlerts.filter((a) => a.severity === 'CRITICAL').length;
    const portWarning = portAlerts.filter((a) => a.severity === 'WARNING').length;
    const breachedClasses = Array.from(new Set(portAlerts.map((a) => a.assetClass))).join('; ') || 'Nenhuma';
    const totalPortExcess = portAlerts.reduce((sum, a) => sum + a.excessValueBRL, 0);
    const ruleSources = Array.from(new Set(portAlerts.map((a) => a.ruleSource))).join('; ') || 'Em Conformidade';

    const statusLabel =
      port.status === 'CRITICAL'
        ? 'DESENQUADRADO (CRÍTICO)'
        : port.status === 'WARNING'
        ? 'EM ATENÇÃO (WARNING)'
        : 'ENQUADRADA (NORMAL)';

    rows.push([
      port.id,
      port.code,
      port.name,
      port.clientName,
      port.manager,
      port.profile,
      port.benchmark,
      port.totalAum.toFixed(2),
      port.cashBalance.toFixed(2),
      statusLabel,
      portAlerts.length,
      portCritical,
      portWarning,
      breachedClasses,
      totalPortExcess.toFixed(2),
      ruleSources,
      port.assignedPolicyId || 'POL-DEFAULT-IPS',
      port.lastRebalanced,
    ].map(escapeCSV).join(','));
  });

  rows.push('');

  // =========================================================================
  // 3. DETAILED ACTIVE ALERTS & POLICIES BREAKDOWN (TABLE 2)
  // =========================================================================
  rows.push(['=== DETALHAMENTO DE DESENQUADRAMENTOS E ALERTAS ATIVOS ==='].map(escapeCSV).join(','));
  rows.push([
    'ID do Alerta',
    'ID da Carteira',
    'Nome da Carteira',
    'Cliente / Titular',
    'Classe de Ativo',
    'Severidade',
    'Origem da Regra (rule_source)',
    'Código da Política (policy_id)',
    'Alocação Atual (%)',
    'Limite Máximo do Mandato (%)',
    'Meta Alvo (%)',
    'Desvio Apurado (p.p.)',
    'Tolerância (p.p.)',
    'Excesso Financeiro Apurado (BRL)',
    'Ação Fiduciária Recomendada',
    'Diagnóstico Técnico / Notificação',
    'Contexto Fiduciário (Mandato vs Política Interna)',
    'Data Efetiva',
  ].map(escapeCSV).join(','));

  if (alerts.length === 0) {
    rows.push(['Nenhum alerta ativo no momento. Todas as carteiras operam em estrita conformidade com seus mandatos.'].map(escapeCSV).join(','));
  } else {
    alerts.forEach((alert) => {
      rows.push([
        alert.id,
        alert.portfolioId,
        alert.portfolioName,
        alert.clientName,
        alert.assetClass,
        alert.severity === 'CRITICAL' ? 'CRÍTICO' : 'ATENÇÃO',
        alert.ruleSource,
        alert.policyId,
        alert.currentValue.toFixed(2),
        alert.limit.toFixed(2),
        alert.targetPercent.toFixed(2),
        alert.difference.toFixed(2),
        alert.tolerancePP.toFixed(2),
        alert.excessValueBRL.toFixed(2),
        alert.suggestedAction,
        alert.message,
        alert.mandateVsInternalExplanation || '',
        alert.effectiveDate || alert.timestamp,
      ].map(escapeCSV).join(','));
    });
  }

  rows.push('');

  // =========================================================================
  // 4. ASSET CLASS ALLOCATION PER PORTFOLIO BREAKDOWN (TABLE 3)
  // =========================================================================
  rows.push(['=== ALOCAÇÃO POR CLASSE DE ATIVOS VS. LIMITES DE MANDATO ==='].map(escapeCSV).join(','));
  rows.push([
    'ID da Carteira',
    'Nome da Carteira',
    'Cliente',
    'Classe de Ativo',
    'Valor Atual na Classe (BRL)',
    'Alocação Atual (%)',
    'Limite Mínimo Mandato (%)',
    'Meta Alvo Mandato (%)',
    'Limite Máximo Mandato (%)',
    'Status de Enquadramento da Classe',
  ].map(escapeCSV).join(','));

  portfolios.forEach((port) => {
    port.mandateLimits.forEach((limit) => {
      const classAssets = port.assets.filter((a) => a.assetClass === limit.assetClass);
      const classTotalBRL = classAssets.reduce((s, a) => s + a.totalValue, 0);
      const currentPct = port.totalAum > 0 ? (classTotalBRL / port.totalAum) * 100 : 0;

      let status = 'ENQUADRADO';
      if (currentPct > limit.maxPercent) {
        status = currentPct > limit.maxPercent + 5 ? 'DESENQUADRAMENTO CRÍTICO' : 'ATENÇÃO (TOLERÂNCIA)';
      } else if (currentPct < limit.minPercent) {
        status = 'ABAIXO DO MÍNIMO';
      }

      rows.push([
        port.id,
        port.name,
        port.clientName,
        limit.assetClass,
        classTotalBRL.toFixed(2),
        currentPct.toFixed(2),
        limit.minPercent.toFixed(2),
        limit.targetPercent.toFixed(2),
        limit.maxPercent.toFixed(2),
        status,
      ].map(escapeCSV).join(','));
    });
  });

  // Assemble CSV with UTF-8 BOM to guarantee proper accents in Excel & Numbers
  const csvContent = '\uFEFF' + rows.join('\r\n');

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_conformidade_carteiras_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
