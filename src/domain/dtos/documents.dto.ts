export interface UploadDocumentDto {
  file: Express.Multer.File;
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  employeeUuid: string;
  employeeName?: string;
  employeeCedula?: string;
  documentType?: string;
}

export interface DocumentMetadataDto {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: Date;
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  extractedText?: string;
  keywords?: string[];
  elasticId?: string;
  // Datos del empleado
  employeeUuid: string;
  employeeName?: string;
  employeeCedula?: string;
  documentType?: string;
  // Ruta del archivo
  filePath: string;
  relativePath: string;
  year: number;
}

export interface ElasticsearchDocumentDto {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  tags: string[];
  category?: string;
  employeeUuid: string;
  employeeName?: string;
  employeeCedula?: string;
  documentType: string;
  uploadDate: Date;
  year: number;
  filename: string;
  mimetype: string;
  size: number;
  relativePath: string;
}

export interface SearchDocumentDto {
  query?: string;
  category?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  size?: number;
  page?: number;
  employeeUuid?: string;
  documentType?: string;
  year?: number;
}