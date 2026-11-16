import { asyncHandler } from '../utils/asyncHandler.js';
import { authService } from '../services/auth.service.js';

/** Capa HTTP del modulo de autenticacion. */
export const authController = {
  login: asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    res.status(200).json({ message: 'Inicio de sesion exitoso', data });
  }),

  profile: asyncHandler(async (req, res) => {
    const data = await authService.profile(req.user.id);
    res.status(200).json({ data });
  }),
};
