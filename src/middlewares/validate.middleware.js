import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

/**
 * Ejecuta la validacion declarada en las rutas y responde 400
 * con el detalle de cada campo invalido.
 */
export function validate(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const details = result.array().map((error) => ({
    campo: error.path,
    mensaje: error.msg,
  }));

  return next(new AppError(400, 'Los datos enviados no son validos', details));
}
