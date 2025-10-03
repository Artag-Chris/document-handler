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

    // Buscar documentos (búsqueda básica)
    router.get('/search', validateSearchQuery, retrievalController.searchDocuments);

    // Búsqueda avanzada con filtros y ordenamiento
    router.get('/advanced-search', retrievalController.advancedSearch);

    // Búsqueda por palabras clave específicas
    router.get('/search/keywords', retrievalController.searchByKeywords);

    // Búsqueda por contenido completo
    router.get('/search/content', retrievalController.searchByContent);

    // Sugerencias de autocompletado
    router.get('/suggestions', retrievalController.getSuggestions);

    // Documentos similares a uno específico
    router.get('/similar/:id', validateDocumentId, retrievalController.findSimilar);

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