import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/policy', (_req, res) => {
  res.json({ ok: true, policy: 'Pendiente (se implementa después)' });
});

router.post('/', requireAuth, (_req, res) => {
  res.status(501).json({ ok: false, error: 'Chat no implementado aún' });
});

export default router;
