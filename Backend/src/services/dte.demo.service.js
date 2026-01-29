// src/services/dte.demo.service.js
import { demoCreate, demoGetById, demoList } from "../storage/demo.storage.js";

const FILE = "dtes.json";

function fakeDteXml({ tipoDte = 33, folio = 1, rutEmisor = "76269769-6", rutRecep = "66666666-6" }) {
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="DEMO_${Date.now()}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>${tipoDte}</TipoDTE>
        <Folio>${folio}</Folio>
        <FchEmis>${new Date().toISOString().slice(0,10)}</FchEmis>
      </IdDoc>
      <Emisor><RUTEmisor>${rutEmisor}</RUTEmisor></Emisor>
      <Receptor><RUTRecep>${rutRecep}</RUTRecep></Receptor>
    </Encabezado>
    <Detalle><NroLinDet>1</NroLinDet><NmbItem>DEMO</NmbItem><QtyItem>1</QtyItem><PrcItem>1000</PrcItem><MontoItem>1000</MontoItem></Detalle>
  </Documento>
</DTE>`;
}

export async function generarDteDemo({ userId, payload }) {
  if (!payload) return { ok: false, status: 400, error: "Body requerido" };

  // mínima
  const tipoDte = Number(payload?.tipoDte || 33);
  const folio = Number(payload?.folio || Math.floor(Math.random() * 900000 + 100000));

  const xml = fakeDteXml({
    tipoDte,
    folio,
    rutEmisor: payload?.emisor?.rut || "76269769-6",
    rutRecep: payload?.receptor?.rut || "66666666-6",
  });

  const row = await demoCreate(FILE, {
    userId: String(userId),
    tipo: "DTE",
    estado: "GENERADO_DEMO",
    tipoDte,
    folio,
    payload,
    xml,
  });

  return { ok: true, data: { dteId: row.id, folio, tipoDte, xml } };
}

export async function listarDtes(userId) {
  const rows = await demoList(FILE, (x) => String(x.userId) === String(userId));
  return rows.map(({ id, createdAt, estado, folio, tipoDte }) => ({ id, createdAt, estado, folio, tipoDte }));
}

export async function obtenerDte(userId, id) {
  const row = await demoGetById(FILE, id);
  if (!row || String(row.userId) !== String(userId)) return null;
  return row;
}
