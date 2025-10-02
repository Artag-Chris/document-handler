import { Router } from 'express';
import { DocumentsRoutes } from '../documents/documents.routes';
import { RetrievalRoutes } from '../retrieval/retrieval.routes';
import { ElasticsearchRoutes } from '../elasticsearch/elasticsearch.routes';



export class AppRoutes {
  static get routes(): Router {
    const router = Router();
    /*  
    aqui iran el nombre de los modulos que usaremos y la importacion de sus rutas por defecto esta prsima como ORMs
    */
  
    
    router.use(`/api/documents`, DocumentsRoutes.routes)
    router.use(`/api/retrieval`, RetrievalRoutes.routes)
    router.use(`/api/elasticsearch`, ElasticsearchRoutes.routes)
    //  router.use(`/api/prisma`, PrismaRoutes.routes);
    // aqui colocare la nueva ruta para el manejo del email
 

    return router;
  }
}




