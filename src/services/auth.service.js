import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/AppError.js';

const toPublicUser = (user) => ({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  rol: user.rol,
});

/** Reglas de negocio de autenticacion. */
export const authService = {
  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    // Mismo mensaje para usuario inexistente y contrasena incorrecta (evita enumeracion).
    if (!user || !passwordMatches) {
      throw new AppError(401, 'Credenciales invalidas');
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn },
    );

    const { exp, iat } = jwt.decode(token);

    return {
      token,
      tokenType: 'Bearer',
      expiresIn: exp - iat,
      user: toPublicUser(user),
    };
  },

  async profile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(401, 'El usuario asociado al token ya no existe');
    }

    return {
      ...toPublicUser(user),
      createdAt: user.createdAt,
    };
  },
};
