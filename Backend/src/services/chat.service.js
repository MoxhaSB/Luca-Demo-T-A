// src/services/chat.service.js
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "../storage/json.storage.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const CHATS_FILE = "chats.json";

function nowIso() {
  return new Date().toISOString();
}

function buildSystemPrompt() {
  return `
Eres "SoyLuca", asistente contable chileno para una DEMO.
Alcance: Boleta de Honorarios, Factura Electrónica, DTE/Sobre, y dudas operativas del sistema.

Reglas:
- No pidas ni aceptes contraseñas reales del SII ni claves privadas/certificados.
- Si el usuario pide API keys, credenciales SII, contraseñas, certificados (.pfx), o cómo obtenerlos/extraerlos: rechaza y ofrece alternativas seguras (ej: “usa tu propio certificado y no lo compartas”).
- No inventes requisitos legales: si falta info, pide campos específicos.
- Si está fuera de alcance, dilo y redirige.

Formato:
- Responde en bullets.
- Luego: "Campos mínimos para continuar:" con lista.
- Si falta info: pregunta solo 1-3 cosas, no más.
`.trim();
}

async function loadDocsContext() {
  const docsDirName = process.env.CHAT_DOCS_DIR || "docs";
  const maxChars = Number(process.env.CHAT_MAX_DOC_CHARS || 12000);
  const maxPdfPages = Number(process.env.CHAT_MAX_PDF_PAGES || 10);

  const docsDir = path.resolve(process.cwd(), docsDirName);

  async function readPdfAsText(fullPath) {
    const buffer = await fs.readFile(fullPath);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;

    const pages = Math.min(pdf.numPages, maxPdfPages);
    let text = "";

    for (let pageNum = 1; pageNum <= pages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const pageText = (content.items || [])
        .map((it) => (it && typeof it.str === "string" ? it.str : ""))
        .filter(Boolean)
        .join(" ");

      text += `\n${pageText}\n`;

      if (text.length >= maxChars) break;
    }

    return text.trim();
  }

  async function readFileAsText(fullPath, filename) {
    const ext = path.extname(filename).toLowerCase();

    if (ext === ".txt" || ext === ".md" || ext === ".json") {
      return await fs.readFile(fullPath, "utf8");
    }

    if (ext === ".pdf") {
      return await readPdfAsText(fullPath);
    }

    return "";
  }

  try {
    const entries = await fs.readdir(docsDir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => /\.(txt|md|json|pdf)$/i.test(name));

    let combined = "";
    const used = [];

    for (const f of files) {
      const p = path.join(docsDir, f);

      let content = "";
      try {
        content = await readFileAsText(p, f);
      } catch (err) {
        console.warn(`[DOCS] No se pudo leer ${f}:`, err?.message || err);
        continue;
      }

      if (content && content.trim()) {
        used.push(f);

        const normalized = content
          .replace(/\s+\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n");

        combined += `\n\n=== ${f} ===\n${normalized}\n`;

        if (combined.length >= maxChars) break;
      }
    }

    return { context: combined.slice(0, maxChars), sources: used };
  } catch {
    return { context: "", sources: [] };
  }
}

function clampHistory(messages, max) {
  if (!Array.isArray(messages)) return [];
  if (messages.length <= max) return messages;
  return messages.slice(messages.length - max);
}

function extractTextFromResponsesAPI(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  let out = "";

  const items = Array.isArray(data?.output) ? data.output : [];
  for (const item of items) {
    const content = Array.isArray(item?.content) ? item.content : [];

    for (const part of content) {
      if (part?.type === "output_text" && typeof part?.text === "string") out += part.text;
      if (part?.type === "text" && typeof part?.text === "string") out += part.text;
    }

    if (!content.length && typeof item?.text === "string") out += item.text;
  }

  return out.trim();
}

async function callOpenAI({ mensaje, contextoDocs, historial }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    return { ok: false, status: 500, error: "OPENAI_API_KEY no configurada en .env" };
  }

  const system = buildSystemPrompt();
  const historyBlock = (historial || [])
    .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
    .join("\n");

  const docsBlock = contextoDocs ? `\n\n[Contexto de documentación]\n${contextoDocs}\n` : "";

  const input = `
${system}
${docsBlock}

[Historial]
${historyBlock || "(sin historial)"}

[Consulta actual]
Usuario: ${mensaje}
`.trim();

  const resp = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input }),
  });

  const dataText = await resp.text();
  let data = null;
  try {
    data = JSON.parse(dataText);
  } catch {}

  if (!resp.ok) {
    return {
      ok: false,
      status: resp.status,
      error: data?.error?.message || `OpenAI error (${resp.status})`,
    };
  }

  const texto = extractTextFromResponsesAPI(data);

  if (!texto) {
    console.log(
      "[OpenAI] Respuesta sin texto. output types:",
      (data?.output || []).map((x) => x?.type)
    );
    return { ok: false, status: 502, error: "OpenAI respondió sin texto." };
  }

  return { ok: true, texto, raw: data };
}

export async function enviarMensajeChat({ userId, chatId, mensaje }) {
  if (!mensaje || !String(mensaje).trim()) {
    return { ok: false, status: 400, error: "Mensaje requerido" };
  }

  const chats = await readJson(CHATS_FILE, []);
  let chat = null;

  if (chatId) {
    chat = chats.find((c) => c.id === chatId && String(c.userId) === String(userId));
    if (!chat) return { ok: false, status: 404, error: "Chat no encontrado" };
  } else {
    chat = { id: randomUUID(), userId, createdAt: nowIso(), messages: [] };
    chats.push(chat);
  }

  chat.messages.push({ role: "user", content: String(mensaje), at: nowIso() });

  const maxHistory = Number(process.env.CHAT_MAX_HISTORY || 12);
  const historial = clampHistory(chat.messages, maxHistory);

  const { context, sources } = await loadDocsContext();
  const ai = await callOpenAI({ mensaje: String(mensaje), contextoDocs: context, historial });

  if (!ai.ok) return { ok: false, status: ai.status || 502, error: ai.error };

  chat.messages.push({ role: "assistant", content: ai.texto, at: nowIso() });

  await writeJson(CHATS_FILE, chats);

  return { ok: true, data: { chatId: chat.id, reply: ai.texto, sources } };
}

export async function obtenerChatsDeUsuario(userId) {
  const chats = await readJson(CHATS_FILE, []);
  return chats
    .filter((c) => String(c.userId) === String(userId))
    .map((c) => ({ id: c.id, createdAt: c.createdAt }));
}

export async function obtenerMensajesChat(userId, chatId) {
  const chats = await readJson(CHATS_FILE, []);
  const chat = chats.find((c) => c.id === chatId && String(c.userId) === String(userId));
  return chat ? chat.messages || [] : null;
}
