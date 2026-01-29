// src/middlewares/safe-mode.middleware.js
export function safeModeGuard(req, res, next) {
  const env = (process.env.SIMPLEAPI_ENV || 'certificacion').toLowerCase();
  const allowSend = String(process.env.ALLOW_SII_SEND || 'false').toLowerCase() === 'true';

  // 1) Bloquea producción por defecto
  if (env === 'produccion') {
    return res.status(403).json({
      ok: false,
      error: 'Bloqueado: SIMPLEAPI_ENV=produccion. Usa certificacion para pruebas.',
    });
  }

  // 2) Bloquea endpoints de envío al SII por flag
  // (ajusta paths si tus rutas se llaman distinto)
  const path = req.path.toLowerCase();
  const isSendEndpoint =
    path.includes('enviar') ||
    path.includes('send') ||
    path.includes('sobre') ||
    path.includes('envio');

  if (isSendEndpoint && !allowSend) {
    return res.status(403).json({
      ok: false,
      error: 'Bloqueado: Envío al SII deshabilitado (ALLOW_SII_SEND=false).',
    });
  }

  next();
}
