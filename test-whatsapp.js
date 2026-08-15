#!/usr/bin/env node
// Script para probar WhatsApp directamente
require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

console.log('🔍 DIAGNÓSTICO DE TWILIO');
console.log('========================\n');

console.log('1️⃣ Verificando variables de entorno:');
console.log(`   TWILIO_ACCOUNT_SID: ${accountSid ? '✅ Configurado' : '❌ NO CONFIGURADO'}`);
console.log(`   TWILIO_AUTH_TOKEN: ${authToken ? '✅ Configurado' : '❌ NO CONFIGURADO'}`);
console.log(`   TWILIO_WHATSAPP_NUMBER: ${whatsappNumber ? '✅ ' + whatsappNumber : '❌ NO CONFIGURADO'}\n`);

if (!accountSid || !authToken || !whatsappNumber) {
  console.log('❌ ERROR: Variables de entorno incompletas');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function testWhatsApp() {
  try {
    console.log('2️⃣ Intentando enviar mensaje de prueba...\n');

    const message = await client.messages.create({
      body: '🧪 Mensaje de prueba desde AppExpert - Si ves esto, ¡WhatsApp funciona!',
      from: whatsappNumber,
      to: 'whatsapp:+34640605762',
      contentSid: 'HX436584f5b375c99a07a5b50701a328fd'
    });

    console.log('✅ ¡ÉXITO! Mensaje enviado correctamente');
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    console.log('\n📱 Verifica tu teléfono en 5-10 segundos\n');

  } catch (error) {
    console.log('❌ ERROR AL ENVIAR:');
    console.log(`   Código: ${error.code}`);
    console.log(`   Mensaje: ${error.message}`);
    console.log(`\n📋 Detalles completos:`);
    console.log(error);
  }
}

testWhatsApp();
