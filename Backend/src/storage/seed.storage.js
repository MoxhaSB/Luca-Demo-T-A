// src/storage/seed.js
import '../config/env.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// /src
const SRC_DIR = path.resolve(__dirname, '..');

const DATA_DIR = path.join(SRC_DIR, 'data');
const SEEDS_DIR = path.join(SRC_DIR, 'seeds');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function safeReadJson(p, fallback) {
  try {
    const raw = await fs.readFile(p, 'utf8');
    if (!raw || raw.trim().length === 0) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function safeWriteJson(p, data) {
  const tmp = `${p}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, p);
}

async function ensureFromSeed({ dataFile, seedFile, fallback }) {
  const dataPath = path.join(DATA_DIR, dataFile);
  const seedPath = path.join(SEEDS_DIR, seedFile);

  const dataExists = await exists(dataPath);

  if (!dataExists) {
    const seedContent = (await exists(seedPath)) ? await fs.readFile(seedPath, 'utf8') : null;
    await fs.writeFile(dataPath, seedContent ?? JSON.stringify(fallback, null, 2), 'utf8');
    return;
  }

  // Si existe, validar JSON
  const raw = await fs.readFile(dataPath, 'utf8');
  if (!raw || raw.trim().length === 0) {
    const seedContent = (await exists(seedPath)) ? await fs.readFile(seedPath, 'utf8') : null;
    await fs.writeFile(dataPath, seedContent ?? JSON.stringify(fallback, null, 2), 'utf8');
    return;
  }

  try {
    JSON.parse(raw);
  } catch {
    const seedContent = (await exists(seedPath)) ? await fs.readFile(seedPath, 'utf8') : null;
    await fs.writeFile(dataPath, seedContent ?? JSON.stringify(fallback, null, 2), 'utf8');
  }
}

function getDemoUsersFromEnv() {
  const adminUser = process.env.DEMO_ADMIN_USER || 'admin@demo.cl';
  const adminPass = process.env.DEMO_ADMIN_PASS || '';
  const userUser = process.env.DEMO_USER_USER || 'user@demo.cl';
  const userPass = process.env.DEMO_USER_PASS || '';

  return { adminUser, adminPass, userUser, userPass };
}

async function ensureUsuariosDesdeEnv() {
  const usuariosPath = path.join(DATA_DIR, 'usuarios.json');

  const usuarios = await safeReadJson(usuariosPath, []);

  // Si ya hay usuarios, no tocamos nada
  if (Array.isArray(usuarios) && usuarios.length > 0) return;

  const { adminUser, adminPass, userUser, userPass } = getDemoUsersFromEnv();

  if (!adminPass || !userPass) {
    throw new Error('[SEED] Faltan DEMO_ADMIN_PASS o DEMO_USER_PASS en .env. No se crearán usuarios.');
  }


  const adminHash = await bcrypt.hash(adminPass, 10);
  const userHash = await bcrypt.hash(userPass, 10);

  const nuevos = [
    { id: 1, usuario: adminUser, passwordHash: adminHash, rol: 'ADMIN', activo: true },
    { id: 2, usuario: userUser, passwordHash: userHash, rol: 'USER', activo: true },
  ];

  await safeWriteJson(usuariosPath, nuevos);
  console.log('\n________________________________________________________________\n\n[SEED] usuarios.json creado desde variables de entorno.');
}

/**
 * Inicializa data/*.json.
 * usuarios.json se crea desde .env 
 */
export async function ensureSeeded() {
  await ensureDir(DATA_DIR);
  await ensureDir(SEEDS_DIR);

  // Usuarios desde ENV (no seed)
  await ensureUsuariosDesdeEnv();

  // Perfiles (seed normal, sin secretos)
  await ensureFromSeed({
    dataFile: 'perfiles.json',
    seedFile: 'perfiles.seed.json',
    fallback: [],
  });

  // Opcionales
  await ensureFromSeed({
    dataFile: 'clientes.json',
    seedFile: 'clientes.seed.json',
    fallback: [],
  });

  await ensureFromSeed({
    dataFile: 'proveedor.json',
    seedFile: 'proveedores.seed.json',
    fallback: [],
  });

  // Colecciones runtime
  await ensureFromSeed({ dataFile: 'chats.json', seedFile: '__no_seed__.json', fallback: [] });
  await ensureFromSeed({ dataFile: 'boletas.json', seedFile: '__no_seed__.json', fallback: [] });
  await ensureFromSeed({ dataFile: 'facturas.json', seedFile: '__no_seed__.json', fallback: [] });
}
