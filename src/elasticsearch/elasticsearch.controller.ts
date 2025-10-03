import { Request, Response } from 'express';
import { DocumentsService } from '../documents/documents.service';
import { ElasticsearchService } from '../config/elasticsearch.service';

export class ElasticsearchController {
  constructor(
    private readonly documentsService: DocumentsService = DocumentsService.getInstance(),
    private readonly elasticsearchService: ElasticsearchService = ElasticsearchService.getInstance()
  ) {}

  // Probar conexión con Elasticsearch
  testConnection = async (req: Request, res: Response) => {
    try {
      const result = await this.documentsService.testElasticsearchConnection();
      
      if (result.connected) {
        res.json({
          message: 'Conexión exitosa con Elasticsearch',
          status: 'connected',
          info: result.info
        });
      } else {
        res.status(503).json({
          message: 'No se pudo conectar con Elasticsearch',
          status: 'disconnected',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error testing Elasticsearch connection:', error);
      res.status(500).json({
        error: 'Error interno del servidor al probar la conexión'
      });
    }
  };

  // Actualizar configuración de Elasticsearch
  updateConfig = async (req: Request, res: Response) => {
    try {
      const { host, port, username, password } = req.body;
      
      if (!host && !port && !username && !password) {
        return res.status(400).json({
          error: 'Debe proporcionar al menos un parámetro de configuración'
        });
      }

      await this.documentsService.updateElasticsearchConfig({
        host,
        port: port ? parseInt(port, 10) : undefined,
        username,
        password
      });

      // Probar la nueva configuración
      const testResult = await this.documentsService.testElasticsearchConnection();

      res.json({
        message: 'Configuración actualizada',
        config: this.documentsService.getElasticsearchConfig(),
        connectionTest: testResult
      });
    } catch (error) {
      console.error('Error updating Elasticsearch config:', error);
      res.status(500).json({
        error: 'Error interno del servidor al actualizar la configuración'
      });
    }
  };

  // Obtener configuración actual
  getConfig = async (req: Request, res: Response) => {
    try {
      const config = this.documentsService.getElasticsearchConfig();
      res.json({
        config: {
          ...config,
          // No exponer credenciales
          password: config.password ? '***' : undefined
        }
      });
    } catch (error) {
      console.error('Error getting Elasticsearch config:', error);
      res.status(500).json({
        error: 'Error interno del servidor al obtener la configuración'
      });
    }
  };

  // Buscar documentos en Elasticsearch
  search = async (req: Request, res: Response) => {
    try {
      const { 
        text, 
        employeeUuid, 
        documentType, 
        category, 
        tags, 
        dateFrom, 
        dateTo, 
        size, 
        from 
      } = req.query;

      const searchQuery = {
        text: text as string,
        employeeUuid: employeeUuid as string,
        documentType: documentType as string,
        category: category as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        size: size ? parseInt(size as string, 10) : 10,
        from: from ? parseInt(from as string, 10) : 0
      };

      const result = await this.documentsService.searchInElasticsearch(searchQuery);

      if (result.error) {
        return res.status(503).json({
          error: 'Error en Elasticsearch',
          details: result.error
        });
      }

      // Agregar URLs de descarga a cada documento
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const documentsWithUrls = result.documents.map((doc: any) => ({
        ...doc,
        downloadUrl: `${baseUrl}/api/retrieval/download/${doc.id}`,
        viewUrl: `${baseUrl}/api/retrieval/view/${doc.id}`
      }));

      res.json({
        documents: documentsWithUrls,
        total: result.total,
        query: searchQuery,
        pagination: {
          size: searchQuery.size,
          from: searchQuery.from,
          hasMore: result.total > (searchQuery.from + searchQuery.size)
        }
      });
    } catch (error) {
      console.error('Error searching in Elasticsearch:', error);
      res.status(500).json({
        error: 'Error interno del servidor al buscar en Elasticsearch'
      });
    }
  };

  // Indexar documento manualmente
  indexDocument = async (req: Request, res: Response) => {
    try {
      const { documentId, indexName } = req.body;

      if (!documentId) {
        return res.status(400).json({
          error: 'documentId es requerido'
        });
      }

      // Obtener documento del servicio local
      const document = await this.documentsService.getDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({
          error: 'Documento no encontrado'
        });
      }

      // Preparar datos para Elasticsearch
      const elasticsearchData = {
        id: document.id,
        title: document.title!,
        content: document.extractedText || '',
        keywords: document.keywords || [],
        tags: document.tags || [],
        category: document.category,
        employeeUuid: document.employeeUuid,
        employeeName: document.employeeName,
        employeeCedula: document.employeeCedula,
        documentType: document.documentType!,
        uploadDate: document.uploadDate,
        year: document.year,
        filename: document.filename,
        mimetype: document.mimetype,
        size: document.size,
        relativePath: document.relativePath
      };

      // Indexar en Elasticsearch
      const result = await this.elasticsearchService.indexDocument(
        elasticsearchData,
        documentId,
        indexName || `documents-${document.year}`
      );

      if (result.success) {
        res.json({
          message: 'Documento indexado exitosamente en Elasticsearch',
          documentId: documentId,
          elasticsearchId: result.id,
          index: indexName || `documents-${document.year}`
        });
      } else {
        res.status(503).json({
          error: 'Error indexando en Elasticsearch',
          details: result.error
        });
      }
    } catch (error) {
      console.error('Error indexing document:', error);
      res.status(500).json({
        error: 'Error interno del servidor al indexar el documento'
      });
    }
  };

  // Obtener estadísticas de índices
  getStats = async (req: Request, res: Response) => {
    try {
      const { indexName } = req.query;
      const stats = await this.elasticsearchService.getIndexStats(indexName as string);

      if (stats) {
        res.json({
          stats,
          indexName: indexName || `documents-${new Date().getFullYear()}`
        });
      } else {
        res.status(503).json({
          error: 'No se pudieron obtener las estadísticas de Elasticsearch'
        });
      }
    } catch (error) {
      console.error('Error getting Elasticsearch stats:', error);
      res.status(500).json({
        error: 'Error interno del servidor al obtener estadísticas'
      });
    }
  };

  // Crear índice manualmente
  createIndex = async (req: Request, res: Response) => {
    try {
      const { indexName } = req.body;
      
      if (!indexName) {
        return res.status(400).json({
          error: 'indexName es requerido'
        });
      }

      const created = await this.elasticsearchService.createIndexIfNotExists(indexName);

      if (created) {
        res.json({
          message: `Índice '${indexName}' creado o ya existe`,
          indexName
        });
      } else {
        res.status(503).json({
          error: 'No se pudo crear el índice'
        });
      }
    } catch (error) {
      console.error('Error creating index:', error);
      res.status(500).json({
        error: 'Error interno del servidor al crear el índice'
      });
    }
  };
}