import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginRules } from '../validators/auth.validator.js';

const router = Router();

// Publica
router.post('/login', loginRules, validate, authController.login);

// Protegida (util para comprobar que el token sigue siendo valido)
router.get('/me', requireAuth, authController.profile);

export default router;
