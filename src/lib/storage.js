// Capa de persistencia local. Simula el rol de un backend/base de datos
// mientras ese componente no existe todavía: guarda usuarios, pacientes
// y visitas en localStorage para que el historial no se pierda entre
// recargas, igual que haría una API real.
import { hashPassword } from './crypto.js'

const KEYS = {
  users: 'optiscale_users',
  patients: 'optiscale_patients',
  visits: 'optiscale_visits',
  session: 'optiscale_session',
  sucursales: 'optiscale_sucursales',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const ROLES = {
  ADMIN: 'admin',
  OPTOMETRISTA: 'optometrista',
  RECEPCION: 'recepcion',
}

// --- Seed inicial: usuarios demo para poder entrar sin backend ---
let seedPromise = null
export function ensureSeed() {
  if (seedPromise) return seedPromise
  seedPromise = (async () => {
    const stored = read(KEYS.users, [])
    // Descarta entradas corruptas (de versiones anteriores con otro esquema)
    // que rompían el login al no traer `usuario` o `passwordHash`.
    const valid = Array.isArray(stored)
      ? stored.filter((u) => u && typeof u.usuario === 'string' && typeof u.passwordHash === 'string')
      : []

    const demo = [
      { usuario: 'admin', password: 'admin123', nombre: 'Administrador', role: ROLES.ADMIN },
      { usuario: 'optometrista', password: 'optica123', nombre: 'Dra. Optometrista', role: ROLES.OPTOMETRISTA },
      { usuario: 'recepcion', password: 'recepcion123', nombre: 'Recepción', role: ROLES.RECEPCION },
    ]
    const missing = demo.filter(
      (d) => !valid.some((u) => u.usuario.toLowerCase() === d.usuario.toLowerCase()),
    )

    if (missing.length > 0 || valid.length !== stored.length) {
      const withHash = await Promise.all(
        missing.map(async (u) => ({
          id: uid('user'),
          usuario: u.usuario,
          nombre: u.nombre,
          role: u.role,
          activo: true,
          passwordHash: await hashPassword(u.password),
        })),
      )
      write(KEYS.users, [...valid, ...withHash])
    }

    const sucursales = read(KEYS.sucursales, null)
    if (!sucursales || sucursales.length === 0) {
      write(KEYS.sucursales, [
        { id: uid('sucursal'), nombre: 'Tuxtla Gutiérrez' },
        { id: uid('sucursal'), nombre: 'Comitán' },
      ])
    }
  })()
  return seedPromise
}

// --- Usuarios ---
export function listUsers() {
  return read(KEYS.users, [])
}

export function findUserByUsername(usuario) {
  if (!usuario) return undefined
  const target = usuario.toLowerCase()
  return listUsers().find((u) => u.usuario && u.usuario.toLowerCase() === target)
}

export async function createUser({ usuario, password, nombre, role }) {
  const users = listUsers()
  const target = (usuario || '').toLowerCase()
  if (users.some((u) => u.usuario && u.usuario.toLowerCase() === target)) {
    throw new Error('Ya existe un usuario con ese nombre de usuario.')
  }
  if (!Object.values(ROLES).includes(role)) {
    throw new Error('Rol inválido.')
  }
  const user = {
    id: uid('user'),
    usuario,
    nombre,
    role,
    activo: true,
    passwordHash: await hashPassword(password),
  }
  write(KEYS.users, [...users, user])
  return user
}

// Usuarios con permisos de gestión (pueden entrar a Usuarios/Sucursales).
// Recepción queda fuera a propósito: son las cuentas "administrativas" de
// facto ya que no hay un rol de administrador dedicado en el día a día.
function esRolGestor(role) {
  return role === ROLES.ADMIN || role === ROLES.OPTOMETRISTA
}

// Evita dejar el sistema sin nadie que pueda gestionar usuarios: cuenta
// cuántas cuentas activas con rol de gestión quedarían sin contar `excludeId`.
function contarGestoresActivos(users, excludeId) {
  return users.filter((u) => u.id !== excludeId && u.activo !== false && esRolGestor(u.role)).length
}

export function updateUser(id, { nombre, usuario, role }, currentUserId) {
  const users = listUsers()
  const user = users.find((u) => u.id === id)
  if (!user) throw new Error('Usuario no encontrado.')

  if (usuario) {
    const target = usuario.toLowerCase()
    if (users.some((u) => u.id !== id && u.usuario && u.usuario.toLowerCase() === target)) {
      throw new Error('Ya existe un usuario con ese nombre de usuario.')
    }
  }
  if (role && !Object.values(ROLES).includes(role)) {
    throw new Error('Rol inválido.')
  }
  if (
    id === currentUserId &&
    role &&
    !esRolGestor(role) &&
    esRolGestor(user.role) &&
    contarGestoresActivos(users, id) === 0
  ) {
    throw new Error(
      'No puedes quitarte permisos de gestión: no quedaría nadie más que pueda administrar usuarios.',
    )
  }

  const updated = {
    ...user,
    ...(nombre ? { nombre } : {}),
    ...(usuario ? { usuario } : {}),
    ...(role ? { role } : {}),
  }
  write(
    KEYS.users,
    users.map((u) => (u.id === id ? updated : u)),
  )
  return updated
}

export async function resetUserPassword(id, newPassword) {
  const users = listUsers()
  const user = users.find((u) => u.id === id)
  if (!user) throw new Error('Usuario no encontrado.')
  if (!newPassword || newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.')
  }
  const passwordHash = await hashPassword(newPassword)
  write(
    KEYS.users,
    users.map((u) => (u.id === id ? { ...u, passwordHash } : u)),
  )
}

export function setUserActive(id, activo, currentUserId) {
  const users = listUsers()
  const user = users.find((u) => u.id === id)
  if (!user) throw new Error('Usuario no encontrado.')

  if (!activo) {
    if (id === currentUserId) {
      throw new Error('No puedes desactivar tu propia cuenta.')
    }
    if (esRolGestor(user.role) && contarGestoresActivos(users, id) === 0) {
      throw new Error(
        'Debe quedar al menos un usuario activo con permisos de gestión antes de desactivar este.',
      )
    }
  }

  write(
    KEYS.users,
    users.map((u) => (u.id === id ? { ...u, activo } : u)),
  )
}

export function deleteUser(id, currentUserId) {
  const users = listUsers()
  const user = users.find((u) => u.id === id)
  if (!user) throw new Error('Usuario no encontrado.')

  if (id === currentUserId) {
    throw new Error('No puedes eliminar tu propia cuenta.')
  }
  if (user.activo !== false && esRolGestor(user.role) && contarGestoresActivos(users, id) === 0) {
    throw new Error('Debe quedar al menos un usuario activo con permisos de gestión antes de eliminar este.')
  }

  write(
    KEYS.users,
    users.filter((u) => u.id !== id),
  )
}

// --- Sesión ---
const SESSION_DURATION_MS = 60 * 60 * 1000 // 1 hora

export function saveSession(user) {
  const session = {
    userId: user.id,
    usuario: user.usuario,
    nombre: user.nombre,
    role: user.role,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  }
  write(KEYS.session, session)
  return session
}

export function getSession() {
  const session = read(KEYS.session, null)
  if (!session) return null
  if (Date.now() > session.expiresAt) {
    clearSession()
    return null
  }
  return session
}

export function clearSession() {
  localStorage.removeItem(KEYS.session)
}

// --- Sucursales ---
export function listSucursales() {
  return read(KEYS.sucursales, [])
}

export function createSucursal({ nombre, foto = null }) {
  const sucursales = listSucursales()
  if (sucursales.some((s) => s.nombre.toLowerCase() === nombre.toLowerCase())) {
    throw new Error('Ya existe una sucursal con ese nombre.')
  }
  const sucursal = { id: uid('sucursal'), nombre, foto }
  write(KEYS.sucursales, [...sucursales, sucursal])
  return sucursal
}

export function updateSucursal(id, { nombre, foto } = {}) {
  const sucursales = listSucursales()
  const sucursal = sucursales.find((s) => s.id === id)
  if (!sucursal) throw new Error('Sucursal no encontrada.')
  if (nombre && sucursales.some((s) => s.id !== id && s.nombre.toLowerCase() === nombre.toLowerCase())) {
    throw new Error('Ya existe una sucursal con ese nombre.')
  }
  const nombreAnterior = sucursal.nombre
  const updated = {
    ...sucursal,
    ...(nombre ? { nombre } : {}),
    ...(foto !== undefined ? { foto } : {}),
  }
  write(
    KEYS.sucursales,
    sucursales.map((s) => (s.id === id ? updated : s)),
  )

  // Los pacientes guardan el nombre de su sucursal, no su id (así se
  // mostraba directo sin necesitar un backend con relaciones). Si se
  // renombra, hay que actualizar esas referencias también — si no, se
  // quedan apuntando a un nombre que ya no existe en ningún lado. Las
  // consultas ya no guardan su propia copia (ver createVisit): siempre
  // usan la sucursal actual del paciente, así que no necesitan este ajuste.
  if (nombre && nombre !== nombreAnterior) {
    const patients = listPatients()
    write(
      KEYS.patients,
      patients.map((p) => (p.sucursal === nombreAnterior ? { ...p, sucursal: nombre } : p)),
    )
  }

  return updated
}

// --- Pacientes ---
export function listPatients() {
  return read(KEYS.patients, [])
}

export function findPatient(id) {
  return listPatients().find((p) => p.id === id) || null
}

export function searchPatients(query) {
  const q = query.trim().toLowerCase()
  const patients = listPatients()
  if (!q) return patients
  return patients.filter(
    (p) => p.nombre.toLowerCase().includes(q) || p.expediente.toLowerCase().includes(q),
  )
}

export function createPatient({ nombre, expediente, sucursal, telefono, correo }) {
  const patients = listPatients()
  if (patients.some((p) => p.expediente === expediente)) {
    throw new Error('Ya existe un paciente con ese número de expediente.')
  }
  const patient = {
    id: uid('patient'),
    nombre,
    expediente,
    sucursal,
    telefono,
    correo,
    creadoEn: new Date().toISOString(),
  }
  write(KEYS.patients, [...patients, patient])
  return patient
}

export function updatePatient(id, { nombre, expediente, sucursal, telefono, correo }) {
  const patients = listPatients()
  const patient = patients.find((p) => p.id === id)
  if (!patient) throw new Error('Paciente no encontrado.')
  if (expediente && patients.some((p) => p.id !== id && p.expediente === expediente)) {
    throw new Error('Ya existe un paciente con ese número de expediente.')
  }
  const updated = {
    ...patient,
    ...(nombre !== undefined ? { nombre } : {}),
    ...(expediente !== undefined ? { expediente } : {}),
    ...(sucursal !== undefined ? { sucursal } : {}),
    ...(telefono !== undefined ? { telefono } : {}),
    ...(correo !== undefined ? { correo } : {}),
  }
  write(
    KEYS.patients,
    patients.map((p) => (p.id === id ? updated : p)),
  )
  return updated
}

// Eliminar un paciente arrastra sus consultas: una visita sin paciente
// rompería el resto de la app (reporte, historial, etc.), así que no se
// deja huérfana.
export function deletePatient(id) {
  const patients = listPatients()
  if (!patients.some((p) => p.id === id)) throw new Error('Paciente no encontrado.')
  write(
    KEYS.patients,
    patients.filter((p) => p.id !== id),
  )
  write(
    KEYS.visits,
    listVisits().filter((v) => v.patientId !== id),
  )
}

// --- Visitas ---
export function listVisits() {
  return read(KEYS.visits, [])
}

export function listVisitsForPatient(patientId) {
  return listVisits()
    .filter((v) => v.patientId === patientId)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

export function getLastVisitForPatient(patientId, beforeVisitId = null) {
  const visits = listVisitsForPatient(patientId).filter((v) => v.id !== beforeVisitId)
  return visits[0] || null
}

export function findVisit(id) {
  return listVisits().find((v) => v.id === id) || null
}

export function createVisit(visit) {
  const visits = listVisits()
  const record = {
    id: uid('visit'),
    creadoEn: new Date().toISOString(),
    ...visit,
  }
  write(KEYS.visits, [...visits, record])
  return record
}

export function updateVisit(id, patch) {
  const visits = listVisits()
  const visit = visits.find((v) => v.id === id)
  if (!visit) throw new Error('Consulta no encontrada.')
  const updated = { ...visit, ...patch }
  write(
    KEYS.visits,
    visits.map((v) => (v.id === id ? updated : v)),
  )
  return updated
}

export function deleteVisit(id) {
  const visits = listVisits()
  if (!visits.some((v) => v.id === id)) throw new Error('Consulta no encontrada.')
  write(
    KEYS.visits,
    visits.filter((v) => v.id !== id),
  )
}
