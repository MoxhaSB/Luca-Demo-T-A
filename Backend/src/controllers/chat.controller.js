// src/controllers/chat.controller.js
import { enviarMensajeChat, obtenerChatsDeUsuario, obtenerMensajesChat } from '../services/chat.service.js';

export async function postChatController(req, res) {
  const userId = req.user?.sub;
  const { chatId, mensaje } = req.body || {};

  const result = await enviarMensajeChat({ userId, chatId, mensaje });
  if (!result.ok) return res.status(result.status || 500).json({ ok: false, error: result.error });

  return res.json({ ok: true, ...result.data });
}

export async function getChatIdsController(req, res) {
  const userId = req.user?.sub;
  const data = await obtenerChatsDeUsuario(userId);
  return res.json({ ok: true, data });
}

export async function getChatMensajesController(req, res) {
  const userId = req.user?.sub;
  const { chatId } = req.params;

  const messages = await obtenerMensajesChat(userId, chatId);
  if (!messages) return res.status(404).json({ ok: false, error: 'Chat no encontrado' });

  return res.json({ ok: true, data: messages });
}
