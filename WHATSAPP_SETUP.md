# WhatsApp Integration Setup 📱

## Overview
La aplicación AGR ahora envía notificaciones automáticas por WhatsApp a los clientes cuando:
- ✅ Su reparación ha sido recibida en el taller
- (Próximo: Cuando su reparación está lista para recoger)

## Requisitos Previos

1. **Crear cuenta en Twilio** (https://www.twilio.com)
2. **Verificar número de teléfono**
3. **Obtener credenciales de Twilio**

## Pasos de Configuración

### 1️⃣ Crear cuenta Twilio

1. Ve a https://www.twilio.com/console
2. Crea una cuenta gratuita
3. Completa la verificación de email

### 2️⃣ Configurar WhatsApp en Twilio

1. Ve a **Messaging** → **Try it out** → **Send an SMS**
2. En la izquierda, ve a **Messaging** → **Services**
3. Crea un nuevo servicio:
   - **Friendly Name**: `AppExpert WhatsApp`
   - **Type**: `Messenger`
4. Una vez creado, ve a la pestaña **Integration**
5. Busca **WhatsApp** en los canales disponibles
6. Haz clic en **Connect** para WhatsApp

### 3️⃣ Obtener credenciales

1. Ve a **Account** → **API Keys & Tokens**
2. Copia:
   - `ACCOUNT SID`
   - `AUTH TOKEN`
3. Ve a **Messaging** → **Services** → Tu servicio
4. Copia el número de WhatsApp asignado

### 4️⃣ Configurar variables de entorno

En el archivo `.env.local`, agrega:

```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+34123456789
```

### 5️⃣ Desplegar cambios

```bash
npm install
npm run build
vercel --prod
```

## Cómo Funciona

Cuando se crea una nueva reparación:

1. El cliente recibe un **email** con detalles
2. El cliente recibe un **WhatsApp** confirmando que fue recibida
3. Incluye:
   - Número de orden
   - Dispositivo reparado
   - Mensaje de confirmación

## Mensaje de ejemplo

```
¡Hola Juan! 📱

Tu reparación ha sido recibida.

📋 Orden: ORD-2026-0001
📱 Dispositivo: iPhone 13 Pro

Te notificaremos cuando esté lista. ¡Gracias por confiar en AppExpert! 🔧
```

## Próximas mejoras

- [ ] Enviar WhatsApp cuando la reparación esté lista
- [ ] Permitir que el cliente cancele desde WhatsApp
- [ ] Notificaciones de progreso en tiempo real
- [ ] Integración de fotos en WhatsApp

## Precios de Twilio

- WhatsApp: ~$0.0075 USD por mensaje
- SMS: ~$0.0075 USD por mensaje
- Primeros 50 créditos gratis para pruebas

## Troubleshooting

**Error: "Invalid WhatsApp number"**
- Verifica que el número esté en formato `whatsapp:+34XXXXXXXXX`

**Error: "Service not found"**
- Asegúrate de que Twilio está inicializado correctamente
- Verifica que las variables de entorno están configuradas

**Error: "Unauthorized"**
- Verifica `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`
- Asegúrate de que están copiados correctamente

## Test Manual

Para probar sin número real:

```bash
# En terminal
curl -X POST http://localhost:3000/api/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "664030087",
    "message": "Test message"
  }'
```
