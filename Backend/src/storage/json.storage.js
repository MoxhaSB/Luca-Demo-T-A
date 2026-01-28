// src/storage/json.store.js
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// /src
const SRC_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(SRC_DIR, 'data');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(nombreArchivo) {
  return path.join(DATA_DIR, nombreArchivo);
}

export async function readJson(nombreArchivo, fallback = []) {
  await ensureDataDir();
  const p = filePath(nombreArchivo);

  try {
    const raw = await fs.readFile(p, 'utf8');
    if (!raw || raw.trim().length === 0) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    // Si no existe o está malo, devolvemos fallback
    return fallback;
  }
}

export async function writeJson(nombreArchivo, data) {
  await ensureDataDir();
  const p = filePath(nombreArchivo);

  // Escritura atómica simple
  const tmp = `${p}.tmp`;
  const content = JSON.stringify(data, null, 2);

  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, p);
}

export async function appendJson(nombreArchivo, item, fallback = []) {
  const data = await readJson(nombreArchivo, fallback);
  data.push(item);
  await writeJson(nombreArchivo, data);
  return item;
}

export async function upsertById(nombreArchivo, item, idField = 'id', fallback = []) {
  const data = await readJson(nombreArchivo, fallback);
  const idx = data.findIndex(x => String(x?.[idField]) === String(item?.[idField]));

  if (idx >= 0) data[idx] = { ...data[idx], ...item };
  else data.push(item);

  await writeJson(nombreArchivo, data);
  return item;
}
