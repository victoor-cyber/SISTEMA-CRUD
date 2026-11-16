/**
 * Error de aplicacion con codigo HTTP asociado.
 * Permite que los servicios lancen errores de negocio y que el
 * middleware de errores los traduzca a respuestas HTTP correctas.
 */
export class AppError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
    this.isOperational = true;
  }
}
