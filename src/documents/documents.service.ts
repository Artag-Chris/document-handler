import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { DocumentMetadataDto } from '../domain/dtos/documents.dto';

export class DocumentsService {
  private static instance: DocumentsService;
  private documents: Map<string, DocumentMetadataDto> = new Map();

  private constructor() {}

  public static getInstance(): DocumentsService {
    if (!DocumentsService.instance) {
      DocumentsService.instance = new DocumentsService();
    }
    return DocumentsService.instance;
  }

  async uploadDocument(file: Express.Multer.File, metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
  }): Promise<DocumentMetadataDto> {
    try {
      const documentId = uuidv4();
      let extractedText = '';
      let keywords: string[] = [];

      // Extraer texto si es un PDF
      if (file.mimetype === 'application/pdf') {
        const buffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
        keywords = this.extractKeywords(extractedText);
      }

      const document: DocumentMetadataDto = {
        id: documentId,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: new Date(),
        title: metadata?.title || file.originalname,
        description: metadata?.description,
        tags: metadata?.tags || [],
        category: metadata?.category,
        extractedText,
        keywords
      };

      // Guardar en memoria (en producción sería una base de datos)
      this.documents.set(documentId, document);

      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Error al procesar el documento');
    }
  }

  async getAllDocuments(): Promise<DocumentMetadataDto[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentById(id: string): Promise<DocumentMetadataDto | null> {
    return this.documents.get(id) || null;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const document = this.documents.get(id);
    if (!document) {
      return false;
    }

    try {
      // Eliminar archivo físico
      const filePath = path.join(process.cwd(), 'uploads', document.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Eliminar de memoria
      this.documents.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  private extractKeywords(text: string): string[] {
    // Implementación básica de extracción de palabras clave
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Contar frecuencia de palabras
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Ordenar por frecuencia y tomar las top 10
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  async searchDocuments(query: {
    text?: string;
    category?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<DocumentMetadataDto[]> {
    let results = Array.from(this.documents.values());

    if (query.text) {
      const searchText = query.text.toLowerCase();
      results = results.filter(doc => 
        doc.title?.toLowerCase().includes(searchText) ||
        doc.description?.toLowerCase().includes(searchText) ||
        doc.extractedText?.toLowerCase().includes(searchText) ||
        doc.keywords?.some(keyword => keyword.includes(searchText))
      );
    }

    if (query.category) {
      results = results.filter(doc => doc.category === query.category);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(doc => 
        doc.tags?.some(tag => query.tags!.includes(tag))
      );
    }

    if (query.dateFrom) {
      results = results.filter(doc => doc.uploadDate >= query.dateFrom!);
    }

    if (query.dateTo) {
      results = results.filter(doc => doc.uploadDate <= query.dateTo!);
    }

    return results;
  }
}