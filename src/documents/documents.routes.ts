import { Router } from 'express';
import { DocumentsController } from './documents.controller';
import { uploadSingle, uploadMultiple } from './middlewares/upload.middleware';
import { 
  validateDocumentUpload, 
  validateMultipleDocumentUpload, 
  validateDocumentMetadata 
} from './middlewares/validation.middleware';

export class DocumentsRoutes {
  static get routes(): Router {
    const router = Router();
    const documentsController = new DocumentsController();

    // Subir un solo documento
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