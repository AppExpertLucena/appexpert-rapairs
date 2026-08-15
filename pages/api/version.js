export default async function handler(req, res) {
  return res.status(200).json({
    version: '2026-08-15-14:20',
    timestamp: new Date().toISOString(),
    endpoints: {
      send_whatsapp: '/api/send-whatsapp',
      send_email: '/api/send-email',
      print_label: '/api/print-label',
      print_thermal: '/api/print-thermal',
      health: '/api/health'
    },
    status: 'OK'
  });
}
