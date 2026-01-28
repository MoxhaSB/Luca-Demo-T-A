import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/sobre', requireAuth, (_req, res) => {
  res.status(501).json({ ok: false, error: 'Generar sobre no implementado aún' });
});

router.post('/enviar', requireAuth, (_req, res) => {
  res.status(501).json({ ok: false, error: 'Enviar al SII no implementado aún' });
});

export default router;
