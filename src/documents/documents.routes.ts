import { Router } from 'express';
import { DocumentsController } from './documents.controller';
import { uploadSingle, uploadMultiple, uploadSuplenciaFiles } from './middlewares/upload.middleware';
import { 
  validateDocumentUpload, 
  validateMultipleDocumentUpload, 
  validateDocumentMetadata 
} from './middlewares/validation.middleware';
import { corsMiddleware } from './middlewares/cors.middleware';

export class DocumentsRoutes {
  static get routes(): Router {
    const router = Router();
    const documentsController = new DocumentsController();


    router.use(corsMiddleware);

    router.post('/upload', 
      uploadSingle, 
      validateDocumentUpload, 
      validateDocumentMetadata, 
      documentsController.uploadDocument
    );

    // Subir múltiples documentos
    router.post('/upload-multiple', 
      uploadMultiple, 
      validateMultipleDocumentUpload, 
      documentsController.uploadMultipleDocuments
    );

    // 🔄 PROMESA 2: Upload de archivos para Suplencias
    // Recibe archivos con nombre de campo 'files', los guarda en carpetas de ambos empleados, 
    // indexa en Elasticsearch y devuelve info para Promesa 3
    router.post('/upload/suplencias',
      uploadSuplenciaFiles,  // Usa middleware específico que espera campo 'files'
      documentsController.uploadSuplenciaDocuments
    );

    // Obtener todos los documentos
    router.get('/', documentsController.getAllDocuments);

    // Buscar documentos
    router.get('/search', documentsController.searchDocuments);

    // Obtener documento por ID
    router.get('/:id', documentsController.getDocumentById);

    // Eliminar documento
    router.delete('/:id', documentsController.deleteDocument);

    return router;
  }
}