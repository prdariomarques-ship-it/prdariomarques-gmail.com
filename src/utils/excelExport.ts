import { Portfolio, ComplianceAlert } from '../types';

/**
 * Escapa strings para formato XML seguro no Excel SpreadsheetML
 */
function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Dispara o download de um arquivo no navegador
 */
function downloadFile(content: string, filename: string, mimeType: string) {
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
 * Exporta os dados consolidados de Compliance Score e Status das Carteiras para Excel (.xls SpreadsheetML).
 * Inclui abas de Resumo Executivo, Detalhamento das Carteiras e Matriz de Alertas CVM 175.
 */
export function downloadExecutiveComplianceExcel(
  portfolios: Portfolio[] = [],
  alerts: ComplianceAlert[] = [],
  options: {
    managerName?: string;
    weightedComplianceScore?: number;
    currency?: 'BRL' | 'USD';
    usdRate?: number;
  } = {}
) {
  const {
    managerName = 'Dário Marques',
    weightedComplianceScore,
    currency = 'BRL',
    usdRate = 5.42,
  } = options;

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

  // Calcula Score Médio se não fornecido
  const fleetScore =
    weightedComplianceScore !== undefined
      ? weightedComplianceScore
      : portfolios.length > 0
      ? Number(((normalPortfolios.length / portfolios.length) * 100).toFixed(1))
      : 100;

  // Montagem do XML Spreadsheet 2003 nativo do Excel
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>${escapeXml(managerName)}</Author>
  <Created>${now.toISOString()}</Created>
  <Company>FlowCore Wealth Management</Company>
  <Title>Relatório Executivo de Compliance Score e Status das Carteiras</Title>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="HeaderSub">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#64748B"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="ColHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiLabel">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#334155"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="All" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiVal">
   <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="All" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="ScoreHigh">
   <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="All" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="R$ #,##0.00"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="Percent">
   <NumberFormat ss:Format="0.0%"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TextCell">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CenterCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="StatusNormal">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="StatusWarning">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#92400E"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="StatusCritical">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#991B1B"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
 </Styles>

 <!-- ABA 1: RESUMO EXECUTIVO -->
 <Worksheet ss:Name="Resumo Executivo">
  <Table ss:ExpandedColumnCount="5" ss:DefaultRowHeight="20">
   <Column ss:Width="220"/>
   <Column ss:Width="160"/>
   <Column ss:Width="30"/>
   <Column ss:Width="180"/>
   <Column ss:Width="140"/>

   <Row ss:Height="28">
    <Cell ss:MergeAcross="4" ss:StyleID="HeaderTitle"><Data ss:Type="String">FLOWCORE WEALTH COPILOT • RELATÓRIO EXECUTIVO DE COMPLIANCE</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="4" ss:StyleID="HeaderSub"><Data ss:Type="String">Emissão: ${dateStr} às ${timeStr} • Gestor: ${escapeXml(managerName)} • Vigilância CVM 175</Data></Cell>
   </Row>
   <Row ss:Height="10"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Compliance Score Ponderado (Frota)</Data></Cell>
    <Cell ss:StyleID="ScoreHigh"><Data ss:Type="Number">${fleetScore / 100}</Data></Cell>
    <Cell/>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Patrimônio Líquido Total (AUM)</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${totalAumBRL}</Data></Cell>
   </Row>

   <Row ss:Height="22">
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Total de Carteiras Monitoradas</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${portfolios.length}</Data></Cell>
    <Cell/>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Capital em Risco / Excesso</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${totalExcessBRL}</Data></Cell>
   </Row>

   <Row ss:Height="22">
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Carteiras Saudáveis (Conformes)</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${normalPortfolios.length}</Data></Cell>
    <Cell/>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Alertas Críticos Ativos</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${criticalAlerts.length}</Data></Cell>
   </Row>

   <Row ss:Height="22">
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Carteiras em Recalibração (Warning)</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${warningPortfolios.length}</Data></Cell>
    <Cell/>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Alertas de Atenção</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${warningAlerts.length}</Data></Cell>
   </Row>

   <Row ss:Height="22">
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Carteiras em Override Crítico</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${criticalPortfolios.length}</Data></Cell>
    <Cell/>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Taxa de Conversão USD (Ptax)</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="String">R$ ${usdRate.toFixed(2)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- ABA 2: STATUS DAS CARTEIRAS -->
 <Worksheet ss:Name="Carteiras &amp; Compliance">
  <Table ss:ExpandedColumnCount="10" ss:DefaultRowHeight="20">
   <Column ss:Width="80"/>
   <Column ss:Width="180"/>
   <Column ss:Width="160"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="130"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="120"/>
   <Column ss:Width="110"/>

   <Row ss:Height="26">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Carteira</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Cliente / Titular</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Perfil</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">AUM (R$)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Alertas Críticos</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Avisos</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Excesso em Risco (R$)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Último Rebalanceamento</Data></Cell>
   </Row>

   ${portfolios
     .map((p) => {
       const pAlerts = alerts.filter((a) => a.portfolioId === p.id);
       const crit = pAlerts.filter((a) => a.severity === 'CRITICAL').length;
       const warn = pAlerts.filter((a) => a.severity === 'WARNING').length;
       const excess = pAlerts.reduce((sum, a) => sum + (a.excessValueBRL || 0), 0);
       const statusStyle =
         p.status === 'CRITICAL'
           ? 'StatusCritical'
           : p.status === 'WARNING'
           ? 'StatusWarning'
           : 'StatusNormal';

       return `
   <Row ss:Height="20">
    <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(p.id)}</Data></Cell>
    <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(p.name)}</Data></Cell>
    <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(p.clientName)}</Data></Cell>
    <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(p.profile)}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${escapeXml(p.status)}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${p.totalAum}</Data></Cell>
    <Cell ss:StyleID="CenterCell"><Data ss:Type="Number">${crit}</Data></Cell>
    <Cell ss:StyleID="CenterCell"><Data ss:Type="Number">${warn}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${excess}</Data></Cell>
    <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(p.lastRebalanced || 'Recente')}</Data></Cell>
   </Row>`;
     })
     .join('')}
  </Table>
 </Worksheet>

 <!-- ABA 3: ALERTAS DE COMPLIANCE CVM 175 -->
 <Worksheet ss:Name="Alertas &amp; Desenquadramentos">
  <Table ss:ExpandedColumnCount="8" ss:DefaultRowHeight="20">
   <Column ss:Width="80"/>
   <Column ss:Width="160"/>
   <Column ss:Width="120"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="130"/>
   <Column ss:Width="250"/>

   <Row ss:Height="26">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">ID Alerta</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Carteira</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Classe de Ativo</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Severidade</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Alocação</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Teto Mandato</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Excesso em Risco (R$)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Descrição / Enquadramento</Data></Cell>
   </Row>

   ${alerts
     .map((a) => {
       const statusStyle =
         a.severity === 'CRITICAL'
           ? 'StatusCritical'
           : a.severity === 'WARNING'
           ? 'StatusWarning'
           : 'StatusNormal';
       const limitVal = a.maxPercent || a.limit || 0;

       return `
   <Row ss:Height="20">
    <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(a.id)}</Data></Cell>
    <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(a.portfolioName)}</Data></Cell>
    <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(a.assetClass)}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${escapeXml(a.severity)}</Data></Cell>
    <Cell ss:StyleID="Percent"><Data ss:Type="Number">${(a.currentPercent / 100).toFixed(4)}</Data></Cell>
    <Cell ss:StyleID="Percent"><Data ss:Type="Number">${(limitVal / 100).toFixed(4)}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${a.excessValueBRL}</Data></Cell>
    <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(a.message || 'Desenquadramento de mandato')}</Data></Cell>
   </Row>`;
     })
     .join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  const filename = `relatorio_executivo_compliance_${now.toISOString().slice(0, 10)}.xls`;
  downloadFile(xmlContent, filename, 'application/vnd.ms-excel;charset=utf-8');
}
