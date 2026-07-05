import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { registerEthiopicFonts, getPdfFont } from './pdf-fonts';

export function addPdfHeader(doc: jsPDF, business: { businessName?: string; logo?: string } | null, startY: number = 10) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY;

  if (business?.logo) {
    try {
      doc.addImage(business.logo, 'PNG', 14, y - 4, 10, 10);
    } catch {}
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(business?.businessName || 'Business Report', pageWidth / 2, y + 3, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleString(), pageWidth / 2, y + 9, { align: 'center' });
  return y + 14;
}

export function exportCSV(headers: string[], rows: any[][], filename: string) {
  const bom = '\uFEFF';
  const csv = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(
  title: string,
  headers: string[],
  rows: any[][],
  filename: string,
  foot?: string[],
  language?: string,
  business?: { businessName?: string; logo?: string } | null
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const lang = language || 'en';
  const fontName = getPdfFont(lang);
  registerEthiopicFonts(doc);

  if (fontName !== 'helvetica') {
    doc.setFont(fontName, 'normal');
  }

  let startY = addPdfHeader(doc, business ?? null, 8) + 4;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, startY, { align: 'center' });
  startY += 8;

  const body = rows.map(r => r.map(c => String(c ?? '')));
  const tableConfig: any = {
    startY,
    head: [headers],
    body,
    theme: 'striped',
    headStyles: { fillColor: [0, 0, 0], fontSize: 8 },
    styles: { fontSize: 7 },
  };
  if (fontName !== 'helvetica') {
    tableConfig.styles.font = fontName;
    tableConfig.headStyles.font = fontName;
  }
  if (foot) {
    tableConfig.foot = [foot];
    tableConfig.footStyles = { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 };
  }

  autoTable(doc, tableConfig);

  doc.save(`${filename}-${Date.now()}.pdf`);
}
