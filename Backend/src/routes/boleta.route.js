import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', requireAuth, (_req, res) => {
  res.status(501).json({ ok: false, error: 'Boleta no implementada aún' });
});

export default router;
