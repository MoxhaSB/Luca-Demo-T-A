import { demoCreate, demoGetById, demoList, demoUpdateById } from "../storage/demo.storage.js";

const FILE = "proveedores.json";

function normalizeRut(rut) {
  return String(rut || "")
    .trim()
    .replace(/\./g, "")
    .toUpperCase();
}

function validateCreate(payload) {
  const errors = [];
  if (!payload?.rut) errors.push("rut requerido");
  if (!payload?.razonSocial) errors.push("razonSocial requerido");
  if (!payload?.giro) errors.push("giro requerido");
  return errors;
}

export async function crearProveedor({ userId, payload }) {
  if (!userId) return { ok: false, status: 401, error: "No autenticado" };
  if (!payload) return { ok: false, status: 400, error: "Body requerido" };

  const errors = validateCreate(payload);
  if (errors.length) return { ok: false, status: 400, error: "Validación", details: errors };

  const rutNorm = normalizeRut(payload.rut);

  const existing = await demoList(FILE, (x) =>
    String(x.userId) === String(userId) &&
    x.deletedAt == null &&
    normalizeRut(x.rut) === rutNorm
  );
  if (existing.length) return { ok: false, status: 409, error: "Proveedor ya existe (RUT duplicado)" };

  const row = await demoCreate(FILE, {
    userId: String(userId),
    tipo: "PROVEEDOR",
    estado: "ACTIVO",
    rut: payload.rut,
    rutNorm,
    razonSocial: payload.razonSocial,
    nombreContacto: payload.nombreContacto || null,
    giro: payload.giro,
    fechaRegistro: payload.fechaRegistro || null,
    productoPrincipal: payload.productoPrincipal || null,
    direccion: {
      direccionCasaMatriz: payload?.direccion?.direccionCasaMatriz || null,
      region: payload?.direccion?.region || null,
      comuna: payload?.direccion?.comuna || null,
    },
    contacto: {
      correoVentas: payload?.contacto?.correoVentas || null,
      telefono: payload?.contacto?.telefono || null,
      sitioWeb: payload?.contacto?.sitioWeb || null,
    },
    raw: payload,
    deletedAt: null,
  });

  return { ok: true, data: row };
}

export async function listarProveedores(userId) {
  const rows = await demoList(FILE, (x) => String(x.userId) === String(userId) && x.deletedAt == null);
  return rows.map(({ id, createdAt, rut, razonSocial, giro, productoPrincipal }) => ({
    id,
    createdAt,
    rut,
    nombre: razonSocial,
    giro,
    productoPrincipal: productoPrincipal || "",
  }));
}

export async function obtenerProveedor(userId, id) {
  const row = await demoGetById(FILE, id);
  if (!row || String(row.userId) !== String(userId) || row.deletedAt != null) return null;
  return row;
}

export async function actualizarProveedor({ userId, id, payload }) {
  if (!payload) return { ok: false, status: 400, error: "Body requerido" };

  const current = await demoGetById(FILE, id);
  if (!current || String(current.userId) !== String(userId) || current.deletedAt != null) {
    return { ok: false, status: 404, error: "Proveedor no encontrado" };
  }

  const nextRut = payload.rut ? normalizeRut(payload.rut) : current.rutNorm;
  if (nextRut !== current.rutNorm) {
    const dup = await demoList(FILE, (x) =>
      String(x.userId) === String(userId) &&
      x.deletedAt == null &&
      x.id !== id &&
      normalizeRut(x.rut) === nextRut
    );
    if (dup.length) return { ok: false, status: 409, error: "RUT ya existe en otro proveedor" };
  }

  const updated = await demoUpdateById(FILE, id, (x) => ({
    ...x,
    rut: payload.rut ?? x.rut,
    rutNorm: nextRut,
    razonSocial: payload.razonSocial ?? x.razonSocial,
    nombreContacto: payload.nombreContacto ?? x.nombreContacto,
    giro: payload.giro ?? x.giro,
    fechaRegistro: payload.fechaRegistro ?? x.fechaRegistro,
    productoPrincipal: payload.productoPrincipal ?? x.productoPrincipal,
    direccion: {
      direccionCasaMatriz: payload?.direccion?.direccionCasaMatriz ?? x?.direccion?.direccionCasaMatriz ?? null,
      region: payload?.direccion?.region ?? x?.direccion?.region ?? null,
      comuna: payload?.direccion?.comuna ?? x?.direccion?.comuna ?? null,
    },
    contacto: {
      correoVentas: payload?.contacto?.correoVentas ?? x?.contacto?.correoVentas ?? null,
      telefono: payload?.contacto?.telefono ?? x?.contacto?.telefono ?? null,
      sitioWeb: payload?.contacto?.sitioWeb ?? x?.contacto?.sitioWeb ?? null,
    },
    raw: payload,
  }));

  return { ok: true, data: updated };
}

export async function eliminarProveedor({ userId, id }) {
  const current = await demoGetById(FILE, id);
  if (!current || String(current.userId) !== String(userId) || current.deletedAt != null) {
    return { ok: false, status: 404, error: "Proveedor no encontrado" };
  }

  const updated = await demoUpdateById(FILE, id, (x) => ({
    ...x,
    estado: "ELIMINADO",
    deletedAt: new Date().toISOString(),
  }));

  return { ok: true, data: updated };
}
