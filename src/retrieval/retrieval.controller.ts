import { Request, Response } from 'express';
import { RetrievalService } from './retrieval.service';

export class RetrievalController {
  constructor(
    private readonly retrievalService: RetrievalService = RetrievalService.getInstance()
  ) {}

  // Función auxiliar para generar URLs de descarga
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

      // Configurar headers para descarga
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
}