export default function handler(req, res) {
  return res.status(200).json({
    twilio: {
      account_sid: process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ NO CONFIGURADO',
      auth_token: process.env.TWILIO_AUTH_TOKEN ? '✅ Configurado' : '❌ NO CONFIGURADO',
      whatsapp_number: process.env.TWILIO_WHATSAPP_NUMBER || '❌ NO CONFIGURADO',
      values: {
        account_sid: process.env.TWILIO_ACCOUNT_SID || 'undefined',
        auth_token: process.env.TWILIO_AUTH_TOKEN ? '***' : 'undefined',
        whatsapp_number: process.env.TWILIO_WHATSAPP_NUMBER || 'undefined'
      }
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ NO',
      key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✅ Configurado' : '❌ NO'
    }
  });
}
