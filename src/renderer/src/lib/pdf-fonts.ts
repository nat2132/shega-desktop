import jsPDF from 'jspdf';

// Font loading infrastructure for Ethiopic script support
// To use: download Noto Sans Ethiopic from Google Fonts, convert to base64,
// and add the VFS mapping below.

const FONTS_BASE64: Record<string, string> = {};

export function registerEthiopicFonts(doc: jsPDF) {
  if (FONTS_BASE64['NotoSansEthiopic-Regular']) {
    doc.addFileToVFS('NotoSansEthiopic-Regular.ttf', FONTS_BASE64['NotoSansEthiopic-Regular']);
    doc.addFont('NotoSansEthiopic-Regular.ttf', 'NotoSansEthiopic', 'normal');
    doc.addFileToVFS('NotoSansEthiopic-Bold.ttf', FONTS_BASE64['NotoSansEthiopic-Bold']);
    doc.addFont('NotoSansEthiopic-Bold.ttf', 'NotoSansEthiopic', 'bold');
    return true;
  }
  return false;
}

export function hasEthiopicFonts(): boolean {
  return !!FONTS_BASE64['NotoSansEthiopic-Regular'];
}

export function getPdfFont(language: string): string {
  if ((language === 'am' || language === 'om' || language === 'ti') && hasEthiopicFonts()) {
    return 'NotoSansEthiopic';
  }
  return 'helvetica';
}
