import { Client } from '@elastic/elasticsearch';
import { envs } from './envs';

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
    // Configuración desde variables de entorno para Docker
    this.config = {
      host: envs.ELASTICSEARCH_HOST, // 'elasticsearch' por defecto (nombre del contenedor)
      port: envs.ELASTICSEARCH_PORT, // 9200 por defecto
      username: envs.ELASTICSEARCH_USERNAME,
      password: envs.ELASTICSEARCH_PASSWORD,
      index: `documents-${new Date().getFullYear()}`
    };

    console.log(`🔧 Configurando Elasticsearch: ${this.config.host}:${this.config.port}`);

    this.client = new Client({
      node: `http://${this.config.host}:${this.config.port}`, // HTTP ya que xpack.security.enabled=false
      auth: this.config.username && this.config.password ? {
        username: this.config.username,
        password: this.config.password
      } : undefined,
      // Configuración simplificada para Elasticsearch 8.x en Docker
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
      node: `http://${this.config.host}:${this.config.port}`, // HTTP para Docker local
      auth: this.config.username && this.config.password ? {
        username: this.config.username,
        password: this.config.password
      } : undefined,
      // Configuración simplificada para Elasticsearch 8.x en Docker
      requestTimeout: 30000,
      pingTimeout: 3000
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

  // Buscar documento por ID exacto
  async getDocumentById(documentId: string, indexName?: string): Promise<any | null> {
    const index = indexName || this.config.index;
    
    try {
      const response = await this.client.get({
        index,
        id: documentId
      });

      if (response.found) {
        return {
          id: response._id,
          ...(response._source as any)
        };
      }
      
      return null;
    } catch (error) {
      // Si el documento no existe, Elasticsearch lanza error 404
      if ((error as any).statusCode === 404) {
        console.log(`📄 Documento con ID ${documentId} no encontrado en Elasticsearch`);
        return null;
      }
      
      console.error('❌ Error buscando documento por ID:', error);
      return null;
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
  }, indexName?: string): Promise<{
    documents: any[];
    total: number;
    took: number;
    aggregations?: any;
  }> {
    const index = indexName || this.config.index;

    try {
      const searchBody: any = {
        size: params.size || 10,
        from: params.from || 0,
        query: {
          bool: {
            must: [],
            filter: [],
            should: []
          }
        },
        highlight: {
          fields: {
            content: {
              fragment_size: 150,
              number_of_fragments: 3
            },
            title: {},
            keywords: {}
          }
        },
        // Agregaciones para estadísticas
        aggs: {
          categories: {
            terms: { field: "category.keyword", size: 10 }
          },
          documentTypes: {
            terms: { field: "documentType.keyword", size: 10 }
          },
          employees: {
            terms: { field: "employeeName.keyword", size: 10 }
          },
          fileTypes: {
            terms: { field: "mimetype.keyword", size: 10 }
          },
          dateHistogram: {
            date_histogram: {
              field: "uploadDate",
              calendar_interval: "month"
            }
          }
        }
      };

      // Búsqueda por texto general
      if (params.query) {
        if (params.fuzzy) {
          // Búsqueda fuzzy para errores tipográficos
          searchBody.query.bool.should.push({
            multi_match: {
              query: params.query,
              fields: ["title^3", "content^2", "keywords^2", "filename"],
              fuzziness: "AUTO",
              boost: params.boost ? 2 : 1
            }
          });
        } else {
          // Búsqueda exacta con boost
          searchBody.query.bool.should.push({
            multi_match: {
              query: params.query,
              fields: ["title^3", "content^2", "keywords^2", "filename"],
              type: "best_fields",
              boost: params.boost ? 2 : 1
            }
          });
        }
      }

      // Búsqueda específica por contenido
      if (params.content) {
        searchBody.query.bool.must.push({
          match: {
            content: {
              query: params.content,
              boost: 2
            }
          }
        });
      }

      // Búsqueda por palabras clave específicas
      if (params.keywords && params.keywords.length > 0) {
        searchBody.query.bool.should.push({
          terms: {
            "keywords.keyword": params.keywords,
            boost: 1.5
          }
        });
      }

      // Aplicar filtros
      if (params.filters) {
        if (params.filters.category) {
          searchBody.query.bool.filter.push({
            term: { "category.keyword": params.filters.category }
          });
        }

        if (params.filters.documentType) {
          searchBody.query.bool.filter.push({
            term: { "documentType.keyword": params.filters.documentType }
          });
        }

        if (params.filters.employeeUuid) {
          searchBody.query.bool.filter.push({
            term: { "employeeUuid.keyword": params.filters.employeeUuid }
          });
        }

        if (params.filters.fileType) {
          searchBody.query.bool.filter.push({
            term: { "mimetype.keyword": params.filters.fileType }
          });
        }

        if (params.filters.dateRange) {
          const dateFilter: any = { range: { uploadDate: {} } };
          if (params.filters.dateRange.from) {
            dateFilter.range.uploadDate.gte = params.filters.dateRange.from;
          }
          if (params.filters.dateRange.to) {
            dateFilter.range.uploadDate.lte = params.filters.dateRange.to;
          }
          searchBody.query.bool.filter.push(dateFilter);
        }
      }

      // Configurar ordenamiento
      if (params.sortBy) {
        const sortOrder = params.sortOrder || 'desc';
        switch (params.sortBy) {
          case 'date':
            searchBody.sort = [{ uploadDate: { order: sortOrder } }];
            break;
          case 'size':
            searchBody.sort = [{ size: { order: sortOrder } }];
            break;
          case 'filename':
            searchBody.sort = [{ "filename.keyword": { order: sortOrder } }];
            break;
          case 'relevance':
          default:
            // Elasticsearch usa relevancia por defecto
            break;
        }
      }

      // Si no hay condiciones must o should, buscar todo
      if (searchBody.query.bool.must.length === 0 && searchBody.query.bool.should.length === 0) {
        searchBody.query = { match_all: {} };
      }

      console.log('🔍 Elasticsearch query:', JSON.stringify(searchBody, null, 2));

      const response = await this.client.search({
        index,
        body: searchBody
      });

      const documents = response.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        highlights: hit.highlight,
        ...hit._source
      }));

      return {
        documents,
        total: typeof response.hits.total === 'object' 
          ? response.hits.total?.value || 0
          : response.hits.total || 0,
        took: response.took,
        aggregations: response.aggregations
      };

    } catch (error) {
      console.error('❌ Error en búsqueda avanzada:', error);
      throw error;
    }
  }

  // Búsqueda de autocompletado
  async suggest(params: {
    text: string;
    field?: 'title' | 'keywords' | 'content';
    size?: number;
  }, indexName?: string): Promise<string[]> {
    const index = indexName || this.config.index;
    const field = params.field || 'title';
    
    try {
      const response = await this.client.search({
        index,
        body: {
          size: 0,
          suggest: {
            suggestions: {
              text: params.text,
              term: {
                field: field,
                size: params.size || 5
              }
            }
          }
        }
      });

      const suggestions = response.suggest?.suggestions as any;
      return suggestions?.[0]?.options?.map?.((option: any) => option.text) || [];
    } catch (error) {
      console.error('❌ Error en sugerencias:', error);
      return [];
    }
  }

  // Búsqueda similar a un documento específico
  async findSimilar(documentId: string, params: {
    size?: number;
    minScore?: number;
  } = {}, indexName?: string): Promise<any[]> {
    const index = indexName || this.config.index;

    try {
      const response = await this.client.search({
        index,
        body: {
          size: params.size || 5,
          min_score: params.minScore || 0.5,
          query: {
            more_like_this: {
              fields: ['title', 'content', 'keywords'],
              like: [
                {
                  _index: index,
                  _id: documentId
                }
              ],
              min_term_freq: 1,
              max_query_terms: 12
            }
          }
        }
      });

      return response.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      }));

    } catch (error) {
      console.error('❌ Error buscando documentos similares:', error);
      return [];
    }
  }
}