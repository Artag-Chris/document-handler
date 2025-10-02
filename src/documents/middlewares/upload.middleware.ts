import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

// Función para crear la estructura de directorios basada en empleado
const createEmployeeDirectory = (employeeUuid: string, documentType: string = 'documentos') => {
  const currentYear = new Date().getFullYear().toString();
  const uploadPath = path.join(process.cwd(), 'uploads', currentYear, employeeUuid, documentType);
  
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  return uploadPath;
};

// Configuración de almacenamiento dinámico
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    try {
      // Extraer datos del empleado del body o headers
      const employeeUuid = req.body?.employeeUuid || req.headers['employee-uuid'] as string;
      const documentType = req.body?.documentType || 'documentos'; // Tipo de documento (hojas, contratos, reportes, etc.)
      
      // Si no hay employeeUuid, crear directorio temporal
      if (!employeeUuid) {
        console.warn('⚠️ No se encontró employeeUuid, usando directorio temporal');
        const tempPath = path.join(process.cwd(), 'uploads', 'temp');
        if (!fs.existsSync(tempPath)) {
          fs.mkdirSync(tempPath, { recursive: true });
        }
        return cb(null, tempPath);
      }

      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(employeeUuid)) {
        console.warn('⚠️ Formato de UUID inválido, usando directorio temporal');
        const tempPath = path.join(process.cwd(), 'uploads', 'temp');
        if (!fs.existsSync(tempPath)) {
          fs.mkdirSync(tempPath, { recursive: true });
        }
        return cb(null, tempPath);
      }

      const uploadPath = createEmployeeDirectory(employeeUuid, documentType);
      cb(null, uploadPath);
    } catch (error) {
      // En caso de error, usar directorio temporal
      console.error('❌ Error en destination:', error);
      const tempPath = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempPath)) {
        fs.mkdirSync(tempPath, { recursive: true });
      }
      cb(null, tempPath);
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    try {
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension);
      
      // Si estamos en directorio temporal, usar nombre simple
      const employeeUuid = req.body?.employeeUuid;
      if (!employeeUuid) {
        const tempFileName = `temp_${timestamp}_${baseName}${extension}`;
        return cb(null, tempFileName);
      }

      const currentYear = new Date().getFullYear();
      const documentType = req.body?.documentType || 'documentos';
      const employeeCedula = req.body?.employeeCedula || employeeUuid.substring(0, 8);
      
      // Formato: YYYY_empleadoCedula_documentType_timestamp_nombreOriginal.extension
      const fileName = `${currentYear}_${employeeCedula}_${documentType}_${timestamp}_${baseName}${extension}`;
      cb(null, fileName);
    } catch (error) {
      // En caso de error, usar nombre simple con timestamp
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension);
      cb(null, `temp_${timestamp}_${baseName}${extension}`);
    }
  }
});

// Filtro de archivos mejorado
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan PDFs, DOC, DOCX, TXT, JPG, PNG, XLS, XLSX'));
  }
};

// Configuración de multer
export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 5 // máximo 5 archivos por request
  },
  fileFilter: fileFilter
});

// Middleware para un solo archivo
export const uploadSingle = uploadMiddleware.single('document');

// Middleware para múltiples archivos
export const uploadMultiple = uploadMiddleware.array('documents', 5);