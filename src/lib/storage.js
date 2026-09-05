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
    const users = read(KEYS.users, null)
    if (!users || users.length === 0) {
      const demo = [
        { usuario: 'admin', password: 'admin123', nombre: 'Administrador', role: ROLES.ADMIN },
        { usuario: 'optometrista', password: 'optica123', nombre: 'Dra. Optometrista', role: ROLES.OPTOMETRISTA },
        { usuario: 'recepcion', password: 'recepcion123', nombre: 'Recepción', role: ROLES.RECEPCION },
      ]
      const withHash = await Promise.all(
        demo.map(async (u) => ({
          id: uid('user'),
          usuario: u.usuario,
          nombre: u.nombre,
          role: u.role,
          passwordHash: await hashPassword(u.password),
        })),
      )
      write(KEYS.users, withHash)
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
  return listUsers().find((u) => u.usuario.toLowerCase() === usuario.toLowerCase())
}

export async function createUser({ usuario, password, nombre, role }) {
  const users = listUsers()
  if (users.some((u) => u.usuario.toLowerCase() === usuario.toLowerCase())) {
    throw new Error('Ya existe un usuario con ese nombre de usuario.')
  }
  const user = {
    id: uid('user'),
    usuario,
    nombre,
    role,
    passwordHash: await hashPassword(password),
  }
  write(KEYS.users, [...users, user])
  return user
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

export function createSucursal({ nombre }) {
  const sucursales = listSucursales()
  if (sucursales.some((s) => s.nombre.toLowerCase() === nombre.toLowerCase())) {
    throw new Error('Ya existe una sucursal con ese nombre.')
  }
  const sucursal = { id: uid('sucursal'), nombre }
  write(KEYS.sucursales, [...sucursales, sucursal])
  return sucursal
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
