import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, message, type, orderData } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Missing phone or message' });
    }

    const formattedPhone = `whatsapp:+34${phone.replace(/\D/g, '').slice(-9)}`;

    const msg = {
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: formattedPhone,
    };

    await client.messages.create(msg);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('WhatsApp error:', error);
    res.status(500).json({ error: error.message });
  }
}
