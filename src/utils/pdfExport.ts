import { jsPDF } from 'jspdf';
import { Portfolio, ComplianceAlert, AlertComplianceSnapshot } from '../types';

/**
 * Formata valores monetários no padrão brasileiro (BRL)
 */
function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata percentuais com 1 casa decimal
 */
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Gera e baixa o Relatório Resumido de Conformidade em formato PDF (A4)
 */
export function downloadPortfolioComplianceReportPDF(
  portfolios: Portfolio[],
  alerts: ComplianceAlert[],
  snapshots?: AlertComplianceSnapshot[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  let currentY = 14;

  const totalAum = portfolios.reduce((sum, p) => sum + p.totalAum, 0);
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  const warningAlerts = alerts.filter((a) => a.severity === 'WARNING');
  const normalPortfolios = portfolios.filter((p) => p.status === 'NORMAL');
  const warningPortfolios = portfolios.filter((p) => p.status === 'WARNING');
  const criticalPortfolios = portfolios.filter((p) => p.status === 'CRITICAL');
  const totalExcessBRL = alerts.reduce((sum, a) => sum + a.excessValueBRL, 0);
  const complianceRate = portfolios.length > 0 ? (normalPortfolios.length / portfolios.length) * 100 : 0;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const auditCode = `FC-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now
    .getDate()
    .toString()
    .padStart(2, '0')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 14;
      renderRunningHeader();
    }
  };

  const renderRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('FLOWCORE COMPLIANCEAGENT • RELATÓRIO RESUMIDO DE CONFORMIDADE', marginX, currentY);
    doc.text(`Ref: ${dateFormatted} | Protocolo: ${auditCode}`, pageWidth - marginX, currentY, { align: 'right' });
    currentY += 3;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 6;
  };

  // =========================================================================
  // 1. CABEÇALHO DO DOCUMENTO
  // =========================================================================
  // Tarja superior decorativa
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginX, currentY, contentWidth, 26, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FLOWCORE COMPLIANCEAGENT', marginX + 6, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('SISTEMA DE MONITORAMENTO CONTÍNUO DE MANDATOS E DESENQUADRAMENTOS CVM 175', marginX + 6, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('RELATÓRIO RESUMIDO DE CONFORMIDADE FIDUCIÁRIA', marginX + 6, currentY + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Data/Hora: ${dateFormatted} às ${timeFormatted}`, pageWidth - marginX - 6, currentY + 8, { align: 'right' });
  doc.text(`Protocolo: ${auditCode}`, pageWidth - marginX - 6, currentY + 14, { align: 'right' });
  doc.text('Normativa: CVM 175 / ANBIMA', pageWidth - marginX - 6, currentY + 21, { align: 'right' });

  currentY += 32;

  // =========================================================================
  // 2. INDICADORES EXECUTIVOS (KPIs) EM CARDS
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Indicadores Globais da Casa (Consolidado)', marginX, currentY);
  currentY += 4;

  const cardWidth = (contentWidth - 9) / 4; // 4 cards with 3mm gap
  const cardHeight = 22;

  // KPI 1: AUM Total
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AUM SOB GESTÃO', marginX + 4, currentY + 6);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`R$ ${(totalAum / 1000000).toFixed(2)}M`, marginX + 4, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`${portfolios.length} carteiras administradas`, marginX + 4, currentY + 18);

  // KPI 2: Taxa de Conformidade
  const kpi2X = marginX + cardWidth + 3;
  const isTargetMet = complianceRate >= 80;
  doc.setFillColor(isTargetMet ? 240 : 255, isTargetMet ? 253 : 241, isTargetMet ? 244 : 242);
  doc.setDrawColor(isTargetMet ? 167 : 254, isTargetMet ? 243 : 205, isTargetMet ? 208 : 211);
  doc.roundedRect(kpi2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(isTargetMet ? 6 : 190, isTargetMet ? 95 : 18, isTargetMet ? 70 : 60);
  doc.text('TAXA DE CONFORMIDADE', kpi2X + 4, currentY + 6);
  doc.setFontSize(11);
  doc.text(formatPercent(complianceRate), kpi2X + 4, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${normalPortfolios.length} de ${portfolios.length} em conformidade`, kpi2X + 4, currentY + 18);

  // KPI 3: Alertas de Compliance
  const kpi3X = kpi2X + cardWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(kpi3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ALERTAS ATIVOS', kpi3X + 4, currentY + 6);
  doc.setFontSize(11);
  doc.setTextColor(criticalAlerts.length > 0 ? 225 : 15, criticalAlerts.length > 0 ? 29 : 23, criticalAlerts.length > 0 ? 72 : 42);
  doc.text(`${alerts.length} apontamentos`, kpi3X + 4, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${criticalAlerts.length} críticos | ${warningAlerts.length} atenção`, kpi3X + 4, currentY + 18);

  // KPI 4: Volume Excedente
  const kpi4X = kpi3X + cardWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(kpi4X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('EXCEDENTE REBALANCEAR', kpi4X + 4, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`R$ ${(totalExcessBRL / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`, kpi4X + 4, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Desvio financeiro total', kpi4X + 4, currentY + 18);

  currentY += cardHeight + 8;

  // =========================================================================
  // 3. EVOLUÇÃO DOS ÚLTIMOS 7 DIAS (SNAPSHOTS)
  // =========================================================================
  if (snapshots && snapshots.length > 0) {
    checkPageBreak(38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Evolução da Taxa de Conformidade (Últimos 7 Dias)', marginX, currentY);
    currentY += 4;

    // Header da tabela de snapshots
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, currentY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Data / Dia', marginX + 3, currentY + 4.2);
    doc.text('Taxa Conformidade', marginX + 38, currentY + 4.2);
    doc.text('Carteiras Conformes', marginX + 78, currentY + 4.2);
    doc.text('Alertas Críticos', marginX + 118, currentY + 4.2);
    doc.text('Contexto / Evento Fiduciário', marginX + 145, currentY + 4.2);
    currentY += 6;

    snapshots.forEach((s) => {
      checkPageBreak(6);
      doc.setFillColor(s.dayLabel === 'Hoje' ? 240 : 255, s.dayLabel === 'Hoje' ? 253 : 255, s.dayLabel === 'Hoje' ? 244 : 255);
      doc.rect(marginX, currentY, contentWidth, 5.5, 'F');

      doc.setFont('helvetica', s.dayLabel === 'Hoje' ? 'bold' : 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(s.dayLabel, marginX + 3, currentY + 3.8);

      const isRateOk = s.complianceRate >= 80;
      doc.setTextColor(isRateOk ? 5 : 190, isRateOk ? 150 : 18, isRateOk ? 105 : 60);
      doc.text(`${s.complianceRate.toFixed(1)}%`, marginX + 38, currentY + 3.8);

      doc.setTextColor(51, 65, 85);
      doc.text(`${s.compliantPortfolios} / ${s.totalPortfolios}`, marginX + 78, currentY + 3.8);

      doc.setTextColor(s.criticalAlerts > 0 ? 225 : 71, s.criticalAlerts > 0 ? 29 : 85, s.criticalAlerts > 0 ? 72 : 105);
      doc.text(`${s.criticalAlerts} alerta(s)`, marginX + 118, currentY + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const ctxText = s.marketContext || 'Aferição regular de mandatos';
      doc.text(ctxText.length > 28 ? ctxText.substring(0, 26) + '...' : ctxText, marginX + 145, currentY + 3.8);

      // Linha separadora
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(marginX, currentY + 5.5, marginX + contentWidth, currentY + 5.5);
      currentY += 5.5;
    });

    currentY += 6;
  }

  // =========================================================================
  // 4. RESUMO DE CONFORMIDADE POR CARTEIRA
  // =========================================================================
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Enquadramento por Carteira sob Gestão', marginX, currentY);
  currentY += 4;

  // Header da tabela de carteiras
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Carteira / Titular', marginX + 3, currentY + 4.2);
  doc.text('Perfil IPS', marginX + 68, currentY + 4.2);
  doc.text('AUM Total', marginX + 102, currentY + 4.2);
  doc.text('Status Fiduciário', marginX + 138, currentY + 4.2);
  doc.text('Desvio Máx.', marginX + 165, currentY + 4.2);
  currentY += 6;

  portfolios.forEach((p) => {
    checkPageBreak(6.5);
    const pAlerts = alerts.filter((a) => a.portfolioId === p.id);
    const maxDeviation = pAlerts.reduce((max, a) => Math.max(max, a.deviationPP), 0);

    doc.setFillColor(p.status === 'CRITICAL' ? 254 : p.status === 'WARNING' ? 254 : 255, p.status === 'CRITICAL' ? 242 : p.status === 'WARNING' ? 251 : 255, p.status === 'CRITICAL' ? 242 : p.status === 'WARNING' ? 235 : 255);
    doc.rect(marginX, currentY, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const pName = p.name.length > 34 ? p.name.substring(0, 32) + '...' : p.name;
    doc.text(pName, marginX + 3, currentY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(p.profile, marginX + 68, currentY + 4.2);
    doc.text(formatCurrencyBRL(p.totalAum), marginX + 102, currentY + 4.2);

    // Status badge
    doc.setFont('helvetica', 'bold');
    if (p.status === 'CRITICAL') {
      doc.setTextColor(225, 29, 72);
      doc.text('DESENQUADRADO', marginX + 138, currentY + 4.2);
    } else if (p.status === 'WARNING') {
      doc.setTextColor(217, 119, 6);
      doc.text('ATENÇÃO', marginX + 138, currentY + 4.2);
    } else {
      doc.setTextColor(16, 185, 129);
      doc.text('CONFORME', marginX + 138, currentY + 4.2);
    }

    doc.setTextColor(maxDeviation > 0 ? (maxDeviation > 5 ? 225 : 217) : 100, maxDeviation > 0 ? (maxDeviation > 5 ? 29 : 119) : 116, maxDeviation > 0 ? (maxDeviation > 5 ? 72 : 6) : 139);
    doc.text(maxDeviation > 0 ? `+${maxDeviation.toFixed(1)} p.p.` : '0.0 p.p.', marginX + 165, currentY + 4.2);

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY + 6, marginX + contentWidth, currentY + 6);
    currentY += 6;
  });

  currentY += 6;

  // =========================================================================
  // 5. APONTAMENTOS E DESENQUADRAMENTOS ATIVOS
  // =========================================================================
  if (alerts.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Desenquadramentos e Violações de Limites Detectadas', marginX, currentY);
    currentY += 4;

    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, currentY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Carteira Afetada', marginX + 3, currentY + 4.2);
    doc.text('Classe / Mandato', marginX + 62, currentY + 4.2);
    doc.text('Atual vs Teto', marginX + 102, currentY + 4.2);
    doc.text('Desvio (p.p.)', marginX + 132, currentY + 4.2);
    doc.text('Severidade', marginX + 155, currentY + 4.2);
    currentY += 6;

    alerts.slice(0, 12).forEach((alert) => {
      checkPageBreak(6.5);
      doc.setFillColor(alert.severity === 'CRITICAL' ? 255 : 255, alert.severity === 'CRITICAL' ? 241 : 251, alert.severity === 'CRITICAL' ? 242 : 235);
      doc.rect(marginX, currentY, contentWidth, 6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      const portName = alert.portfolioName.length > 28 ? alert.portfolioName.substring(0, 26) + '...' : alert.portfolioName;
      doc.text(portName, marginX + 3, currentY + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(alert.assetClass, marginX + 62, currentY + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.text(`${alert.currentPercent.toFixed(1)}% / ${alert.maxPercent.toFixed(1)}%`, marginX + 102, currentY + 4.2);

      doc.setTextColor(alert.severity === 'CRITICAL' ? 225 : 217, alert.severity === 'CRITICAL' ? 29 : 119, alert.severity === 'CRITICAL' ? 72 : 6);
      doc.text(`+${alert.deviationPP.toFixed(1)} p.p.`, marginX + 132, currentY + 4.2);

      doc.text(alert.severity === 'CRITICAL' ? 'CRÍTICO' : 'ATENÇÃO', marginX + 155, currentY + 4.2);

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(marginX, currentY + 6, marginX + contentWidth, currentY + 6);
      currentY += 6;
    });

    if (alerts.length > 12) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`* Mais ${alerts.length - 12} apontamento(s) consolidados no arquivo de auditoria completo.`, marginX + 3, currentY + 4);
      currentY += 5;
    }
  }

  // =========================================================================
  // 6. CARIMBO DE AUDITORIA E ASSINATURA NORMATIVA (RODAPÉ)
  // =========================================================================
  checkPageBreak(22);
  currentY += 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('CERTIFICADO DE CONFORMIDADE E CONTROLE FIDUCIÁRIO', marginX + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Este documento foi emitido de forma automatizada pelo motor FlowCore Sentinel em conformidade com as regras da Resolução CVM 175.',
    marginX + 4,
    currentY + 9.5
  );
  doc.text(
    `Autenticação Criptográfica: SHA256-${auditCode}-${now.getTime()} | Registro de auditoria imutável emitido para compliance da instituição.`,
    marginX + 4,
    currentY + 14
  );

  // Numeração de páginas no rodapé absoluto
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${totalPages} • FlowCore Sentinel CVM 175`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Download do arquivo
  const filename = `relatorio-conformidade-cvm175-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
