// src/controllers/factura.controller.js
import {
  emitirFacturaDemo,
  listarFacturas,
  obtenerFactura,
} from "../services/factura.service.js";

export async function emitirFacturaController(req, res, next) {
  try {
    // Tu JWT middleware deja req.user = payload
    // En tu signToken dices que el id viene en "sub"
    // Pero tú a veces usas req.user.id -> normalizamos:
    const userId = req.user?.id || req.user?.sub;

    const payload = req.body;

    const result = await emitirFacturaDemo({ userId, payload });
    if (!result.ok) {
      return res
        .status(result.status || 500)
        .json({ ok: false, error: result.error, details: result.details });
    }

    return res.status(200).json({ ok: true, factura: result.data });
  } catch (err) {
    next(err);
  }
}

export async function listarFacturasController(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.sub;
    const data = await listarFacturas(userId);
    return res.json({ ok: true, facturas: data });
  } catch (err) {
    next(err);
  }
}

export async function obtenerFacturaController(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.sub;
    const { id } = req.params;

    const row = await obtenerFactura(userId, id);
    if (!row) return res.status(404).json({ ok: false, error: "Factura no encontrada" });

    return res.json({ ok: true, factura: row });
  } catch (err) {
    next(err);
  }
}
