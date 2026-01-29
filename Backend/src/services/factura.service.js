// src/services/factura.service.js
import { demoCreate, demoGetById, demoList } from "../storage/demo.storage.js";

const FILE = "facturas.json";

function isDemo() {
  return (process.env.APP_MODE || "demo").toLowerCase() === "demo";
}

function normalizeRut(input) {
  if (!input) return "";
  // quita puntos, deja guion si existe
  return String(input).replace(/\./g, "").trim();
}

function mustString(v, field) {
  if (!v || !String(v).trim()) return `${field} requerido`;
  return null;
}

function mustNumber(v, field) {
  const n = Number(v);
  if (!Number.isFinite(n)) return `${field} debe ser número`;
  return null;
}

function clampInt(n, min, max) {
  const x = Math.trunc(Number(n));
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, x));
}

// IVA estándar demo: 19%
function getIvaRatePct() {
  return Number(process.env.IVA_RATE_PCT || 19);
}

function calcTotals({ tipoFactura, items }) {
  // items: [{ nombre, descripcion?, unidad, cantidad, precioUnitario, exento? }]
  const subtotal = items.reduce((acc, it) => {
    const qty = Number(it.cantidad || 0);
    const pu = Number(it.precioUnitario || 0);
    return acc + Math.round(qty * pu);
  }, 0);

  const ivaPct = getIvaRatePct();
  const afecta = tipoFactura === "AFECTA"; // con IVA
  const iva = afecta ? Math.round(subtotal * (ivaPct / 100)) : 0;
  const total = subtotal + iva;

  return { subtotal, ivaPct, iva, total };
}

function fakePdfBase64() {
  // No es PDF real: es demo (igual que boleta)
  return Buffer.from(`DEMO_PDF_${Date.now()}`).toString("base64");
}

