import { Client } from '@elastic/elasticsearch';

export interface ElasticsearchConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  apiKey?: string;
  index: string;
}

export class ElasticsearchService {
  private static instance: ElasticsearchService;
  private client: Client;
  private config: ElasticsearchConfig;

  private constructor() {
    // Configuración por defecto - ajusta según tu setup
    this.config = {
      host: 'localhost',
      port: 9200, // Puerto estándar, puede ser diferente en tu Docker
      index: `documents-${new Date().getFullYear()}`
    };

    this.client = new Client({
      node: `http://${this.config.host}:${this.config.port}`,
      auth: this.config.username && this.config.password ? {
        username: this.config.username,
        password: this.config.password
      } : undefined,
      // Configuración adicional para desarrollo
      requestTimeout: 30000,
      pingTimeout: 3000
    });
  }

  public static getInstance(): ElasticsearchService {
    if (!ElasticsearchService.instance) {
      ElasticsearchService.instance = new ElasticsearchService();
    }
    return ElasticsearchService.instance;
  }

  // Actualizar configuración dinámicamente
  public updateConfig(newConfig: Partial<ElasticsearchConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.client = new Client({
      node: `http://${this.config.host}:${this.config.port}`,
      auth: this.config.username && this.config.password ? {
        username: this.config.username,
        password: this.config.password
      } : undefined,
    });
  }

  // Verificar conexión
  async testConnection(): Promise<{ connected: boolean; info?: any; error?: string }> {
    try {
      const response = await this.client.info();
      console.log('✅ Elasticsearch connected successfully:', {
        cluster: response.cluster_name,
        version: response.version.number
      });
      return { 
        connected: true, 
        info: {
          cluster: response.cluster_name,
          version: response.version.number,
          lucene: response.version.lucene_version
        }
      };
    } catch (error) {
      console.error('❌ Elasticsearch connection failed:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Crear índice si no existe
  async createIndexIfNotExists(indexName?: string): Promise<boolean> {
    const index = indexName || this.config.index;
    
    try {
      const exists = await this.client.indices.exists({ index });
      
      if (!exists) {
        await this.client.indices.create({
          index,
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                spanish_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'spanish_stop', 'spanish_stemmer']
                }
              },
              filter: {
                spanish_stop: {
                  type: 'stop',
                  stopwords: '_spanish_'
                },
                spanish_stemmer: {
                  type: 'stemmer',
                  language: 'spanish'
                }
              }
            }
          },
          mappings: {
            properties: {
              title: {
                type: 'text',
                analyzer: 'spanish_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              content: {
                type: 'text',
                analyzer: 'spanish_analyzer'
              },
              keywords: {
                type: 'text',
                analyzer: 'keyword'
              },
              tags: {
                type: 'keyword'
              },
              category: {
                type: 'keyword'
              },
              employeeUuid: {
                type: 'keyword'
              },
              employeeName: {
                type: 'text',
                analyzer: 'spanish_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              employeeCedula: {
                type: 'keyword'
              },
              documentType: {
                type: 'keyword'
              },
              uploadDate: {
                type: 'date'
              },
              year: {
                type: 'integer'
              },
              filename: {
                type: 'keyword'
              },
              mimetype: {
                type: 'keyword'
              },
              size: {
                type: 'long'
              },
              relativePath: {
                type: 'keyword'
              }
            }
          }
        });
        
        console.log(`✅ Índice '${index}' creado exitosamente`);
        return true;
      }
      
      console.log(`ℹ️ Índice '${index}' ya existe`);
      return true;
    } catch (error) {
      console.error(`❌ Error creando índice '${index}':`, error);
      return false;
    }
  }

  // Indexar documento
  async indexDocument(document: any, documentId?: string, indexName?: string): Promise<{ success: boolean; id?: string; error?: string }> {
    const index = indexName || this.config.index;
    
    try {
      // Asegurar que el índice existe
      await this.createIndexIfNotExists(index);
      
      const response = await this.client.index({
        index,
        id: documentId,
        document: document
      });

      console.log(`📄 Documento indexado exitosamente:`, {
        index,
        id: response._id,
        result: response.result
      });

      return { 
        success: true, 
        id: response._id 
      };
    } catch (error) {
      console.error('❌ Error indexando documento:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Buscar documentos
  async searchDocuments(query: {
    text?: string;
    employeeUuid?: string;
    documentType?: string;
    category?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    size?: number;
    from?: number;
  }, indexName?: string): Promise<{ documents: any[]; total: number; error?: string }> {
    const index = indexName || this.config.index;
    
    try {
      const must: any[] = [];
      const filter: any[] = [];

      // Búsqueda por texto
      if (query.text) {
        must.push({
          multi_match: {
            query: query.text,
            fields: ['title^3', 'content^2', 'keywords^2', 'employeeName'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Filtros exactos
      if (query.employeeUuid) {
        filter.push({ term: { employeeUuid: query.employeeUuid } });
      }

      if (query.documentType) {
        filter.push({ term: { documentType: query.documentType } });
      }

      if (query.category) {
        filter.push({ term: { category: query.category } });
      }

      if (query.tags && query.tags.length > 0) {
        filter.push({ terms: { tags: query.tags } });
      }

      // Filtro de fechas
      if (query.dateFrom || query.dateTo) {
        const dateRange: any = {};
        if (query.dateFrom) dateRange.gte = query.dateFrom.toISOString();
        if (query.dateTo) dateRange.lte = query.dateTo.toISOString();
        filter.push({ range: { uploadDate: dateRange } });
      }

      const response = await this.client.search({
        index,
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter: filter.length > 0 ? filter : undefined
          }
        },
        sort: [
          { _score: { order: 'desc' } },
          { uploadDate: { order: 'desc' } }
        ],
        size: query.size || 10,
        from: query.from || 0
      });

      const documents = response.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      }));

      return {
        documents,
        total: typeof response.hits.total === 'number' 
          ? response.hits.total 
          : response.hits.total?.value || 0
      };

    } catch (error) {
      console.error('❌ Error buscando documentos:', error);
      return {
        documents: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Eliminar documento
  async deleteDocument(documentId: string, indexName?: string): Promise<{ success: boolean; error?: string }> {
    const index = indexName || this.config.index;
    
    try {
      await this.client.delete({
        index,
        id: documentId
      });

      console.log(`🗑️ Documento eliminado de Elasticsearch:`, { index, id: documentId });
      return { success: true };
    } catch (error) {
      console.error('❌ Error eliminando documento:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Obtener estadísticas del índice
  async getIndexStats(indexName?: string): Promise<any> {
    const index = indexName || this.config.index;
    
    try {
      const stats = await this.client.indices.stats({ index });
      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }

  // Obtener configuración actual
  getConfig(): ElasticsearchConfig {
    return { ...this.config };
  }
}