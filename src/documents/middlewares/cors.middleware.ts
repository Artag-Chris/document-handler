import { Request, Response, NextFunction } from 'express';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Log para debugging
  console.log(`🌐 CORS Middleware - Origin: ${origin}, Method: ${req.method}, Path: ${req.path}`);
  
  // Configurar headers CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Content-Disposition',
    'x-finova-api-key',
    'x-finovaClient-id'
  ].join(', '));
  res.header('Access-Control-Expose-Headers', 'Content-Disposition');
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight por 24 horas

  // Manejar preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    console.log(`✅ Handling OPTIONS preflight request for ${req.path}`);
    return res.status(200).json({
      message: 'CORS preflight successful',
      allowedMethods: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Disposition, x-finova-api-key, x-finovaClient-id'
    });
  }

  next();
};