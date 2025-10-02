import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { DocumentMetadataDto, ElasticsearchDocumentDto } from '../domain/dtos/documents.dto';

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
    employeeUuid?: string;
    employeeName?: string;
    employeeCedula?: string;
    documentType?: string;
  }): Promise<{ document: DocumentMetadataDto; elasticsearchData: ElasticsearchDocumentDto }> {
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

      // Calcular ruta relativa para almacenamiento
      const currentYear = new Date().getFullYear();
      const relativePath = path.relative(process.cwd(), file.path);

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
        keywords,
        employeeUuid: metadata?.employeeUuid || '',
        employeeName: metadata?.employeeName,
        employeeCedula: metadata?.employeeCedula,
        documentType: metadata?.documentType || 'documentos',
        filePath: file.path,
        relativePath,
        year: currentYear
      };

      // Preparar datos para Elasticsearch
      const elasticsearchData: ElasticsearchDocumentDto = {
        id: documentId,
        title: document.title!,
        content: extractedText,
        keywords,
        tags: document.tags!,
        category: document.category,
        employeeUuid: document.employeeUuid,
        employeeName: document.employeeName,
        employeeCedula: document.employeeCedula,
        documentType: document.documentType!,
        uploadDate: document.uploadDate,
        year: currentYear,
        filename: document.filename,
        mimetype: document.mimetype,
        size: document.size,
        relativePath: document.relativePath
      };

      // Guardar en memoria (en producción sería una base de datos)
      this.documents.set(documentId, document);

      console.log('📄 Documento procesado para Elasticsearch:', {
        id: documentId,
        employeeUuid: document.employeeUuid,
        documentType: document.documentType,
        year: currentYear,
        path: relativePath,
        keywordsCount: keywords.length,
        fileSize: document.size
      });

      return { document, elasticsearchData };
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
      // Eliminar archivo físico usando la ruta completa almacenada
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
        console.log(`🗑️ Archivo eliminado: ${document.filePath}`);
      }

      // Eliminar de memoria
      this.documents.delete(id);
      
      console.log(`📋 Documento eliminado del sistema:`, {
        id,
        employeeUuid: document.employeeUuid,
        filename: document.filename,
        documentType: document.documentType
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  private extractKeywords(text: string): string[] {
    // Lista de palabras vacías en español e inglés (stop words)
    //debere exportarlo
    const stopWords = new Set([
      // Español
      'que', 'con', 'para', 'una', 'del', 'las', 'los', 'por', 'como', 'pero', 
      'sus', 'por', 'ser', 'han', 'son', 'fue', 'año', 'años', 'muy', 'más',
      'este', 'esta', 'estos', 'estas', 'todo', 'todos', 'toda', 'todas',
      'entre', 'sobre', 'desde', 'hasta', 'hacia', 'aunque', 'cuando', 'donde',
      'mientras', 'porque', 'sino', 'tanto', 'también', 'durante', 'después',
      'antes', 'entonces', 'ahora', 'aquí', 'allí', 'donde', 'cual', 'cuales',
      'quien', 'quienes', 'qué', 'cómo', 'cuándo', 'dónde', 'porqué',
      // Inglés
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
      'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
      'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy',
      'did', 'way', 'use', 'she', 'may', 'say', 'each', 'which', 'their',
      'time', 'will', 'about', 'would', 'there', 'could', 'other', 'after',
      'first', 'well', 'water', 'been', 'call', 'who', 'oil', 'sit', 'now',
      'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'
    ]);

    if (!text || text.trim().length === 0) return [];

    // 1. Limpiar y normalizar texto
    let cleanText = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s\-]/g, ' ') // Mantener guiones para palabras compuestas
      .replace(/\s+/g, ' ')
      .trim();

    // 2. Extraer diferentes tipos de términos
    const allTerms = new Set<string>();

    // 2.1. Palabras individuales (4+ caracteres)
    const individualWords = cleanText
      .split(/\s+/)
      .filter(word => 
        word.length >= 4 && 
        !stopWords.has(word) &&
        !/^\d+$/.test(word) && // No solo números
        /[a-zA-Z]/.test(word) // Debe contener al menos una letra
      );

    individualWords.forEach(word => allTerms.add(word));

    // 2.2. Bigramas (frases de 2 palabras)
    for (let i = 0; i < individualWords.length - 1; i++) {
      const bigram = `${individualWords[i]} ${individualWords[i + 1]}`;
      if (bigram.length >= 8) { // Bigramas de al menos 8 caracteres
        allTerms.add(bigram);
      }
    }

    // 2.3. Trigramas (frases de 3 palabras) - solo los más significativos
    for (let i = 0; i < individualWords.length - 2; i++) {
      const trigram = `${individualWords[i]} ${individualWords[i + 1]} ${individualWords[i + 2]}`;
      if (trigram.length >= 12) { // Trigramas de al menos 12 caracteres
        allTerms.add(trigram);
      }
    }

    // 2.4. Palabras compuestas con guión
    const hyphenatedWords = cleanText.match(/\b\w+\-\w+\b/g) || [];
    hyphenatedWords
      .filter(word => word.length >= 6)
      .forEach(word => allTerms.add(word));

    // 2.5. Números con contexto (años, códigos, etc.)
    const numbersWithContext = cleanText.match(/\b(19|20)\d{2}\b|\b\d{4,}\b/g) || [];
    numbersWithContext.forEach(num => allTerms.add(num));

    // 2.6. Palabras en mayúsculas (posibles siglas o nombres propios)
    const upperCaseWords = text.match(/\b[A-Z]{2,}\b/g) || [];
    upperCaseWords
      .filter(word => word.length >= 2)
      .forEach(word => allTerms.add(word.toLowerCase()));

    // 3. Calcular frecuencia de términos
    const termFrequency = new Map<string, number>();
    const words = cleanText.split(/\s+/);

    Array.from(allTerms).forEach(term => {
      // Contar ocurrencias exactas
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = cleanText.match(regex) || [];
      termFrequency.set(term, matches.length);
    });

    // 4. Calcular TF-IDF simplificado y puntuación
    const termsWithScore = Array.from(termFrequency.entries()).map(([term, freq]) => {
      let score = freq;

      // Bonificar términos más largos
      if (term.length >= 8) score *= 1.5;
      if (term.length >= 12) score *= 2;

      // Bonificar bigramas y trigramas
      const wordCount = term.split(' ').length;
      if (wordCount === 2) score *= 1.3;
      if (wordCount === 3) score *= 1.8;

      // Bonificar palabras compuestas
      if (term.includes('-')) score *= 1.4;

      // Bonificar números con contexto
      if (/\d/.test(term)) score *= 1.2;

      // Penalizar términos muy comunes (que aparecen en más del 10% del texto)
      const textLength = words.length;
      if (freq > textLength * 0.1) score *= 0.7;

      return { term, score, frequency: freq };
    });

    // 5. Ordenar y seleccionar mejores términos
    const sortedTerms = termsWithScore
      .sort((a, b) => b.score - a.score)
      .slice(0, 50) // Tomar top 50 en lugar de 10
      .map(item => item.term);

    // 6. Diversificar resultados (mezclar palabras individuales y frases)
    const finalKeywords: string[] = [];
    const singleWords: string[] = [];
    const phrases: string[] = [];

    sortedTerms.forEach(term => {
      if (term.includes(' ')) {
        phrases.push(term);
      } else {
        singleWords.push(term);
      }
    });

    // Combinar de forma balanceada: 60% palabras individuales, 40% frases
    const maxSingleWords = Math.min(30, singleWords.length);
    const maxPhrases = Math.min(20, phrases.length);

    finalKeywords.push(...singleWords.slice(0, maxSingleWords));
    finalKeywords.push(...phrases.slice(0, maxPhrases));

    return finalKeywords.slice(0, 50); // Máximo 50 keywords para Elasticsearch
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