import { findUserByUsername, saveSession, getSession, clearSession } from './storage.js'
import { hashPassword } from './crypto.js'

export async function login(usuario, password) {
  const user = findUserByUsername(usuario)
  if (!user) throw new Error('Usuario o contraseña incorrectos.')
  const hash = await hashPassword(password)
  if (hash !== user.passwordHash) throw new Error('Usuario o contraseña incorrectos.')
  if (user.activo === false) {
    throw new Error('Esta cuenta está desactivada. Pide a otro usuario con permisos que la reactive.')
  }
  return saveSession(user)
}

export function logout() {
  clearSession()
}

export function currentSession() {
  return getSession()
}
