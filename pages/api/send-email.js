import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, orderData } = req.body;

    const msg = {
      to: email,
      from: 'appexpert.mobile@gmail.com',
      subject: `Resguardo de Reparación - Orden ${orderData.id}`,
      html: `
        <h2>¡Orden Recibida!</h2>
        <p><strong>Número de Orden:</strong> ${orderData.id}</p>
        <p><strong>Dispositivo:</strong> ${orderData.device.brand} ${orderData.device.model}</p>
        <p><strong>Estado:</strong> Recibido en taller</p>
        <p>Te notificaremos cuando esté listo.</p>
        <p><strong>AppExpert Gadgets Solutions</strong></p>
      `
    };

    await sgMail.send(msg);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: error.message });
  }
}
