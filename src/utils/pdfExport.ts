import { jsPDF } from 'jspdf';
import { Portfolio, ComplianceAlert, AlertComplianceSnapshot } from '../types';

export interface PdfExportOptions {
  managerName?: string;
  weightedComplianceScore?: number;
  currency?: 'BRL' | 'USD';
  usdRate?: number;
  snapshots?: AlertComplianceSnapshot[];
}

/**
 * Gera e realiza o download de um relatório executivo formal em PDF
 * contendo o Compliance Score, resumo da frota de carteiras e matriz de risco CVM 175.
 */
export function downloadPortfolioComplianceReportPDF(
  portfolios: Portfolio[] = [],
  alerts: ComplianceAlert[] = [],
  optionsOrSnapshots?: PdfExportOptions | AlertComplianceSnapshot[]
) {
  const options: PdfExportOptions = Array.isArray(optionsOrSnapshots)
    ? { snapshots: optionsOrSnapshots }
    : optionsOrSnapshots || {};

  const {
    managerName = 'Dário Marques',
    weightedComplianceScore,
    currency = 'BRL',
    usdRate = 5.42,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const totalAumBRL = portfolios.reduce((sum, p) => sum + (p.totalAum || 0), 0);
  const normalPortfolios = portfolios.filter((p) => p.status === 'NORMAL');
  const warningPortfolios = portfolios.filter((p) => p.status === 'WARNING');
  const criticalPortfolios = portfolios.filter((p) => p.status === 'CRITICAL');

  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  const warningAlerts = alerts.filter((a) => a.severity === 'WARNING');
  const totalExcessBRL = alerts.reduce((sum, a) => sum + (a.excessValueBRL || 0), 0);

  const fleetScore =
    weightedComplianceScore !== undefined
      ? weightedComplianceScore
      : portfolios.length > 0
      ? Number(((normalPortfolios.length / portfolios.length) * 100).toFixed(1))
      : 100;

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // --- CABEÇALHO SUPERIOR ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Linha de realce esmeralda
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Título e Subtítulo
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FLOWCORE WEALTH COPILOT', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('RELATÓRIO EXECUTIVO DE COMPLIANCE & GOVERNANÇA FIDUCIÁRIA CVM 175', margin, 18);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Emissão: ${dateStr} às ${timeStr}`, pageWidth - margin, 12, { align: 'right' });
  doc.text(`Gestor: ${managerName}`, pageWidth - margin, 18, { align: 'right' });

  let y = 36;

  // --- PAINEL DE INDICADORES PRINCIPAIS (KPIS) ---
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'D');

  // Coluna 1: Compliance Score Ponderado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('COMPLIANCE SCORE PONDERADO', margin + 6, y + 8);

  doc.setFontSize(18);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`${fleetScore.toFixed(1)}%`, margin + 6, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Meta Prudencial: 85.0%`, margin + 6, y + 26);

  // Divisor vertical 1
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 58, y + 4, margin + 58, y + 28);

  // Coluna 2: Patrimônio sob Gestão
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PATRIMÔNIO LÍQUIDO (AUM)', margin + 64, y + 8);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  const aumFormatted = (totalAumBRL / 1_000_000).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  doc.text(`R$ ${aumFormatted}M`, margin + 64, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const aumUsd = (totalAumBRL / usdRate / 1_000_000).toFixed(2);
  doc.text(`$ ${aumUsd}M USD (Ptax: R$ ${usdRate.toFixed(2)})`, margin + 64, y + 26);

  // Divisor vertical 2
  doc.line(margin + 120, y + 4, margin + 120, y + 28);

  // Coluna 3: Distribuição das Carteiras
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('STATUS DA FROTA', margin + 126, y + 8);

  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`• ${normalPortfolios.length} Saudáveis`, margin + 126, y + 15);

  doc.setTextColor(217, 119, 6);
  doc.text(`• ${warningPortfolios.length} Em Recalibração`, margin + 126, y + 20);

  doc.setTextColor(225, 29, 72);
  doc.text(`• ${criticalPortfolios.length} Em Override Crítico`, margin + 126, y + 25);

  y += 39;

  // --- SEÇÃO: MATRIZ DE STATUS DAS CARTEIRAS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Diagnóstico Consolidado das Carteiras sob Gestão', margin, y);

  y += 5;

  // Cabeçalho da Tabela
  const tableHeaderY = y;
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, tableHeaderY, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);

  doc.text('CARTEIRA', margin + 3, tableHeaderY + 4.8);
  doc.text('CLIENTE / TITULAR', margin + 46, tableHeaderY + 4.8);
  doc.text('PERFIL', margin + 92, tableHeaderY + 4.8);
  doc.text('STATUS', margin + 118, tableHeaderY + 4.8);
  doc.text('AUM (R$)', margin + 148, tableHeaderY + 4.8, { align: 'right' });
  doc.text('EXCESSO', margin + 180, tableHeaderY + 4.8, { align: 'right' });

  y += 7;

  // Linhas das carteiras
  portfolios.forEach((portfolio, idx) => {
    // Checa se precisa quebrar página
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;

      // Reimprime cabeçalho da tabela na nova página
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('CARTEIRA', margin + 3, y + 4.8);
      doc.text('CLIENTE / TITULAR', margin + 46, y + 4.8);
      doc.text('PERFIL', margin + 92, y + 4.8);
      doc.text('STATUS', margin + 118, y + 4.8);
      doc.text('AUM (R$)', margin + 148, y + 4.8, { align: 'right' });
      doc.text('EXCESSO', margin + 180, y + 4.8, { align: 'right' });
      y += 7;
    }

    const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, y, contentWidth, 6.5, 'F');

    // Linha inferior separadora
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    // Trunca nome se muito longo
    const pName = portfolio.name.length > 24 ? portfolio.name.slice(0, 22) + '..' : portfolio.name;
    doc.text(pName, margin + 3, y + 4.4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const cName = portfolio.clientName.length > 24 ? portfolio.clientName.slice(0, 22) + '..' : portfolio.clientName;
    doc.text(cName, margin + 46, y + 4.4);

    doc.text(portfolio.profile, margin + 92, y + 4.4);

    // Badge de Status
    if (portfolio.status === 'CRITICAL') {
      doc.setTextColor(190, 18, 60); // rose-700
      doc.setFont('helvetica', 'bold');
      doc.text('OVERRIDE', margin + 118, y + 4.4);
    } else if (portfolio.status === 'WARNING') {
      doc.setTextColor(180, 83, 9); // amber-700
      doc.setFont('helvetica', 'bold');
      doc.text('ATENÇÃO', margin + 118, y + 4.4);
    } else {
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.setFont('helvetica', 'bold');
      doc.text('CONFORME', margin + 118, y + 4.4);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const aumStr = portfolio.totalAum.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    });
    doc.text(aumStr, margin + 148, y + 4.4, { align: 'right' });

    // Excesso
    const pAlerts = alerts.filter((a) => a.portfolioId === portfolio.id);
    const pExcess = pAlerts.reduce((sum, a) => sum + (a.excessValueBRL || 0), 0);
    if (pExcess > 0) {
      doc.setTextColor(225, 29, 72);
      doc.setFont('helvetica', 'bold');
      const excessStr = pExcess.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      });
      doc.text(excessStr, margin + 180, y + 4.4, { align: 'right' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('R$ 0', margin + 180, y + 4.4, { align: 'right' });
    }

    y += 6.5;
  });

  y += 8;

  // --- SEÇÃO 2: MATRIZ DE INFRAÇÕES E RECOMENDAÇÕES EXECUTIVAS ---
  if (y > pageHeight - 50) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Infrações Fiduciárias Ativas e Ações Mitigatórias Recomendadas', margin, y);

  y += 5;

  if (alerts.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text('Nenhuma infração fiduciária ativa identificada no momento.', margin, y + 4);
    y += 10;
  } else {
    // Exibe até os 5 alertas mais prioritários
    const topAlerts = [...alerts]
      .sort((a, b) => (b.excessValueBRL || 0) - (a.excessValueBRL || 0))
      .slice(0, 6);

    topAlerts.forEach((alert) => {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(254, 242, 242); // rose-50
      doc.setDrawColor(254, 205, 211);
      doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

      const limitVal = alert.maxPercent || alert.limit || 0;
      const deviation = alert.deviationPP !== undefined ? alert.deviationPP : Number((alert.currentPercent - limitVal).toFixed(1));

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(159, 18, 57);
      doc.text(
        `[${alert.severity}] ${alert.portfolioName} • ${alert.assetClass}: Desvio de ${Math.abs(deviation).toFixed(1)} p.p. acima do mandato`,
        margin + 4,
        y + 4.5
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      const excessStr = (alert.excessValueBRL || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      });
      doc.text(
        `Excesso em risco: ${excessStr} | Ação recomendada: Executar rebalanceamento tático para enquadramento CVM 175`,
        margin + 4,
        y + 9
      );

      y += 14;
    });
  }

  // --- RODAPÉ FIDUCIÁRIO ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Documento confidencial gerado eletronicamente por FlowCore Wealth Copilot • Sentinel Compliance Engine',
      margin,
      pageHeight - 8
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  const filename = `relatorio_executivo_compliance_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
