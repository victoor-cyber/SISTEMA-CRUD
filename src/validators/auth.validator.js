import { body } from 'express-validator';

/** Reglas del inicio de sesion. */
export const loginRules = [
  body('email')
    .exists()
    .withMessage('El email es obligatorio')
    .bail()
    .isEmail()
    .withMessage('El email no es valido')
    .normalizeEmail(),

  body('password')
    .exists()
    .withMessage('La contrasena es obligatoria')
    .bail()
    .isString()
    .withMessage('La contrasena debe ser texto')
    .bail()
    .isLength({ min: 6 })
    .withMessage('La contrasena debe tener al menos 6 caracteres'),
];
