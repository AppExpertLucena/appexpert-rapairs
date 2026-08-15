import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Readable } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderData } = req.body;

    if (!orderData || !orderData.id) {
      return res.status(400).json({ error: 'Missing orderData or order ID' });
    }

    // Generar QR code como data URL
    const qrContent = `https://reparaciones.appexpertlucena.es/?order=${orderData.id}`;
    const qrDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });

    // Crear PDF
    const doc = new PDFDocument({
      size: [203, 254], // 4x3 inches (tamaño estándar térmica)
      margin: 10,
    });

    // Buffer para acumular el PDF
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Encabezado
    doc.fontSize(14).font('Helvetica-Bold').text('APPEXPERT', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Gestión de Reparaciones', { align: 'center' });
    doc.moveTo(10, doc.y).lineTo(193, doc.y).stroke();

    doc.moveDown(0.3);

    // Orden ID grande
    doc.fontSize(16).font('Helvetica-Bold').text(orderData.id, { align: 'center' });
    doc.moveDown(0.2);

    // Cliente
    doc.fontSize(9).font('Helvetica-Bold').text('CLIENTE:');
    doc.fontSize(8).font('Helvetica').text(orderData.client?.name || 'N/A', { width: 183 });
    doc.fontSize(7).text(`Tel: ${orderData.client?.phone || 'N/A'}`, { width: 183 });

    doc.moveDown(0.2);

    // Dispositivo
    doc.fontSize(9).font('Helvetica-Bold').text('DISPOSITIVO:');
    doc.fontSize(8).font('Helvetica').text(`${orderData.device?.brand || 'N/A'} ${orderData.device?.model || 'N/A'}`, { width: 183 });
    if (orderData.device?.imei) {
      doc.fontSize(7).text(`IMEI: ${orderData.device.imei}`, { width: 183 });
    }

    doc.moveDown(0.2);

    // Estado
    doc.fontSize(9).font('Helvetica-Bold').text('ESTADO:');
    doc.fontSize(8).font('Helvetica').text(orderData.status || 'Recibido', { width: 183 });

    doc.moveDown(0.3);

    // QR Code
    doc.image(qrDataUrl, 75, doc.y, { width: 53, height: 53 });
    doc.moveDown(3.5);

    // Footer
    doc.moveTo(10, doc.y).lineTo(193, doc.y).stroke();
    doc.fontSize(7).font('Helvetica').text(new Date().toLocaleDateString('es-ES'), { align: 'center' });

    doc.end();

    // Promesa para esperar que se complete el PDF
    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="etiqueta_${orderData.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Print label error:', error);
    res.status(500).json({ error: error.message });
  }
}
