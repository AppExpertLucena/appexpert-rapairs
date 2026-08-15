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

    console.log("📱 [WhatsApp] Parámetros recibidos:", { to, customerName, repairId, deviceType, orderNumber });

    if (!to || !customerName || !repairId || !deviceType || !orderNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Ensure phone number is formatted correctly for Twilio
    const cleanPhone = to.toString().replace(/\D/g, '');
    const toNumber = cleanPhone.startsWith('34') ? `+${cleanPhone}` : `+34${cleanPhone.slice(-9)}`;

    console.log("📱 [WhatsApp] Teléfono formateado:", toNumber);
    console.log("📱 [WhatsApp] From:", process.env.TWILIO_WHATSAPP_NUMBER);
    console.log("📱 [WhatsApp] ContentSid:", "HX4365b4f5b375c99a07a5b507011a328fd");

    const message = await client.messages.create({
      body: `Hola ${customerName}! Tu reparación ${repairId} ha sido recibida. Dispositivo: ${deviceType}. Orden: ${orderNumber}`,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${toNumber}`,
      contentSid: "HX4365b4f5b375c99a07a5b507011a328fd"
    });

    console.log("✅ [WhatsApp] Mensaje enviado exitosamente:", message.sid);
    console.log("📊 [WhatsApp] Status:", message.status);

    return res.status(200).json({
      success: true,
      messageSid: message.sid,
      status: message.status,
      debugInfo: {
        phoneFormatted: toNumber,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        contentSidUsed: "HX4365b4f5b375c99a07a5b507011a328fd"
      }
    });
  } catch (error) {
    console.error("❌ [WhatsApp] Error:", error.message);
    console.error("❌ [WhatsApp] Code:", error.code);
    console.error("❌ [WhatsApp] Status:", error.status);
    console.error("❌ [WhatsApp] Full error:", JSON.stringify(error, null, 2));

    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      status: error.status,
      details: error.details || "No details"
    });
  }
}
