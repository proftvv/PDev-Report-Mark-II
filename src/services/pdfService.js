const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { buildGeneratedPath } = require('../storage');
const { formatDocNumber } = require('../utils/docNumber');

/**
 * fieldData: { key: value, ... }
 * fieldMap: [{ key, page, x, y, size }]
 */
async function fillPdfTemplate({ templatePath, fieldData, fieldMap, docNumber, outputName }) {
  const existingPdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  (fieldMap || []).forEach(field => {
    const page = pdfDoc.getPage(field.page || 0);
    const value = fieldData[field.key] || '';
    if (!page) return;
    page.drawText(String(value), {
      x: field.x,
      y: field.y,
      size: field.size || 11,
      font,
      color: rgb(0, 0, 0)
    });
  });

  // Belge numarasini sag ust koseye yaz
  const firstPage = pdfDoc.getPage(0);
  const { width, height } = firstPage.getSize();
  firstPage.drawText(docNumber, {
    x: width - 150,
    y: height - 30,
    size: 12,
    font,
    color: rgb(0.1, 0.1, 0.1)
  });

  const pdfBytes = await pdfDoc.save();
  const filePath = buildGeneratedPath(outputName);
  fs.writeFileSync(filePath, pdfBytes);
  return filePath;
}

function nextDocNumber(date, sequence) {
  return formatDocNumber(date, sequence);
}

module.exports = {
  fillPdfTemplate,
  nextDocNumber
};

