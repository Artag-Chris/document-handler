import { Request, Response, NextFunction } from 'express';

export const validateDocumentId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      error: 'ID de documento inválido'
    });
  }

  // Validar formato UUID v4 básico
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      error: 'Formato de ID inválido'
    });
  }

  next();
};

export const validateSearchQuery = (req: Request, res: Response, next: NextFunction) => {
  const { text, category, tags, dateFrom, dateTo } = req.query;

  // Al menos un parámetro de búsqueda debe estar presente
  if (!text && !category && !tags && !dateFrom && !dateTo) {
    return res.status(400).json({
      error: 'Debe proporcionar al menos un parámetro de búsqueda'
    });
  }

  // Validar fechas si se proporcionan
  if (dateFrom) {
    const fromDate = new Date(dateFrom as string);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({
        error: 'Formato de fecha inválido para dateFrom'
      });
    }
  }

  if (dateTo) {
    const toDate = new Date(dateTo as string);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({
        error: 'Formato de fecha inválido para dateTo'
      });
    }
  }

  // Validar que dateFrom no sea posterior a dateTo
  if (dateFrom && dateTo) {
    const fromDate = new Date(dateFrom as string);
    const toDate = new Date(dateTo as string);
    
    if (fromDate > toDate) {
      return res.status(400).json({
        error: 'La fecha de inicio no puede ser posterior a la fecha de fin'
      });
    }
  }

  next();
};

export const validateCategory = (req: Request, res: Response, next: NextFunction) => {
  const { category } = req.params;
  
  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    return res.status(400).json({
      error: 'Categoría inválida'
    });
  }

  next();
};

export const validateTags = (req: Request, res: Response, next: NextFunction) => {
  const { tags } = req.query;
  
  if (!tags) {
    return res.status(400).json({
      error: 'Se requiere al menos un tag'
    });
  }

  const tagsArray = Array.isArray(tags) ? tags : [tags];
  
  if (tagsArray.some(tag => typeof tag !== 'string' || tag.trim().length === 0)) {
    return res.status(400).json({
      error: 'Todos los tags deben ser strings válidos'
    });
  }

  next();
};