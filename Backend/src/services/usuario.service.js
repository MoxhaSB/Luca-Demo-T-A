// src/services/usuario.service.js
import bcrypt from 'bcryptjs';
import { readJson } from '../storage/json.storage.js';

const USUARIOS_FILE = 'usuarios.json';
const PERFILES_FILE = 'perfiles.json';

export async function loginUsuario({ login, password }) {
  if (!login || !password) {
    return { ok: false, status: 400, error: 'Credenciales requeridas' };
  }

  const usuarios = await readJson(USUARIOS_FILE, []);
  const found = usuarios.find(u => String(u.usuario).toLowerCase() === String(login).toLowerCase());

  if (!found || found.activo === false) {
    return { ok: false, status: 401, error: 'Credenciales inválidas' };
  }

  if (!found.passwordHash) {
    return { ok: false, status: 500, error: 'Usuario sin passwordHash' };
  }

  const valid = await bcrypt.compare(password, found.passwordHash);
  if (!valid) {
    return { ok: false, status: 401, error: 'Credenciales inválidas' };
  }

  const perfiles = await readJson(PERFILES_FILE, []);
  const perfil = perfiles.find(p => String(p.idUsuario) === String(found.id));
  const esPrimeraVez = perfil ? Boolean(perfil.esPrimeraVez) : true;

  return {
    ok: true,
    data: {
      id: found.id,
      usuario: found.usuario,
      roles: [found.rol || 'USER'],
      esPrimeraVez,
    },
  };
}
