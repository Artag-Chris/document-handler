/**
 * Utilidades para validación de UUID
 */

/**
 * Regex para validar UUID de cualquier versión (1-5)
 * Formato: xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
 * Donde:
 * - x es cualquier dígito hexadecimal [0-9a-f]
 * - M es la versión del UUID [1-5]
 * - N es el variant [8-9a-b]
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valida si una cadena es un UUID válido
 * @param uuid - La cadena a validar
 * @returns true si es un UUID válido, false en caso contrario
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  return UUID_REGEX.test(uuid);
}

/**
 * Obtiene la versión de un UUID
 * @param uuid - El UUID del cual obtener la versión
 * @returns La versión del UUID (1-5) o null si no es válido
 */
export function getUUIDVersion(uuid: string): number | null {
  if (!isValidUUID(uuid)) {
    return null;
  }
  
  const versionChar = uuid[14];
  const version = parseInt(versionChar, 10);
  
  return version >= 1 && version <= 5 ? version : null;
}

/**
 * Valida y proporciona información detallada sobre un UUID
 * @param uuid - El UUID a analizar
 * @returns Objeto con información de validación
 */
export function validateUUIDDetailed(uuid: string): {
  isValid: boolean;
  version?: number;
  variant?: string;
  error?: string;
} {
  if (!uuid || typeof uuid !== 'string') {
    return {
      isValid: false,
      error: 'UUID debe ser una cadena de texto'
    };
  }
  
  if (uuid.length !== 36) {
    return {
      isValid: false,
      error: `UUID debe tener exactamente 36 caracteres, recibido: ${uuid.length}`
    };
  }
  
  if (!UUID_REGEX.test(uuid)) {
    return {
      isValid: false,
      error: 'Formato de UUID inválido'
    };
  }
  
  const version = getUUIDVersion(uuid);
  const variantChar = uuid[19];
  
  let variant: string;
  if (['8', '9'].includes(variantChar)) {
    variant = 'RFC 4122';
  } else if (['a', 'b'].includes(variantChar.toLowerCase())) {
    variant = 'RFC 4122';
  } else {
    variant = 'Unknown';
  }
  
  return {
    isValid: true,
    version: version!,
    variant
  };
}

/**
 * Lista de UUIDs de ejemplo para testing
 */
export const EXAMPLE_UUIDS = {
  v1: [
    '3389ecbe-a18c-11f0-99f3-0242ac120002',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
  ],
  v4: [
    '123e4567-e89b-12d3-a456-426614174000',
    '550e8400-e29b-41d4-a716-446655440000',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  ],
  invalid: [
    'invalid-uuid-here',
    '123e4567-e89b-12d3-a456-42661417400', // muy corto
    '123e4567-e89b-12d3-a456-426614174000x', // muy largo
    '123e4567-e89b-12d3-g456-426614174000', // carácter inválido
    '123e4567-e89b-62d3-a456-426614174000'  // versión inválida
  ]
};

// Exportar también el regex para usar en otros archivos
export { UUID_REGEX as uuidRegex };