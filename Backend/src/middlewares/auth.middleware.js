// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

/**
 * Genera un JWT para el usuario autenticado.
 * payload mínimo: { sub: "<id>", usuario: "<email/username>", roles: ["USER"] }
 */
export function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'DEV_SECRET';
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Middleware: requiere JWT válido.
 * Espera: Authorization: Bearer <token>
 * Adjunta: req.user = payload del token
 */
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');

    if (!token) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    const secret = process.env.JWT_SECRET || 'DEV_SECRET';
    const decoded = jwt.verify(token, secret);

    // Normalizamos: req.user
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware: requiere al menos uno de los roles especificados.
 * Uso: app.get('/algo', requireAuth, requireRoles('ADMIN'), ...)
 */
export function requireRoles(...rolesPermitidos) {
  const allowed = new Set(rolesPermitidos);

  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    const roles = Array.isArray(user.roles) ? user.roles : [];
    const hasRole = roles.some(r => allowed.has(r));

    if (!hasRole) {
      return res.status(403).json({ ok: false, error: 'No autorizado' });
    }

    return next();
  };
}
