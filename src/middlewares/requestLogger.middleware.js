import { config } from '../config/env.js';

/** Registro simple de peticiones (desactivado en pruebas). */
export function requestLogger(req, res, next) {
  if (config.nodeEnv === 'test') return next();

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs.toFixed(1)} ms)`,
    );
  });

  return next();
}
