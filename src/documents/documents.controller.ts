import { Request, Response } from 'express';
import { DocumentsService } from './documents.service';

export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService = DocumentsService.getInstance()
  ) {}

  /**
   * 🔄 PROMESA 2: Upload de archivos para Horas Extra
   * Recibe archivos del frontend, los guarda con Multer, indexa en Elasticsearch
   * y devuelve la información necesaria para la Promesa 3 (registro en BD)
   */
  uploadHorasExtraDocuments = async (req: Request, res: Response) => {
    try {
      console.log('📥 Request recibido en uploadHorasExtraDocuments');
      console.log('📋 Body:', req.body);
      console.log('📎 Files:', req.files ? (Array.isArray(req.files) ? `${req.files.length} archivos` : 'Files object') : 'No files');
      
      // Verificar que haya archivos
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        console.warn('⚠️ No se recibieron archivos en el request');
        return res.status(400).json({
          success: false,
          message: 'No se han proporcionado archivos. Asegúrate de enviar archivos con el campo "files" (plural)',
          error: 'No files uploaded',
          hint: 'El FormData debe incluir: formData.append("files", archivo)'
        });
      }

      // Extraer datos del body
      const { 
        horas_extra_id,
        empleado_id,
        sede_id,
        tipo_documento = 'horas_extra' 
      } = req.body;

      // Validar datos requeridos
      if (!horas_extra_id) {
        return res.status(400).json({
          success: false,
          message: 'horas_extra_id es requerido',
          error: 'Missing horas_extra_id'
        });
      }

      if (!empleado_id) {
        return res.status(400).json({
          success: false,
          message: 'empleado_id es requerido',
          error: 'Missing empleado_id'
        });
      }

      if (!sede_id) {
        return res.status(400).json({
          success: false,
          message: 'sede_id es requerido',
          error: 'Missing sede_id'
        });
      }

      console.log(`📤 Procesando ${req.files.length} archivos para horas extra ${horas_extra_id}`);

      // Procesar archivos con el servicio
      const resultado = await this.documentsService.uploadHorasExtraDocuments(
        req.files as Express.Multer.File[],
        {
          horas_extra_id,
          empleado_id,
          sede_id,
          tipo_documento
        }
      );

      // ✅ Respuesta para la Promesa 3
      return res.status(200).json({
        success: true,
        message: 'Archivos subidos y procesados exitosamente',
        data: {
          horas_extra_id: resultado.horas_extra_id,
          total_archivos: resultado.total_archivos,
          archivos_procesados: resultado.archivos_procesados,
          elasticsearch_indexados: resultado.elasticsearch_indexados,
          timestamp: resultado.timestamp
        }
      });

    } catch (error: any) {
      console.error('❌ Error en uploadHorasExtraDocuments:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al procesar archivos de horas extra',
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * 🔄 PROMESA 2: Upload de archivos para Suplencias
   * Recibe archivos del frontend, los guarda con Multer, indexa en Elasticsearch
   * y devuelve la información necesaria para la Promesa 3 (registro en BD)
   */
  uploadSuplenciaDocuments = async (req: Request, res: Response) => {
    try {
      console.log('📥 Request recibido en uploadSuplenciaDocuments');
      console.log('📋 Body:', req.body);
      console.log('📎 Files:', req.files ? (Array.isArray(req.files) ? `${req.files.length} archivos` : 'Files object') : 'No files');
      
      // Verificar que haya archivos
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        console.warn('⚠️ No se recibieron archivos en el request');
        return res.status(400).json({
          success: false,
          message: 'No se han proporcionado archivos. Asegúrate de enviar archivos con el campo "files" (plural)',
          error: 'No files uploaded',
          hint: 'El FormData debe incluir: formData.append("files", archivo)'
        });
      }

      // Extraer datos del body
      const { 
        suplencia_id,
        docente_ausente_id,
        docente_reemplazo_id,
        tipo_documento = 'suplencia' 
      } = req.body;

      // Validar datos requeridos
      if (!suplencia_id) {
        return res.status(400).json({
          success: false,
          message: 'suplencia_id es requerido',
          error: 'Missing suplencia_id'
        });
      }

      if (!docente_ausente_id || !docente_reemplazo_id) {
        return res.status(400).json({
          success: false,
          message: 'docente_ausente_id y docente_reemplazo_id son requeridos',
          error: 'Missing employee IDs'
        });
      }

      console.log(`📤 Procesando ${req.files.length} archivos para suplencia ${suplencia_id}`);

      // Procesar archivos con el servicio
      const resultado = await this.documentsService.uploadSuplenciaDocuments(
        req.files as Express.Multer.File[],
        {
          suplencia_id,
          docente_ausente_id,
          docente_reemplazo_id,
          tipo_documento
        }
      );

      // ✅ Respuesta para la Promesa 3
      return res.status(200).json({
        success: true,
        message: `${resultado.archivos_procesados.length} archivos procesados exitosamente`,
        data: {
          suplencia_id: resultado.suplencia_id,
          total_archivos: resultado.total_archivos,
          archivos_procesados: resultado.archivos_procesados,
          elasticsearch_indexados: resultado.elasticsearch_indexados,
          timestamp: resultado.timestamp
        }
      });

    } catch (error: any) {
      console.error('❌ Error en uploadSuplenciaDocuments:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al procesar archivos de suplencia',
        error: error.message || 'Internal server error'
      });
    }
  }

  uploadDocument = async (req: Request, res: Response) => {

    try {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Disposition');
      
      if (!req.file) {
        return res.status(400).json({
          error: 'No se ha proporcionado ningún archivo'
        });
      }

      const { 
        title, 
        description, 
        tags, 
        category, 
        employeeUuid, 
        employeeName, 
        employeeCedula, 
        documentType 
      } = req.body;


      if (!employeeUuid) {
        return res.status(400).json({
          error: 'employeeUuid es requerido para organizar los documentos'
        });
      }
      
      const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim())) : [];

      const result = await this.documentsService.uploadDocument(req.file, {
        title,
        description,
        tags: tagsArray,
        category,
        employeeUuid,
        employeeName,
        employeeCedula,
        documentType: documentType || 'documentos'
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const downloadUrls = {
        downloadUrl: `${baseUrl}/api/retrieval/download/${result.document.id}`,
        viewUrl: `${baseUrl}/api/retrieval/view/${result.document.id}`
      };

      res.status(201).json({
        message: 'Documento subido exitosamente',
        document: {
          id: result.document.id,
          title: result.document.title,
          filename: result.document.filename,
          originalName: result.document.originalName,
          size: result.document.size,
          mimetype: result.document.mimetype,
          uploadDate: result.document.uploadDate,
          category: result.document.category,
          tags: result.document.tags,
          keywords: result.document.keywords,
          employeeUuid: result.document.employeeUuid,
          employeeName: result.document.employeeName,
          employeeCedula: result.document.employeeCedula,
          documentType: result.document.documentType,
          year: result.document.year,
          relativePath: result.document.relativePath,
          ...downloadUrls
        },
        elasticsearchData: result.elasticsearchData,
        indexInfo: {
          suggestedIndex: `documents-${result.document.year}`,
          documentPath: `uploads/${result.document.year}/${result.document.employeeUuid}/${result.document.documentType}`,
          readyForElasticsearch: true
        }
      });
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      
      // Asegurar headers CORS también en error responses
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Disposition');
      
      res.status(500).json({
        error: 'Error interno del servidor al subir el documento',
        details: process.env.NODE_ENV === 'development' ? error : undefined
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

      const { employeeUuid, employeeName, employeeCedula, documentType } = req.body;

      // Validar que employeeUuid esté presente
      if (!employeeUuid) {
        return res.status(400).json({
          error: 'employeeUuid es requerido para organizar los documentos'
        });
      }

      const uploadPromises = req.files.map(async (file: Express.Multer.File) => {
        return await this.documentsService.uploadDocument(file, {
          employeeUuid,
          employeeName,
          employeeCedula,
          documentType: documentType || 'documentos'
        });
      });

      const results = await Promise.all(uploadPromises);

      res.status(201).json({
        message: `${results.length} documentos subidos exitosamente`,
        documents: results.map(result => ({
          id: result.document.id,
          title: result.document.title,
          filename: result.document.filename,
          originalName: result.document.originalName,
          size: result.document.size,
          mimetype: result.document.mimetype,
          uploadDate: result.document.uploadDate,
          keywords: result.document.keywords,
          employeeUuid: result.document.employeeUuid,
          documentType: result.document.documentType,
          year: result.document.year
        })),
        elasticsearchBatch: results.map(result => result.elasticsearchData),
        indexInfo: {
          suggestedIndex: `documents-${new Date().getFullYear()}`,
          totalDocuments: results.length,
          readyForElasticsearch: true
        }
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