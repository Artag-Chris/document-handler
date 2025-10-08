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
    
      let document = await this.documentsService.getDocumentById(documentId);

      if (!document) {

        const elasticDoc = await this.documentsService.getDocumentByIdFromElasticsearch(
          documentId, 
          `documents-${new Date().getFullYear()}`
        );
        
        if (elasticDoc) {
       
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
            filePath: '', 
            relativePath: `uploads\\${elasticDoc.year}\\${elasticDoc.employeeUuid}\\${elasticDoc.documentType}\\${elasticDoc.filename}`
          };
          
        }
      }
      
      if (!document) {
        console.log(`❌ Documento no encontrado ni en memoria ni en Elasticsearch: ${documentId}`);
        return null;
      }

      let filePath: string;
      
      if (document.filePath && existsSync(document.filePath)) {
        filePath = document.filePath;
     
      } else if (document.relativePath) {

        const normalizedRelativePath = document.relativePath.replace(/\\/g, '/');
        filePath = path.resolve(process.cwd(), normalizedRelativePath);

      } else {

        filePath = path.join(
          process.cwd(), 
          'uploads', 
          document.year?.toString() || '2025',
          document.employeeUuid,
          document.documentType || 'documentos',
          document.filename
        );

      }
      
      if (!existsSync(filePath)) {

        const dir = dirname(filePath);
        const baseFilename = document.filename;

        const filenameParts = baseFilename.split('_');
        if (filenameParts.length >= 4) {
          const [year, cedula, docType, ...rest] = filenameParts;
          const extension = path.extname(baseFilename);
          const lastPart = path.basename(baseFilename, extension).split('_').pop();
          
          try {
            if (existsSync(dir)) {
              const files = readdirSync(dir);
              const matchingFile = files.find(file => {
                const regex = new RegExp(`^${year}_${cedula}_${docType}_\\d+_${lastPart?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${extension.replace('.', '\\.')}$`);
                return regex.test(file);
              });
              
              if (matchingFile) {
                filePath = path.join(dir, matchingFile);

              } else {
              
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
         
          throw new Error(`Archivo no encontrado en el sistema de archivos: ${filePath}`);
        }
      }

      return {
        filePath,
        document
      };
    } catch (error) {
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
      const elasticResult = await this.documentsService.getElasticsearchService().advancedSearch(params);
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

  async getDocumentsByEmployeeUuid(
    employeeUuid: string, 
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<DocumentMetadataDto[]> {
    try {
      const { page = 1, limit = 20, sortBy = 'uploadDate', sortOrder = 'desc' } = options;

      const allDocuments = await this.documentsService.getAllDocuments();
      let employeeDocuments = allDocuments.filter(doc => doc.employeeUuid === employeeUuid);

      // Si no hay documentos en memoria, buscar en Elasticsearch
      if (employeeDocuments.length === 0) {
        
        const elasticResult = await this.documentsService.searchInElasticsearch({
          employeeUuid,
          size: limit,
          from: (page - 1) * limit
        });

        if (elasticResult.documents && elasticResult.documents.length > 0) {
          // Convertir documentos de Elasticsearch a DocumentMetadataDto
          employeeDocuments = elasticResult.documents.map(doc => ({
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
            extractedText: doc.content || '',
            keywords: doc.keywords || [],
            employeeUuid: doc.employeeUuid,
            employeeName: doc.employeeName,
            employeeCedula: doc.employeeCedula,
            documentType: doc.documentType || 'documentos',
            filePath: this.reconstructFilePath(doc),
            relativePath: doc.relativePath,
            year: doc.year || new Date().getFullYear()
          }));
        }
      }

      // Aplicar ordenamiento
      employeeDocuments.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'uploadDate':
            aValue = a.uploadDate.getTime();
            bValue = b.uploadDate.getTime();
            break;
          case 'title':
            aValue = a.title?.toLowerCase() || '';
            bValue = b.title?.toLowerCase() || '';
            break;
          case 'size':
            aValue = a.size;
            bValue = b.size;
            break;
          case 'filename':
            aValue = a.filename.toLowerCase();
            bValue = b.filename.toLowerCase();
            break;
          default:
            aValue = a.uploadDate.getTime();
            bValue = b.uploadDate.getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      // Aplicar paginación
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedDocuments = employeeDocuments.slice(startIndex, endIndex);

      return paginatedDocuments;
    } catch (error) {
      console.error('Error obteniendo documentos por employeeUuid:', error);
      throw error;
    }
  }

  async searchInElasticsearch(query: {
    text?: string;
    employeeUuid?: string;
    documentType?: string;
    category?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    size?: number;
    from?: number;
  }): Promise<{ documents: any[]; total: number; took?: number }> {
    try {
      const result = await this.documentsService.searchInElasticsearch(query);
      return {
        documents: result.documents || [],
        total: result.total || 0,
        took: 0 // ElasticsearchService no retorna 'took' actualmente
      };
    } catch (error) {
      console.error('Error en búsqueda de Elasticsearch:', error);
      throw error;
    }
  }

  private reconstructFilePath(elasticDoc: any): string {
    if (elasticDoc.relativePath) {
      return path.join(process.cwd(), elasticDoc.relativePath);
    }

    const year = elasticDoc.year || new Date().getFullYear();
    const employeeUuid = elasticDoc.employeeUuid;
    const documentType = elasticDoc.documentType || 'documentos';
    const filename = elasticDoc.filename;
    
    return path.join(process.cwd(), 'uploads', year.toString(), employeeUuid, documentType, filename);
  }

  /**
   * 🔍 BÚSQUEDA AVANZADA: Buscar archivo en múltiples ubicaciones
   * Este método busca un documento por ID en todas las ubicaciones posibles:
   * - Suplencias (docente_ausente y docente_reemplazo)
   * - Actos Administrativos
   * - Horas Extra
   * - Ubicación estándar de empleados
   */
  async findDocumentInAllLocations(documentId: string): Promise<{
    filePath: string;
    document: DocumentMetadataDto;
    location: string;
  } | null> {
    try {
      console.log(`\n🔍 Buscando documento: ${documentId} en todas las ubicaciones...`);

      // 1. Intentar obtener el documento de memoria o Elasticsearch
      let document = await this.documentsService.getDocumentById(documentId);

      if (!document) {
        console.log('📊 No encontrado en memoria, buscando en Elasticsearch...');
        const elasticDoc = await this.documentsService.getDocumentByIdFromElasticsearch(
          documentId,
          `documents-${new Date().getFullYear()}`
        );

        if (elasticDoc) {
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
            filePath: '',
            relativePath: elasticDoc.relativePath || ''
          };
        }
      }

      if (!document) {
        console.log('❌ Documento no encontrado en ningún índice');
        return null;
      }

      console.log(`✅ Documento encontrado en índice: ${document.title}`);
      console.log(`📝 Metadata:`, {
        category: document.category,
        documentType: document.documentType,
        employeeUuid: document.employeeUuid,
        year: document.year
      });

      // 2. Lista de ubicaciones a buscar
      const searchLocations = this.generateSearchLocations(document);

      console.log(`📂 Ubicaciones a buscar: ${searchLocations.length}`);

      // 3. Buscar en cada ubicación
      for (const location of searchLocations) {
        console.log(`🔎 Buscando en: ${location.path}`);
        
        if (existsSync(location.path)) {
          console.log(`✅ ¡Archivo encontrado en: ${location.description}!`);
          return {
            filePath: location.path,
            document,
            location: location.description
          };
        }
      }

      // 4. Si no se encuentra, buscar por patrón en directorio
      console.log('🔄 Archivo no encontrado en rutas directas, buscando por patrón...');
      
      const foundByPattern = await this.searchByPattern(document);
      if (foundByPattern) {
        return foundByPattern;
      }

      console.log('❌ Archivo no encontrado en ninguna ubicación');
      throw new Error(`Archivo no encontrado en el sistema: ${document.filename}`);

    } catch (error) {
      console.error('❌ Error en findDocumentInAllLocations:', error);
      throw error;
    }
  }

  /**
   * Generar todas las ubicaciones posibles donde puede estar el archivo
   */
  private generateSearchLocations(document: DocumentMetadataDto): Array<{ path: string; description: string }> {
    const locations: Array<{ path: string; description: string }> = [];
    const currentYear = document.year || new Date().getFullYear();
    const baseDir = process.cwd();

    // Obtener información del metadata si existe
    const metadata = (document as any).metadata;

    // UBICACIÓN 1: Ruta relativa directa (si existe)
    if (document.relativePath) {
      const normalizedPath = document.relativePath.replace(/\\/g, '/');
      locations.push({
        path: path.join(baseDir, normalizedPath),
        description: 'Ruta relativa del documento'
      });
    }

    // UBICACIÓN 2: Ruta absoluta (si existe)
    if (document.filePath && document.filePath !== '') {
      locations.push({
        path: document.filePath,
        description: 'Ruta absoluta del documento'
      });
    }

    // UBICACIÓN 3: Suplencias (si el documento es de tipo suplencia)
    if (document.category === 'suplencias' || document.documentType === 'suplencia' || metadata?.tipo === 'suplencia') {
      const suplenciaId = metadata?.suplencia_id;
      const docenteAusenteId = metadata?.docente_ausente_id;
      const docenteReemplazoId = metadata?.docente_reemplazo_id;

      // Carpeta del docente ausente
      if (docenteAusenteId) {
        locations.push({
          path: path.join(baseDir, 'uploads', 'suplencias', currentYear.toString(), docenteAusenteId, document.filename),
          description: `Suplencias - Docente Ausente (${docenteAusenteId})`
        });
      }

      // Carpeta del docente de reemplazo
      if (docenteReemplazoId) {
        locations.push({
          path: path.join(baseDir, 'uploads', 'suplencias', currentYear.toString(), docenteReemplazoId, document.filename),
          description: `Suplencias - Docente Reemplazo (${docenteReemplazoId})`
        });
      }

      // Si no hay metadata, buscar con employeeUuid
      if (document.employeeUuid) {
        locations.push({
          path: path.join(baseDir, 'uploads', 'suplencias', currentYear.toString(), document.employeeUuid, document.filename),
          description: `Suplencias - Employee UUID (${document.employeeUuid})`
        });
      }
    }

    // UBICACIÓN 4: Actos Administrativos
    if (document.category === 'actos_administrativos' || document.documentType === 'acto_administrativo' || metadata?.tipo === 'acto_administrativo') {
      const institucionId = metadata?.institucion_educativa_id || document.employeeUuid;

      if (institucionId) {
        locations.push({
          path: path.join(baseDir, 'uploads', 'actos_administrativos', currentYear.toString(), institucionId, document.filename),
          description: `Actos Administrativos - Institución (${institucionId})`
        });
      }
    }

    // UBICACIÓN 5: Horas Extra
    if (document.category === 'horas_extra' || document.documentType === 'horas_extra' || metadata?.tipo === 'horas_extra') {
      const currentMonth = new Date().getMonth() + 1;
      const monthStr = currentMonth.toString().padStart(2, '0');

      locations.push({
        path: path.join(baseDir, 'uploads', 'horas_extra', currentYear.toString(), monthStr, document.filename),
        description: `Horas Extra - Mes actual (${monthStr}/${currentYear})`
      });

      // Buscar en todos los meses del año actual
      for (let month = 1; month <= 12; month++) {
        const monthPadded = month.toString().padStart(2, '0');
        locations.push({
          path: path.join(baseDir, 'uploads', 'horas_extra', currentYear.toString(), monthPadded, document.filename),
          description: `Horas Extra - Mes ${monthPadded}/${currentYear}`
        });
      }
    }

    // UBICACIÓN 6: Ubicación estándar de empleado
    if (document.employeeUuid) {
      const docType = document.documentType || 'documentos';
      locations.push({
        path: path.join(baseDir, 'uploads', currentYear.toString(), document.employeeUuid, docType, document.filename),
        description: `Empleado - ${docType} (${document.employeeUuid})`
      });

      // También buscar sin el tipo de documento
      locations.push({
        path: path.join(baseDir, 'uploads', currentYear.toString(), document.employeeUuid, document.filename),
        description: `Empleado - Raíz (${document.employeeUuid})`
      });
    }

    return locations;
  }

  /**
   * Buscar archivo por patrón en directorios
   */
  private async searchByPattern(document: DocumentMetadataDto): Promise<{
    filePath: string;
    document: DocumentMetadataDto;
    location: string;
  } | null> {
    try {
      const currentYear = document.year || new Date().getFullYear();
      const baseDir = process.cwd();
      const uploadsDir = path.join(baseDir, 'uploads');

      // Extraer información del nombre del archivo
      const filenameParts = document.filename.split('_');
      
      if (filenameParts.length >= 4) {
        const [year, cedula, docType] = filenameParts;
        const extension = path.extname(document.filename);
        const baseName = path.basename(document.filename, extension);
        const lastPart = baseName.split('_').pop();

        // Directorios específicos a buscar
        const searchDirs = [
          path.join(uploadsDir, 'suplencias', currentYear.toString()),
          path.join(uploadsDir, 'actos_administrativos', currentYear.toString()),
          path.join(uploadsDir, 'horas_extra', currentYear.toString()),
          path.join(uploadsDir, currentYear.toString())
        ];

        for (const searchDir of searchDirs) {
          if (!existsSync(searchDir)) continue;

          const found = await this.searchInDirectory(
            searchDir,
            document.filename,
            lastPart || '',
            extension
          );

          if (found) {
            console.log(`✅ Archivo encontrado por patrón en: ${found}`);
            return {
              filePath: found,
              document,
              location: `Búsqueda por patrón en ${searchDir}`
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error en searchByPattern:', error);
      return null;
    }
  }

  /**
   * Buscar recursivamente en un directorio
   */
  private async searchInDirectory(
    dir: string,
    targetFilename: string,
    lastPart: string,
    extension: string
  ): Promise<string | null> {
    try {
      const files = readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
          // Búsqueda recursiva
          const found = await this.searchInDirectory(fullPath, targetFilename, lastPart, extension);
          if (found) return found;
        } else {
          // Comprobar si es el archivo buscado
          if (file.name === targetFilename) {
            return fullPath;
          }

          // Búsqueda por patrón
          if (lastPart && file.name.includes(lastPart) && file.name.endsWith(extension)) {
            return fullPath;
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Error buscando en directorio ${dir}:`, error);
      return null;
    }
  }
}