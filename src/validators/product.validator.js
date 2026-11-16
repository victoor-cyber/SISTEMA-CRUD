import { body, param, query } from 'express-validator';
import { PRODUCT_FIELDS } from '../models/product.model.js';

const nombreRule = body('nombre')
  .exists()
  .withMessage('El nombre es obligatorio')
  .bail()
  .isString()
  .withMessage('El nombre debe ser texto')
  .bail()
  .trim()
  .isLength({ min: 3, max: 100 })
  .withMessage('El nombre debe tener entre 3 y 100 caracteres');

const precioRule = body('precio')
  .exists()
  .withMessage('El precio es obligatorio')
  .bail()
  .isFloat({ gt: 0 })
  .withMessage('El precio debe ser un numero mayor que 0')
  .toFloat();

const descripcionRule = body('descripcion')
  .optional({ values: 'null' })
  .isString()
  .withMessage('La descripcion debe ser texto')
  .isLength({ max: 500 })
  .withMessage('La descripcion no puede superar los 500 caracteres')
  .trim();

const stockRule = body('stock')
  .optional({ values: 'null' })
  .isInt({ min: 0 })
  .withMessage('El stock debe ser un entero mayor o igual a 0')
  .toInt();

const categoriaRule = body('categoria')
  .optional({ values: 'null' })
  .isString()
  .withMessage('La categoria debe ser texto')
  .isLength({ min: 2, max: 60 })
  .withMessage('La categoria debe tener entre 2 y 60 caracteres')
  .trim();

const activoRule = body('activo')
  .optional({ values: 'null' })
  .isBoolean()
  .withMessage('El campo activo debe ser true o false')
  .toBoolean();

const alMenosUnCampoRule = body().custom((payload) => {
  const provided = PRODUCT_FIELDS.filter(
    (field) => payload?.[field] !== undefined,
  );

  if (provided.length === 0) {
    throw new Error(
      `Debes enviar al menos uno de estos campos: ${PRODUCT_FIELDS.join(', ')}`,
    );
  }

  return true;
});

/** Reglas para crear un producto (POST). */
export const createProductRules = [
  nombreRule,
  precioRule,
  descripcionRule,
  stockRule,
  categoriaRule,
  activoRule,
];

/** Reglas para actualizar un producto (PUT). */
export const updateProductRules = [
  body('nombre').optional({ values: 'null' }).isString().withMessage('El nombre debe ser texto').bail().trim().isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  body('precio').optional({ values: 'null' }).isFloat({ gt: 0 }).withMessage('El precio debe ser un numero mayor que 0').toFloat(),
  descripcionRule,
  stockRule,
  categoriaRule,
  activoRule,
  alMenosUnCampoRule,
];

/** Valida que el :id de la ruta sea un UUID. */
export const productIdRule = [
  param('id').isUUID().withMessage('El id debe ser un UUID valido'),
];

/** Valida los filtros y la paginacion del listado. */
export const listProductsRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page debe ser un entero mayor o igual a 1')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit debe ser un entero entre 1 y 100')
    .toInt(),
  query('activo')
    .optional()
    .isIn(['true', 'false'])
    .withMessage("activo debe ser 'true' o 'false'"),
  query('sort')
    .optional()
    .isIn(['nombre', 'precio', 'stock', 'createdAt', 'updatedAt'])
    .withMessage('sort no es un campo ordenable'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage("order debe ser 'asc' o 'desc'"),
  query('search')
    .optional()
    .isString()
    .withMessage('search debe ser texto')
    .trim(),
  query('categoria')
    .optional()
    .isString()
    .withMessage('categoria debe ser texto')
    .trim(),
];
