import { AppError } from '../utils/AppError.js';

/** Respuesta uniforme para rutas inexistentes. */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      status: 404,
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    },
  });
}

/** Middleware central de errores: traduce excepciones a codigos HTTP. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof AppError) {
    const body = { error: { status: error.status, message: error.message } };
    if (error.details) body.error.details = error.details;
    return res.status(error.status).json(body);
  }

  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { status: 400, message: 'El cuerpo de la peticion no es un JSON valido' },
    });
  }

  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      error: { status: 413, message: 'El cuerpo de la peticion es demasiado grande' },
    });
  }

  console.error('[error no controlado]', error);
  return res.status(500).json({
    error: { status: 500, message: 'Error interno del servidor' },
  });
}
