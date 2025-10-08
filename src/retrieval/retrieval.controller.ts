import { Request, Response } from 'express';
import { RetrievalService } from './retrieval.service';
import { existsSync, statSync, createReadStream } from 'fs';
import { join, basename, extname } from 'path';

export class RetrievalController {
  constructor(
    private readonly retrievalService: RetrievalService = RetrievalService.getInstance()
  ) {}

  private generateDownloadUrls(documentId: string, req: Request) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return {
      downloadUrl: `${baseUrl}/api/retrieval/download/${documentId}`,
      viewUrl: `${baseUrl}/api/retrieval/view/${documentId}`
    };
  }

  downloadDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.retrievalService.getDocumentFile(id);

      if (!result) {
        return res.status(404).json({
          error: 'Documento no encontrado'
        });
      }

      const { filePath, document } = result;

      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Type', document.mimetype);
      res.setHeader('Content-Length', document.size);

      // Enviar el archivo
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error in downloadDocument:', error);
      res.status(500).json({
        error: 'Error interno del servidor al descargar el documento'
      });
    }
  };

  viewDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.retrievalService.getDocumentStream(id);

      if (!result) {
        return res.status(404).json({
          error: 'Documento no encontrado'
        });
      }

      const { stream, document } = result;

      // Configurar headers para visualización
      res.setHeader('Content-Type', document.mimetype);
      res.setHeader('Content-Length', document.size);
      
      // Para PDFs, permitir visualización en el navegador
      if (document.mimetype === 'application/pdf') {
        res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      }

      // Pipe el stream al response
      stream.pipe(res);
    } catch (error) {
      console.error('Error in viewDocument:', error);
      res.status(500).json({
        error: 'Error interno del servidor al visualizar el documento'
      });
    }
  };

  searchDocuments = async (req: Request, res: Response) => {
    try {
      const { text, category, tags, dateFrom, dateTo, includeContent } = req.query;
      
      const searchQuery = {
        text: text as string,
        category: category as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        includeContent: includeContent === 'true'
      };

      const documents = await this.retrievalService.searchAndRetrieve(searchQuery);

      res.json({
        documents: documents.map(doc => {
          const urls = this.generateDownloadUrls(doc.id, req);
          return {
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            originalName: doc.originalName,
            size: doc.size,
            mimetype: doc.mimetype,
            uploadDate: doc.uploadDate,
            description: doc.description,
            category: doc.category,
            tags: doc.tags,
            keywords: doc.keywords,
            employeeUuid: doc.employeeUuid,
            employeeName: doc.employeeName,
            documentType: doc.documentType,
            downloadUrl: urls.downloadUrl,
            viewUrl: urls.viewUrl,
            ...(searchQuery.includeContent && { extractedText: doc.extractedText })
          };
        }),
        count: documents.length,
        query: searchQuery
      });
    } catch (error) {
      console.error('Error in searchDocuments:', error);
      res.status(500).json({
        error: 'Error interno del servidor al buscar documentos'
      });
    }
  };

  // Búsqueda avanzada por contenido y palabras clave
  advancedSearch = async (req: Request, res: Response) => {
    try {
      const {
        query,
        keywords,
        content,
        fuzzy,
        boost,
        size,
        from,
        category,
        documentType,
        employeeUuid,
        dateFrom,
        dateTo,
        fileType,
        sortBy,
        sortOrder
      } = req.query;

      const searchParams = {
        query: query as string,
        keywords: keywords ? (Array.isArray(keywords) ? keywords as string[] : [keywords as string]) : undefined,
        content: content as string,
        fuzzy: fuzzy === 'true',
        boost: boost === 'true',
        size: size ? parseInt(size as string) : 10,
        from: from ? parseInt(from as string) : 0,
        filters: {
          category: category as string,
          documentType: documentType as string,
          employeeUuid: employeeUuid as string,
          fileType: fileType as string,
          dateRange: (dateFrom || dateTo) ? {
            from: dateFrom ? new Date(dateFrom as string) : undefined,
            to: dateTo ? new Date(dateTo as string) : undefined
          } : undefined
        },
        sortBy: sortBy as 'relevance' | 'date' | 'size' | 'filename',
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.retrievalService.advancedSearch(searchParams);

      res.json({
        documents: result.documents.map(doc => {
          const urls = this.generateDownloadUrls(doc.id, req);
          return {
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            originalName: doc.originalName,
            size: doc.size,
            mimetype: doc.mimetype,
            uploadDate: doc.uploadDate,
            description: doc.description,
            category: doc.category,
            tags: doc.tags,
            keywords: doc.keywords,
            employeeUuid: doc.employeeUuid,
            employeeName: doc.employeeName,
            documentType: doc.documentType,
            downloadUrl: urls.downloadUrl,
            viewUrl: urls.viewUrl,
            score: doc.score,
            highlights: doc.highlights
          };
        }),
        total: result.total,
        took: result.took,
        facets: result.facets,
        query: searchParams
      });
    } catch (error) {
      console.error('Error in advancedSearch:', error);
      res.status(500).json({
        error: 'Error interno del servidor en búsqueda avanzada'
      });
    }
  };

  // Búsqueda por palabras clave específicas
  searchByKeywords = async (req: Request, res: Response) => {
    try {
      const { keywords, size, from, exactMatch, boost } = req.query;

      if (!keywords) {
        return res.status(400).json({
          error: 'Se requiere al menos una palabra clave'
        });
      }

      const keywordList = Array.isArray(keywords) ? keywords as string[] : [keywords as string];
      
      const result = await this.retrievalService.searchByKeywords(keywordList, {
        size: size ? parseInt(size as string) : 10,
        from: from ? parseInt(from as string) : 0,
        exactMatch: exactMatch === 'true',
        boost: boost === 'true'
      });

      res.json({
        documents: result.documents.map(doc => {
          const urls = this.generateDownloadUrls(doc.id, req);
          return {
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            originalName: doc.originalName,
            size: doc.size,
            mimetype: doc.mimetype,
            uploadDate: doc.uploadDate,
            category: doc.category,
            tags: doc.tags,
            keywords: doc.keywords,
            employeeUuid: doc.employeeUuid,
            employeeName: doc.employeeName,
            documentType: doc.documentType,
            downloadUrl: urls.downloadUrl,
            viewUrl: urls.viewUrl,
            score: doc.score
          };
        }),
        total: result.total,
        matchedKeywords: result.matchedKeywords,
        searchedKeywords: keywordList
      });
    } catch (error) {
      console.error('Error in searchByKeywords:', error);
      res.status(500).json({
        error: 'Error interno del servidor en búsqueda por palabras clave'
      });
    }
  };

  // Búsqueda por contenido completo
  searchByContent = async (req: Request, res: Response) => {
    try {
      const { content, size, from, fuzzy, highlight } = req.query;

      if (!content) {
        return res.status(400).json({
          error: 'Se requiere texto de contenido para buscar'
        });
      }

      const result = await this.retrievalService.searchByContent(content as string, {
        size: size ? parseInt(size as string) : 10,
        from: from ? parseInt(from as string) : 0,
        fuzzy: fuzzy === 'true',
        highlight: highlight === 'true'
      });

      res.json({
        documents: result.documents.map(doc => {
          const urls = this.generateDownloadUrls(doc.id, req);
          return {
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            originalName: doc.originalName,
            size: doc.size,
            mimetype: doc.mimetype,
            uploadDate: doc.uploadDate,
            category: doc.category,
            tags: doc.tags,
            keywords: doc.keywords,
            employeeUuid: doc.employeeUuid,
            employeeName: doc.employeeName,
            documentType: doc.documentType,
            downloadUrl: urls.downloadUrl,
            viewUrl: urls.viewUrl,
            score: doc.score,
            highlights: doc.highlights
          };
        }),
        total: result.total,
        searchTerm: content,
        highlights: result.highlights
      });
    } catch (error) {
      console.error('Error in searchByContent:', error);
      res.status(500).json({
        error: 'Error interno del servidor en búsqueda por contenido'
      });
    }
  };

  // Sugerencias de autocompletado
  getSuggestions = async (req: Request, res: Response) => {
    try {
      const { text, field, size } = req.query;

      if (!text) {
        return res.status(400).json({
          error: 'Se requiere texto para generar sugerencias'
        });
      }

      const suggestions = await this.retrievalService.getSearchSuggestions({
        text: text as string,
        field: field as 'title' | 'keywords' | 'content',
        size: size ? parseInt(size as string) : 5
      });

      res.json({
        suggestions,
        searchTerm: text
      });
    } catch (error) {
      console.error('Error in getSuggestions:', error);
      res.status(500).json({
        error: 'Error interno del servidor al generar sugerencias'
      });
    }
  };

  // Documentos similares
  findSimilar = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { size, minScore } = req.query;
      const similarDocuments = await this.retrievalService.findSimilarDocuments(id, {
        size: size ? parseInt(size as string) : 5,
        minScore: minScore ? parseFloat(minScore as string) : 0.5
      });

      res.json({
        similarDocuments: similarDocuments.map(doc => {
          const urls = this.generateDownloadUrls(doc.id, req);
          return {
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            originalName: doc.originalName,
            size: doc.size,
            mimetype: doc.mimetype,
            uploadDate: doc.uploadDate,
            category: doc.category,
            tags: doc.tags,
            keywords: doc.keywords,
            employeeUuid: doc.employeeUuid,
            employeeName: doc.employeeName,
            documentType: doc.documentType,
            downloadUrl: urls.downloadUrl,
            viewUrl: urls.viewUrl,
            score: doc.score
          };
        }),
        count: similarDocuments.length,
        referenceDocumentId: id
      });
    } catch (error) {
      console.error('Error in findSimilar:', error);
      res.status(500).json({
        error: 'Error interno del servidor al buscar documentos similares'
      });
    }
  };

  getDocumentsByCategory = async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const documents = await this.retrievalService.getDocumentsByCategory(category);

      res.json({
        category,
        documents: documents.map(doc => {
          const urls = this.generateDownloadUrls(doc.id, req);
          return {
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            originalName: doc.originalName,
            size: doc.size,
            mimetype: doc.mimetype,
            uploadDate: doc.uploadDate,
            tags: doc.tags,
            keywords: doc.keywords,
            employeeUuid: doc.employeeUuid,
            employeeName: doc.employeeName,
            documentType: doc.documentType,
            downloadUrl: urls.downloadUrl,
            viewUrl: urls.viewUrl
          };
        }),
        count: documents.length
      });
    } catch (error) {
      console.error('Error in getDocumentsByCategory:', error);
      res.status(500).json({
        error: 'Error interno del servidor al obtener documentos por categoría'
      });
    }
  };

  getDocumentsByTags = async (req: Request, res: Response) => {
    try {
      const { tags } = req.query;
      
      if (!tags) {
        return res.status(400).json({
          error: 'Se requiere al menos un tag'
        });
      }

      const tagsArray = Array.isArray(tags) ? tags as string[] : [tags as string];
      const documents = await this.retrievalService.getDocumentsByTags(tagsArray);

      res.json({
        tags: tagsArray,
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
          originalName: doc.originalName,
          size: doc.size,
          mimetype: doc.mimetype,
          uploadDate: doc.uploadDate,
          category: doc.category,
          tags: doc.tags,
          keywords: doc.keywords
        })),
        count: documents.length
      });
    } catch (error) {
      console.error('Error in getDocumentsByTags:', error);
      res.status(500).json({
        error: 'Error interno del servidor al obtener documentos por tags'
      });
    }
  };

  getRecentDocuments = async (req: Request, res: Response) => {
    try {
      const { limit } = req.query;
      const limitNumber = limit ? parseInt(limit as string, 10) : 10;
      
      const documents = await this.retrievalService.getRecentDocuments(limitNumber);

      res.json({
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
          originalName: doc.originalName,
          size: doc.size,
          mimetype: doc.mimetype,
          uploadDate: doc.uploadDate,
          category: doc.category,
          tags: doc.tags,
          keywords: doc.keywords
        })),
        count: documents.length
      });
    } catch (error) {
      console.error('Error in getRecentDocuments:', error);
      res.status(500).json({
        error: 'Error interno del servidor al obtener documentos recientes'
      });
    }
  };

  getDocumentsByEmployee = async (req: Request, res: Response) => {
    try {
      const { employeeUuid } = req.params;
      const { page = '1', limit = '20', sortBy = 'uploadDate', sortOrder = 'desc' } = req.query;

      const documents = await this.retrievalService.getDocumentsByEmployeeUuid(
        employeeUuid,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc'
        }
      );

      res.json({
        employeeUuid,
        documents: documents.map(doc => {
          const urls = this.generateDownloadUrls(doc.id, req);
          return {
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            originalName: doc.originalName,
            size: doc.size,
            mimetype: doc.mimetype,
            uploadDate: doc.uploadDate,
            description: doc.description,
            category: doc.category,
            tags: doc.tags,
            keywords: doc.keywords,
            employeeUuid: doc.employeeUuid,
            employeeName: doc.employeeName,
            employeeCedula: doc.employeeCedula,
            documentType: doc.documentType,
            year: doc.year,
            downloadUrl: urls.downloadUrl,
            viewUrl: urls.viewUrl
          };
        }),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: documents.length
        },
        meta: {
          employeeInfo: documents.length > 0 ? {
            employeeName: documents[0].employeeName,
            employeeCedula: documents[0].employeeCedula
          } : null
        }
      });
    } catch (error) {
      console.error('Error in getDocumentsByEmployee:', error);
      res.status(500).json({
        error: 'Error interno del servidor al obtener documentos del empleado'
      });
    }
  };

  searchInEmployeeDocuments = async (req: Request, res: Response) => {
    try {
      const { employeeUuid } = req.params;
      const { 
        text, 
        category, 
        tags, 
        documentType,
        dateFrom, 
        dateTo, 
     //   includeContent = 'false',
        page = '1',
        limit = '20',
      //  sortBy = 'relevance'
      } = req.query;

      if (!text && !category && !tags && !documentType && !dateFrom && !dateTo) {
        return res.status(400).json({
          error: 'Debe proporcionar al menos un parámetro de búsqueda (text, category, tags, documentType, dateFrom, dateTo)'
        });
      }

      const searchQuery = {
        text: text as string,
        employeeUuid,
        category: category as string,
        documentType: documentType as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        size: parseInt(limit as string),
        from: (parseInt(page as string) - 1) * parseInt(limit as string)
      };

      const result = await this.retrievalService.searchInElasticsearch(searchQuery);

      res.json({
        employeeUuid,
        searchQuery: {
          text: text || null,
          category: category || null,
          documentType: documentType || null,
          tags: searchQuery.tags || null,
          dateRange: {
            from: dateFrom || null,
            to: dateTo || null
          }
        },
        documents: result.documents.map((doc: any) => {
          const urls = this.generateDownloadUrls(doc.id, req);
          return {
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            originalName: doc.originalName,
            size: doc.size,
            mimetype: doc.mimetype,
            uploadDate: doc.uploadDate,
            description: doc.description,
            category: doc.category,
            tags: doc.tags,
            keywords: doc.keywords,
            employeeUuid: doc.employeeUuid,
            employeeName: doc.employeeName,
            employeeCedula: doc.employeeCedula,
            documentType: doc.documentType,
            year: doc.year,
            downloadUrl: urls.downloadUrl,
            viewUrl: urls.viewUrl,
            score: doc.score,
            highlights: doc.highlights
          };
        }),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total
        },
        meta: {
          took: result.took || 0,
          employeeInfo: result.documents.length > 0 ? {
            employeeName: result.documents[0].employeeName,
            employeeCedula: result.documents[0].employeeCedula
          } : null
        }
      });
    } catch (error) {
      console.error('Error in searchInEmployeeDocuments:', error);
      res.status(500).json({
        error: 'Error interno del servidor al buscar documentos del empleado'
      });
    }
  };

  getDocumentStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.retrievalService.getDocumentStats();

      res.json({
        stats: {
          totalDocuments: stats.totalDocuments,
          totalSize: stats.totalSize,
          averageSize: stats.totalDocuments > 0 ? Math.round(stats.totalSize / stats.totalDocuments) : 0,
          categories: stats.categories,
          mimeTypes: stats.mimeTypes
        }
      });
    } catch (error) {
      console.error('Error in getDocumentStats:', error);
      res.status(500).json({
        error: 'Error interno del servidor al obtener estadísticas de documentos'
      });
    }
  };

  /**
   * 🔍 DESCARGA AVANZADA: Busca el documento en todas las ubicaciones posibles
   * Ubicaciones: Suplencias, Actos Administrativos, Horas Extra, carpetas de empleados
   */
  downloadDocumentAdvanced = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      console.log(`\n🚀 Descarga avanzada solicitada para documento: ${id}`);
      
      const result = await this.retrievalService.findDocumentInAllLocations(id);

      if (!result) {
        console.log(`❌ Documento ${id} no encontrado en ninguna ubicación`);
        return res.status(404).json({
          success: false,
          error: 'Documento no encontrado',
          message: 'El documento no se encuentra en ninguna ubicación del sistema',
          documentId: id
        });
      }

      const { filePath, document, location } = result;

      console.log(`✅ Documento encontrado en: ${location}`);
      console.log(`📂 Ruta: ${filePath}`);

      // Configurar headers para descarga
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Type', document.mimetype);
      res.setHeader('Content-Length', document.size);
      res.setHeader('X-Document-Location', location); // Header personalizado con la ubicación

      // Enviar el archivo
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('❌ Error enviando archivo:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Error al enviar el archivo',
              message: err.message
            });
          }
        } else {
          console.log(`✅ Archivo enviado exitosamente: ${document.originalName}`);
        }
      });
    } catch (error) {
      console.error('❌ Error in downloadDocumentAdvanced:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
          message: errorMessage,
          details: error instanceof Error ? error.stack : undefined
        });
      }
    }
  };

  /**
   * 👁️ VISUALIZACIÓN AVANZADA: Muestra el documento en todas las ubicaciones posibles
   * Ideal para PDFs - Se muestra inline en el navegador
   */
  viewDocumentAdvanced = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      console.log(`\n👁️ Visualización avanzada solicitada para documento: ${id}`);
      
      const result = await this.retrievalService.findDocumentInAllLocations(id);

      if (!result) {
        console.log(`❌ Documento ${id} no encontrado en ninguna ubicación`);
        return res.status(404).json({
          success: false,
          error: 'Documento no encontrado',
          message: 'El documento no se encuentra en ninguna ubicación del sistema',
          documentId: id
        });
      }

      const { filePath, document, location } = result;

      console.log(`✅ Documento encontrado en: ${location}`);
      console.log(`📂 Ruta: ${filePath}`);

      // Configurar headers para visualización
      res.setHeader('Content-Type', document.mimetype);
      res.setHeader('Content-Length', document.size);
      res.setHeader('X-Document-Location', location); // Header personalizado con la ubicación
      
      // Para PDFs, permitir visualización en el navegador
      if (document.mimetype === 'application/pdf') {
        res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      } else {
        // Para otros tipos, descargar
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      }

      // Enviar el archivo
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('❌ Error enviando archivo:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Error al enviar el archivo',
              message: err.message
            });
          }
        } else {
          console.log(`✅ Archivo visualizado exitosamente: ${document.originalName}`);
        }
      });
    } catch (error) {
      console.error('❌ Error in viewDocumentAdvanced:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
          message: errorMessage,
          details: error instanceof Error ? error.stack : undefined
        });
      }
    }
  };

  /**
   * 📍 INFO DE DOCUMENTO: Obtiene información sobre dónde se encuentra el documento
   */
  getDocumentLocationInfo = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      console.log(`\n📍 Información de ubicación solicitada para: ${id}`);
      
      const result = await this.retrievalService.findDocumentInAllLocations(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Documento no encontrado',
          documentId: id
        });
      }

      const { filePath, document, location } = result;
      const urls = this.generateDownloadUrls(id, req);

      res.json({
        success: true,
        document: {
          id: document.id,
          title: document.title,
          filename: document.filename,
          originalName: document.originalName,
          size: document.size,
          mimetype: document.mimetype,
          uploadDate: document.uploadDate,
          category: document.category,
          documentType: document.documentType,
          employeeUuid: document.employeeUuid,
          employeeName: document.employeeName
        },
        location: {
          description: location,
          fullPath: filePath,
          exists: true
        },
        urls: {
          download: `${urls.downloadUrl}/advanced`,
          view: urls.viewUrl.replace('/view/', '/view-advanced/'),
          downloadStandard: urls.downloadUrl,
          viewStandard: urls.viewUrl
        }
      });
    } catch (error) {
      console.error('❌ Error in getDocumentLocationInfo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * 📥 DESCARGA POR RUTA RELATIVA: Descarga directa usando la ruta relativa del documento
   * Endpoint: POST /retrieval/download-by-path
   * Body: { relativePath: "uploads/2025/uuid/suplencias/file.pdf" }
   */
  downloadByPath = async (req: Request, res: Response) => {
    try {
      const { relativePath } = req.body;

      if (!relativePath) {
        return res.status(400).json({
          success: false,
          error: 'Ruta relativa requerida',
          message: 'Debes proporcionar el campo "relativePath" en el body'
        });
      }

      console.log(`\n📥 Descarga por ruta solicitada: ${relativePath}`);

      // Normalizar la ruta: agregar 'uploads/' si no está presente
      let normalizedPath = relativePath;
      if (!relativePath.startsWith('uploads/')) {
        normalizedPath = `uploads/${relativePath}`;
        console.log(`🔧 Ruta normalizada: ${normalizedPath}`);
      }

      // Construir ruta absoluta desde la raíz del proyecto
      const baseDir = process.cwd();
      const fullPath = join(baseDir, normalizedPath);

      console.log(`📂 Ruta completa: ${fullPath}`);

      // Verificar que el archivo existe
      if (!existsSync(fullPath)) {
        console.log(`❌ Archivo no encontrado en: ${fullPath}`);
        return res.status(404).json({
          success: false,
          error: 'Archivo no encontrado',
          message: `No se encontró el archivo en la ruta: ${relativePath}`,
          fullPath
        });
      }

      // Verificar que es un archivo (no directorio)
      const stats = statSync(fullPath);
      if (!stats.isFile()) {
        console.log(`❌ La ruta no es un archivo: ${fullPath}`);
        return res.status(400).json({
          success: false,
          error: 'Ruta inválida',
          message: 'La ruta proporcionada no es un archivo'
        });
      }

      // Extraer nombre del archivo
      const filename = basename(fullPath);
      
      console.log(`✅ Archivo encontrado: ${filename} (${stats.size} bytes)`);

      // Headers para descarga
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('X-File-Path', normalizedPath); // Usar ruta normalizada

      // Stream del archivo
      const fileStream = createReadStream(fullPath);
      
      fileStream.on('error', (err) => {
        console.error('❌ Error streaming archivo:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Error al leer el archivo',
            message: err.message
          });
        }
      });

      fileStream.pipe(res);
      
      console.log(`📤 Enviando archivo: ${filename}`);
      
    } catch (error) {
      console.error('❌ Error in downloadByPath:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * 👁️ VISUALIZACIÓN POR RUTA RELATIVA: Muestra el documento usando la ruta relativa
   * Endpoint: POST /retrieval/view-by-path
   * Body: { relativePath: "uploads/2025/uuid/suplencias/file.pdf" }
   */
  viewByPath = async (req: Request, res: Response) => {
    try {
      const { relativePath } = req.body;

      if (!relativePath) {
        return res.status(400).json({
          success: false,
          error: 'Ruta relativa requerida',
          message: 'Debes proporcionar el campo "relativePath" en el body'
        });
      }

      console.log(`\n👁️ Visualización por ruta solicitada: ${relativePath}`);

      // Normalizar la ruta: agregar 'uploads/' si no está presente
      let normalizedPath = relativePath;
      if (!relativePath.startsWith('uploads/')) {
        normalizedPath = `uploads/${relativePath}`;
        console.log(`🔧 Ruta normalizada: ${normalizedPath}`);
      }

      // Construir ruta absoluta
      const baseDir = process.cwd();
      const fullPath = join(baseDir, normalizedPath);

      console.log(`📂 Ruta completa: ${fullPath}`);

      // Verificar que el archivo existe
      if (!existsSync(fullPath)) {
        console.log(`❌ Archivo no encontrado en: ${fullPath}`);
        return res.status(404).json({
          success: false,
          error: 'Archivo no encontrado',
          message: `No se encontró el archivo en la ruta: ${relativePath}`,
          fullPath
        });
      }

      // Verificar que es un archivo
      const stats = statSync(fullPath);
      if (!stats.isFile()) {
        console.log(`❌ La ruta no es un archivo: ${fullPath}`);
        return res.status(400).json({
          success: false,
          error: 'Ruta inválida',
          message: 'La ruta proporcionada no es un archivo'
        });
      }

      // Extraer nombre y extensión
      const filename = basename(fullPath);
      const ext = extname(fullPath).toLowerCase();
      
      console.log(`✅ Archivo encontrado: ${filename} (${stats.size} bytes)`);

      // Determinar Content-Type
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (ext === '.jpg' || ext === '.jpeg') {
        contentType = 'image/jpeg';
      } else if (ext === '.png') {
        contentType = 'image/png';
      } else if (ext === '.gif') {
        contentType = 'image/gif';
      }

      // Headers para visualización inline
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('X-File-Path', normalizedPath); // Usar ruta normalizada

      // Stream del archivo
      const fileStream = createReadStream(fullPath);
      
      fileStream.on('error', (err) => {
        console.error('❌ Error streaming archivo:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Error al leer el archivo',
            message: err.message
          });
        }
      });

      fileStream.pipe(res);
      
      console.log(`📤 Mostrando archivo: ${filename}`);
      
    } catch (error) {
      console.error('❌ Error in viewByPath:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
}