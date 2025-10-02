import fs from 'fs';
import path from 'path';
import { DocumentMetadataDto } from '../domain/dtos/documents.dto';
import { DocumentsService } from '../documents/documents.service';

export class RetrievalService {
  private static instance: RetrievalService;

  private constructor(
    private readonly documentsService: DocumentsService = DocumentsService.getInstance()
  ) {}

  public static getInstance(): RetrievalService {
    if (!RetrievalService.instance) {
      RetrievalService.instance = new RetrievalService();
    }
    return RetrievalService.instance;
  }

  async getDocumentFile(documentId: string): Promise<{ 
    filePath: string; 
    document: DocumentMetadataDto 
  } | null> {
    try {
      const document = await this.documentsService.getDocumentById(documentId);
      
      if (!document) {
        return null;
      }

      const filePath = path.join(process.cwd(), 'uploads', document.filename);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('Archivo no encontrado en el sistema de archivos');
      }

      return {
        filePath,
        document
      };
    } catch (error) {
      console.error('Error getting document file:', error);
      throw error;
    }
  }

  async getDocumentStream(documentId: string): Promise<{
    stream: fs.ReadStream;
    document: DocumentMetadataDto;
  } | null> {
    try {
      const result = await this.getDocumentFile(documentId);
      
      if (!result) {
        return null;
      }

      const stream = fs.createReadStream(result.filePath);
      
      return {
        stream,
        document: result.document
      };
    } catch (error) {
      console.error('Error getting document stream:', error);
      throw error;
    }
  }

  async searchAndRetrieve(query: {
    text?: string;
    category?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    includeContent?: boolean;
  }): Promise<DocumentMetadataDto[]> {
    try {
      const documents = await this.documentsService.searchDocuments({
        text: query.text,
        category: query.category,
        tags: query.tags,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo
      });

      // Si se solicita incluir el contenido, verificar que los archivos existan
      if (query.includeContent) {
        const validDocuments = [];
        
        for (const doc of documents) {
          const filePath = path.join(process.cwd(), 'uploads', doc.filename);
          if (fs.existsSync(filePath)) {
            validDocuments.push(doc);
          }
        }
        
        return validDocuments;
      }

      return documents;
    } catch (error) {
      console.error('Error in searchAndRetrieve:', error);
      throw error;
    }
  }

  async getDocumentsByCategory(category: string): Promise<DocumentMetadataDto[]> {
    try {
      return await this.documentsService.searchDocuments({ category });
    } catch (error) {
      console.error('Error getting documents by category:', error);
      throw error;
    }
  }

  async getDocumentsByTags(tags: string[]): Promise<DocumentMetadataDto[]> {
    try {
      return await this.documentsService.searchDocuments({ tags });
    } catch (error) {
      console.error('Error getting documents by tags:', error);
      throw error;
    }
  }

  async getRecentDocuments(limit: number = 10): Promise<DocumentMetadataDto[]> {
    try {
      const allDocuments = await this.documentsService.getAllDocuments();
      
      return allDocuments
        .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent documents:', error);
      throw error;
    }
  }

  async getDocumentStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    categories: Record<string, number>;
    mimeTypes: Record<string, number>;
  }> {
    try {
      const documents = await this.documentsService.getAllDocuments();
      
      const stats = {
        totalDocuments: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
        categories: {} as Record<string, number>,
        mimeTypes: {} as Record<string, number>
      };

      documents.forEach(doc => {
        // Contar categorías
        if (doc.category) {
          stats.categories[doc.category] = (stats.categories[doc.category] || 0) + 1;
        }

        // Contar tipos MIME
        stats.mimeTypes[doc.mimetype] = (stats.mimeTypes[doc.mimetype] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw error;
    }
  }
}