import type jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QuoteFormatConfig, PaymentMethodConfig, PDFExportConfig } from '@/types/templates';
import type { ExportHeaderBranding } from '@/utils/pdfExportBranding';
import { resolveExportCompanyName, isQuoteLogoEnabled } from '@/utils/pdfExportBranding';
import { drawPdfHeaderLogoPositioned } from '@/utils/pdfBranding';
import {
  setPdfUnicodeFont,
  pdfTableFontStyles,
  pdfTableHeadFontStyles,
  pdfAutoTableUnicodeHooks,
} from '@/utils/pdfFonts';
import { formatNairaForPdf } from '@/utils/formatters';

export interface QuotePdfQuote {
  projectName: string;
  siteAddress: string;
  customerName: string;
  customerEmail: string;
  quoteId: string;
  issueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  summary: {
    subtotal: number;
    charges: Array<{ label: string; amount: number }>;
    grandTotal: number;
  };
  paymentInfo: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  paymentTerms?: string;
  customPaymentTerms?: string;
  additionalNotes?: string;
}

type SectionKey = keyof QuoteFormatConfig['sections'];

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  'due-on-receipt': 'Due on Receipt',
  'net-7': 'Net 7 (Due 7 days after quote date)',
  'net-30': 'Net 30 (Due 30 days after invoice date)',
  '50-50': '50% Deposit, 50% on Completion',
  '30-70': '30% Upfront, 70% on Delivery',
};

export function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '').trim();
  if (raw.length === 3 && /^[a-f\d]{3}$/i.test(raw)) {
    return [
      parseInt(raw[0] + raw[0], 16),
      parseInt(raw[1] + raw[1], 16),
      parseInt(raw[2] + raw[2], 16),
    ];
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(raw);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [31, 41, 55];
}

function formatPaymentTermsForPdf(paymentTerms?: string, customPaymentTerms?: string): string | null {
  if (!paymentTerms) return null;
  if (paymentTerms === 'customize' && customPaymentTerms?.trim()) {
    return customPaymentTerms.trim();
  }
  return PAYMENT_TERMS_LABELS[paymentTerms] ?? paymentTerms;
}

function getOrderedSections(sections: QuoteFormatConfig['sections']): SectionKey[] {
  return (Object.entries(sections) as Array<[SectionKey, { visible: boolean; order: number }]>)
    .filter(([, section]) => section.visible)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key]) => key);
}

function textXForAlignment(
  alignment: 'left' | 'center' | 'right',
  marginLeft: number,
  marginRight: number,
  pageW: number
): number {
  if (alignment === 'center') return pageW / 2;
  if (alignment === 'right') return pageW - marginRight;
  return marginLeft;
}

function drawAlignedText(
  doc: jsPDF,
  text: string,
  y: number,
  alignment: 'left' | 'center' | 'right',
  marginLeft: number,
  marginRight: number,
  pageW: number
): void {
  const x = textXForAlignment(alignment, marginLeft, marginRight, pageW);
  doc.text(text, x, y, { align: alignment });
}

function drawSectionHeading(
  doc: jsPDF,
  title: string,
  y: number,
  quoteFormat: QuoteFormatConfig,
  marginLeft: number,
  marginRight: number,
  pageW: number
): number {
  const [r, g, b] = hexToRgb(quoteFormat.colors.primary);
  doc.setFontSize(quoteFormat.typography.headingSize - 2);
  setPdfUnicodeFont(doc, 'bold');
  doc.setTextColor(r, g, b);
  drawAlignedText(doc, title, y, 'left', marginLeft, marginRight, pageW);
  return y + quoteFormat.typography.headingSize * 0.45;
}

function drawBodyLine(
  doc: jsPDF,
  text: string,
  y: number,
  quoteFormat: QuoteFormatConfig,
  marginLeft: number,
  marginRight: number,
  pageW: number
): number {
  const [r, g, b] = hexToRgb(quoteFormat.colors.secondary);
  doc.setFontSize(quoteFormat.typography.bodySize);
  setPdfUnicodeFont(doc, 'normal');
  doc.setTextColor(r, g, b);
  drawAlignedText(doc, text, y, 'left', marginLeft, marginRight, pageW);
  return y + quoteFormat.typography.bodySize * 0.5;
}