function fakeFacturaXml({ tipoDte, folio, fechaEmision, emisorRut, receptorRut, total }) {
  // XML demo simple (NO válido SII)
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="DEMO_${Date.now()}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>${tipoDte}</TipoDTE>
        <Folio>${folio}</Folio>
        <FchEmis>${fechaEmision}</FchEmis>
      </IdDoc>
      <Emisor>
        <RUTEmisor>${emisorRut}</RUTEmisor>
      </Emisor>
      <Receptor>
        <RUTRecep>${receptorRut}</RUTRecep>
      </Receptor>
      <Totales>
        <MntTotal>${total}</MntTotal>
      </Totales>
    </Encabezado>
    <Detalle>
      <NroLinDet>1</NroLinDet>
      <NmbItem>DEMO</NmbItem>
      <QtyItem>1</QtyItem>
      <PrcItem>${total}</PrcItem>
      <MontoItem>${total}</MontoItem>
    </Detalle>
  </Documento>
</DTE>`;
}

/**
 * Factura DEMO (no llama a SimpleAPI / SII).
 * Espera 1 JSON final desde front.
 */
export async function emitirFacturaDemo({ userId, payload }) {
  if (!payload) return { ok: false, status: 400, error: "Body requerido" };
  if (!userId) return { ok: false, status: 401, error: "No autenticado (userId faltante)" };

  const details = [];

  // === Campos principales (según tus pantallas) ===
  const tipoFactura = payload?.tipoFactura; // "AFECTA" | "EXENTA"
  const formaPago = payload?.formaPago;     // "CONTADO" | "CREDITO" | "SIN_COSTO"
  const ambiente = payload?.ambiente;       // "CERTIFICACION" | "PRODUCCION" (en demo solo informativo)
  const folio = payload?.folio ?? Math.floor(Math.random() * 900000 + 100000);
  const fechaEmision = payload?.fechaEmision; // "YYYY-MM-DD"
  const fechaVencimiento = payload?.fechaVencimiento || null; // opcional

  // emisor
  const emisor = payload?.emisor || {};
  const emisorRut = normalizeRut(emisor?.rut);
  const emisorRazonSocial = emisor?.razonSocial;
  const emisorGiro = emisor?.giro;
  const emisorActeco = emisor?.acteco;
  const emisorDireccion = emisor?.direccion;
  const emisorComuna = emisor?.comuna;
  const emisorTelefono = emisor?.telefono;

  // receptor (cliente)
  const receptor = payload?.receptor || {};
  const receptorRut = normalizeRut(receptor?.rut);
  const receptorNombre = receptor?.razonSocialNombre;
  const receptorDireccion = receptor?.direccion;
  const receptorComuna = receptor?.comuna;
  const receptorGiro = receptor?.giro;
  const receptorEmail = receptor?.email;

  // items (productos/servicios)
  const items = Array.isArray(payload?.items) ? payload.items : [];

  // Validación mínima (front valida más, pero backend no puede confiar 100%)
  if (!tipoFactura || !["AFECTA", "EXENTA"].includes(tipoFactura)) {
    details.push("tipoFactura debe ser 'AFECTA' o 'EXENTA'");
  }
  if (!formaPago || !["CONTADO", "CREDITO", "SIN_COSTO"].includes(formaPago)) {
    details.push("formaPago debe ser 'CONTADO', 'CREDITO' o 'SIN_COSTO'");
  }
  if (!ambiente || !["CERTIFICACION", "PRODUCCION"].includes(ambiente)) {
    details.push("ambiente debe ser 'CERTIFICACION' o 'PRODUCCION'");
  }
  if (mustString(fechaEmision, "fechaEmision")) details.push("fechaEmision requerida (YYYY-MM-DD)");

  if (mustString(emisorRut, "emisor.rut")) details.push("emisor.rut requerido");
  if (mustString(emisorRazonSocial, "emisor.razonSocial")) details.push("emisor.razonSocial requerido");
  if (mustString(emisorGiro, "emisor.giro")) details.push("emisor.giro requerido");
  if (mustString(emisorActeco, "emisor.acteco")) details.push("emisor.acteco requerido");
  if (mustString(emisorDireccion, "emisor.direccion")) details.push("emisor.direccion requerido");
  if (mustString(emisorComuna, "emisor.comuna")) details.push("emisor.comuna requerido");
  if (mustString(emisorTelefono, "emisor.telefono")) details.push("emisor.telefono requerido");

  if (mustString(receptorRut, "receptor.rut")) details.push("receptor.rut requerido");
  if (mustString(receptorNombre, "receptor.razonSocialNombre")) details.push("receptor.razonSocialNombre requerido");
  if (mustString(receptorDireccion, "receptor.direccion")) details.push("receptor.direccion requerido");
  if (mustString(receptorComuna, "receptor.comuna")) details.push("receptor.comuna requerido");
  if (mustString(receptorGiro, "receptor.giro")) details.push("receptor.giro requerido");
  if (mustString(receptorEmail, "receptor.email")) details.push("receptor.email requerido");

  if (!items.length) details.push("items debe traer al menos 1 producto/servicio");

  // Validación de items (mínima)
  const normalizedItems = items.map((it, idx) => {
    const nombre = it?.nombre;
    const unidad = it?.unidad || "UN";
    const cantidad = Number(it?.cantidad ?? 1);
    const precioUnitario = Number(it?.precioUnitario ?? 0);

    if (mustString(nombre, `items[${idx}].nombre`)) details.push(`items[${idx}].nombre requerido`);
    if (mustNumber(cantidad, `items[${idx}].cantidad`)) details.push(`items[${idx}].cantidad debe ser número`);
    if (mustNumber(precioUnitario, `items[${idx}].precioUnitario`)) details.push(`items[${idx}].precioUnitario debe ser número`);

    return {
      idx,
      nombre: String(nombre || "").trim(),
      descripcion: String(it?.descripcion || "").trim(),
      unidad,
      cantidad: cantidad <= 0 ? 1 : cantidad,
      precioUnitario: precioUnitario < 0 ? 0 : precioUnitario,
      subtotal: Math.round((cantidad <= 0 ? 1 : cantidad) * (precioUnitario < 0 ? 0 : precioUnitario)),
    };
  });

  if (details.length) {
    return { ok: false, status: 400, error: "Payload inválido", details };
  }

  // Totales
  const totals = calcTotals({ tipoFactura, items: normalizedItems });

  // Map tipo DTE demo:
  // - Afecta: 33
  // - Exenta: 34 (en la práctica hay más, pero demo suficiente)
  const tipoDte = tipoFactura === "AFECTA" ? 33 : 34;

  const xml = fakeFacturaXml({
    tipoDte,
    folio: Number(folio) || Math.floor(Math.random() * 900000 + 100000),
    fechaEmision,
    emisorRut,
    receptorRut,
    total: totals.total,
  });

  const row = await demoCreate(FILE, {
    userId: String(userId),
    tipo: "FACTURA",
    estado: "GENERADA_DEMO",
    tipoFactura,
    tipoDte,
    ambiente,
    formaPago,
    folio: Number(folio) || null,
    fechaEmision,
    fechaVencimiento,
    emisor: {
      rut: emisorRut,
      razonSocial: emisorRazonSocial,
      giro: emisorGiro,
      acteco: String(emisorActeco),
      direccion: emisorDireccion,
      comuna: emisorComuna,
      telefono: emisorTelefono,
    },
    receptor: {
      rut: receptorRut,
      razonSocialNombre: receptorNombre,
      direccion: receptorDireccion,
      comuna: receptorComuna,
      giro: receptorGiro,
      email: receptorEmail,
    },
    items: normalizedItems,
    resumen: totals,
    xml,
    pdfBase64: fakePdfBase64(),
    raw: payload,
    mode: isDemo() ? "demo" : "live",
  });

  return { ok: true, data: row };
}

export async function listarFacturas(userId) {
  const rows = await demoList(FILE, (x) => String(x.userId) === String(userId));
  return rows.map(({ id, createdAt, estado, folio, fechaEmision, tipoFactura, resumen, receptor }) => ({
    id,
    createdAt,
    estado,
    folio,
    fechaEmision,
    tipoFactura,
    receptor: { rut: receptor?.rut, razonSocialNombre: receptor?.razonSocialNombre },
    resumen,
  }));
}

export async function obtenerFactura(userId, id) {
  const row = await demoGetById(FILE, id);
  if (!row || String(row.userId) !== String(userId)) return null;
  return row;
}
