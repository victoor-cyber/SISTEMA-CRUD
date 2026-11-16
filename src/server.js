import { createApp } from './app.js';
import { config } from './config/env.js';
import { seedDatabase } from './database/seed.js';

await seedDatabase({ silent: true });

const app = createApp();

const server = app.listen(config.port, () => {
  console.log('=========================================================');
  console.log(' API REST - Catalogo de productos');
  console.log(` Entorno:    ${config.nodeEnv}`);
  console.log(` Servidor:   http://localhost:${config.port}`);
  console.log(` Salud:      http://localhost:${config.port}/api/health`);
  console.log(` Login:      POST http://localhost:${config.port}/api/auth/login`);
  console.log(` Archivo BD: ${config.dbFile}`);
  console.log('=========================================================');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `El puerto ${config.port} ya esta en uso. Cambia PORT en el archivo .env`,
    );
    process.exit(1);
  }

  console.error('No se pudo iniciar el servidor:', error);
  process.exit(1);
});

const shutdown = (signal) => {
  console.log(`\nRecibido ${signal}. Cerrando servidor...`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