function drawHeaderBranding(
  doc: jsPDF,
  pageW: number,
  marginLeft: number,
  marginRight: number,
  headerTopY: number,
  headerHeight: number,
  branding: ExportHeaderBranding,
  logoPosition: PDFExportConfig['quote']['logo']['position'],
  logoSize: PDFExportConfig['quote']['logo']['size']
): void {
  if (branding.type === 'image') {
    drawPdfHeaderLogoPositioned(
      doc,
      pageW,
      marginLeft,
      marginRight,
      headerTopY,
      headerHeight,
      branding.logo,
      logoPosition,
      logoSize
    );
    return;
  }

  if (branding.type === 'text') {
    const [r, g, b] = hexToRgb('#374151');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(r, g, b);
    const maxWidth = logoSize === 'small' ? 32 : logoSize === 'large' ? 52 : 42;
    const truncated =
      branding.companyName.length > 28
        ? `${branding.companyName.slice(0, 27)}…`
        : branding.companyName;
    const textWidth = Math.min(doc.getTextWidth(truncated), maxWidth);
    const centerY = headerTopY + headerHeight / 2;
    let x: number;
    if (logoPosition === 'top-left') x = marginLeft;
    else if (logoPosition === 'top-center') x = (pageW - textWidth) / 2;
    else x = pageW - marginRight - textWidth;
    doc.text(truncated, x, centerY);
    return;
  }

  if (branding.logo) {
    drawPdfHeaderLogoPositioned(
      doc,
      pageW,
      marginLeft,
      marginRight,
      headerTopY,
      headerHeight,
      branding.logo,
      logoPosition,
      logoSize
    );
  }
}

function drawQuoteHeader(
  doc: jsPDF,
  pageW: number,
  quoteFormat: QuoteFormatConfig,
  pdfConfig: PDFExportConfig['quote'],
  headerBranding: ExportHeaderBranding
): number {
  const marginLeft = quoteFormat.page.margins.left;
  const marginRight = quoteFormat.page.margins.right;
  const marginTop = quoteFormat.page.margins.top;
  const alignment = quoteFormat.header.alignment;
  const companyName = (quoteFormat.header.companyName || resolveExportCompanyName()).trim();
  const headerHeight = pdfConfig.header.enabled ? pdfConfig.header.height : 0;
  const headerTopY = marginTop;
  const showLogo = isQuoteLogoEnabled(quoteFormat.header.logoSource);
  const logoPosition = quoteFormat.header.logoPosition ?? 'top-right';
  const logoSize = quoteFormat.header.logoSize ?? 'medium';
  let contentY = headerTopY + 6;

  if (pdfConfig.header.enabled && showLogo) {
    drawHeaderBranding(
      doc,
      pageW,
      marginLeft,
      marginRight,
      headerTopY,
      headerHeight,
      headerBranding,
      logoPosition,
      logoSize
    );
  }

  const [primaryR, primaryG, primaryB] = hexToRgb(quoteFormat.colors.primary);
  const [secondaryR, secondaryG, secondaryB] = hexToRgb(quoteFormat.colors.secondary);

  if (companyName) {
    doc.setFontSize(quoteFormat.typography.headingSize);
    setPdfUnicodeFont(doc, 'bold');
    doc.setTextColor(primaryR, primaryG, primaryB);
    drawAlignedText(doc, companyName, contentY, alignment, marginLeft, marginRight, pageW);
    contentY += quoteFormat.typography.headingSize * 0.55;
  } else {
    doc.setFontSize(quoteFormat.typography.headingSize);
    setPdfUnicodeFont(doc, 'bold');
    doc.setTextColor(primaryR, primaryG, primaryB);
    drawAlignedText(doc, 'QUOTE', contentY, alignment, marginLeft, marginRight, pageW);
    contentY += quoteFormat.typography.headingSize * 0.55;
  }

  if (quoteFormat.header.tagline?.trim()) {
    doc.setFontSize(quoteFormat.typography.bodySize);
    setPdfUnicodeFont(doc, 'normal');
    doc.setTextColor(secondaryR, secondaryG, secondaryB);
    drawAlignedText(doc, quoteFormat.header.tagline.trim(), contentY, alignment, marginLeft, marginRight, pageW);
    contentY += quoteFormat.typography.bodySize * 0.65;
  }

  const headerBottom = pdfConfig.header.enabled
    ? Math.max(contentY, headerTopY + headerHeight)
    : contentY;

  return headerBottom + quoteFormat.page.sectionSpacing * 0.35;
}

