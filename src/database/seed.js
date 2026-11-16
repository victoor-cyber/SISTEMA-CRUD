import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { read, write } from './store.js';

const sampleProducts = [
  {
    nombre: 'Teclado mecanico RGB',
    descripcion: 'Teclado con switches azules y retroiluminacion RGB',
    precio: 189900,
    stock: 25,
    categoria: 'Perifericos',
  },
  {
    nombre: 'Mouse inalambrico',
    descripcion: 'Mouse ergonomico con conexion Bluetooth y 2.4 GHz',
    precio: 89900,
    stock: 40,
    categoria: 'Perifericos',
  },
  {
    nombre: 'Monitor 24 pulgadas',
    descripcion: 'Monitor Full HD de 75 Hz con panel IPS',
    precio: 649900,
    stock: 12,
    categoria: 'Pantallas',
  },
  {
    nombre: 'Diadema gamer',
    descripcion: 'Diadema con microfono incorporado y sonido estereo',
    precio: 129900,
    stock: 18,
    categoria: 'Audio',
  },
];

/**
 * Crea el usuario administrador y unos productos de ejemplo
 * solo cuando la base de datos esta vacia.
 */
export async function seedDatabase({ silent = false } = {}) {
  const db = await read();

  const needsAdmin = !db.users.some(
    (user) => user.email === config.admin.email.toLowerCase(),
  );
  const needsProducts = db.products.length === 0;

  if (!needsAdmin && !needsProducts) {
    if (!silent) console.log('Base de datos ya inicializada, no se requiere seed.');
    return;
  }

  const passwordHash = needsAdmin
    ? await bcrypt.hash(config.admin.password, 10)
    : null;

  await write((data) => {
    if (needsAdmin) {
      data.users.push({
        id: randomUUID(),
        nombre: config.admin.nombre,
        email: config.admin.email.toLowerCase(),
        passwordHash,
        rol: 'admin',
        createdAt: new Date().toISOString(),
      });
    }

    if (needsProducts) {
      const now = new Date().toISOString();
      data.products.push(
        ...sampleProducts.map((product) => ({
          id: randomUUID(),
          descripcion: '',
          stock: 0,
          categoria: 'General',
          activo: true,
          ...product,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }
  });

  if (!silent) {
    console.log(`Base de datos inicializada en: ${config.dbFile}`);
    if (needsAdmin) {
      console.log(`Usuario admin: ${config.admin.email} / ${config.admin.password}`);
    }
  }
}

// Permite ejecutarlo directamente: npm.cmd run seed
const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await seedDatabase();
}
