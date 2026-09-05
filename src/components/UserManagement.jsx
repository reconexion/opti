import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { listUsers, createUser, ROLES } from '../lib/storage.js'

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

export default function UserManagement() {
  const [users, setUsers] = useState(listUsers())
  const [nombre, setNombre] = useState('')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(ROLES.OPTOMETRISTA)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await createUser({ nombre, usuario, password, role })
      setUsers(listUsers())
      setNombre('')
      setUsuario('')
      setPassword('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p>Administra quién puede entrar al sistema y con qué permisos.</p>
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
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.usuario}</td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                <option value={ROLES.ADMIN}>Administrador</option>
                <option value={ROLES.OPTOMETRISTA}>Optometrista</option>
                <option value={ROLES.RECEPCION}>Recepción</option>
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
    </div>
  )
}
