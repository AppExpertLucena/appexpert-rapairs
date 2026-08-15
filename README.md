# 🔧 AGR - AppExpert Gestión de Reparaciones

Sistema profesional de gestión de reparaciones para AppExpert Gadgets Solutions.

## ✨ Características Implementadas

### ✅ Fase 1 - COMPLETADA
- **Autenticación**: Sistema de login por técnico
- **Gestión de Órdenes**: Crear, ver y buscar órdenes de reparación
- **Datos Detallados**: Información completa de cliente y dispositivo
- **Fotos**: Captura de hasta 5 fotos del dispositivo
- **Firma Digital**: Firma del cliente mediante Canvas API
- **Almacenamiento**: Base de datos Supabase con 100 días de retención
- **Búsqueda Avanzada**: Por IMEI, teléfono, nombre, número de orden
- **PDF**: Descarga de comprobante profesional
- **QR Code**: Código QR para cada orden
- **Email Automático**: Confirmación por correo (plantilla mejorada)
- **Estadísticas**: Dashboard con métricas de órdenes
- **Validaciones**: Validación completa de datos entrada

### 🎯 Mejoras Realizadas
- Login screen mejorado con gradiente y emojis
- Dashboard con estadísticas en tiempo real
- QR codes integrados en cada orden
- Validación avanzada de teléfono e IMEI
- Email template HTML profesional sin fotos (evita errores 413)
- Grid layout responsive para todas las pantallas
- Interfaz intuitiva y amigable

## 🚀 Deployment

- **Producción**: https://appexpert-rapairs.vercel.app
- **Health Check**: https://appexpert-rapairs.vercel.app/api/health
- **Dominio Personalizado**: reparaciones.appexpertlucena.es (pendiente configuración)

## 💾 Base de Datos

- **Proveedor**: Supabase (PostgreSQL)
- **Región**: Frankfurt (RGPD Compliant)
- **Tablas**:
  - `orders`: Órdenes de reparación
  - `clients`: Datos de clientes
  - `devices`: Datos de dispositivos

## 🛠️ Stack Técnico

- **Frontend**: React 18.2, Next.js 14, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL
- **Authentication**: Email via SendGrid
- **Hosting**: Vercel
- **QR Codes**: qrcode.react
- **Encryption**: AES-256 (para datos sensibles)

## 📋 Guía de Uso

### Crear Nueva Orden
1. Haz clic en "+ Nueva orden"
2. Completa los 7 pasos:
   - Datos del cliente
   - Datos del dispositivo
   - Fotos
   - Síntomas
   - Diagnóstico
   - PIN/Contraseña
   - Firma

### Buscar Orden
1. Haz clic en "🔍 Buscar dispositivo"
2. Ingresa IMEI, teléfono, nombre o número de orden
3. Haz clic en una orden para verdetalle

### Ver Detalles
- Información completa del cliente y dispositivo
- QR code para acceso rápido
- Botón para descargar PDF
- Botón para imprimir

## 🔐 Seguridad

- SSL/TLS en todas las conexiones
- Validación en frontend y backend
- Datos sensibles cifrados
- RGPD compliant
- Autenticación por usuario

## 📞 Contacto

**AppExpert Gadgets Solutions**
- 📍 C/ Jaime 24, Lucena (Córdoba)
- 📱 664 03 00 87
- 🌐 https://appexpert-rapairs.vercel.app

## 📝 Notas de Desarrollo

- Todas las órdenes se guardan automáticamente en Supabase
- Las fotos se almacenan como base64 en la BD
- Los emails se envían sin fotos para evitar problemas de tamaño
- El sistema es completamente responsive (mobile-first)

---

**Última actualización**: 2026-08-15
**Versión**: 1.0.0
