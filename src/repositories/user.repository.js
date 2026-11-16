import { read, write } from '../database/store.js';

/** Capa de acceso a datos de usuarios. */
export const userRepository = {
  async findByEmail(email) {
    const db = await read();
    const normalized = String(email ?? '').toLowerCase();
    return db.users.find((user) => user.email === normalized) ?? null;
  },

  async findById(id) {
    const db = await read();
    return db.users.find((user) => user.id === id) ?? null;
  },

  create(user) {
    return write((db) => {
      db.users.push(user);
      return user;
    });
  },
};
