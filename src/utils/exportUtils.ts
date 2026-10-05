import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

/**
 * Trigger browser file download from Blob
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * 1. Export Data to CSV (.csv)
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const sanitizeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const headerLine = headers.map(sanitizeCell).join(',');
  const rowLines = rows.map(row => row.map(sanitizeCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n'); // UTF-8 BOM for Excel

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  triggerFileDownload(blob, finalFilename);
}

/**
 * Escape XML special characters
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
 * 2. Export Data to Excel (.xlsx) using standard OpenXML ZIP structure
 */
export async function exportToExcelXLSX(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number | undefined | null)[][],
  reportTitle?: string
) {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  // 3. xl/_rels/workbook.xml.rels
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // 4. xl/workbook.xml
  const cleanSheetName = escapeXml(sheetName.slice(0, 31) || 'Sheet1');
  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${cleanSheetName}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  // 5. xl/styles.xml
  zip.file(
    'xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Calibri"/><sz val="11"/></font>
    <font><b/><name val="Calibri"/><sz val="11"/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF4C0196"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`
  );

  // Helper to convert index 0 -> A, 27 -> AB
  const getColLetter = (colIdx: number): string => {
    let temp = colIdx;
    let letter = '';
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  // Build rows XML
  let sheetRowsXml = '';
  let rowIndex = 1;

  // Title row if present
  if (reportTitle) {
    const titleCell = `<c r="A${rowIndex}" t="inlineStr"><is><t>${escapeXml(reportTitle)}</t></is></c>`;
    sheetRowsXml += `<row r="${rowIndex}">${titleCell}</row>`;
    rowIndex++;
    // Empty row separator
    sheetRowsXml += `<row r="${rowIndex}"></row>`;
    rowIndex++;
  }

  // Header row (styled)
  let headerCellsXml = '';
  headers.forEach((h, colIdx) => {
    const cellRef = `${getColLetter(colIdx)}${rowIndex}`;
    headerCellsXml += `<c r="${cellRef}" s="1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`;
  });
  sheetRowsXml += `<row r="${rowIndex}">${headerCellsXml}</row>`;
  rowIndex++;

  // Data rows
  rows.forEach(row => {
    let rowCellsXml = '';
    row.forEach((val, colIdx) => {
      const cellRef = `${getColLetter(colIdx)}${rowIndex}`;
      if (typeof val === 'number') {
        rowCellsXml += `<c r="${cellRef}"><v>${val}</v></c>`;
      } else {
        rowCellsXml += `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
      }
    });
    sheetRowsXml += `<row r="${rowIndex}">${rowCellsXml}</row>`;
    rowIndex++;
  });

  // 6. xl/worksheets/sheet1.xml
  zip.file(
    'xl/worksheets/sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetRowsXml}
  </sheetData>
</worksheet>`
  );

  // Generate binary xlsx
  const content = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  triggerFileDownload(content, finalFilename);
}

/**
 * 3. Export Data to PDF (.pdf)
 */
export function exportToPDF(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number | undefined | null)[][],
  totalsSummary?: { label: string; value: string }[],
  businessInfo?: { name?: string; address?: string; phone?: string; email?: string }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  let currentY = 18;

  // Header branding bar (Smartcore Royal Purple #4C0196)
  doc.setFillColor(76, 1, 150);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Business Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59);
  doc.text(businessInfo?.name || 'Smartcore ICT Centre', marginX, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  if (businessInfo?.address) {
    doc.text(businessInfo.address, marginX, currentY);
    currentY += 4;
  }

  const contactText = [businessInfo?.phone ? `Tel: ${businessInfo.phone}` : '', businessInfo?.email ? `Email: ${businessInfo.email}` : '']
    .filter(Boolean)
    .join('  ·  ');
  if (contactText) {
    doc.text(contactText, marginX, currentY);
    currentY += 6;
  } else {
    currentY += 4;
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 6;

  // Report Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title, marginX, currentY);

  if (subtitle) {
    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, marginX, currentY);
  }

  currentY += 7;

  // Table calculations
  const availableWidth = pageWidth - marginX * 2;
  const colWidth = availableWidth / headers.length;
  const rowHeight = 7;

  // Header Row
  doc.setFillColor(76, 1, 150);
  doc.rect(marginX, currentY, availableWidth, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  headers.forEach((h, i) => {
    const textX = marginX + i * colWidth + 2;
    doc.text(h, textX, currentY + 4.8);
  });

  currentY += rowHeight;

  // Data Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  rows.forEach((row, rowIdx) => {
    // Check if new page needed
    if (currentY + rowHeight > pageHeight - 25) {
      doc.addPage();
      currentY = 18;
      // Re-draw header
      doc.setFillColor(76, 1, 150);
      doc.rect(marginX, currentY, availableWidth, rowHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      headers.forEach((h, i) => {
        const textX = marginX + i * colWidth + 2;
        doc.text(h, textX, currentY + 4.8);
      });
      currentY += rowHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
    }

    // Alternating row background
    if (rowIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, availableWidth, rowHeight, 'F');
    }

    doc.setTextColor(51, 65, 85);
    row.forEach((val, colIdx) => {
      const textX = marginX + colIdx * colWidth + 2;
      const strVal = val !== undefined && val !== null ? String(val) : '';
      // Truncate if too long for column
      const maxChars = Math.floor(colWidth * 0.45);
      const displayVal = strVal.length > maxChars ? strVal.slice(0, maxChars - 2) + '..' : strVal;
      doc.text(displayVal, textX, currentY + 4.8);
    });

    // Row underline
    doc.setDrawColor(241, 245, 249);
    doc.line(marginX, currentY + rowHeight, marginX + availableWidth, currentY + rowHeight);
    currentY += rowHeight;
  });

  // Totals Summary Box (if provided)
  if (totalsSummary && totalsSummary.length > 0) {
    currentY += 4;
    if (currentY + totalsSummary.length * 6 > pageHeight - 20) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFillColor(241, 245, 249);
    const boxHeight = totalsSummary.length * 5.5 + 4;
    doc.roundedRect(marginX + availableWidth - 75, currentY, 75, boxHeight, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    totalsSummary.forEach((tot, idx) => {
      const lineY = currentY + 4 + idx * 5.5;
      doc.setTextColor(71, 85, 105);
      doc.text(tot.label, marginX + availableWidth - 72, lineY);
      doc.setTextColor(15, 23, 42);
      doc.text(tot.value, marginX + availableWidth - 4, lineY, { align: 'right' });
    });

    currentY += boxHeight + 4;
  }

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by BizFlow · ${new Date().toLocaleDateString('en-GB')} · Official Business Record`,
      marginX,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
  }

  const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(finalFilename);
}
