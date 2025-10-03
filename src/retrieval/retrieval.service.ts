import fs, { readdirSync, existsSync } from 'fs';
import path, { dirname } from 'path';
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
      // Primero intentar buscar en memoria (DocumentsService)
      let document = await this.documentsService.getDocumentById(documentId);
      
      // Si no está en memoria, buscar en Elasticsearch
      if (!document) {
        console.log(`📄 Documento no encontrado en memoria, buscando en Elasticsearch: ${documentId}`);
        
        // Intentar buscar por ID exacto primero
        const elasticDoc = await this.documentsService.getDocumentByIdFromElasticsearch(
          documentId, 
          `documents-${new Date().getFullYear()}`
        );
        
        if (elasticDoc) {
          // Convertir documento de Elasticsearch a DocumentMetadataDto
          document = {
            id: elasticDoc.id || documentId,
            filename: elasticDoc.filename,
            originalName: elasticDoc.filename || elasticDoc.title,
            mimetype: elasticDoc.mimetype || 'application/pdf',
            size: elasticDoc.size || 0,
            uploadDate: new Date(elasticDoc.uploadDate),
            title: elasticDoc.title,
            description: elasticDoc.description,
            tags: elasticDoc.tags || [],
            category: elasticDoc.category,
            extractedText: elasticDoc.content,
            keywords: elasticDoc.keywords || [],
            employeeUuid: elasticDoc.employeeUuid,
            employeeName: elasticDoc.employeeName,
            employeeCedula: elasticDoc.employeeCedula,
            documentType: elasticDoc.documentType,
            year: elasticDoc.year,
            // Construir rutas basándose en la estructura conocida
            filePath: '', // Lo calculamos abajo
            relativePath: `uploads\\${elasticDoc.year}\\${elasticDoc.employeeUuid}\\${elasticDoc.documentType}\\${elasticDoc.filename}`
          };
          
          console.log(`✅ Documento encontrado en Elasticsearch por ID:`, {
            id: document.id,
            filename: document.filename,
            employeeUuid: document.employeeUuid,
            documentType: document.documentType
          });
        }
      }
      
      if (!document) {
        console.log(`❌ Documento no encontrado ni en memoria ni en Elasticsearch: ${documentId}`);
        return null;
      }

      // Usar filePath si está disponible, sino construir la ruta desde relativePath
      let filePath: string;
      
      if (document.filePath && existsSync(document.filePath)) {
        filePath = document.filePath;
        console.log(`📁 Usando filePath directo: ${filePath}`);
      } else if (document.relativePath) {
        // Construir ruta absoluta desde relativePath
        // Normalizar separadores de ruta para Windows/Linux
        const normalizedRelativePath = document.relativePath.replace(/\\/g, '/');
        filePath = path.resolve(process.cwd(), normalizedRelativePath);
        console.log(`📁 Construyendo desde relativePath: ${filePath}`);
      } else {
        // Fallback: construir ruta desde estructura conocida
        filePath = path.join(
          process.cwd(), 
          'uploads', 
          document.year?.toString() || '2025',
          document.employeeUuid,
          document.documentType || 'documentos',
          document.filename
        );
        console.log(`📁 Usando estructura conocida: ${filePath}`);
      }
      
      if (!existsSync(filePath)) {
        console.log(`❌ Archivo no encontrado en: ${filePath}`);
        
        // Intentar buscar por patrón si el archivo exacto no existe
        const dir = dirname(filePath);
        const baseFilename = document.filename;
        
        // Extraer partes del filename para buscar por patrón
        const filenameParts = baseFilename.split('_');
        if (filenameParts.length >= 4) {
          const [year, cedula, docType, ...rest] = filenameParts;
          const extension = path.extname(baseFilename);
          
          // Obtener solo la parte final del nombre (después del último underscore antes de la extensión)
          const lastPart = path.basename(baseFilename, extension).split('_').pop();
          
          console.log(`🔍 Buscando archivos con patrón en: ${dir}`);
          console.log(`📋 Componentes: año=${year}, cedula=${cedula}, docType=${docType}, lastPart=${lastPart}, ext=${extension}`);
          
          try {
            if (existsSync(dir)) {
              const files = readdirSync(dir);
              const matchingFile = files.find(file => {
                // Buscar archivos que tengan la misma estructura: año_cedula_docType_timestamp_nombre.ext
                const regex = new RegExp(`^${year}_${cedula}_${docType}_\\d+_${lastPart?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${extension.replace('.', '\\.')}$`);
                return regex.test(file);
              });
              
              if (matchingFile) {
                filePath = path.join(dir, matchingFile);
                console.log(`✅ Archivo encontrado por patrón: ${filePath}`);
              } else {
                console.log(`📋 Archivos en directorio:`, files);
                console.log(`📋 Buscando patrón: ${year}_${cedula}_${docType}_*_${lastPart}${extension}`);
                console.log(`📋 Datos del documento:`, {
                  id: document.id,
                  filename: document.filename,
                  filePath: document.filePath,
                  relativePath: document.relativePath,
                  employeeUuid: document.employeeUuid,
                  documentType: document.documentType,
                  year: document.year
                });
                throw new Error(`Archivo no encontrado en el sistema de archivos: ${filePath}`);
              }
            } else {
              throw new Error(`Directorio no encontrado: ${dir}`);
            }
          } catch (error) {
            console.log(`❌ Error buscando archivos en directorio: ${error}`);
            throw new Error(`Archivo no encontrado en el sistema de archivos: ${filePath}`);
          }
        } else {
          console.log(`📋 Datos del documento:`, {
            id: document.id,
            filename: document.filename,
            filePath: document.filePath,
            relativePath: document.relativePath,
            employeeUuid: document.employeeUuid,
            documentType: document.documentType,
            year: document.year
          });
          throw new Error(`Archivo no encontrado en el sistema de archivos: ${filePath}`);
        }
      }

      console.log(`✅ Archivo encontrado: ${filePath}`);
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

  // Búsqueda avanzada por contenido y palabras clave
  async advancedSearch(params: {
    query?: string;
    keywords?: string[];
    content?: string;
    fuzzy?: boolean;
    boost?: boolean;
    size?: number;
    from?: number;
    filters?: {
      category?: string;
      documentType?: string;
      employeeUuid?: string;
      dateRange?: { from?: Date; to?: Date };
      fileType?: string;
    };
    sortBy?: 'relevance' | 'date' | 'size' | 'filename';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    documents: DocumentMetadataDto[];
    total: number;
    took: number;
    aggregations?: any;
    facets?: {
      categories: Array<{ key: string; count: number }>;
      documentTypes: Array<{ key: string; count: number }>;
      employees: Array<{ key: string; count: number }>;
      fileTypes: Array<{ key: string; count: number }>;
    };
  }> {
    try {
      console.log('🔍 Búsqueda avanzada con parámetros:', params);

      const elasticResult = await this.documentsService.getElasticsearchService().advancedSearch(params);

      // Convertir documentos de Elasticsearch a DocumentMetadataDto
      const documents: DocumentMetadataDto[] = elasticResult.documents.map((doc: any) => ({
        id: doc.id,
        filename: doc.filename,
        originalName: doc.filename || doc.title,
        mimetype: doc.mimetype || 'application/pdf',
        size: doc.size || 0,
        uploadDate: new Date(doc.uploadDate),
        title: doc.title,
        description: doc.description,
        tags: doc.tags || [],
        category: doc.category,
        extractedText: doc.content,
        keywords: doc.keywords || [],
        employeeUuid: doc.employeeUuid,
        employeeName: doc.employeeName,
        employeeCedula: doc.employeeCedula,
        documentType: doc.documentType,
        year: doc.year,
        filePath: '',
        relativePath: doc.relativePath || `uploads\\\\${doc.year}\\\\${doc.employeeUuid}\\\\${doc.documentType}\\\\${doc.filename}`,
        score: doc.score,
        highlights: doc.highlights
      }));

      // Procesar agregaciones para crear facetas
      const facets = elasticResult.aggregations ? {
        categories: elasticResult.aggregations.categories?.buckets?.map((bucket: any) => ({
          key: bucket.key,
          count: bucket.doc_count
        })) || [],
        documentTypes: elasticResult.aggregations.documentTypes?.buckets?.map((bucket: any) => ({
          key: bucket.key,
          count: bucket.doc_count
        })) || [],
        employees: elasticResult.aggregations.employees?.buckets?.map((bucket: any) => ({
          key: bucket.key,
          count: bucket.doc_count
        })) || [],
        fileTypes: elasticResult.aggregations.fileTypes?.buckets?.map((bucket: any) => ({
          key: bucket.key,
          count: bucket.doc_count
        })) || []
      } : undefined;

      return {
        documents,
        total: elasticResult.total,
        took: elasticResult.took,
        aggregations: elasticResult.aggregations,
        facets
      };

    } catch (error) {
      console.error('Error en búsqueda avanzada:', error);
      throw error;
    }
  }

  // Búsqueda de autocompletado
  async getSearchSuggestions(params: {
    text: string;
    field?: 'title' | 'keywords' | 'content';
    size?: number;
  }): Promise<string[]> {
    try {
      return await this.documentsService.getElasticsearchService().suggest(params);
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      return [];
    }
  }

  // Buscar documentos similares
  async findSimilarDocuments(documentId: string, params: {
    size?: number;
    minScore?: number;
  } = {}): Promise<DocumentMetadataDto[]> {
    try {
      const similarDocs = await this.documentsService.getElasticsearchService().findSimilar(documentId, params);

      return similarDocs.map((doc: any) => ({
        id: doc.id,
        filename: doc.filename,
        originalName: doc.filename || doc.title,
        mimetype: doc.mimetype || 'application/pdf',
        size: doc.size || 0,
        uploadDate: new Date(doc.uploadDate),
        title: doc.title,
        description: doc.description,
        tags: doc.tags || [],
        category: doc.category,
        extractedText: doc.content,
        keywords: doc.keywords || [],
        employeeUuid: doc.employeeUuid,
        employeeName: doc.employeeName,
        employeeCedula: doc.employeeCedula,
        documentType: doc.documentType,
        year: doc.year,
        filePath: '',
        relativePath: doc.relativePath || `uploads\\\\${doc.year}\\\\${doc.employeeUuid}\\\\${doc.documentType}\\\\${doc.filename}`,
        score: doc.score
      }));

    } catch (error) {
      console.error('Error buscando documentos similares:', error);
      return [];
    }
  }

  // Búsqueda por palabras clave específicas
  async searchByKeywords(keywords: string[], params: {
    size?: number;
    from?: number;
    exactMatch?: boolean;
    boost?: boolean;
  } = {}): Promise<{
    documents: DocumentMetadataDto[];
    total: number;
    matchedKeywords: string[];
  }> {
    try {
      const searchParams = {
        keywords: keywords,
        size: params.size || 10,
        from: params.from || 0,
        boost: params.boost || false
      };

      const result = await this.advancedSearch(searchParams);

      // Encontrar qué palabras clave coincidieron
      const matchedKeywords = keywords.filter(keyword =>
        result.documents.some(doc =>
          doc.keywords?.some(docKeyword =>
            docKeyword.toLowerCase().includes(keyword.toLowerCase())
          )
        )
      );

      return {
        documents: result.documents,
        total: result.total,
        matchedKeywords
      };

    } catch (error) {
      console.error('Error en búsqueda por palabras clave:', error);
      throw error;
    }
  }

  // Búsqueda por contenido completo
  async searchByContent(content: string, params: {
    size?: number;
    from?: number;
    fuzzy?: boolean;
    highlight?: boolean;
  } = {}): Promise<{
    documents: DocumentMetadataDto[];
    total: number;
    highlights?: any;
  }> {
    try {
      const searchParams = {
        content: content,
        size: params.size || 10,
        from: params.from || 0,
        fuzzy: params.fuzzy || false
      };

      const result = await this.advancedSearch(searchParams);

      return {
        documents: result.documents,
        total: result.total,
        highlights: params.highlight ? result.documents.map((doc: DocumentMetadataDto) => doc.highlights) : undefined
      };

    } catch (error) {
      console.error('Error en búsqueda por contenido:', error);
      throw error;
    }
  }
}