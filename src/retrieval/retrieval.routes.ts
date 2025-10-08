import { Router } from 'express';
import { RetrievalController } from './retrieval.controller';
import { 
  validateDocumentId, 
  validateSearchQuery, 
  validateCategory, 
  validateTags,
  validateEmployeeUuid 
} from './middlewares/validation.middleware';

export class RetrievalRoutes {
  static get routes(): Router {
    const router = Router();
    const retrievalController = new RetrievalController();

    // Buscar documentos (búsqueda básica)
    router.get('/search', validateSearchQuery, retrievalController.searchDocuments);

    // NUEVAS RUTAS: Búsqueda específica por empleado UUID
    // Obtener todos los documentos de un empleado específico
    router.get('/employee/:employeeUuid', validateEmployeeUuid, retrievalController.getDocumentsByEmployee);

    // Buscar dentro de los documentos de un empleado específico
    router.get('/employee/:employeeUuid/search', validateEmployeeUuid, retrievalController.searchInEmployeeDocuments);

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

    // ============================================
    // 🚀 RUTAS DIRECTAS POR RUTA RELATIVA (MÁS RÁPIDO)
    // Usa directamente la ruta del documento sin búsquedas
    // Ideal cuando ya tienes la ruta del documento
    // ============================================

    // Descargar por ruta relativa (POST)
    // Body: { relativePath: "uploads/2025/uuid/folder/file.pdf" }
    router.post('/download-by-path', retrievalController.downloadByPath);

    // Visualizar por ruta relativa (POST)
    // Body: { relativePath: "uploads/2025/uuid/folder/file.pdf" }
    router.post('/view-by-path', retrievalController.viewByPath);

    // ============================================
    // RUTAS AVANZADAS DE DESCARGA Y VISUALIZACIÓN
    // Buscan en TODAS las ubicaciones posibles:
    // - Suplencias (docente_ausente y docente_reemplazo)
    // - Actos Administrativos (por institución)
    // - Horas Extra (todos los meses del año)
    // - Carpetas estándar de empleados
    // ============================================

    // Descargar documento (búsqueda avanzada multi-ubicación)
    router.get('/download-advanced/:id', validateDocumentId, retrievalController.downloadDocumentAdvanced);

    // Visualizar documento (búsqueda avanzada multi-ubicación)
    router.get('/view-advanced/:id', validateDocumentId, retrievalController.viewDocumentAdvanced);

    // Obtener información de ubicación del documento
    router.get('/location-info/:id', validateDocumentId, retrievalController.getDocumentLocationInfo);

    // ============================================
    // RUTAS ESTÁNDAR DE DESCARGA Y VISUALIZACIÓN
    // Solo buscan en carpetas estándar de empleados
    // ============================================

    // Descargar documento (método estándar)
    router.get('/download/:id', validateDocumentId, retrievalController.downloadDocument);

    // Visualizar documento (método estándar)
    router.get('/view/:id', validateDocumentId, retrievalController.viewDocument);

    return router;
  }
}