// src/controllers/usuario.controller.js
import { signToken } from '../middlewares/auth.middleware.js';
import { loginUsuario } from '../services/usuario.service.js';

export async function loginController(req, res) {
  // Aceptamos distintas llaves para comodidad del front
  const { usuario, username, email, password } = req.body || {};
  const login = usuario || username || email;

  const result = await loginUsuario({ login, password });

  if (!result.ok) {
    return res.status(result.status || 500).json({ ok: false, error: result.error || 'Error' });
  }

  const { id, usuario: usuarioDb, roles, esPrimeraVez } = result.data;

  const token = signToken({
    sub: String(id),
    usuario: usuarioDb,
    roles,
  });

  return res.json({
    ok: true,
    token,
    user: {
      id,
      usuario: usuarioDb,
      roles,
      es_primera_vez: esPrimeraVez,
    },
  });
}

export async function meController(req, res) {
  // requireAuth ya setea req.user
  return res.json({ ok: true, user: req.user });
}
