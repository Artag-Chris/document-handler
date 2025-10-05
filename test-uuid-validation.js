#!/usr/bin/env node

// Test simple para validar UUIDs
const testUUIDs = [
  '3389ecbe-a18c-11f0-99f3-0242ac120002', // Tu UUID v1
  '123e4567-e89b-12d3-a456-426614174000', // UUID v1
  '550e8400-e29b-41d4-a716-446655440000', // UUID v4
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // UUID v1
  '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // UUID v1
  '00000000-0000-1000-8000-000000000000', // UUID v1 mínimo
  'invalid-uuid-here',                     // Inválido
  '123e4567-e89b-12d3-a456-42661417400',  // Muy corto
  '123e4567-e89b-12d3-a456-426614174000x' // Muy largo
];

// Nuevo regex que acepta todas las versiones de UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

console.log('🧪 Test de validación de UUIDs\n');
console.log('Regex usado:', uuidRegex.toString());
console.log('='  .repeat(80));

testUUIDs.forEach((uuid, index) => {
  const isValid = uuidRegex.test(uuid);
  const status = isValid ? '✅ VÁLIDO  ' : '❌ INVÁLIDO';
  const version = uuid.length === 36 ? `v${uuid[14]}` : 'N/A';
  
  console.log(`${index + 1}. ${status} | ${version} | ${uuid}`);
});

console.log('='  .repeat(80));
console.log('\n🎯 Tu UUID específico:');
const yourUuid = '3389ecbe-a18c-11f0-99f3-0242ac120002';
const isYourUuidValid = uuidRegex.test(yourUuid);
console.log(`UUID: ${yourUuid}`);
console.log(`Versión: v${yourUuid[14]}`);
console.log(`Estado: ${isYourUuidValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);

if (isYourUuidValid) {
  console.log('\n🎉 ¡Tu UUID ahora debería funcionar correctamente!');
} else {
  console.log('\n❌ Hay un problema con el regex...');
}