import { Router } from 'express';
import { DocumentsRoutes } from '../documents/documents.routes';
import { RetrievalRoutes } from '../retrieval/retrieval.routes';
import { ElasticsearchRoutes } from '../elasticsearch/elasticsearch.routes';
import { validateUUIDDetailed } from '../config/uuid.utils';



export class AppRoutes {
  static get routes(): Router {
    const router = Router();
    /*  
    aqui iran el nombre de los modulos que usaremos y la importacion de sus rutas por defecto esta prsima como ORMs
    */
  
    // Health check endpoint con CORS habilitado
    router.get('/health', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Disposition');
      
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Document Handler API',
        cors: 'enabled',
        limits: {
          maxFileSize: process.env.MAX_FILE_SIZE || '1gb',
          maxFilesPerRequest: process.env.MAX_FILES_PER_REQUEST || 10,
          requestTimeout: process.env.REQUEST_TIMEOUT || 1200000
        },
        endpoints: {
          documents: '/api/documents',
          retrieval: '/api/retrieval',
          elasticsearch: '/api/elasticsearch'
        }
      });
    });

    // CORS preflight para todas las rutas API
    router.options('/api/*', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Disposition, x-finova-api-key, x-finovaClient-id, Accept, Origin, X-Requested-With');
      res.header('Access-Control-Max-Age', '86400');
      res.status(200).end();
    });

    // Endpoint para validar UUIDs
    router.get('/validate-uuid/:uuid', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      const { uuid } = req.params;
      
      const validation = validateUUIDDetailed(uuid);
      
      res.json({
        uuid,
        validation,
        examples: {
          yourUuid: '3389ecbe-a18c-11f0-99f3-0242ac120002',
          v1Example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          v4Example: '550e8400-e29b-41d4-a716-446655440000'
        }
      });
    });
    
    router.use(`/api/documents`, DocumentsRoutes.routes)
    router.use(`/api/retrieval`, RetrievalRoutes.routes)
    router.use(`/api/elasticsearch`, ElasticsearchRoutes.routes)

 

    return router;
  }
}




