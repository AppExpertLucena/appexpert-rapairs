# 🖨️ Thermal Printer Integration Setup

## Overview

La aplicación AGR ahora soporta impresoras térmicas para generar etiquetas de reparaciones con:
- ✅ QR code único para cada orden
- ✅ Información del cliente
- ✅ Detalles del dispositivo
- ✅ Estado de la reparación
- ✅ Descarga automática como PDF

## Características

### 1. Generación de Etiquetas PDF
- Tamaño estándar: 4x3 pulgadas (formato térmico)
- QR code con alta corrección de errores
- Información completa del cliente y dispositivo
- Descargable directamente desde el dashboard

### 2. Impresoras Térmicas USB
- Compatible con impresoras Epson ES-POS
- Comunicación USB directa
- Impresión automática sin diálogo

### 3. Impresoras de Red
- Compatible con impresoras en red Ethernet
- Configuración remota
- Ideal para talleres con múltiples puntos de impresión

---

## 🚀 Instalación

### Requisitos
- Impresora térmica compatible (Epson, Star Micronics, etc.)
- Windows, macOS o Linux
- Drivers de impresora instalados

### Paso 1: Verificar Dependencias

Las dependencias ya están instaladas:
```bash
npm install
```

**Librerías utilizadas:**
- `pdfkit` - Generación de PDFs
- `qrcode` - Generación de QR codes
- `escpos` - Comunicación con impresoras Epson

### Paso 2: Conectar Impresora

**Para USB:**
1. Conecta la impresora térmica por USB
2. Instala los drivers del fabricante
3. La impresora debería detectarse automáticamente

**Para Red:**
1. Conecta a la red Ethernet
2. Anota la IP de la impresora
3. Configura en Vercel (ver sección Configuración)

---

## 🎯 Uso

### Desde el Dashboard

1. Ve a https://reparaciones.appexpertlucena.es
2. En la lista de órdenes, busca la que quieres imprimir
3. Haz clic en el botón **"🖨️ Imprimir"**
4. Se descargará un PDF con la etiqueta
5. Abre el PDF e imprime con tu impresora térmica

### API Directa

**Generar PDF:**
```bash
curl -X POST https://reparaciones.appexpertlucena.es/api/print-label \
  -H "Content-Type: application/json" \
  -d '{
    "orderData": {
      "id": "ORD-2026-0001",
      "client": {"name": "Juan", "phone": "664030087"},
      "device": {"brand": "iPhone", "model": "13 Pro", "imei": "123456789"},
      "status": "Recibido"
    }
  }'
```

**Imprimir en Impresora Térmica USB** (desde Node.js):
```bash
curl -X POST https://reparaciones.appexpertlucena.es/api/print-thermal \
  -H "Content-Type: application/json" \
  -d '{
    "orderData": {...},
    "printerPort": 0
  }'
```

---

## ⚙️ Configuración Avanzada

### Impresoras USB

**Windows:**
1. Panel de Control → Dispositivos e Impresoras
2. Busca tu impresora térmica
3. Anota el puerto COM (ej: COM3, COM4)
4. En Vercel, configura: `PRINTER_PORT=COM3`

**macOS/Linux:**
```bash
# Listar dispositivos USB
lsusb

# Busca tu impresora (ej: Epson)
# Anota el ID de proveedor y dispositivo
```

### Impresoras de Red

**Configurar IP:**
```env
PRINTER_HOST=192.168.1.100
PRINTER_PORT=9100
```

**En Vercel Settings → Environment Variables:**
```
PRINTER_TYPE=network
PRINTER_HOST=192.168.1.100
PRINTER_PORT=9100
```

---

## 🖼️ Formato de Etiqueta

Tamaño: **4" x 3"** (102mm x 76mm)

```
┌─────────────────────────────┐
│       APPEXPERT             │
│  Gestión de Reparaciones    │
├─────────────────────────────┤
│      ORD-2026-0001          │
├─────────────────────────────┤
│ CLIENTE:                    │
│ Juan García                 │
│ Tel: 664 03 00 87           │
│                             │
│ DISPOSITIVO:                │
│ iPhone 13 Pro               │
│ IMEI: 358240051111110      │
│                             │
│ ESTADO:                     │
│ Recibido                    │
│                             │
│        ┌───────────┐        │
│        │    QR     │        │
│        │   CODE    │        │
│        └───────────┘        │
│                             │
│       15/08/2026            │
└─────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Error: "Impresora no detectada"
- Verifica que esté conectada
- Instala drivers del fabricante
- Reinicia la computadora

### Error: "No permissions"
- Linux: `sudo usermod -a -G lp $USER`
- Windows: Ejecuta como Administrador

### Las etiquetas salen vacías
- Verifica el rollo de papel
- Limpia la cabeza de impresión
- Calibra en el software de la impresora

### QR no se ve
- Aumenta el nivel de corrección de errores
- Limpia la lente de la impresora
- Verifica la densidad de impresión

---

## 📊 Modelos Compatibles

**Epson:**
- TM-T20
- TM-T88
- TM-P20
- TM-P60II
- TM-T100

**Star Micronics:**
- SM-L200
- SM-L300
- mPOP

**Otros:**
- Zebra (con drivers específicos)
- Brother QL (etiquetas de envío)
- OLED (impresoras inalámbricas)

---

## 💡 Tips

✅ Usa papel térmico de 80mm (ancho estándar)
✅ Guarda las etiquetas en una carpeta para referencia
✅ Imprime de prueba con órdenes de test
✅ Limpia los rodillos mensualmente
✅ Reemplaza los cabezales según el fabricante

---

## 🔗 Enlaces Útiles

- [Escpos NPM](https://www.npmjs.com/package/escpos)
- [PDFKit Documentación](http://pdfkit.org/)
- [QRCode NPM](https://www.npmjs.com/package/qrcode)
- [Epson ES-POS Manual](https://download.epson-biz.com/)

---

## 📝 Próximas Mejoras

- [ ] Interfaz web para configurar impresora
- [ ] Historial de impresiones
- [ ] Reimpresión de etiquetas
- [ ] Múltiples idiomas en etiquetas
- [ ] Códigos de barras en lugar de QR
- [ ] Impresoras de red auto-detectadas
