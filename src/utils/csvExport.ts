import { Portfolio, ComplianceAlert, AlertComplianceSnapshot } from '../types';

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

/**
 * Generates and downloads the comprehensive 30-Day Compliance History report in CSV format
 * matching the exact historical trajectory displayed on the 30-day Recharts chart.
 */
export function downloadThirtyDayComplianceHistoryCSV(
  snapshots: AlertComplianceSnapshot[],
  portfolios: Portfolio[],
  alerts: ComplianceAlert[]
): void {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeFormatted = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');

  const totalAum = portfolios.reduce((sum, p) => sum + p.totalAum, 0);
  const totalP = Math.max(1, portfolios.length);
  const compliantPortfolios = portfolios.filter((p) => p.status === 'NORMAL');
  const warningPortfolios = portfolios.filter((p) => p.status === 'WARNING');
  const criticalPortfolios = portfolios.filter((p) => p.status === 'CRITICAL');
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  const warningAlerts = alerts.filter((a) => a.severity === 'WARNING');
  const totalExcessBRL = alerts.reduce((sum, a) => sum + a.excessValueBRL, 0);

  // Aggregated stats over the 30-day series
  const currentRate = snapshots.length > 0 ? snapshots[snapshots.length - 1].complianceRate : 0;
  const initialRate = snapshots.length > 0 ? snapshots[0].complianceRate : 0;
  const delta = Number((currentRate - initialRate).toFixed(1));
  const avgRate = snapshots.length > 0
    ? Number((snapshots.reduce((acc, s) => acc + s.complianceRate, 0) / snapshots.length).toFixed(1))
    : 0;
  const minRate = snapshots.length > 0 ? Math.min(...snapshots.map((s) => s.complianceRate)) : 0;
  const maxRate = snapshots.length > 0 ? Math.max(...snapshots.map((s) => s.complianceRate)) : 0;
  const daysAboveTarget = snapshots.filter((s) => s.complianceRate >= 80).length;
  const pctDaysAboveTarget = snapshots.length > 0 ? Math.round((daysAboveTarget / snapshots.length) * 100) : 0;

  const startDateLabel = snapshots.length > 0 ? (snapshots[0].fullDate || snapshots[0].date) : '-';
  const endDateLabel = snapshots.length > 0 ? (snapshots[snapshots.length - 1].fullDate || snapshots[snapshots.length - 1].date) : '-';

  const rows: string[] = [];

  // =========================================================================
  // 1. EXECUTIVE HEADER
  // =========================================================================
  rows.push(['RELATÓRIO HISTÓRICO DE CONFORMIDADE FIDUCIÁRIA - ÚLTIMOS 30 DIAS'].map(escapeCSV).join(','));
  rows.push(['FlowCore ComplianceAgent - Sistema de Monitoramento Contínuo de Mandatos e Portfólios'].map(escapeCSV).join(','));
  rows.push(['Data e Hora de Geração', timeFormatted].map(escapeCSV).join(','));
  rows.push(['Marco Regulatório de Referência', 'Resolução CVM 175 / Código ANBIMA de Administração de Recursos'].map(escapeCSV).join(','));
  rows.push(['Período Histórico Coberto', `${startDateLabel} a ${endDateLabel} (${snapshots.length} dias analisados)`].map(escapeCSV).join(','));
  rows.push(['Protocolo de Auditoria', `AUD-HIST30-${now.getTime().toString(36).toUpperCase()}`].map(escapeCSV).join(','));
  rows.push('');

  // =========================================================================
  // 2. CONSOLIDATED STATS SUMMARY (KPIS)
  // =========================================================================
  rows.push(['=== RESUMO ESTATÍSTICO DO PERÍODO (30 DIAS) ==='].map(escapeCSV).join(','));
  rows.push(['Métrica Consolidada', 'Valor Apurado', 'Parâmetro de Governança / Meta'].map(escapeCSV).join(','));
  rows.push(['Taxa de Conformidade Atual (Hoje)', `${currentRate.toFixed(1)}%`, 'Meta Mínima Regulatória: >= 80,0%'].map(escapeCSV).join(','));
  rows.push(['Taxa Média de Conformidade (30 Dias)', `${avgRate.toFixed(1)}%`, 'Tolerância Média Institucional: >= 75,0%'].map(escapeCSV).join(','));
  rows.push(['Piso Registrado no Período (Mínimo)', `${minRate.toFixed(1)}%`, 'Menor percentual registrado na série'].map(escapeCSV).join(','));
  rows.push(['Pico Registrado no Período (Máximo)', `${maxRate.toFixed(1)}%`, 'Maior percentual registrado na série'].map(escapeCSV).join(','));
  rows.push(['Variação Líquida no Período (D-29 vs Hoje)', `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} p.p.`, delta >= 0 ? 'Trajetória Positiva de Enquadramento' : 'Alargamento de Desvios'].map(escapeCSV).join(','));
  rows.push(['Dias em Conformidade Plena (>= 80%)', `${daysAboveTarget} de ${snapshots.length} dias (${pctDaysAboveTarget}%)`, 'Meta Institucional: >= 80% dos dias'].map(escapeCSV).join(','));
  rows.push(['Total de Carteiras Monitoradas', String(totalP), 'Total de carteiras sob mandato ativo'].map(escapeCSV).join(','));
  rows.push(['Patrimônio Total sob Gestão (AUM)', `R$ ${formatCurrency(totalAum)}`, 'Patrimônio sob supervisão contínua'].map(escapeCSV).join(','));
  rows.push(['Carteiras Rigorosamente Conformes Hoje', `${compliantPortfolios.length} de ${totalP} (${Math.round((compliantPortfolios.length / totalP) * 100)}%)`, 'Status: NORMAL'].map(escapeCSV).join(','));
  rows.push(['Carteiras em Atenção Hoje (Tolerância)', `${warningPortfolios.length}`, 'Desvio <= +5,0 p.p.'].map(escapeCSV).join(','));
  rows.push(['Desenquadramentos Críticos Ativos Hoje', `${criticalPortfolios.length}`, 'Desvio > +5,0 p.p. (Ação Imediata)'].map(escapeCSV).join(','));
  rows.push(['Alertas Críticos Ativos', `${criticalAlerts.length}`, 'Violações severas de teto'].map(escapeCSV).join(','));
  rows.push(['Volume Financeiro a Rebalancear Hoje', `R$ ${formatCurrency(totalExcessBRL)}`, 'Excedente acumulado fora dos mandatos'].map(escapeCSV).join(','));
  rows.push('');

  // =========================================================================
  // 3. DAILY 30-DAY HISTORICAL SNAPSHOT TABLE
  // =========================================================================
  rows.push(['=== SÉRIE TEMPORAL HISTÓRICA DIÁRIA (30 DIAS) ==='].map(escapeCSV).join(','));
  rows.push([
    'Data de Aferição',
    'Rótulo / Dia da Semana',
    'Taxa de Conformidade (%)',
    'Meta Regulatória (%)',
    'Status Frente à Meta',
    'Carteiras em Conformidade (Qtd)',
    'Total de Carteiras Monitoradas',
    'Percentual Conforme (%)',
    'Desenquadramentos Críticos (Qtd)',
    'Alertas em Atenção (Qtd)',
    'Volume Excedente a Rebalancear (BRL)',
    'Contexto Normativo e de Mercado',
  ].map(escapeCSV).join(','));

  // Write snapshots chronological or reverse (chronological is standard for time-series)
  snapshots.forEach((snap) => {
    const isTargetMet = snap.complianceRate >= 80;
    const compliantPct = snap.totalPortfolios > 0
      ? ((snap.compliantPortfolios / snap.totalPortfolios) * 100).toFixed(1)
      : '0.0';

    rows.push([
      snap.fullDate || snap.date,
      snap.dayLabel,
      snap.complianceRate.toFixed(1) + '%',
      '80,0%',
      isTargetMet ? 'META ATINGIDA' : 'ABAIXO DA META',
      String(snap.compliantPortfolios),
      String(snap.totalPortfolios),
      compliantPct + '%',
      String(snap.criticalAlerts),
      String(snap.warningAlerts),
      formatCurrency(snap.totalExcessBRL),
      snap.marketContext || 'Aferição fiduciária regular',
    ].map(escapeCSV).join(','));
  });

  rows.push('');

  // =========================================================================
  // 4. PORTFOLIOS CURRENT STANDING SNAPSHOT (HOJE)
  // =========================================================================
  rows.push(['=== POSIÇÃO ATUAL DAS CARTEIRAS MONITORADAS (HOJE) ==='].map(escapeCSV).join(','));
  rows.push([
    'ID da Carteira',
    'Nome da Carteira',
    'Cliente Titular',
    'Perfil de Risco (IPS)',
    'AUM Atual (BRL)',
    'Status Fiduciário',
    'Desvio Máximo Apurado (p.p.)',
    'Alertas Ativos (Qtd)',
  ].map(escapeCSV).join(','));

  portfolios.forEach((port) => {
    const portAlerts = alerts.filter((a) => a.portfolioId === port.id);
    const maxDev = portAlerts.reduce((max, a) => Math.max(max, a.deviationPP), 0);

    rows.push([
      port.id,
      port.name,
      port.clientName,
      port.profile,
      formatCurrency(port.totalAum),
      port.status === 'CRITICAL' ? 'DESENQUADRADO' : port.status === 'WARNING' ? 'ATENÇÃO' : 'NORMAL (CONFORME)',
      maxDev > 0 ? `+${maxDev.toFixed(1)} p.p.` : '0,0 p.p.',
      String(portAlerts.length),
    ].map(escapeCSV).join(','));
  });

  rows.push('');

  // =========================================================================
  // 5. ACTIVE COMPLIANCE BREACHES DETAIL
  // =========================================================================
  rows.push(['=== DETALHAMENTO DE DESENQUADRAMENTOS ATIVOS ==='].map(escapeCSV).join(','));
  rows.push([
    'ID do Alerta',
    'Carteira',
    'Classe de Ativo',
    'Alocação Atual (%)',
    'Teto Regulatório (%)',
    'Desvio Fiduciário (p.p.)',
    'Severidade',
    'Volume Excedente a Rebalancear (BRL)',
    'Ação Recomendada pelo ComplianceAgent',
    'Data de Detecção',
  ].map(escapeCSV).join(','));

  if (alerts.length === 0) {
    rows.push(['Nenhum alerta ou desenquadramento ativo no momento.'].map(escapeCSV).join(','));
  } else {
    alerts.forEach((alert) => {
      rows.push([
        alert.id,
        alert.portfolioName,
        alert.assetClass,
        alert.currentPercent.toFixed(1) + '%',
        alert.maxPercent.toFixed(1) + '%',
        `+${alert.deviationPP.toFixed(1)} p.p.`,
        alert.severity === 'CRITICAL' ? 'CRÍTICO' : 'ATENÇÃO',
        formatCurrency(alert.excessValueBRL),
        alert.suggestedAction,
        alert.timestamp || alert.effectiveDate || timeFormatted,
      ].map(escapeCSV).join(','));
    });
  }

  // Assemble CSV with UTF-8 BOM
  const csvContent = '\uFEFF' + rows.join('\r\n');

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_historico_conformidade_30dias_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

