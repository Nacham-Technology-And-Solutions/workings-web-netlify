import React, { useState } from 'react';
import { useTemplateStore } from '@/stores/templateStore';

type PreviewMode = 'layout' | 'actual';

/** Scale factor: config values (e.g. mm) to preview pixels */
const MARGIN_SCALE = 0.5;
const spacing = (px: number) => Math.max(2, Math.round(px * MARGIN_SCALE));

/**
 * Live preview of the quote template with two modes:
 * - Layout View: section structure and labels
 * - Actual View: real-time document preview with placement, margins, typography, sample content
 */
const TemplatePreviewCanvas: React.FC = () => {
  const { quoteFormat, paymentMethodConfig, pdfExport, activeTab } = useTemplateStore();
  const [previewMode, setPreviewMode] = useState<PreviewMode>('actual');

  const showQuotePreview = activeTab === 'quoteFormat';
  const showPDFPreview = activeTab === 'pdfExport';

  const alignmentClass = (align: 'left' | 'center' | 'right') =>
    align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right';

  const m = quoteFormat.page.margins;
  const marginPx = {
    top: spacing(m.top),
    right: spacing(m.right),
    bottom: spacing(m.bottom),
    left: spacing(m.left),
  };
  const sectionGap = spacing(quoteFormat.page.sectionSpacing);
  const bodySize = Math.max(9, Math.min(quoteFormat.typography.bodySize, 13));
  const headingSize = Math.max(11, Math.min(quoteFormat.typography.headingSize, 16));

  const baseDocStyle: React.CSSProperties = {
    fontFamily: quoteFormat.typography.fontFamily,
    fontSize: bodySize,
    color: quoteFormat.colors.primary,
    padding: `${marginPx.top}px ${marginPx.right}px ${marginPx.bottom}px ${marginPx.left}px`,
  };

  // -------- Layout View (current behavior: structure only) --------
  const renderLayoutView = () => (
    <div
      className="bg-white shadow-sm rounded-md overflow-hidden mx-auto"
      style={{ maxWidth: '100%', ...baseDocStyle }}
    >
      <div
        className="border-b py-2"
        style={{ borderColor: quoteFormat.colors.secondary, backgroundColor: `${quoteFormat.colors.primary}08` }}
      >
        <div className={alignmentClass(quoteFormat.header.alignment)}>
          {quoteFormat.header.logoUrl && (
            <img src={quoteFormat.header.logoUrl} alt="Logo" className="max-h-8 w-auto mb-1 inline-block object-contain" />
          )}
          {quoteFormat.header.companyName && (
            <p className="font-semibold" style={{ fontSize: headingSize, color: quoteFormat.colors.primary }}>
              {quoteFormat.header.companyName}
            </p>
          )}
          {quoteFormat.header.tagline && (
            <p className="text-xs mt-0.5" style={{ color: quoteFormat.colors.secondary }}>
              {quoteFormat.header.tagline}
            </p>
          )}
        </div>
      </div>
      <div className="py-2 space-y-2">
        {Object.entries(quoteFormat.sections)
          .sort(([, a], [, b]) => a.order - b.order)
          .filter(([, s]) => s.visible)
          .map(([key]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
            return (
              <div key={key} className="border-b border-gray-100 pb-2 last:border-0">
                <p className="font-semibold mb-1" style={{ fontSize: headingSize - 2, color: quoteFormat.colors.primary }}>
                  {label}
                </p>
                <p className="text-xs" style={{ color: quoteFormat.colors.secondary }}>
                  {key === 'itemsTable' && 'Item · Qty · Unit · Total'}
                  {key === 'summary' && 'Subtotal · Tax · Total'}
                  {key === 'paymentInfo' && 'Payment details'}
                  {key !== 'itemsTable' && key !== 'summary' && key !== 'paymentInfo' && 'Sample content'}
                </p>
              </div>
            );
          })}
      </div>
      {quoteFormat.footer.visible && (
        <div
          className={`py-2 text-xs border-t ${alignmentClass(quoteFormat.footer.alignment)}`}
          style={{
            borderTopColor: quoteFormat.colors.secondary,
            backgroundColor: `${quoteFormat.colors.primary}06`,
            color: quoteFormat.colors.secondary,
          }}
        >
          {quoteFormat.footer.content || 'Footer text'}
        </div>
      )}
    </div>
  );

  // -------- Actual View (document-style preview with real placement and sample content) --------
  const renderActualView = () => {
    const visibleSections = Object.entries(quoteFormat.sections)
      .sort(([, a], [, b]) => a.order - b.order)
      .filter(([, s]) => s.visible);

    return (
      <div
        className="bg-white shadow-sm rounded-md overflow-hidden mx-auto min-h-[280px]"
        style={{
          maxWidth: '100%',
          ...baseDocStyle,
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <header
          className="border-b"
          style={{
            borderColor: quoteFormat.colors.secondary,
            paddingBottom: sectionGap,
            marginBottom: sectionGap,
            backgroundColor: `${quoteFormat.colors.primary}06`,
          }}
        >
          <div className={alignmentClass(quoteFormat.header.alignment)}>
            {quoteFormat.header.logoUrl && (
              <img
                src={quoteFormat.header.logoUrl}
                alt="Logo"
                className="max-h-10 w-auto mb-1 inline-block object-contain"
              />
            )}
            {quoteFormat.header.companyName && (
              <p className="font-semibold leading-tight" style={{ fontSize: headingSize, color: quoteFormat.colors.primary }}>
                {quoteFormat.header.companyName}
              </p>
            )}
            {quoteFormat.header.tagline && (
              <p className="leading-tight mt-0.5" style={{ fontSize: bodySize - 1, color: quoteFormat.colors.secondary }}>
                {quoteFormat.header.tagline}
              </p>
            )}
          </div>
        </header>

        {/* Body: sections in order with real sample content */}
        <div className="space-y-0" style={{ gap: sectionGap }}>
          {visibleSections.map(([key]) => {
            const gapStyle = { marginBottom: sectionGap };
            if (key === 'projectInfo') {
              return (
                <section key={key} style={gapStyle}>
                  <p className="font-semibold mb-1" style={{ fontSize: headingSize - 1, color: quoteFormat.colors.primary }}>
                    Project Information
                  </p>
                  <div className="space-y-0.5" style={{ fontSize: bodySize, color: quoteFormat.colors.secondary }}>
                    <p>Project: Sample Project</p>
                    <p>Quote #: Q-2024-001</p>
                    <p>Date: 25 Dec 2024</p>
                  </div>
                </section>
              );
            }
            if (key === 'customerDetails') {
              return (
                <section key={key} style={gapStyle}>
                  <p className="font-semibold mb-1" style={{ fontSize: headingSize - 1, color: quoteFormat.colors.primary }}>
                    Customer Details
                  </p>
                  <div className="space-y-0.5" style={{ fontSize: bodySize, color: quoteFormat.colors.secondary }}>
                    <p>John Doe</p>
                    <p>123 Main Street, Lagos</p>
                    <p>john@example.com · +234 800 000 0000</p>
                  </div>
                </section>
              );
            }
            if (key === 'itemsTable') {
              return (
                <section key={key} style={gapStyle}>
                  <p className="font-semibold mb-1" style={{ fontSize: headingSize - 1, color: quoteFormat.colors.primary }}>
                    Items
                  </p>
                  <table className="w-full border-collapse" style={{ fontSize: bodySize - 1 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${quoteFormat.colors.primary}`, color: quoteFormat.colors.primary }}>
                        <th className="text-left py-1 pr-2 font-semibold">Description</th>
                        <th className="text-right py-1 px-1 font-semibold w-10">Qty</th>
                        <th className="text-right py-1 px-1 font-semibold w-14">Unit</th>
                        <th className="text-right py-1 pl-2 font-semibold w-14">Total</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: quoteFormat.colors.secondary }}>
                      <tr style={{ borderBottom: `1px solid ${quoteFormat.colors.secondary}33` }}>
                        <td className="py-1 pr-2">Casement Window 1200×1500</td>
                        <td className="text-right py-1 px-1">5</td>
                        <td className="text-right py-1 px-1">₦45,000</td>
                        <td className="text-right py-1 pl-2">₦225,000</td>
                      </tr>
                      <tr style={{ borderBottom: `1px solid ${quoteFormat.colors.secondary}33` }}>
                        <td className="py-1 pr-2">Installation</td>
                        <td className="text-right py-1 px-1">1</td>
                        <td className="text-right py-1 px-1">₦30,000</td>
                        <td className="text-right py-1 pl-2">₦30,000</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-2">Sealant & accessories</td>
                        <td className="text-right py-1 px-1">1</td>
                        <td className="text-right py-1 px-1">₦12,500</td>
                        <td className="text-right py-1 pl-2">₦12,500</td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              );
            }
            if (key === 'summary') {
              return (
                <section key={key} style={gapStyle}>
                  <p className="font-semibold mb-1" style={{ fontSize: headingSize - 1, color: quoteFormat.colors.primary }}>
                    Summary
                  </p>
                  <div className="space-y-0.5" style={{ fontSize: bodySize, color: quoteFormat.colors.secondary }}>
                    <div className="flex justify-between"><span>Subtotal</span><span>₦267,500</span></div>
                    <div className="flex justify-between"><span>Tax (7.5%)</span><span>₦20,063</span></div>
                    <div className="font-semibold flex justify-between mt-1" style={{ color: quoteFormat.colors.primary }}>
                      <span>Total</span><span>₦287,563</span>
                    </div>
                  </div>
                </section>
              );
            }
            if (key === 'paymentInfo') {
              return (
                <section key={key} style={gapStyle}>
                  <p className="font-semibold mb-1" style={{ fontSize: headingSize - 1, color: quoteFormat.colors.primary }}>
                    Payment Information
                  </p>
                  <div className="space-y-1" style={{ fontSize: bodySize, color: quoteFormat.colors.secondary }}>
                    {paymentMethodConfig.methods.length > 0 ? (
                      paymentMethodConfig.methods.slice(0, 2).map((pm) => (
                        <div key={pm.id} className="border rounded p-1.5" style={{ borderColor: `${quoteFormat.colors.secondary}44` }}>
                          <p className="font-medium" style={{ color: quoteFormat.colors.primary }}>{pm.bankName}</p>
                          <p>Acct: {pm.accountName}</p>
                          <p>****{pm.accountNumber?.slice(-4)}</p>
                        </div>
                      ))
                    ) : (
                      <p>Bank transfer details will be provided upon acceptance.</p>
                    )}
                  </div>
                </section>
              );
            }
            if (key === 'notes') {
              return (
                <section key={key} style={gapStyle}>
                  <p className="font-semibold mb-1" style={{ fontSize: headingSize - 1, color: quoteFormat.colors.primary }}>
                    Notes
                  </p>
                  <p style={{ fontSize: bodySize, color: quoteFormat.colors.secondary }}>
                    Thank you for your business. This quote is valid for 30 days. Payment terms: 50% advance, 50% on completion.
                  </p>
                </section>
              );
            }
            return null;
          })}
        </div>

        {/* Footer */}
        {quoteFormat.footer.visible && (
          <footer
            className={`border-t mt-auto pt-2 text-xs ${alignmentClass(quoteFormat.footer.alignment)}`}
            style={{
              marginTop: sectionGap,
              paddingTop: sectionGap,
              borderTopColor: quoteFormat.colors.secondary,
              backgroundColor: `${quoteFormat.colors.primary}06`,
              color: quoteFormat.colors.secondary,
            }}
          >
            {quoteFormat.footer.content || 'Terms & conditions · Contact us'}
          </footer>
        )}
      </div>
    );
  };

  // -------- PDF Export preview (page layout, header/footer, logo position, fonts, file name) --------
  const renderPDFPreview = () => {
    const q = pdfExport.quote;
    const isLandscape = q.orientation === 'landscape';
    // A4 aspect (w/h) = 210/297; preview base width 200, height follows
    const aspect = q.pageSize === 'A4' ? 210 / 297 : q.pageSize === 'Letter' ? 8.5 / 11 : q.pageSize === 'A3' ? 297 / 420 : 210 / 297;
    const baseW = 200;
    const baseH = baseW / aspect;
    const previewW = isLandscape ? baseH : baseW;
    const previewH = isLandscape ? baseW : baseH;
    const headerH = q.header.enabled ? Math.max(8, Math.min(q.header.height * 0.4, 24)) : 0;
    const footerH = q.footer.enabled ? Math.max(6, Math.min(q.footer.height * 0.4, 18)) : 0;
    const bodyH = previewH - headerH - footerH;
    const logoPos = q.logo.position;
    const logoSize = q.logo.size === 'small' ? 12 : q.logo.size === 'large' ? 20 : 16;

    const fileNamePreview = pdfExport.fileNaming.pattern
      .replace('{quoteId}', 'Q-20241225-0001')
      .replace('{projectName}', 'Sample Project')
      .replace('{customerName}', 'John Doe')
      .replace('{quoteNumber}', 'Q-20241225-0001')
      .replace('{date}', new Date().toISOString().split('T')[0]);

    return (
      <div className="space-y-4">
        {/* Page outline */}
        <div
          className="bg-white border-2 border-gray-300 rounded shadow-sm mx-auto overflow-hidden"
          style={{
            width: isLandscape ? previewH : previewW,
            height: isLandscape ? previewW : previewH,
          }}
        >
          {q.header.enabled && (
            <div
              className="border-b border-gray-200 flex items-center px-1.5 relative"
              style={{
                height: headerH,
                backgroundColor: '#f5f5f5',
              }}
            >
              {q.logo.enabled && (
                <div
                  className="absolute bg-blue-100 rounded border border-blue-300 flex items-center justify-center text-[8px] text-blue-700 font-medium"
                  style={{
                    position: 'absolute',
                    width: logoSize,
                    height: logoSize,
                    ...(logoPos === 'top-left' && { left: 4, top: '50%', transform: 'translateY(-50%)' }),
                    ...(logoPos === 'top-center' && { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }),
                    ...(logoPos === 'top-right' && { right: 4, top: '50%', transform: 'translateY(-50%)' }),
                  }}
                >
                  Logo
                </div>
              )}
            </div>
          )}
          <div
            className="p-2 overflow-hidden"
            style={{
              height: bodyH,
              fontFamily: q.fonts.family,
              fontSize: Math.max(8, Math.min(q.fonts.bodySize, 11)),
              color: q.fonts.bodyColor,
            }}
          >
            <p style={{ fontSize: Math.max(9, Math.min(q.fonts.headingSize, 12)), color: q.fonts.headingColor, fontWeight: 600 }}>
              Quote heading
            </p>
            <p className="mt-0.5">Sample body text. Table size: {q.fonts.tableSize}pt.</p>
          </div>
          {q.footer.enabled && (
            <div
              className="border-t border-gray-200 px-1.5 flex items-center text-[8px] text-gray-500"
              style={{ height: footerH, backgroundColor: '#f9f9f9' }}
            >
              Footer area
            </div>
          )}
        </div>
        <p className="text-[10px] text-gray-500 text-center">Page: {q.pageSize} · {q.orientation}</p>
        {/* File name preview */}
        <div className="bg-gray-50 rounded p-2 border border-gray-200">
          <p className="text-[10px] font-medium text-gray-600 mb-1">File name</p>
          <p className="text-xs text-gray-800 truncate" title={fileNamePreview}>{fileNamePreview}.pdf</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-200 bg-white flex-shrink-0 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {showQuotePreview ? 'Quote format preview' : showPDFPreview ? 'PDF export preview' : 'Live Preview'}
        </p>
        {showQuotePreview && (
          <>
            <div className="flex rounded-lg bg-gray-100 p-0.5">
              <button
                type="button"
                onClick={() => setPreviewMode('layout')}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  previewMode === 'layout' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Layout
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('actual')}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  previewMode === 'actual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Actual
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {previewMode === 'layout' ? 'Section structure' : 'Real-time document view'}
            </p>
          </>
        )}
        {showPDFPreview && (
          <p className="text-xs text-gray-400">Page layout, header/footer, fonts & file name</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {showQuotePreview && (previewMode === 'layout' ? renderLayoutView() : renderActualView())}
        {showPDFPreview && renderPDFPreview()}
      </div>
    </div>
  );
};

export default TemplatePreviewCanvas;
