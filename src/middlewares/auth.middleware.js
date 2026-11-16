import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Middleware de autenticacion: exige el encabezado
 * `Authorization: Bearer <token>` con un JWT valido y no expirado.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (!token || scheme !== 'Bearer') {
    return next(
      new AppError(
        401,
        'Token no proporcionado. Envia el encabezado Authorization: Bearer <token>',
      ),
    );
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);

    req.user = {
      id: payload.sub,
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
    };

    return next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'El token ha expirado, inicia sesion de nuevo'
        : 'Token invalido';

    return next(new AppError(401, message));
  }
}
