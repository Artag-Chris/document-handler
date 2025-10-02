export interface UploadDocumentDto {
  file: Express.Multer.File;
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
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
}

export interface SearchDocumentDto {
  query?: string;
  category?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  size?: number;
  page?: number;
}