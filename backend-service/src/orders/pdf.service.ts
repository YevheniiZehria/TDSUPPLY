import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { OrderEntity } from './order.entity';
import { Response } from 'express';

@Injectable()
export class PdfService {
  generateOrderPdf(order: OrderEntity, res: Response) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Stream output to the response object directly
    doc.pipe(res);

    // Styling & Header
    doc
      .fillColor('#1e3a5f')
      .fontSize(20)
      .text('DISTRIDENT MEDICAL', 50, 50);

    doc
      .fontSize(9)
      .fillColor('#64748b')
      .text('Distribuitor B2B Materiale Dentare', 50, 75)
      .text('Email: dentaltdsupply@gmail.com | Tel: +40 700 000 000', 50, 90);

    // Invoice Title & Info
    doc
      .fillColor('#1e293b')
      .fontSize(14)
      .text('CONFIRMARE COMANDĂ / PROFORMĂ', 250, 50, { align: 'right' })
      .fontSize(9)
      .fillColor('#64748b')
      .text(`Nr. Comandă: #${order.id.slice(0, 8).toUpperCase()}`, 250, 75, { align: 'right' })
      .text(`Data: ${new Date(order.createdAt).toLocaleDateString('ro-RO')}`, 250, 90, { align: 'right' });

    // Divider Line
    doc.moveTo(50, 115).lineTo(545, 115).stroke('#cbd5e1');

    // Customer & Shipping Info
    const startY = 135;
    doc
      .fillColor('#1e3a5f')
      .fontSize(11)
      .text('DETALII CLIENT', 50, startY)
      .fillColor('#1e293b')
      .fontSize(9)
      .text(`Nume: ${order.userName}`, 50, startY + 20)
      .text(`Email: ${order.userEmail}`, 50, startY + 35);

    if (order.deliveryAddress) {
      const addr = order.deliveryAddress;
      doc
        .fillColor('#1e3a5f')
        .fontSize(11)
        .text('ADRESĂ LIVRARE', 300, startY)
        .fillColor('#1e293b')
        .fontSize(9)
        .text(`Strada: ${addr.strada}`, 300, startY + 20);

      let nextLineY = startY + 35;
      if (addr.bloc) {
        doc.text(`Bloc/Scară/Ap: ${addr.bloc}`, 300, nextLineY);
        nextLineY += 15;
      }
      doc.text(`Oraș: ${addr.oras}, Județ: ${addr.judet}`, 300, nextLineY);
      nextLineY += 15;
      doc.text(`Cod poștal: ${addr.codPostal}`, 300, nextLineY);

      if (addr.observatii) {
        nextLineY += 15;
        doc.text(`Observații: ${addr.observatii}`, 300, nextLineY, { width: 245 });
      }
    }

    // Table Header
    let tableTop = 260;
    doc.moveTo(50, tableTop).lineTo(545, tableTop).stroke('#cbd5e1');
    tableTop += 10;

    doc
      .fillColor('#1e3a5f')
      .fontSize(9)
      .text('DENUMIRE PRODUS', 55, tableTop)
      .text('CANTITATE', 300, tableTop, { align: 'right', width: 70 })
      .text('PREȚ UNITAR', 380, tableTop, { align: 'right', width: 75 })
      .text('VALOARE', 470, tableTop, { align: 'right', width: 75 });

    tableTop += 15;
    doc.moveTo(50, tableTop).lineTo(545, tableTop).stroke('#e2e8f0');
    tableTop += 10;

    let currentY = tableTop;
    order.items.forEach((item) => {
      if (currentY > 680) {
        doc.addPage();
        currentY = 50;
      }

      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;

      doc
        .fillColor('#1e293b')
        .fontSize(9)
        .text(item.name, 55, currentY, { width: 230 })
        .text(quantity.toString(), 300, currentY, { align: 'right', width: 70 })
        .text(`${price.toFixed(2)} ${item.currency}`, 380, currentY, { align: 'right', width: 75 })
        .text(`${(price * quantity).toFixed(2)} ${item.currency}`, 470, currentY, { align: 'right', width: 75 });

      currentY += 20;
    });

    // Total section
    if (currentY > 680) {
      doc.addPage();
      currentY = 50;
    }

    doc.moveTo(50, currentY).lineTo(545, currentY).stroke('#cbd5e1');
    currentY += 15;

    const orderTotal = Number(order.total) || 0;

    doc
      .fillColor('#1e3a5f')
      .fontSize(11)
      .text('TOTAL DE PLATĂ:', 300, currentY, { align: 'right', width: 150 })
      .fontSize(12)
      .text(`${orderTotal.toFixed(2)} ${order.currency}`, 465, currentY - 1, { align: 'right', width: 80 });

    // Footer info
    doc
      .fillColor('#94a3b8')
      .fontSize(8)
      .text(
        'Aceasta este o factură proformă de confirmare comandă. Factura fiscală finală va fi eliberată la livrare.',
        50,
        750,
        { align: 'center', width: 500 }
      );

    doc.end();
  }
}
