// src/middlewares/error.middleware.js
export function errorMiddleware(err, _req, res, _next) {
  console.error('[ERROR]', err);

  // Si ya se enviaron headers, no podemos responder
  if (res.headersSent) return;

  res.status(500).json({
    ok: false,
    error: 'Error interno',
  });
}
