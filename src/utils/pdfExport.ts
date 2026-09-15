import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportElementToPDF = async (
  elementId: string,
  filename: string,
  title: string
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // Add a temporary class to ensure the element renders optimally for print
    element.classList.add('pdf-export-mode');

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#020617', // Match slate-950 background
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    element.classList.remove('pdf-export-mode');

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Calculate PDF dimensions (A4 size: 210 x 297 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;

    // Add a small header
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pdfWidth, 20, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text("FLOWCORE COMPLIANCE - RELATÓRIO EXECUTIVO", 10, 13);
    
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184); // slate-400
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    pdf.text(`Emitido em: ${dateStr}`, pdfWidth - 65, 13);

    // Add image below header
    pdf.addImage(imgData, 'JPEG', (pdfWidth - finalWidth) / 2, 25, finalWidth, finalHeight);
    
    pdf.save(`${filename}-${new Date().getTime()}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};

export const downloadPortfolioComplianceReportPDF = (
  portfolios: any[],
  alerts: any[],
  history: any[]
) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  pdf.setFillColor(15, 23, 42); 
  pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 20, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text("FLOWCORE COMPLIANCE - CONSOLIDATED REPORT", 10, 13);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.text(`Total Portfolios: ${portfolios.length}`, 10, 40);
  pdf.text(`Total Alerts: ${alerts.length}`, 10, 50);

  let y = 70;
  alerts.slice(0, 20).forEach(alert => {
    pdf.setFontSize(10);
    const text = `[${alert.severity}] ${alert.portfolioName} - ${alert.assetClass}: ${alert.deviationPP}%`;
    pdf.text(text, 10, y);
    y += 10;
    if (y > 280) {
      pdf.addPage();
      y = 20;
    }
  });

  pdf.save(`Compliance-Report-${new Date().getTime()}.pdf`);
};
