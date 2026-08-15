import escpos from 'escpos';
import QRCode from 'qrcode';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderData, printerPort } = req.body;

    if (!orderData || !orderData.id) {
      return res.status(400).json({ error: 'Missing orderData or order ID' });
    }

    // Generar QR como buffer
    const qrBuffer = await QRCode.toBuffer(orderData.id, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 200,
    });

    // Información de la impresora (puede ser USB, Serial, o Red)
    // Para producción, esto vendría de configuración
    const device = new escpos.USB(printerPort || 0x0483);
    const printer = new escpos.Printer(device);

    await new Promise((resolve, reject) => {
      device.open(() => {
        printer
          .align('ct')
          .style('b')
          .size(2, 2)
          .text('APPEXPERT')
          .text('')
          .size(1, 1)
          .style('normal')
          .text('Gestión de Reparaciones')
          .hr()
          .text('')
          // Orden ID
          .align('ct')
          .size(2, 2)
          .style('b')
          .text(orderData.id)
          .text('')
          .size(1, 1)
          .style('normal')
          // Cliente
          .align('lt')
          .text('CLIENTE:')
          .text(orderData.client?.name || 'N/A')
          .text(`Tel: ${orderData.client?.phone || 'N/A'}`)
          .text('')
          // Dispositivo
          .text('DISPOSITIVO:')
          .text(`${orderData.device?.brand || 'N/A'} ${orderData.device?.model || 'N/A'}`)
          .text(orderData.device?.imei ? `IMEI: ${orderData.device.imei}` : '')
          .text('')
          // Estado
          .text('ESTADO:')
          .text(orderData.status || 'Recibido')
          .text('')
          // QR
          .align('ct')
          .image(qrBuffer, 0, 0, { width: 200, height: 200 })
          .text('')
          // Footer
          .align('ct')
          .style('normal')
          .text(new Date().toLocaleDateString('es-ES'))
          .cut()
          .close(resolve);
      });

      device.on('error', reject);
    });

    res.status(200).json({ success: true, message: 'Etiqueta impresa correctamente' });
  } catch (error) {
    console.error('Thermal print error:', error);
    res.status(500).json({ error: error.message });
  }
}
