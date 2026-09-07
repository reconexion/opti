import { useState } from 'react'
import { UserPlus, Pencil, KeyRound, Power, PowerOff, Trash2, X, Check } from 'lucide-react'
import {
  listUsers,
  createUser,
  updateUser,
  resetUserPassword,
  setUserActive,
  deleteUser,
  ROLES,
} from '../lib/storage.js'
import ConfirmDialog from './ConfirmDialog.jsx'

const ROLE_LABEL = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.OPTOMETRISTA]: 'Optometrista',
  [ROLES.RECEPCION]: 'Recepción',
}

const ROLE_BADGE = {
  [ROLES.ADMIN]: 'badge--info',
  [ROLES.OPTOMETRISTA]: 'badge--good',
  [ROLES.RECEPCION]: 'badge--neutral',
}

export default function UserManagement({ session }) {
  const [users, setUsers] = useState(listUsers())
  const [nombre, setNombre] = useState('')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(ROLES.OPTOMETRISTA)
  const [error, setError] = useState('')
  const [tableError, setTableError] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [editError, setEditError] = useState('')

  const [pending, setPending] = useState(null) // { type: 'deactivate' | 'delete' | 'reset-password', user }
  const [pendingPassword, setPendingPassword] = useState('')
  const [pendingError, setPendingError] = useState('')
  const [pendingBusy, setPendingBusy] = useState(false)

  function reload() {
    setUsers(listUsers())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await createUser({ nombre, usuario, password, role })
      reload()
      setNombre('')
      setUsuario('')
      setPassword('')
      setRole(ROLES.OPTOMETRISTA)
    } catch (err) {
      setError(err.message)
    }
  }

  function startEdit(u) {
    setTableError('')
    setEditingId(u.id)
    setEditDraft({ nombre: u.nombre, usuario: u.usuario, role: u.role })
    setEditError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft(null)
    setEditError('')
  }

  function saveEdit(u) {
    setEditError('')
    try {
      updateUser(u.id, editDraft, session.userId)
      reload()
      cancelEdit()
    } catch (err) {
      setEditError(err.message)
    }
  }

  function openPending(type, user) {
    setTableError('')
    setPending({ type, user })
    setPendingPassword('')
    setPendingError('')
    setPendingBusy(false)
  }

  function closePending() {
    setPending(null)
    setPendingPassword('')
    setPendingError('')
    setPendingBusy(false)
  }

  async function confirmPending() {
    if (!pending) return
    setPendingBusy(true)
    setPendingError('')
    try {
      const { type, user } = pending
      if (type === 'deactivate') {
        setUserActive(user.id, false, session.userId)
      } else if (type === 'delete') {
        deleteUser(user.id, session.userId)
      } else if (type === 'reset-password') {
        await resetUserPassword(user.id, pendingPassword)
      }
      reload()
      closePending()
    } catch (err) {
      setPendingError(err.message)
      setPendingBusy(false)
    }
  }

  function activate(u) {
    setTableError('')
    try {
      setUserActive(u.id, true, session.userId)
      reload()
    } catch (err) {
      setTableError(err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p>
            Administra quién puede entrar al sistema y con qué permisos. Desactivar, eliminar y restablecer
            contraseñas pide confirmación explícita para evitar cambios accidentales.
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>Usuarios existentes</h2>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === session.userId
                const isEditing = editingId === u.id
                const activo = u.activo !== false

                if (isEditing) {
                  return (
                    <tr key={u.id}>
                      <td>
                        <input
                          value={editDraft.nombre}
                          onChange={(e) => setEditDraft({ ...editDraft, nombre: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td>
                        <input
                          value={editDraft.usuario}
                          onChange={(e) => setEditDraft({ ...editDraft, usuario: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td>
                        <select
                          value={editDraft.role}
                          onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value })}
                        >
                          <option value={ROLES.OPTOMETRISTA}>Optometrista</option>
                          <option value={ROLES.RECEPCION}>Recepción</option>
                          <option value={ROLES.ADMIN}>Administrador</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${activo ? 'badge--good' : 'badge--neutral'}`}>
                          {activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={cancelEdit}
                            title="Cancelar"
                          >
                            <X size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={() => saveEdit(u)}
                            title="Guardar cambios"
                          >
                            <Check size={15} />
                          </button>
                        </div>
                        {editError && (
                          <p className="error-text" style={{ marginTop: 6, textAlign: 'right' }}>
                            {editError}
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td>{u.usuario}</td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                    </td>
                    <td>
                      <span className={`badge ${activo ? 'badge--good' : 'badge--neutral'}`}>
                        {activo ? 'Activo' : 'Inactivo'}
                      </span>
                      {isSelf && (
                        <span style={{ marginLeft: 6, fontSize: 11.5, color: 'var(--ink-faint)' }}>(tú)</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => startEdit(u)}
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => openPending('reset-password', u)}
                          title="Restablecer contraseña"
                        >
                          <KeyRound size={15} />
                        </button>
                        {activo ? (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => openPending('deactivate', u)}
                            disabled={isSelf}
                            title={isSelf ? 'No puedes desactivar tu propia cuenta' : 'Desactivar'}
                          >
                            <PowerOff size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => activate(u)}
                            title="Activar"
                          >
                            <Power size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => openPending('delete', u)}
                          disabled={isSelf}
                          title={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'}
                        >
                          <Trash2 size={15} color={isSelf ? undefined : 'var(--bad)'} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {tableError && (
          <p className="error-text" style={{ marginTop: 12 }}>
            {tableError}
          </p>
        )}
      </div>

      <div className="panel">
        <h2>Nuevo usuario</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="field">
              <label>Usuario</label>
              <input value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="field">
              <label>Rol</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value={ROLES.OPTOMETRISTA}>Optometrista</option>
                <option value={ROLES.RECEPCION}>Recepción</option>
                <option value={ROLES.ADMIN}>Administrador</option>
              </select>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn--primary">
            <UserPlus size={16} />
            Crear usuario
          </button>
        </form>
      </div>

      {pending?.type === 'deactivate' && (
        <ConfirmDialog
          title="Desactivar usuario"
          description={`${pending.user.nombre} no podrá iniciar sesión hasta que reactives su cuenta. Puedes revertir esto en cualquier momento.`}
          confirmLabel="Desactivar"
          danger
          busy={pendingBusy}
          error={pendingError}
          onConfirm={confirmPending}
          onCancel={closePending}
        />
      )}

      {pending?.type === 'delete' && (
        <ConfirmDialog
          title="Eliminar usuario"
          description="Esta acción no se puede deshacer: el usuario perderá acceso al sistema de forma permanente."
          confirmLabel="Eliminar definitivamente"
          danger
          requireText={pending.user.usuario}
          busy={pendingBusy}
          error={pendingError}
          onConfirm={confirmPending}
          onCancel={closePending}
        />
      )}

      {pending?.type === 'reset-password' && (
        <ConfirmDialog
          title="Restablecer contraseña"
          description={`Se reemplazará la contraseña actual de ${pending.user.nombre}. Comunícale la nueva contraseña por un medio seguro.`}
          confirmLabel="Restablecer contraseña"
          busy={pendingBusy}
          error={pendingError}
          confirmDisabled={pendingPassword.length < 6}
          onConfirm={confirmPending}
          onCancel={closePending}
        >
          <div className="field">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={pendingPassword}
              onChange={(e) => setPendingPassword(e.target.value)}
              minLength={6}
              autoFocus
              placeholder="Mínimo 6 caracteres"
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}
