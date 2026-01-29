// src/controllers/dte.demo.controller.js
import { generarDteDemo, listarDtes, obtenerDte } from "../services/dte.demo.service.js";

export async function generarDteDemoController(req, res, next) {
  try {
    const userId = req.user?.id;
    const payload = req.body;

    const result = await generarDteDemo({ userId, payload });
    if (!result.ok) return res.status(result.status || 500).json({ ok: false, error: result.error });

    res.json({ ok: true, ...result.data });
  } catch (err) {
    next(err);
  }
}

export async function listarDtesController(req, res, next) {
  try {
    const userId = req.user?.id;
    const data = await listarDtes(userId);
    res.json({ ok: true, dtes: data });
  } catch (err) {
    next(err);
  }
}

export async function obtenerDteController(req, res, next) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const row = await obtenerDte(userId, id);
    if (!row) return res.status(404).json({ ok: false, error: "DTE no encontrado" });

    res.json({ ok: true, dte: row });
  } catch (err) {
    next(err);
  }
}
