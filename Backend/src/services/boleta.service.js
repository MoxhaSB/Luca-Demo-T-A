// src/services/boleta.service.js
import { demoCreate, demoGetById, demoList } from "../storage/demo.storage.js";

const FILE = "boletas.json";

// --- Helpers ---
function normalizeRut(rut) {
  if (!rut) return "";
  return String(rut).replace(/\./g, "").replace(/\s+/g, "").toUpperCase().trim();
}

function toNumber(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function fakePdfBase64() {
  // demo: NO es PDF real, solo placeholder
  return Buffer.from(`DEMO_PDF_${Date.now()}`).toString("base64");
}

// Contrato esperado:
// {
//   fechaEmision: "YYYY-MM-DD" (o DD-MM-YYYY),
//   tipoRetencion: "CON_RETENCION" | "SIN_RETENCION",
//   tasaRetencionPct: 10.75,
//   emisor: { direccion },
//   receptor: { rut, nombreCompleto, direccion, region, comuna },
//   servicios: [{ descripcion, valor }]
// }
export async function emitirBoletaDemo({ userId, payload }) {
  if (!userId) return { ok: false, status: 401, error: "No autorizado" };
  if (!payload || typeof payload !== "object") {
    return { ok: false, status: 400, error: "Body requerido (JSON)" };
  }

  const fechaEmision = payload.fechaEmision;
  const tipoRetencion = String(payload.tipoRetencion || "").trim(); // "CON_RETENCION" | "SIN_RETENCION"
  const tasaRetencionPct = toNumber(payload.tasaRetencionPct, 10.75);

  const emisor = payload.emisor || {};
  const receptor = payload.receptor || {};
  const servicios = Array.isArray(payload.servicios) ? payload.servicios : [];

  // Validaciones mínimas
  if (!fechaEmision) return { ok: false, status: 400, error: "fechaEmision requerida" };
  if (!tipoRetencion) return { ok: false, status: 400, error: "tipoRetencion requerida" };

  if (!["CON_RETENCION", "SIN_RETENCION"].includes(tipoRetencion)) {
    return {
      ok: false,
      status: 400,
      error: "tipoRetencion inválida. Use CON_RETENCION o SIN_RETENCION",
    };
  }

  const rutRecep = normalizeRut(receptor.rut);
  const nombreRecep = String(receptor.nombreCompleto || "").trim();

  if (!rutRecep) return { ok: false, status: 400, error: "receptor.rut requerido" };
  if (!nombreRecep) return { ok: false, status: 400, error: "receptor.nombreCompleto requerido" };

  if (servicios.length < 1) {
    return { ok: false, status: 400, error: "servicios (>=1) requerido" };
  }

  // Normaliza servicios
  const serviciosNorm = servicios.map((s, idx) => ({
    idx,
    descripcion: String(s?.descripcion || "").trim(),
    valor: toNumber(s?.valor, 0),
  }));

  const invalid = serviciosNorm.find((s) => !s.descripcion || s.valor < 0);
  if (invalid) {
    return {
      ok: false,
      status: 400,
      error: "Cada servicio requiere descripcion y valor >= 0",
      details: { invalid },
    };
  }

  const totalBruto = serviciosNorm.reduce((acc, s) => acc + s.valor, 0);

  // Retención
  const tasa = tasaRetencionPct / 100;
  const montoRetencion =
    tipoRetencion === "CON_RETENCION" ? Math.floor(totalBruto * tasa) : 0;

  const liquido = Math.max(0, totalBruto - montoRetencion);

  const folio = payload.folio ?? Math.floor(Math.random() * 900000 + 100000);

  const row = await demoCreate(FILE, {
    userId: String(userId),
    tipo: "BHE",
    estado: "EMITIDA_DEMO",
    folio,
    fechaEmision,

    tipoRetencion,
    tasaRetencionPct,

    emisor: {
      direccion: String(emisor.direccion || "").trim(),
    },

    receptor: {
      rut: rutRecep,
      nombreCompleto: nombreRecep,
      direccion: String(receptor.direccion || "").trim(),
      region: String(receptor.region || "").trim(),
      comuna: String(receptor.comuna || "").trim(),
    },

    servicios: serviciosNorm,

    resumen: {
      totalBruto,
      montoRetencion,
      liquido,
    },

    pdfBase64: fakePdfBase64(),
    raw: payload,
    mode: (process.env.APP_MODE || "demo").toLowerCase(),
  });

  return { ok: true, data: row };
}

export async function listarBoletas(userId) {
  const rows = await demoList(FILE, (x) => String(x.userId) === String(userId));
  return rows.map(({ id, createdAt, estado, folio, fechaEmision, receptor, resumen }) => ({
    id,
    createdAt,
    estado,
    folio,
    fechaEmision,
    receptor,
    resumen,
  }));
}

export async function obtenerBoleta(userId, id) {
  const row = await demoGetById(FILE, id);
  if (!row || String(row.userId) !== String(userId)) return null;
  return row;
}
