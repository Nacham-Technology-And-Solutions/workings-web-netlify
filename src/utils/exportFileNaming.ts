export function formatExportDate(dateFormat: string, date = new Date()): string {
  switch (dateFormat) {
    case 'DD-MM-YYYY':
      return date.toLocaleDateString('en-GB').replace(/\//g, '-');
    case 'MM/DD/YYYY':
      return date.toLocaleDateString('en-US');
    case 'YYYY/MM/DD':
      return date.toISOString().split('T')[0].replace(/-/g, '/');
    default:
      return date.toISOString().split('T')[0];
  }
}

export function previewExportFileName(
  pattern: string,
  dateFormat: string,
  placeholders: {
    quoteId?: string;
    projectName?: string;
    customerName?: string;
    quoteNumber?: string;
  } = {}
): string {
  const dateStr = formatExportDate(dateFormat);
  return pattern
    .replace('{quoteId}', placeholders.quoteId ?? 'Q-20241225-0001')
    .replace('{projectName}', placeholders.projectName ?? 'Sample-Project')
    .replace('{customerName}', placeholders.customerName ?? 'John-Doe')
    .replace('{quoteNumber}', placeholders.quoteNumber ?? 'Q-20241225-0001')
    .replace('{date}', dateStr);
}
