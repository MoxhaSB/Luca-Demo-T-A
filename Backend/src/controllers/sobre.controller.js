import {
  generarSobreDemo,
  enviarSobreDemo,
  listarSobres,
  obtenerSobre,
} from "../services/sobre.service.js";

function getUserId(req) {
  return String(req.user?.sub || req.user?.id || "");
}

export async function generarSobreController(req, res, next) {
  try {
    const userId = getUserId(req);

    // input viene como string JSON en multipart
    const input = req.body?.input;
    const files = Array.isArray(req.files) ? req.files : [];

    const result = await generarSobreDemo({ userId, inputJson: input, files });
    if (!result.ok) {
      return res
        .status(result.status || 500)
        .json({ ok: false, error: result.error, details: result.details });
    }

    return res.status(200).json({ ok: true, ...result.data });
  } catch (err) {
    next(err);
  }
}

export async function enviarSobreController(req, res, next) {
  try {
    const userId = getUserId(req);

    const input = req.body?.input;
    const files = Array.isArray(req.files) ? req.files : [];

    const result = await enviarSobreDemo({ userId, inputJson: input, files });
    if (!result.ok) {
      return res
        .status(result.status || 500)
        .json({ ok: false, error: result.error, details: result.details });
    }

    return res.status(200).json({ ok: true, ...result.data });
  } catch (err) {
    next(err);
  }
}

export async function listarSobresController(req, res, next) {
  try {
    const userId = getUserId(req);
    const data = await listarSobres(userId);
    return res.json({ ok: true, sobres: data });
  } catch (err) {
    next(err);
  }
}

export async function obtenerSobreController(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const row = await obtenerSobre(userId, id);
    if (!row) return res.status(404).json({ ok: false, error: "Sobre no encontrado" });

    return res.json({ ok: true, sobre: row });
  } catch (err) {
    next(err);
  }
}
