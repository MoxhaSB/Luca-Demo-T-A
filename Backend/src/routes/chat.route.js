// src/routes/chat.route.js
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { postChatController, getChatIdsController, getChatMensajesController } from '../controllers/chat.controller.js';

const router = Router();

router.get('/ids', requireAuth, getChatIdsController);
router.get('/:chatId', requireAuth, getChatMensajesController);
router.post('/', requireAuth, postChatController);

export default router;

