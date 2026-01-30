import {
  crearCliente,
  listarClientes,
  obtenerCliente,
  actualizarCliente,
  eliminarCliente,
} from "../services/cliente.service.js";

function getUserId(req) {
  return String(req.user?.sub || req.user?.id || "");
}

export async function crearClienteController(req, res, next) {
  try {
    const userId = getUserId(req);
    const payload = req.body;

    const result = await crearCliente({ userId, payload });
    if (!result.ok) {
      return res
        .status(result.status || 500)
        .json({ ok: false, error: result.error, details: result.details });
    }

    return res.status(201).json({ ok: true, cliente: result.data });
  } catch (err) {
    next(err);
  }
}

export async function listarClientesController(req, res, next) {
  try {
    const userId = getUserId(req);
    const data = await listarClientes(userId);
    return res.json({ ok: true, clientes: data });
  } catch (err) {
    next(err);
  }
}

export async function obtenerClienteController(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const row = await obtenerCliente(userId, id);
    if (!row) return res.status(404).json({ ok: false, error: "Cliente no encontrado" });

    return res.json({ ok: true, cliente: row });
  } catch (err) {
    next(err);
  }
}

export async function actualizarClienteController(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const payload = req.body;

    const result = await actualizarCliente({ userId, id, payload });
    if (!result.ok) {
      return res
        .status(result.status || 500)
        .json({ ok: false, error: result.error, details: result.details });
    }

    return res.json({ ok: true, cliente: result.data });
  } catch (err) {
    next(err);
  }
}

export async function eliminarClienteController(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const result = await eliminarCliente({ userId, id });
    if (!result.ok) {
      return res
        .status(result.status || 500)
        .json({ ok: false, error: result.error, details: result.details });
    }

    return res.json({ ok: true, deleted: true, cliente: result.data });
  } catch (err) {
    next(err);
  }
}
