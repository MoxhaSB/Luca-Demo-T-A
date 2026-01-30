import {
  crearProveedor,
  listarProveedores,
  obtenerProveedor,
  actualizarProveedor,
  eliminarProveedor,
} from "../services/proveedor.service.js";

function getUserId(req) {
  return String(req.user?.sub || req.user?.id || "");
}

export async function crearProveedorController(req, res, next) {
  try {
    const userId = getUserId(req);
    const payload = req.body;

    const result = await crearProveedor({ userId, payload });
    if (!result.ok) {
      return res
        .status(result.status || 500)
        .json({ ok: false, error: result.error, details: result.details });
    }

    return res.status(201).json({ ok: true, proveedor: result.data });
  } catch (err) {
    next(err);
  }
}

export async function listarProveedoresController(req, res, next) {
  try {
    const userId = getUserId(req);
    const data = await listarProveedores(userId);
    return res.json({ ok: true, proveedores: data });
  } catch (err) {
    next(err);
  }
}

export async function obtenerProveedorController(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const row = await obtenerProveedor(userId, id);
    if (!row) return res.status(404).json({ ok: false, error: "Proveedor no encontrado" });

    return res.json({ ok: true, proveedor: row });
  } catch (err) {
    next(err);
  }
}

export async function actualizarProveedorController(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const payload = req.body;

    const result = await actualizarProveedor({ userId, id, payload });
    if (!result.ok) {
      return res
        .status(result.status || 500)
        .json({ ok: false, error: result.error, details: result.details });
    }

    return res.json({ ok: true, proveedor: result.data });
  } catch (err) {
    next(err);
  }
}

export async function eliminarProveedorController(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const result = await eliminarProveedor({ userId, id });
    if (!result.ok) {
      return res
        .status(result.status || 500)
        .json({ ok: false, error: result.error, details: result.details });
    }

    return res.json({ ok: true, deleted: true, proveedor: result.data });
  } catch (err) {
    next(err);
  }
}
