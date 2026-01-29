import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, (_req, res) => {
  res.json({ ok: true, data: [] });
});

export default router;
