import { Request, Response } from 'express';
import { RetrievalService } from './retrieval.service';

export class RetrievalController {
  constructor(
    private readonly retrievalService: RetrievalService = RetrievalService.getInstance()
  ) {}

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
        documents: documents.map(doc => ({
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
          ...(searchQuery.includeContent && { extractedText: doc.extractedText })
        })),
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

  getDocumentsByCategory = async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const documents = await this.retrievalService.getDocumentsByCategory(category);

      res.json({
        category,
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
          originalName: doc.originalName,
          size: doc.size,
          mimetype: doc.mimetype,
          uploadDate: doc.uploadDate,
          tags: doc.tags,
          keywords: doc.keywords
        })),
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