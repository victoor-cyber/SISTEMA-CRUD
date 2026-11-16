import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/env.js';

/**
 * Almacen de datos basado en un archivo JSON.
 * Mantiene una copia en memoria y serializa las escrituras para
 * evitar condiciones de carrera entre peticiones concurrentes.
 */
let cache = null;
let writeQueue = Promise.resolve();

async function load() {
  if (cache) return cache;

  try {
    const raw = await readFile(config.dbFile, 'utf8');
    const parsed = JSON.parse(raw);
    cache = {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      products: Array.isArray(parsed.products) ? parsed.products : [],
    };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    cache = { users: [], products: [] };
    await persist();
  }

  return cache;
}

async function persist() {
  await mkdir(path.dirname(config.dbFile), { recursive: true });
  await writeFile(config.dbFile, JSON.stringify(cache, null, 2), 'utf8');
}

/** Devuelve la base de datos en memoria. */
export function read() {
  return load();
}

/**
 * Ejecuta una mutacion sobre la base de datos y persiste el resultado.
 * @param {(db: { users: object[], products: object[] }) => any} mutator
 */
export function write(mutator) {
  const operation = writeQueue.then(async () => {
    const db = await load();
    const result = await mutator(db);
    await persist();
    return result;
  });

  writeQueue = operation.catch(() => {});
  return operation;
}

/** Utilidad para pruebas: obliga a releer el archivo en la proxima operacion. */
export function resetCache() {
  cache = null;
  writeQueue = Promise.resolve();
}
