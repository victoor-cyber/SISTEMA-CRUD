import { randomUUID } from 'node:crypto';

/** Campos del producto que el cliente puede enviar. */
export const PRODUCT_FIELDS = [
  'nombre',
  'descripcion',
  'precio',
  'stock',
  'categoria',
  'activo',
];

/** Construye una entidad Producto nueva (capa de modelo). */
export function buildProduct(payload) {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    nombre: payload.nombre,
    descripcion: payload.descripcion ?? '',
    precio: payload.precio,
    stock: payload.stock ?? 0,
    categoria: payload.categoria ?? 'General',
    activo: payload.activo ?? true,
    createdAt: now,
    updatedAt: now,
  };
}

/** Aplica los cambios permitidos sobre un producto existente. */
export function applyProductChanges(product, payload) {
  const updated = { ...product };

  for (const field of PRODUCT_FIELDS) {
    if (payload[field] !== undefined) {
      updated[field] = payload[field];
    }
  }

  updated.updatedAt = new Date().toISOString();
  return updated;
}
