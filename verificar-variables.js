#!/usr/bin/env node
/**
 * Script para verificar y mostrar las variables de entorno de Firebase necesarias
 * Ejecuta: node verificar-variables.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('  Verificación de Variables Firebase');
console.log('========================================\n');

// Variables requeridas
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
];

// Leer archivo .env si existe
const envPath = path.join(process.cwd(), '.env');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  console.log('✓ Archivo .env encontrado\n');
} else {
  console.log('⚠ Archivo .env no encontrado\n');
}

// Verificar cada variable
console.log('Variables requeridas:\n');
let allPresent = true;
let missingVars = [];

requiredVars.forEach(varName => {
  const value = envVars[varName] || process.env[varName];
  const isPresent = value && value.trim() !== '';
  const status = isPresent ? '✓' : '✗';
  const displayValue = isPresent ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'NO CONFIGURADA';
  
  console.log(`  ${status} ${varName.padEnd(35)} ${displayValue}`);
  
  if (!isPresent) {
    allPresent = false;
    missingVars.push(varName);
  }
});

console.log('\n========================================\n');

if (allPresent) {
  console.log('✅ Todas las variables están configuradas localmente.\n');
  console.log('📋 Para configurarlas en Vercel:');
  console.log('   1. Ve a: https://vercel.com/dashboard');
  console.log('   2. Selecciona tu proyecto');
  console.log('   3. Settings → Environment Variables');
  console.log('   4. Agrega cada variable con su valor\n');
} else {
  console.log('❌ Faltan variables de entorno.\n');
  console.log('📝 Cómo obtener los valores de Firebase:\n');
  console.log('   1. Ve a: https://console.firebase.google.com/');
  console.log('   2. Selecciona tu proyecto');
  console.log('   3. ⚙️ Configuración del proyecto');
  console.log('   4. Desplázate hasta "Tus aplicaciones"');
  console.log('   5. Si no tienes app web, crea una (ícono </>)');
  console.log('   6. Copia los valores del objeto firebaseConfig\n');
  
  console.log('📋 Variables que faltan:');
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n');
  
  console.log('💡 Después de obtener los valores:');
  console.log('   1. Crea/edita el archivo .env en la raíz del proyecto');
  console.log('   2. Agrega cada variable con su valor:');
  console.log('      VITE_FIREBASE_API_KEY=tu_valor_aqui');
  console.log('      VITE_FIREBASE_PROJECT_ID=tu_valor_aqui');
  console.log('      ...\n');
  console.log('   3. Luego configúralas también en Vercel (ver CONFIGURAR_VERCEL.md)\n');
}

console.log('📖 Para más detalles, consulta: CONFIGURAR_VERCEL.md\n');
