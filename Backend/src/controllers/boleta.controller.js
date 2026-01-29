// src/controllers/boleta.controller.js
import {
  emitirBoletaDemo,
  listarBoletas,
  obtenerBoleta,
} from "../services/boleta.service.js";

function getUserId(req) {
  // Tu JWT viene con sub (según tu signToken y middleware requireAuth)
  return req.user?.id ?? req.user?.sub ?? req.user?.userId ?? null;
}

export async function emitirBoletaController(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ ok: false, error: "No autenticado" });

    const payload = req.body;

    const result = await emitirBoletaDemo({ userId, payload });
    if (!result.ok) {
      return res
        .status(result.status || 500)
        .json({ ok: false, error: result.error, details: result.details });
    }

    return res.status(200).json({ ok: true, boleta: result.data });
  } catch (err) {
    next(err);
  }
}

export async function listarBoletasController(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ ok: false, error: "No autenticado" });

    const data = await listarBoletas(userId);
    return res.json({ ok: true, boletas: data });
  } catch (err) {
    next(err);
  }
}

export async function obtenerBoletaController(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ ok: false, error: "No autenticado" });

    const { id } = req.params;

    const row = await obtenerBoleta(userId, id);
    if (!row) return res.status(404).json({ ok: false, error: "Boleta no encontrada" });

    return res.json({ ok: true, boleta: row });
  } catch (err) {
    next(err);
  }
}
