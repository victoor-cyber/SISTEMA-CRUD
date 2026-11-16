/**
 * Envuelve un controlador async para que cualquier error rechazado
 * llegue al middleware de errores de Express.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
