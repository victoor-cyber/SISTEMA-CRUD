import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createProductRules,
  listProductsRules,
  productIdRule,
  updateProductRules,
} from '../validators/product.validator.js';

const router = Router();

// Publicas
router.get('/', listProductsRules, validate, productController.list);
router.get('/:id', productIdRule, validate, productController.getById);

// Protegidas con JWT
router.post('/', requireAuth, createProductRules, validate, productController.create);
router.put('/:id', requireAuth, productIdRule, updateProductRules, validate, productController.update);
router.delete('/:id', requireAuth, productIdRule, validate, productController.remove);

export default router;
