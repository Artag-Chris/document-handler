import { Request, Response, NextFunction } from 'express';

export const validateDocumentUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No se ha proporcionado ningún archivo'
    });
  }

  // Validar tamaño del archivo (100MB máximo)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      error: 'El archivo es demasiado grande. Máximo permitido: 100MB'
    });
  }

  // Validar que el archivo tenga contenido
  if (req.file.size === 0) {
    return res.status(400).json({
      error: 'El archivo está vacío'
    });
  }

  next();
};

export const validateMultipleDocumentUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({
      error: 'No se han proporcionado archivos'
    });
  }

  const maxFiles = 5;
  if (req.files.length > maxFiles) {
    return res.status(400).json({
      error: `Máximo ${maxFiles} archivos permitidos por operación`
    });
  }

  const maxSize = 100 * 1024 * 1024; // 100MB por archivo
  const oversizedFiles = req.files.filter(file => file.size > maxSize);
  
  if (oversizedFiles.length > 0) {
    return res.status(400).json({
      error: 'Uno o más archivos exceden el tamaño máximo de 100MB'
    });
  }

  const emptyFiles = req.files.filter(file => file.size === 0);
  if (emptyFiles.length > 0) {
    return res.status(400).json({
      error: 'Uno o más archivos están vacíos'
    });
  }

  next();
};

export const validateDocumentMetadata = (req: Request, res: Response, next: NextFunction) => {
  const { title, description, category, tags } = req.body;

  // Validar título si se proporciona
  if (title && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({
      error: 'El título debe ser una cadena de texto válida'
    });
  }

  // Validar descripción si se proporciona
  if (description && (typeof description !== 'string' || description.trim().length === 0)) {
    return res.status(400).json({
      error: 'La descripción debe ser una cadena de texto válida'
    });
  }

  // Validar categoría si se proporciona
  if (category && (typeof category !== 'string' || category.trim().length === 0)) {
    return res.status(400).json({
      error: 'La categoría debe ser una cadena de texto válida'
    });
  }

  // Validar tags si se proporcionan
  if (tags) {
    let tagsArray;
    
    if (typeof tags === 'string') {
      tagsArray = tags.split(',').map(tag => tag.trim());
    } else if (Array.isArray(tags)) {
      tagsArray = tags;
    } else {
      return res.status(400).json({
        error: 'Los tags deben ser una cadena separada por comas o un array de strings'
      });
    }

    const invalidTags = tagsArray.filter(tag => typeof tag !== 'string' || tag.trim().length === 0);
    
    if (invalidTags.length > 0) {
      return res.status(400).json({
        error: 'Todos los tags deben ser cadenas de texto válidas'
      });
    }
  }

  next();
};