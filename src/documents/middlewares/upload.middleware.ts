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
      const employeeUuid = req.body.employeeUuid || req.headers['employee-uuid'] as string;
      const documentType = req.body.documentType || 'documentos'; // Tipo de documento (hojas, contratos, reportes, etc.)
      
      if (!employeeUuid) {
        return cb(new Error('Employee UUID es requerido para crear la estructura de carpetas'));
      }

      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(employeeUuid)) {
        return cb(new Error('Formato de Employee UUID inválido'));
      }

      const uploadPath = createEmployeeDirectory(employeeUuid, documentType);
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    try {
      const currentYear = new Date().getFullYear();
      const timestamp = Date.now();
      const employeeUuid = req.body.employeeUuid || req.headers['employee-uuid'] as string;
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension);
      
      // Formato: YYYY_empleadoUUID_timestamp_nombreOriginal.extension
      const fileName = `${currentYear}_${employeeUuid.substring(0, 8)}_${timestamp}_${baseName}${extension}`;
      cb(null, fileName);
    } catch (error) {
      cb(error);
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