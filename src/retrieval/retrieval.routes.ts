import { Router } from 'express';
import { RetrievalController } from './retrieval.controller';
import { 
  validateDocumentId, 
  validateSearchQuery, 
  validateCategory, 
  validateTags 
} from './middlewares/validation.middleware';

export class RetrievalRoutes {
  static get routes(): Router {
    const router = Router();
    const retrievalController = new RetrievalController();

    // Buscar documentos
    router.get('/search', validateSearchQuery, retrievalController.searchDocuments);

    // Obtener estadísticas de documentos
    router.get('/stats', retrievalController.getDocumentStats);

    // Obtener documentos recientes
    router.get('/recent', retrievalController.getRecentDocuments);

    // Obtener documentos por categoría
    router.get('/category/:category', validateCategory, retrievalController.getDocumentsByCategory);

    // Obtener documentos por tags
    router.get('/tags', validateTags, retrievalController.getDocumentsByTags);

    // Descargar documento
    router.get('/download/:id', validateDocumentId, retrievalController.downloadDocument);

    // Visualizar documento
    router.get('/view/:id', validateDocumentId, retrievalController.viewDocument);

    return router;
  }
}