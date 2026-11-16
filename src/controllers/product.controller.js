import { asyncHandler } from '../utils/asyncHandler.js';
import { productService } from '../services/product.service.js';

/** Capa HTTP: traduce peticiones en llamadas al servicio y respuestas JSON. */
export const productController = {
  list: asyncHandler(async (req, res) => {
    const { data, meta } = await productService.list(req.query);
    res.status(200).json({ data, meta });
  }),

  getById: asyncHandler(async (req, res) => {
    const product = await productService.getById(req.params.id);
    res.status(200).json({ data: product });
  }),

  create: asyncHandler(async (req, res) => {
    const product = await productService.create(req.body);
    res
      .status(201)
      .location(`/api/productos/${product.id}`)
      .json({ message: 'Producto creado correctamente', data: product });
  }),

  update: asyncHandler(async (req, res) => {
    const product = await productService.update(req.params.id, req.body);
    res
      .status(200)
      .json({ message: 'Producto actualizado correctamente', data: product });
  }),

  remove: asyncHandler(async (req, res) => {
    await productService.remove(req.params.id);
    res.status(204).send();
  }),
};
