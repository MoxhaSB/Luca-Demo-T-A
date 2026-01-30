import { demoCreate, demoGetById, demoList, demoUpdateById } from "../storage/demo.storage.js";
import { randomUUID } from "crypto";

const FILE = "sobres.json";

function safeJsonParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function fakeSobreXml({ caratula, dteXml }) {
  const id = `ENVIO_DEMO_${Date.now()}`;
  const rutEmisor = caratula?.rutEmisor || "11111111-1";
  const rutRecep = caratula?.rutReceptor || rutEmisor;
  const ambiente = caratula?.ambiente || "CERTIFICACION";

  // XML DEMO (no válido SII, es para UI)
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<EnvioDTE version="1.0">
  <SetDTE ID="${id}">
    <Caratula version="1.0">
      <RutEmisor>${rutEmisor}</RutEmisor>
      <RutReceptor>${rutRecep}</RutReceptor>
      <RutEnvia>${caratula?.rutEnvia || rutEmisor}</RutEnvia>
      <FchResol>${caratula?.fechaResolucion || "2026-01-01"}</FchResol>
      <NroResol>${caratula?.numeroResolucion || "0"}</NroResol>
      <TmstFirmaEnv>${new Date().toISOString()}</TmstFirmaEnv>
      <Ambiente>${ambiente}</Ambiente>
    </Caratula>

    <DTEs>
      <![CDATA[
${dteXml}
      ]]>
    </DTEs>
  </SetDTE>
</EnvioDTE>`;
}

function requireInput(inputJson) {
  const obj = safeJsonParse(inputJson);
  if (!obj) return { ok: false, status: 400, error: "input debe ser JSON string válido" };
  return { ok: true, data: obj };
}

function pickPfx(files) {
  // En demo, el front “obliga” archivo: aceptamos cualquier cosa.
  // Si quieres endurecer: validar mimetype/extension .pfx
  const first = files?.[0];
  return first ? { name: first.originalname || "cert.pfx", size: first.size || first.buffer?.length || 0 } : null;
}

/**
 * input esperado (JSON):
 * {
 *   "dteXml": "<xml...>",
 *   "caratula": {
 *      "rutEmisor": "...",
 *      "rutReceptor": "...",
 *      "rutEnvia": "...",
 *      "fechaResolucion": "YYYY-MM-DD",
 *      "numeroResolucion": "123",
 *      "ambiente": "CERTIFICACION" | "PRODUCCION"
 *   },
 *   "cert": { "rutCertificado": "...", "password": "..." } // opcional
 * }
 */
export async function generarSobreDemo({ userId, inputJson, files }) {
  if (!userId) return { ok: false, status: 401, error: "No autenticado" };
  if (!inputJson) return { ok: false, status: 400, error: "Falta campo input (JSON string)" };

  const parsed = requireInput(inputJson);
  if (!parsed.ok) return parsed;

  const payload = parsed.data;

  const dteXml = payload?.dteXml;
  if (!dteXml || typeof dteXml !== "string") {
    return { ok: false, status: 400, error: "dteXml requerido (string)" };
  }

  const caratula = payload?.caratula || {};
  if (!caratula?.rutEmisor) return { ok: false, status: 400, error: "caratula.rutEmisor requerido" };
  if (!caratula?.rutReceptor) return { ok: false, status: 400, error: "caratula.rutReceptor requerido" };
  if (!caratula?.fechaResolucion) return { ok: false, status: 400, error: "caratula.fechaResolucion requerido" };
  if (!caratula?.numeroResolucion) return { ok: false, status: 400, error: "caratula.numeroResolucion requerido" };

  const certFileInfo = pickPfx(files);
  if (!certFileInfo) {
    // si tu UI obliga certificado, esto ayuda a detectar cuando no lo mandaron
    return { ok: false, status: 400, error: "Debe adjuntar certificado (demo)" };
  }

  const sobreXml = fakeSobreXml({ caratula, dteXml });

  const row = await demoCreate(FILE, {
    userId: String(userId),
    tipo: "SOBRE",
    estado: "GENERADO_DEMO",
    sobreId: randomUUID(),
    caratula,
    cert: {
      rutCertificado: payload?.cert?.rutCertificado || null,
      hasPassword: Boolean(payload?.cert?.password),
      file: certFileInfo,
    },
    dteXml,
    sobreXml,
    raw: payload,
    deletedAt: null,
  });

  return {
    ok: true,
    data: {
      id: row.id,
      estado: row.estado,
      sobreXml: row.sobreXml,
      caratula: row.caratula,
    },
  };
}

/**
 * input esperado:
 * {
 *   "sobreXml": "<EnvioDTE...>",
 *   "ambiente": "CERTIFICACION" | "PRODUCCION",
 *   "cert": { "rutCertificado": "...", "password": "..." } // opcional
 * }
 */
export async function enviarSobreDemo({ userId, inputJson, files }) {
  if (!userId) return { ok: false, status: 401, error: "No autenticado" };
  if (!inputJson) return { ok: false, status: 400, error: "Falta campo input (JSON string)" };

  const parsed = requireInput(inputJson);
  if (!parsed.ok) return parsed;

  const payload = parsed.data;

  // 👇 NUEVO: si viene sobreId, buscamos el sobre generado
  const sobreId = payload?.sobreId;
  let sobreXml = payload?.sobreXml;

  if (sobreId) {
    const existing = await demoGetById(FILE, sobreId);
    if (!existing || String(existing.userId) !== String(userId)) {
      return { ok: false, status: 404, error: "Sobre no encontrado (genéralo primero)" };
    }
    sobreXml = existing.sobreXml;
  }

  if (!sobreXml || typeof sobreXml !== "string") {
    return { ok: false, status: 400, error: "Debe enviar sobreId o sobreXml" };
  }

  const certFileInfo = pickPfx(files);
  if (!certFileInfo) {
    return { ok: false, status: 400, error: "Debe adjuntar certificado (demo)" };
  }

  const trackId = String(Math.floor(Math.random() * 9000000 + 1000000));

  const row = await demoCreate(FILE, {
    userId: String(userId),
    tipo: "SOBRE_ENVIO",
    estado: "ENVIADO_DEMO",
    trackId,
    ambiente: payload?.ambiente || "CERTIFICACION",
    cert: {
      rutCertificado: payload?.cert?.rutCertificado || null,
      hasPassword: Boolean(payload?.cert?.password),
      file: certFileInfo,
    },
    sobreXml,
    raw: payload,
    deletedAt: null,
  });

  return {
    ok: true,
    data: { id: row.id, estado: row.estado, trackId, ambiente: row.ambiente },
  };
}


export async function listarSobres(userId) {
  const rows = await demoList(FILE, (x) => String(x.userId) === String(userId) && x.deletedAt == null);
  return rows.map(({ id, createdAt, tipo, estado, trackId, ambiente }) => ({
    id, createdAt, tipo, estado, trackId: trackId || null, ambiente: ambiente || null
  }));
}

export async function obtenerSobre(userId, id) {
  const row = await demoGetById(FILE, id);
  if (!row || String(row.userId) !== String(userId) || row.deletedAt != null) return null;
  return row;
}
