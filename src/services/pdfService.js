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
  // Embed all standard fonts
  const fonts = {
    Helvetica: {
      normal: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
      bolditalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)
    },
    TimesRoman: {
      normal: await pdfDoc.embedFont(StandardFonts.TimesRoman),
      bold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
      italic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
      bolditalic: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic)
    },
    Courier: {
      normal: await pdfDoc.embedFont(StandardFonts.Courier),
      bold: await pdfDoc.embedFont(StandardFonts.CourierBold),
      italic: await pdfDoc.embedFont(StandardFonts.CourierOblique),
      bolditalic: await pdfDoc.embedFont(StandardFonts.CourierBoldOblique)
    }
  };

  const hexToRgb = (hex) => {
    if (!hex) return rgb(0, 0, 0);
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

  (fieldMap || []).forEach(field => {
    const page = pdfDoc.getPage(field.page || 0);
    const value = fieldData[field.key] || '';
    if (!page) return;

    // Font Selection
    const family = fonts[field.fontFamily || 'Helvetica'] || fonts.Helvetica;
    const isBold = field.fontWeight === 'bold';
    const isItalic = field.fontStyle === 'italic';
    let selectedFont = family.normal;
    if (isBold && isItalic) selectedFont = family.bolditalic;
    else if (isBold) selectedFont = family.bold;
    else if (isItalic) selectedFont = family.italic;

    const size = field.fontSize || field.size || 11;
    const color = hexToRgb(field.color || '#000000');

    let x = field.x;
    let y = field.y;

    if (field.w && field.h) {
      const text = String(value);
      const textWidth = selectedFont.widthOfTextAtSize(text, size);
      const textAlign = field.textAlign || 'left';

      // Vertical Center (Default for boxes)
      y = field.y + (field.h / 2) - (size / 4);

      // Horizontal Alignment
      if (textAlign === 'center') {
        x = field.x + (field.w - textWidth) / 2;
      } else if (textAlign === 'right') {
        x = field.x + field.w - textWidth - 2; // -2 padding
      } else {
        x = field.x + 2; // Left with padding
      }
    }

    page.drawText(String(value), {
      x: x,
      y: y,
      size: size,
      font: selectedFont,
      color: color
    });
  });

  // Belge numarasini sag ust koseye yaz
  const firstPage = pdfDoc.getPage(0);
  const { width, height } = firstPage.getSize();
  firstPage.drawText(docNumber, {
    x: width - 150,
    y: height - 30,
    size: 12,
    font: fonts.Helvetica.normal,
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

