import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, orderData } = req.body;

    if (!email || !orderData) {
      return res.status(400).json({ error: 'Missing email or orderData' });
    }

    const msg = {
      to: email,
      from: 'noreply@appexpertlucena.es',
      subject: `Resguardo de Reparación - Orden ${orderData.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0C1F3A 0%, #1a3a52 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">AppExpert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Gestión de Reparaciones</p>
          </div>

          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #dee2e6;">
            <h2 style="color: #0C1F3A; margin-top: 0;">¡Orden Recibida!</h2>

            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #00BCD4;">
              <p style="margin: 0 0 15px 0;"><strong style="color: #0C1F3A;">Número de Orden:</strong><br><span style="font-size: 18px; color: #00BCD4; font-weight: bold;">${orderData.id}</span></p>
              <p style="margin: 0 0 15px 0;"><strong style="color: #0C1F3A;">Cliente:</strong><br>${orderData.client?.name || 'N/A'}</p>
              <p style="margin: 0 0 15px 0;"><strong style="color: #0C1F3A;">Dispositivo:</strong><br>${orderData.device?.brand || 'N/A'} ${orderData.device?.model || 'N/A'}</p>
              <p style="margin: 0;"><strong style="color: #0C1F3A;">Estado:</strong><br><span style="color: #28a745; font-weight: bold;">Recibido en taller</span></p>
            </div>

            <p style="color: #666; line-height: 1.6;">Te notificaremos cuando tu dispositivo esté listo para recoger. Puedes consultar el estado de tu orden en cualquier momento.</p>

            <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #0C1F3A;"><strong>¿Preguntas?</strong></p>
              <p style="margin: 5px 0 0 0; color: #666;">Contáctanos: 📱 664 03 00 87</p>
            </div>

            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">

            <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
              <strong>AppExpert Gadgets Solutions</strong><br>
              📍 C/ Jaime 24, Lucena (Córdoba)<br>
              © 2026 Todos los derechos reservados
            </p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: error.message });
  }
}
