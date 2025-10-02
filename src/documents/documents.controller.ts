import { Request, Response } from 'express';
import { DocumentsService } from './documents.service';

export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService = DocumentsService.getInstance()
  ) {}

  uploadDocument = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No se ha proporcionado ningún archivo'
        });
      }

      const { title, description, tags, category } = req.body;
      
      const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim())) : [];

      const document = await this.documentsService.uploadDocument(req.file, {
        title,
        description,
        tags: tagsArray,
        category
      });

      res.status(201).json({
        message: 'Documento subido exitosamente',
        document: {
          id: document.id,
          title: document.title,
          filename: document.filename,
          originalName: document.originalName,
          size: document.size,
          mimetype: document.mimetype,
          uploadDate: document.uploadDate,
          category: document.category,
          tags: document.tags,
          keywords: document.keywords
        }
      });
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      res.status(500).json({
        error: 'Error interno del servidor al subir el documento'
      });
    }
  };

  uploadMultipleDocuments = async (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          error: 'No se han proporcionado archivos'
        });
      }

      const uploadPromises = req.files.map(async (file: Express.Multer.File) => {
        return await this.documentsService.uploadDocument(file);
      });

      const documents = await Promise.all(uploadPromises);

      res.status(201).json({
        message: `${documents.length} documentos subidos exitosamente`,
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
          originalName: doc.originalName,
          size: doc.size,
          mimetype: doc.mimetype,
          uploadDate: doc.uploadDate,
          keywords: doc.keywords
        }))
      });
    } catch (error) {
      console.error('Error in uploadMultipleDocuments:', error);
      res.status(500).json({
        error: 'Error interno del servidor al subir los documentos'
      });
    }
  };

  getAllDocuments = async (req: Request, res: Response) => {
    try {
      const documents = await this.documentsService.getAllDocuments();
      
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
        }))
      });
    } catch (error) {
      console.error('Error in getAllDocuments:', error);
      res.status(500).json({
        error: 'Error interno del servidor al obtener los documentos'
      });
    }
  };

  getDocumentById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const document = await this.documentsService.getDocumentById(id);

      if (!document) {
        return res.status(404).json({
          error: 'Documento no encontrado'
        });
      }

      res.json({
        document: {
          id: document.id,
          title: document.title,
          filename: document.filename,
          originalName: document.originalName,
          size: document.size,
          mimetype: document.mimetype,
          uploadDate: document.uploadDate,
          description: document.description,
          category: document.category,
          tags: document.tags,
          keywords: document.keywords,
          extractedText: document.extractedText
        }
      });
    } catch (error) {
      console.error('Error in getDocumentById:', error);
      res.status(500).json({
        error: 'Error interno del servidor al obtener el documento'
      });
    }
  };

  deleteDocument = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.documentsService.deleteDocument(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Documento no encontrado'
        });
      }

      res.json({
        message: 'Documento eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      res.status(500).json({
        error: 'Error interno del servidor al eliminar el documento'
      });
    }
  };

  searchDocuments = async (req: Request, res: Response) => {
    try {
      const { text, category, tags, dateFrom, dateTo } = req.query;
      
      const searchQuery = {
        text: text as string,
        category: category as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      };

      const documents = await this.documentsService.searchDocuments(searchQuery);

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
      console.error('Error in searchDocuments:', error);
      res.status(500).json({
        error: 'Error interno del servidor al buscar documentos'
      });
    }
  };
}