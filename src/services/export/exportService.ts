import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface CuttingLayout {
  id: string;
  layout: string;
  repetition: number;
  cuts: { length: number; unit: string }[];
  offCut: number;
}

export const exportMaterialListToPDF = (
  materials: MaterialItem[],
  projectName: string,
  customerName: string,
  grandTotal: number
) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Material List', 14, 20);

  // Project Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 14, 30);
  doc.text(`Customer: ${customerName}`, 14, 36);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 42);

  // Material Table
  const tableData = materials.map((item, index) => [
    index + 1,
    item.name,
    item.quantity,
    item.unit,
    `₦${item.unitPrice.toLocaleString()}`,
    `₦${item.total.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['S/N', 'Item', 'Quantity', 'Unit', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' }
  });

  // Grand Total
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total: ₦${grandTotal.toLocaleString()}`, 14, finalY + 10);

  // Save
  doc.save(`Material-List-${projectName.replace(/\s+/g, '-')}.pdf`);
};

export const exportCuttingListToPDF = (
  layouts: CuttingLayout[],
  projectName: string,
  materialLength: number,
  materialQuantity: number
) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Cutting List', 14, 20);

  // Project Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 14, 30);
  doc.text(`Material Length: ${materialLength} meters`, 14, 36);
  doc.text(`Quantity: ${materialQuantity} length`, 14, 42);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 48);

  // Cutting Layout Table
  const tableData = layouts.map((layout) => [
    layout.layout,
    `${layout.repetition}X`,
    layout.cuts.map(c => `${c.length}${c.unit}`).join(', '),
    `${layout.offCut}m`
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Layout', 'Repetition', 'Cuts', 'Off-cut']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold' }
  });

  // Save
  doc.save(`Cutting-List-${projectName.replace(/\s+/g, '-')}.pdf`);
};

export const exportMaterialListToExcel = (
  materials: MaterialItem[],
  projectName: string,
  customerName: string,
  grandTotal: number
) => {
  // Create worksheet data
  const wsData = [
    ['Material List'],
    [],
    ['Project:', projectName],
    ['Customer:', customerName],
    ['Date:', new Date().toLocaleDateString()],
    [],
    ['S/N', 'Item', 'Quantity', 'Unit', 'Unit Price (₦)', 'Total (₦)'],
    ...materials.map((item, index) => [
      index + 1,
      item.name,
      item.quantity,
      item.unit,
      item.unitPrice,
      item.total
    ]),
    [],
    ['', '', '', '', 'Grand Total:', grandTotal]
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Style the header
  ws['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Material List');

  // Save file
  XLSX.writeFile(wb, `Material-List-${projectName.replace(/\s+/g, '-')}.xlsx`);
};

export const exportCuttingListToExcel = (
  layouts: CuttingLayout[],
  projectName: string,
  materialLength: number,
  materialQuantity: number
) => {
  // Create worksheet data
  const wsData = [
    ['Cutting List'],
    [],
    ['Project:', projectName],
    ['Material Length:', `${materialLength} meters`],
    ['Quantity:', `${materialQuantity} length`],
    ['Date:', new Date().toLocaleDateString()],
    [],
    ['Layout', 'Repetition', 'Cuts', 'Off-cut (m)'],
    ...layouts.map((layout) => [
      layout.layout,
      `${layout.repetition}X`,
      layout.cuts.map(c => `${c.length}${c.unit}`).join(', '),
      layout.offCut
    ])
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 30 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Cutting List');

  // Save file
  XLSX.writeFile(wb, `Cutting-List-${projectName.replace(/\s+/g, '-')}.xlsx`);
};

export const shareData = async (
  type: 'material' | 'cutting',
  data: any,
  projectName: string
) => {
  // Check if Web Share API is available
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${type === 'material' ? 'Material List' : 'Cutting List'} - ${projectName}`,
        text: `View the ${type} list for project: ${projectName}`,
        url: window.location.href
      });
      return { success: true, message: 'Shared successfully' };
    } catch (error) {
      console.error('Error sharing:', error);
      return { success: false, message: 'Share cancelled or failed' };
    }
  } else {
    // Fallback: Copy to clipboard
    const text = type === 'material' 
      ? `Material List for ${projectName}\n${JSON.stringify(data, null, 2)}`
      : `Cutting List for ${projectName}\n${JSON.stringify(data, null, 2)}`;
    
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, message: 'Copied to clipboard!' };
    } catch (error) {
      return { success: false, message: 'Could not copy to clipboard' };
    }
  }
};

