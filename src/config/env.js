import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..', '..');

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 3000,

  // JWT
  jwtSecret: process.env.JWT_SECRET ?? 'super-secreto-cambiar-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',

  // CORS: "*" o lista separada por comas
  corsOrigins: (process.env.CORS_ORIGIN ?? '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  // Persistencia
  dbFile: process.env.DB_FILE
    ? path.resolve(process.env.DB_FILE)
    : path.resolve(projectRoot, 'data', 'db.json'),

  // Usuario administrador inicial
  admin: {
    nombre: process.env.ADMIN_NOMBRE ?? 'Administrador',
    email: process.env.ADMIN_EMAIL ?? 'admin@tienda.com',
    password: process.env.ADMIN_PASSWORD ?? 'Admin123!',
  },
};
