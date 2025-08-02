import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar headers requeridos
 * @param requiredHeaders Objeto con los headers y valores esperados
 * @example { 'x-api-key': 'valor-esperado', 'otro-header': 'otro-valor' }
 */
export const checkHeaders = (requiredHeaders: Record<string, string>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingHeaders: string[] = [];
    const invalidHeaders: string[] = [];

    // Verificar cada header requerido
    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const headerValue = req.headers[header.toLowerCase()];
      
      if (!headerValue) {
        missingHeaders.push(header);
      } else if (headerValue !== expectedValue) {
        invalidHeaders.push(header);
      }
    }

    if (missingHeaders.length > 0) {
      return res.status(401).json({
        success: false,
        message: 'Headers requeridos faltantes',
        missingHeaders
      });
    }

    if (invalidHeaders.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Valores de headers incorrectos',
        invalidHeaders
      });
    }

    // Si todo está correcto, continuar
    next();
  };
};