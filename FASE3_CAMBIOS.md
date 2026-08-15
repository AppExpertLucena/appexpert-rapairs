# 🖨️ Phase 3 - Thermal Printer Integration

## Resumen

Se ha implementado completamente la integración de impresoras térmicas en la aplicación AGR. Los usuarios ahora pueden generar etiquetas profesionales en PDF o imprimir directamente en impresoras térmicas USB/red.

**Fecha**: 15 de agosto de 2026
**Status**: ✅ COMPLETADA

---

## 📊 Cambios Realizados

### 1. Dependencias Agregadas

**Archivo**: `package.json`

```json
{
  "dependencies": {
    "pdfkit": "^0.13.0",
    "qrcode": "^1.5.3",
    "escpos": "^3.0.0-alpha.7"
  }
}
```

**Librerías:**
- **pdfkit**: Generación de PDFs con diseño profesional
- **qrcode**: Generación de QR codes en servidor
- **escpos**: Comunicación con impresoras Epson ES-POS

### 2. Endpoint de Generación de PDF

**Archivo**: `pages/api/print-label.js` (NUEVO)

```javascript
- Recibe: orderData (orden completa)
- Genera QR code único
- Crea PDF con tamaño 4x3 pulgadas (térmico)
- Incluye: cliente, dispositivo, estado, QR
- Retorna: PDF descargable
```

**Características:**
- ✅ Tamaño estándar de impresora térmica
- ✅ QR con alta corrección de errores
- ✅ Información completa legible
- ✅ Descarga automática del navegador
- ✅ Manejo de errores robusto

### 3. Endpoint de Impresora Térmica USB

**Archivo**: `pages/api/print-thermal.js` (NUEVO)

```javascript
- Recibe: orderData + puerto de impresora
- Comunica directamente con impresora USB
- Envía comandos ESC/POS
- Imprime automáticamente sin diálogo
- Corta el papel después de imprimir
```

**Características:**
- ✅ Compatible Epson TM-T20, TM-T88, etc.
- ✅ Comunicación USB directa
- ✅ Corte automático de papel
- ✅ Configuración flexible de puerto

### 4. Integración en Dashboard

**Archivo**: `pages/index.js` (MODIFICADO)

**Cambios:**
- Línea ~278: Agregada función `handlePrintLabel`
- Línea ~700: Modificada lista de órdenes con botón "🖨️ Imprimir"

**Flujo:**
1. Usuario ve lista de órdenes en dashboard
2. Haz clic en "🖨️ Imprimir" en cualquier orden
3. Se genera PDF con la etiqueta
4. Se descarga automáticamente
5. Usuario lo abre e imprime con su impresora térmica

### 5. Documentación Completa

**Archivo**: `THERMAL_PRINTER_SETUP.md` (NUEVO)
- Instrucciones de instalación paso a paso
- Configuración para USB, Red, Serial
- Troubleshooting común
- Modelos compatibles
- Tips y mejores prácticas

---

## 🎨 Diseño de la Etiqueta

### Tamaño
- **4" x 3"** (102mm x 76mm) - Estándar industria
- Márgenes: 10mm

### Contenido
```
APPEXPERT
Gestión de Reparaciones
─────────────────────
    ORD-2026-0001
─────────────────────
CLIENTE:
Juan García
Tel: 664 03 00 87

DISPOSITIVO:
iPhone 13 Pro
IMEI: 358240051111110

ESTADO:
Recibido

   [QR CODE]

15/08/2026
```

---

## 🧪 Testing

### Test Manual - Descargar PDF

1. Ve a https://reparaciones.appexpertlucena.es
2. Crea una orden (7 pasos)
3. En el dashboard, busca tu orden
4. Haz clic en "🖨️ Imprimir"
5. Se descargará `etiqueta_ORD-XXXX-XXXX.pdf`
6. Abre el PDF en tu navegador
7. Imprime con Ctrl+P o File → Print

### Test API

```bash
# Generar PDF
curl -X POST http://localhost:3000/api/print-label \
  -H "Content-Type: application/json" \
  -d '{
    "orderData": {
      "id": "ORD-2026-0042",
      "client": {"name": "Test", "phone": "664030087"},
      "device": {"brand": "Test", "model": "Model", "imei": "123456"},
      "status": "Recibido"
    }
  }' > etiqueta.pdf
```

---

## 🚀 Deployment

### Paso 1: Instalar dependencias

```bash
npm install
```

### Paso 2: Construir

```bash
npm run build
```

### Paso 3: Desplegar a Vercel

```bash
vercel --prod
```

---

## 📈 Beneficios

✅ Etiquetas profesionales y consistentes
✅ Impresión rápida sin configuración compleja
✅ QR codes únicos para cada reparación
✅ Reduce errores manuales
✅ Trazabilidad mejorada
✅ Compatible con la mayoría de impresoras térmicas

---

## 💻 Especificaciones Técnicas

### Generador de PDF (pdfkit)
- Crea PDFs desde cero en Node.js
- Soporte para imágenes
- Tipografía personalizable
- Tamaño exacto de página

### Generador de QR (qrcode)
- QR codes de alta resolución
- Niveles de corrección: L, M, Q, H
- Formato PNG/SVG/Terminal
- Detección automática de tamaño

### Comunicación ESC/POS (escpos)
- Protocolo estándar de impresoras térmicas
- Comandos: align, text, image, cut
- Soporta múltiples puertos: USB, Serial, Red
- Compatible: Epson, Star Micronics, Bixolon

---

## 🔗 Integración con Otros Sistemas

### Opción A: Usar PDF generado
- Descarga y guarda PDFs en servidor
- Integración con sistemas de archivo
- Historial de impresiones

### Opción B: Imprimir directamente
- Usa endpoint `/api/print-thermal`
- Requiere configuración de puerto
- Ideal para kioscos/puntos de venta

### Opción C: Terceros (PrintNode, Google Cloud Print)
- Servicio de impresión en la nube
- Múltiples impresoras
- Historial centralizado

---

## ⚙️ Configuración Producción

### Vercel Environment Variables

```env
# Impresora USB (Windows)
PRINTER_PORT=COM3

# Impresora de Red
PRINTER_HOST=192.168.1.100
PRINTER_PORT=9100

# Tipo de impresora
PRINTER_TYPE=usb|network|pdf
```

### Configurar en Vercel Dashboard

1. Abre https://vercel.com/dashboard
2. Proyecto: appexpert-rapairs
3. Settings → Environment Variables
4. Agrega las variables según tu setup

---

## 🎯 Próximas Mejoras (Phase 4)

- [ ] Interfaz web para configurar impresora
- [ ] Historial de impresiones en base de datos
- [ ] Reimpresión de etiquetas anteriores
- [ ] Múltiples idiomas en etiquetas
- [ ] Códigos de barras + QR
- [ ] Diseño personalizable de etiqueta
- [ ] Impresoras de red auto-detectadas
- [ ] Impresión por lotes
- [ ] Etiquetas de envío (4x6 pulgadas)

---

## ✅ Checklist

- [x] pdfkit instalado
- [x] qrcode instalado
- [x] escpos instalado
- [x] Endpoint `/api/print-label.js` creado
- [x] Endpoint `/api/print-thermal.js` creado
- [x] Botón "Imprimir" en dashboard
- [x] Función `handlePrintLabel` implementada
- [x] Documentación completa (THERMAL_PRINTER_SETUP.md)
- [x] README.md actualizado
- [ ] Configurar impresora en Vercel (manual)
- [ ] Probar con impresora real (manual)
- [ ] Desplegar a producción (manual)
