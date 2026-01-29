// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

export function signToken(payload) {
  const secret = process.env.JWT_SECRET || "DEV_SECRET";
  const expiresIn = process.env.JWT_EXPIRES_IN || "8h";
  return jwt.sign(payload, secret, { expiresIn });
}

export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ ok: false, error: "No autenticado" });
    }

    const secret = process.env.JWT_SECRET || "DEV_SECRET";
    const decoded = jwt.verify(token, secret);

    // ✅ Normalizamos para que tu código use req.user.id
    req.user = {
      ...decoded,
      id: decoded.id ?? decoded.sub, // <-- clave
    };

    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Token inválido o expirado" });
  }
}

export function requireRoles(...rolesPermitidos) {
  const allowed = new Set(rolesPermitidos);

  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ ok: false, error: "No autenticado" });
    }

    const roles = Array.isArray(user.roles) ? user.roles : [];
    const hasRole = roles.some((r) => allowed.has(r));

    if (!hasRole) {
      return res.status(403).json({ ok: false, error: "No autorizado" });
    }

    return next();
  };
}