function applyFooterToAllPages(
  doc: jsPDF,
  quoteFormat: QuoteFormatConfig,
  pdfConfig: PDFExportConfig['quote']
): void {
  if (!pdfConfig.footer.enabled || !quoteFormat.footer.visible || !quoteFormat.footer.content.trim()) {
    return;
  }

  const marginLeft = quoteFormat.page.margins.left;
  const marginRight = quoteFormat.page.margins.right;
  const marginBottom = quoteFormat.page.margins.bottom;
  const [r, g, b] = hexToRgb(quoteFormat.colors.secondary);
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const pageH = doc.internal.pageSize.getHeight();
    const pageW = doc.internal.pageSize.getWidth();
    const footerY = pageH - marginBottom;
    doc.setFontSize(Math.max(8, quoteFormat.typography.bodySize - 2));
    setPdfUnicodeFont(doc, 'normal');
    doc.setTextColor(r, g, b);
    drawAlignedText(
      doc,
      quoteFormat.footer.content,
      footerY,
      quoteFormat.footer.alignment,
      marginLeft,
      marginRight,
      pageW
    );
  }
}

export function renderQuotePdfContent(
  doc: jsPDF,
  quote: QuotePdfQuote,
  quoteFormat: QuoteFormatConfig,
  pdfConfig: PDFExportConfig['quote'],
  paymentMethodConfig: PaymentMethodConfig,
  headerBranding: ExportHeaderBranding
): void {
  const pageW = doc.internal.pageSize.getWidth();
  const marginLeft = quoteFormat.page.margins.left;
  const marginRight = quoteFormat.page.margins.right;
  const sectionGap = quoteFormat.page.sectionSpacing * 0.35;
  const [accentR, accentG, accentB] = hexToRgb(quoteFormat.colors.accent);
  const [primaryR, primaryG, primaryB] = hexToRgb(quoteFormat.colors.primary);

  let currentY = drawQuoteHeader(doc, pageW, quoteFormat, pdfConfig, headerBranding);

  const sections = getOrderedSections(quoteFormat.sections);

  for (const sectionKey of sections) {
    if (sectionKey === 'projectInfo') {
      currentY = drawSectionHeading(doc, 'Project Information', currentY, quoteFormat, marginLeft, marginRight, pageW);
      currentY = drawBodyLine(doc, `Project: ${quote.projectName}`, currentY, quoteFormat, marginLeft, marginRight, pageW);
      currentY = drawBodyLine(doc, `Site Address: ${quote.siteAddress}`, currentY, quoteFormat, marginLeft, marginRight, pageW);
      currentY = drawBodyLine(doc, `Quote ID: ${quote.quoteId}`, currentY, quoteFormat, marginLeft, marginRight, pageW);
      currentY = drawBodyLine(doc, `Issue Date: ${quote.issueDate}`, currentY, quoteFormat, marginLeft, marginRight, pageW);
      currentY += sectionGap;
      continue;
    }

    if (sectionKey === 'customerDetails') {
      currentY = drawSectionHeading(doc, 'Customer Details', currentY, quoteFormat, marginLeft, marginRight, pageW);
      currentY = drawBodyLine(doc, `Customer: ${quote.customerName}`, currentY, quoteFormat, marginLeft, marginRight, pageW);
      if (quote.customerEmail) {
        currentY = drawBodyLine(doc, `Email: ${quote.customerEmail}`, currentY, quoteFormat, marginLeft, marginRight, pageW);
      }
      const paymentTermsText = formatPaymentTermsForPdf(quote.paymentTerms, quote.customPaymentTerms);
      if (paymentTermsText) {
        currentY = drawBodyLine(doc, `Payment Terms: ${paymentTermsText}`, currentY, quoteFormat, marginLeft, marginRight, pageW);
      }
      currentY += sectionGap;
      continue;
    }

    if (sectionKey === 'itemsTable') {
      currentY = drawSectionHeading(doc, 'Items', currentY, quoteFormat, marginLeft, marginRight, pageW);
      currentY += 2;

      const tableData = quote.items.map((item, index) => [
        index + 1,
        item.description,
        item.quantity,
        formatNairaForPdf(item.unitPrice),
        formatNairaForPdf(item.total),
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: marginLeft, right: marginRight },
        head: [['S/N', 'Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: pdfConfig.fonts.tableSize,
          ...pdfTableFontStyles({ textColor: pdfConfig.fonts.bodyColor }),
        },
        headStyles: {
          fillColor: [primaryR, primaryG, primaryB] as [number, number, number],
          ...pdfTableHeadFontStyles({ textColor: [255, 255, 255] }),
        },
        bodyStyles: pdfTableFontStyles({ textColor: pdfConfig.fonts.bodyColor }),
        ...pdfAutoTableUnicodeHooks(),
      });

      currentY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? currentY) + sectionGap;
      continue;
    }

    if (sectionKey === 'summary') {
      currentY = drawSectionHeading(doc, 'Summary', currentY, quoteFormat, marginLeft, marginRight, pageW);
      currentY = drawBodyLine(
        doc,
        `Subtotal: ${formatNairaForPdf(quote.summary.subtotal)}`,
        currentY,
        quoteFormat,
        marginLeft,
        marginRight,
        pageW
      );

      quote.summary.charges.forEach((charge) => {
        currentY = drawBodyLine(
          doc,
          `${charge.label}: ${formatNairaForPdf(charge.amount)}`,
          currentY,
          quoteFormat,
          marginLeft,
          marginRight,
          pageW
        );
      });

      currentY += 2;
      doc.setFontSize(quoteFormat.typography.headingSize);
      setPdfUnicodeFont(doc, 'bold');
      doc.setTextColor(accentR, accentG, accentB);
      drawAlignedText(
        doc,
        `Grand Total: ${formatNairaForPdf(quote.summary.grandTotal)}`,
        currentY,
        'left',
        marginLeft,
        marginRight,
        pageW
      );
      currentY += quoteFormat.typography.headingSize * 0.6 + sectionGap;
      continue;
    }

    if (sectionKey === 'paymentInfo') {
      if (!paymentMethodConfig.displayOptions.showInPDF || !quote.paymentInfo.accountName) {
        continue;
      }

      currentY = drawSectionHeading(doc, 'Payment Information', currentY, quoteFormat, marginLeft, marginRight, pageW);
      currentY = drawBodyLine(
        doc,
        `Account Name: ${quote.paymentInfo.accountName}`,
        currentY,
        quoteFormat,
        marginLeft,
        marginRight,
        pageW
      );
      currentY = drawBodyLine(
        doc,
        `Account Number: ${quote.paymentInfo.accountNumber}`,
        currentY,
        quoteFormat,
        marginLeft,
        marginRight,
        pageW
      );
      currentY = drawBodyLine(
        doc,
        `Bank: ${quote.paymentInfo.bankName}`,
        currentY,
        quoteFormat,
        marginLeft,
        marginRight,
        pageW
      );

      if (paymentMethodConfig.displayOptions.customInstructions?.trim()) {
        currentY += 2;
        currentY = drawBodyLine(
          doc,
          paymentMethodConfig.displayOptions.customInstructions.trim(),
          currentY,
          quoteFormat,
          marginLeft,
          marginRight,
          pageW
        );
      }

      currentY += sectionGap;
      continue;
    }

    if (sectionKey === 'notes' && quote.additionalNotes?.trim()) {
      currentY = drawSectionHeading(doc, 'Notes', currentY, quoteFormat, marginLeft, marginRight, pageW);
      currentY = drawBodyLine(doc, quote.additionalNotes.trim(), currentY, quoteFormat, marginLeft, marginRight, pageW);
      currentY += sectionGap;
    }
  }

  applyFooterToAllPages(doc, quoteFormat, pdfConfig);
}
