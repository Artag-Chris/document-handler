import { Router } from 'express';
import { ElasticsearchController } from './elasticsearch.controller';

export class ElasticsearchRoutes {
  static get routes(): Router {
    const router = Router();
    const elasticsearchController = new ElasticsearchController();

    // Probar conexión con Elasticsearch
    router.get('/test-connection', elasticsearchController.testConnection);

    // Configuración de Elasticsearch
    router.get('/config', elasticsearchController.getConfig);
    router.put('/config', elasticsearchController.updateConfig);

    // Buscar documentos en Elasticsearch
    router.get('/search', elasticsearchController.search);

    // Operaciones de índices
    router.post('/create-index', elasticsearchController.createIndex);
    router.get('/stats', elasticsearchController.getStats);

    // Indexar documento manualmente
    router.post('/index-document', elasticsearchController.indexDocument);

    return router;
  }
}