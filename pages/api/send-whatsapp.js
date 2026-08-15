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
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const messageBody = `Hola ${customerName}! Tu reparación ${repairId} ha sido recibida. Dispositivo: ${deviceType}. Orden: ${orderNumber}`;

    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
    });

    return res.status(200).json({
      success: true,
      messageSid: message.sid,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      error: error.message,
    });
  }
}
