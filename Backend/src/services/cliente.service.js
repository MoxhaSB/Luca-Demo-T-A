import { demoCreate, demoGetById, demoList, demoUpdateById } from "../storage/demo.storage.js";

const FILE = "clientes.json";

function normalizeRut(rut) {
  return String(rut || "")
    .trim()
    .replace(/\./g, "")
    .toUpperCase();
}

function validateCreate(payload) {
  const errors = [];
  if (!payload?.rut) errors.push("rut requerido");
  if (!payload?.nombre) errors.push("nombre requerido");
  if (!payload?.giro) errors.push("giro requerido");
  return errors;
}

export async function crearCliente({ userId, payload }) {
  if (!userId) return { ok: false, status: 401, error: "No autenticado" };
  if (!payload) return { ok: false, status: 400, error: "Body requerido" };

  const errors = validateCreate(payload);
  if (errors.length) return { ok: false, status: 400, error: "Validación", details: errors };

  const rutNorm = normalizeRut(payload.rut);

  // Evitar duplicado por rut (por usuario) si está activo
  const existing = await demoList(FILE, (x) =>
    String(x.userId) === String(userId) &&
    x.deletedAt == null &&
    normalizeRut(x.rut) === rutNorm
  );
  if (existing.length) return { ok: false, status: 409, error: "Cliente ya existe (RUT duplicado)" };

  const row = await demoCreate(FILE, {
    userId: String(userId),
    tipo: "CLIENTE",
    estado: "ACTIVO",
    rut: payload.rut,
    rutNorm,
    nombre: payload.nombre,
    giro: payload.giro,
    fechaCreacion: payload.fechaCreacion || null,
    productoFrecuente: payload.productoFrecuente || null,
    direccion: {
      calleNumero: payload?.direccion?.calleNumero || payload?.direccion?.direccion || payload?.direccion || null,
      region: payload?.direccion?.region || null,
      comuna: payload?.direccion?.comuna || null,
    },
    contacto: {
      correo: payload?.contacto?.correo || payload?.correo || null,
      telefono: payload?.contacto?.telefono || payload?.telefono || null,
      sitioWeb: payload?.contacto?.sitioWeb || payload?.sitioWeb || null,
    },
    raw: payload,
    deletedAt: null,
  });

  return { ok: true, data: row };
}

export async function listarClientes(userId) {
  const rows = await demoList(FILE, (x) => String(x.userId) === String(userId) && x.deletedAt == null);
  return rows.map(({ id, createdAt, rut, nombre, giro, direccion }) => ({
    id,
    createdAt,
    rut,
    nombre,
    giro,
    ciudad: direccion?.comuna || "",
  }));
}

export async function obtenerCliente(userId, id) {
  const row = await demoGetById(FILE, id);
  if (!row || String(row.userId) !== String(userId) || row.deletedAt != null) return null;
  return row;
}

export async function actualizarCliente({ userId, id, payload }) {
  if (!payload) return { ok: false, status: 400, error: "Body requerido" };

  const current = await demoGetById(FILE, id);
  if (!current || String(current.userId) !== String(userId) || current.deletedAt != null) {
    return { ok: false, status: 404, error: "Cliente no encontrado" };
  }

  // Si cambia rut, validamos duplicado
  const nextRut = payload.rut ? normalizeRut(payload.rut) : current.rutNorm;
  if (nextRut !== current.rutNorm) {
    const dup = await demoList(FILE, (x) =>
      String(x.userId) === String(userId) &&
      x.deletedAt == null &&
      x.id !== id &&
      normalizeRut(x.rut) === nextRut
    );
    if (dup.length) return { ok: false, status: 409, error: "RUT ya existe en otro cliente" };
  }

  const updated = await demoUpdateById(FILE, id, (x) => ({
    ...x,
    rut: payload.rut ?? x.rut,
    rutNorm: nextRut,
    nombre: payload.nombre ?? x.nombre,
    giro: payload.giro ?? x.giro,
    fechaCreacion: payload.fechaCreacion ?? x.fechaCreacion,
    productoFrecuente: payload.productoFrecuente ?? x.productoFrecuente,
    direccion: {
      calleNumero:
        payload?.direccion?.calleNumero ??
        payload?.direccion?.direccion ??
        (typeof payload?.direccion === "string" ? payload.direccion : undefined) ??
        x?.direccion?.calleNumero ??
        null,
      region: payload?.direccion?.region ?? x?.direccion?.region ?? null,
      comuna: payload?.direccion?.comuna ?? x?.direccion?.comuna ?? null,
    },
    contacto: {
      correo: payload?.contacto?.correo ?? payload?.correo ?? x?.contacto?.correo ?? null,
      telefono: payload?.contacto?.telefono ?? payload?.telefono ?? x?.contacto?.telefono ?? null,
      sitioWeb: payload?.contacto?.sitioWeb ?? payload?.sitioWeb ?? x?.contacto?.sitioWeb ?? null,
    },
    raw: payload, // opcional: guardar último payload
  }));

  return { ok: true, data: updated };
}

export async function eliminarCliente({ userId, id }) {
  const current = await demoGetById(FILE, id);
  if (!current || String(current.userId) !== String(userId) || current.deletedAt != null) {
    return { ok: false, status: 404, error: "Cliente no encontrado" };
  }

  const updated = await demoUpdateById(FILE, id, (x) => ({
    ...x,
    estado: "ELIMINADO",
    deletedAt: new Date().toISOString(),
  }));

  return { ok: true, data: updated };
}
