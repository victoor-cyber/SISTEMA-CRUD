import { read, write } from '../database/store.js';

/**
 * Capa de acceso a datos de productos.
 * Es la unica capa que conoce como se almacenan los datos.
 */
export const productRepository = {
  async findAll() {
    const db = await read();
    return db.products;
  },

  async findById(id) {
    const db = await read();
    return db.products.find((product) => product.id === id) ?? null;
  },

  create(product) {
    return write((db) => {
      db.products.unshift(product);
      return product;
    });
  },

  update(id, changes) {
    return write((db) => {
      const index = db.products.findIndex((product) => product.id === id);
      if (index === -1) return null;

      db.products[index] = { ...db.products[index], ...changes, id };
      return db.products[index];
    });
  },

  remove(id) {
    return write((db) => {
      const index = db.products.findIndex((product) => product.id === id);
      if (index === -1) return false;

      db.products.splice(index, 1);
      return true;
    });
  },
};
