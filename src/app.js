import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { requestLogger } from './middlewares/requestLogger.middleware.js';
import routes from './routes/index.js';
import { AppError } from './utils/AppError.js';

const publicDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
);

const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

const baseCorsOptions = {
  methods: allowedMethods,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Location'],
  maxAge: 86400,
};

const allowAllOrigins = config.corsOrigins.includes('*');

const corsOptions = allowAllOrigins
  ? { ...baseCorsOptions, origin: '*' }
  : {
      ...baseCorsOptions,
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(
          new AppError(403, `Origen no permitido por CORS: ${origin}`),
        );
      },
    };

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '100kb' }));
  app.use(requestLogger);

  // Formulario web (HTML + CSS + JS) que consume esta misma API
  app.use(express.static(publicDir));

  app.get('/api', (req, res) => {
    res.status(200).json({
      name: 'API REST - Catalogo de productos',
      version: '1.0.0',
      formulario: 'GET / -> public/index.html (formulario CRUD)',
      endpoints: {
        'POST /api/auth/login': 'Publica - obtiene el token JWT',
        'GET /api/productos': 'Publica - lista con paginacion y filtros',
        'GET /api/productos/:id': 'Publica - detalle',
        'POST /api/productos': 'JWT - crea un producto',
        'PUT /api/productos/:id': 'JWT - actualiza un producto',
        'DELETE /api/productos/:id': 'JWT - elimina un producto',
        'GET /api/health': 'Publica - estado del servicio',
      },
    });
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
