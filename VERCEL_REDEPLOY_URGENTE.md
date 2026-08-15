# 🚨 REDEPLOY URGENTE - VERCEL WEBHOOK ROTO

**Fecha**: 15 de agosto de 2026, 14:30 UTC
**Problema**: El webhook GitHub → Vercel NO funciona. Los últimos 8 commits no se han deployado.

---

## ⚠️ SITUACIÓN ACTUAL

```
GitHub Status:      ✅ 8 commits nuevos pusheados
Vercel Status:      ❌ Sirviendo código viejo (sin actualizar en 2+ horas)
Endpoint version:   ❌ 404 (no existe)
Endpoint whatsapp:  ❌ 404 (no existe)
```

---

## 🔧 SOLUCIÓN: REDEPLOY MANUAL (2 minutos)

### Paso 1: Abre Vercel Dashboard
```
URL: https://vercel.com/AppExpertLucena/appexpert-rapairs
```

### Paso 2: Busca el Botón "Redeploy" o "Revert"
```
En la lista de deployments:
- Encuentra el deployment más reciente
- Haz clic en los "..." (tres puntos)
- Selecciona "Redeploy"
```

### Paso 3: Espera 2-3 Minutos
```
Vercel comenzará a reconstruir todo desde cero.
Verás una barra de progreso azul.
Cuando sea verde = ¡COMPLETO!
```

### Paso 4: Verifica que Funcionó
```bash
# Abre una terminal y ejecuta:
curl https://reparaciones.appexpertlucena.es/api/version

# Debería responder:
# HTTP 200 OK con:
# {
#   "version": "2026-08-15-14:20",
#   "endpoints": { ... },
#   "status": "OK"
# }
```

---

## 🎯 DESPUÉS DEL REDEPLOY

Una vez que Vercel haya actualizado y `/api/version` devuelva 200:

### 1. Test WhatsApp
```
1. Abre: https://reparaciones.appexpertlucena.es
2. Login: Técnico "1233"
3. "+ Nueva orden"
4. Datos:
   - Nombre: "Test WhatsApp"
   - Teléfono: 649591425
   - Dispositivo: iPhone
   - Modelo: 13
   - IMEI: 123456789
   - Síntomas: "Test de WhatsApp"
   - Firma: Dibuja algo
5. GUARDA
6. 📱 Espera WhatsApp en tu móvil (5-10 segundos)
```

### 2. Verifica Logs de Vercel (Opcional)
```
Si el WhatsApp no llega:
1. Ve a Vercel → Logs
2. Busca errores de /api/send-whatsapp
3. Verifica credenciales de Twilio
```

---

## 📊 QUÉ SE ESPERA RECIBIR EN WHATSAPP

```
¡Hola Test WhatsApp! 📱

Tu reparación ha sido recibida.

📋 Orden: ORD-2026-0003
📱 Dispositivo: iPhone 13
Síntomas: Test de WhatsApp

Te notificaremos cuando esté lista. ¡Gracias por confiar en AppExpert! 🔧
```

---

## ⏱️ ESTIMADO DE TIEMPO

| Paso | Tiempo | Status |
|------|--------|--------|
| Abrir Vercel | 30 seg | ✅ Manual |
| Hacer Redeploy | 1 min | ✅ Manual |
| Esperar build | 2-3 min | ⏳ Automático |
| Test WhatsApp | 1 min | ✅ Manual |
| **TOTAL** | **~5 min** | 🚀 |

---

## 🆘 SI NO FUNCIONA

### Opción A: Limpiar Caché
```
1. Abre DevTools (F12)
2. Settings → Network → Disable cache
3. Recarga: Ctrl+Shift+R
4. Intenta de nuevo
```

### Opción B: Forzar Redeploy Desde CLI
```bash
# Si tienes Vercel CLI instalado:
npm install -g vercel
vercel --prod --force

# Ingresa tus credenciales de Vercel
```

### Opción C: Verificar Credenciales Twilio
```
Si recibe la orden pero NO el WhatsApp:

1. Ve a Vercel → Settings → Environment Variables
2. Verifica que existan:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_WHATSAPP_NUMBER
3. Si faltan, agrégalas y redeploy nuevamente
```

---

## 📝 NOTAS IMPORTANTES

1. **Webhook Roto**: El problema es que GitHub → Vercel webhook no está funcionando. Después de este redeploy manual, considera:
   - Recrear el webhook en GitHub settings
   - O conectar un nuevo webhook en Vercel

2. **Número de Teléfono**: Asegúrate de que 649591425 está verificado en tu cuenta Twilio Sandbox

3. **Base de Datos**: La BD está limpia. Cuando hagas el test, se creará ORD-2026-0003 (después de las órdenes de prueba anteriores)

---

## ✅ CHECKLIST FINAL

- [ ] Redeploy manual completado en Vercel
- [ ] `/api/version` retorna 200 OK
- [ ] `/api/send-whatsapp` retorna 405+ (no 404)
- [ ] Orden ORD-2026-0003 creada exitosamente
- [ ] WhatsApp recibido en tu móvil
- [ ] Phase 2 (WhatsApp) ✅ COMPLETADO

---

**Tiempo total esperado**: 5-7 minutos  
**Dificultad**: Muy fácil (3 clics)  
**Ayuda**: Si algo falla, revisa los logs de Vercel o ejecuta `VERCEL_DEBUG=true vercel logs`

¡Que funcione! 🚀
