import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Format date to dd/mm/yyyy format
 */
export function formatDateDDMMYYYY(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date with time to dd/mm/yyyy HH:mm format
 */
export function formatDateTimeDDMMYYYY(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export async function generatePDF(report: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  let y = height - 50;
  const margin = 50;
  const fontSize = 12;

  // Add title
  page.drawText('KRISPOINT MEDICAL REPORT', {
    x: margin,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  // Add patient information
  const patientInfo = [
    `Patient: ${report.patient_name}`,
    `MRN: ${report.patient_mrn}`,
    `Accession: ${report.accession_number}`,
    `Exam: ${report.exam_type}`,
    `Age: ${report.age}`,
    `Indication: ${report.indication}`,
    `Date: ${new Date(report.created_at).toLocaleDateString()}`
  ];

  patientInfo.forEach(info => {
    if (y < 100) {
      page = pdfDoc.addPage([595, 842]);
      y = height - 50;
    }
    page.drawText(info, { x: margin, y, size: fontSize, font });
    y -= 20;
  });

  y -= 20;

  // Add findings
  if (y < 150) {
    page = pdfDoc.addPage([595, 842]);
    y = height - 50;
  }
  page.drawText('FINDINGS:', { x: margin, y, size: 14, font: boldFont });
  y -= 20;
  await addFormattedText(pdfDoc, report.findings, margin, y, font);

  // Add impression
  if (y < 150) {
    page = pdfDoc.addPage([595, 842]);
    y = height - 50;
  }
  page.drawText('IMPRESSION:', { x: margin, y, size: 14, font: boldFont });
  y -= 20;
  await addFormattedText(pdfDoc, report.impression, margin, y, font);

  return pdfDoc.save();
}

async function addFormattedText(pdfDoc: PDFDocument, text: string, x: number, y: number, font: any) {
  // Simple text formatting implementation
  const lines = text.split('\n');
  for (const line of lines) {
    if (y < 50) {
      const newPage = pdfDoc.addPage([595, 842]);
      y = 842 - 50;
    }
    newPage.drawText(line, { x, y, size: 12, font });
    y -= 15;
  }
}