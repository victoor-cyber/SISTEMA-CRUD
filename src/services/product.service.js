import { applyProductChanges, buildProduct } from '../models/product.model.js';
import { productRepository } from '../repositories/product.repository.js';
import { AppError } from '../utils/AppError.js';

const SORTABLE_FIELDS = ['nombre', 'precio', 'stock', 'createdAt', 'updatedAt'];

/**
 * Reglas de negocio del catalogo de productos.
 * No conoce Express ni el mecanismo de persistencia.
 */
export const productService = {
  async list(query = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const { search, categoria, activo, sort = 'createdAt', order = 'desc' } = query;

    let items = [...(await productRepository.findAll())];

    if (search) {
      const term = String(search).toLowerCase();
      items = items.filter(
        (product) =>
          product.nombre.toLowerCase().includes(term) ||
          (product.descripcion ?? '').toLowerCase().includes(term),
      );
    }

    if (categoria) {
      const term = String(categoria).toLowerCase();
      items = items.filter(
        (product) => (product.categoria ?? '').toLowerCase() === term,
      );
    }

    if (activo !== undefined) {
      const value = activo === true || activo === 'true';
      items = items.filter((product) => product.activo === value);
    }

    if (SORTABLE_FIELDS.includes(sort)) {
      items.sort((a, b) => {
        const valueA = a[sort];
        const valueB = b[sort];

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return order === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        return order === 'asc' ? valueA - valueB : valueB - valueA;
      });
    }

    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError(404, `No existe un producto con el id ${id}`);
    }
    return product;
  },

  async create(payload) {
    const product = buildProduct(payload);
    return productRepository.create(product);
  },

  async update(id, payload) {
    const current = await this.getById(id);
    const updated = applyProductChanges(current, payload);
    return productRepository.update(id, updated);
  },

  async remove(id) {
    await this.getById(id);
    await productRepository.remove(id);
  },
};
