import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { to, customerName, repairId, deviceType, orderNumber } = req.body;

    if (!to || !customerName || !repairId || !deviceType || !orderNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Ensure phone number is formatted correctly for Twilio
    const phoneNumber = to.toString().replace(/\D/g, ''); // Remove all non-digits
    const toNumber = phoneNumber.length === 9 ? `+34${phoneNumber}` : `+34${phoneNumber.slice(-9)}`;

    const message = await client.messages.create({
      body: `Hola ${customerName}! Tu reparación ${repairId} ha sido recibida. Dispositivo: ${deviceType}. Orden: ${orderNumber}`,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${toNumber}`,
      contentSid: "HX436584f5b375c99a07a5b50701a328fd",
    });

    return res.status(200).json({
      success: true,
      messageSid: message.sid,
    });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return res.status(500).json({
      error: error.message,
      code: error.code
    });
  }
}
