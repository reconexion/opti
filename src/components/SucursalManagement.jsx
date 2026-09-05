import { useState } from 'react'
import { Plus } from 'lucide-react'
import { listSucursales, createSucursal } from '../lib/storage.js'

export default function SucursalManagement() {
  const [sucursales, setSucursales] = useState(listSucursales())
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      createSucursal({ nombre })
      setSucursales(listSucursales())
      setNombre('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sucursales</h1>
          <p>Administra las sucursales disponibles al dar de alta a un paciente.</p>
        </div>
      </div>

      <div className="panel">
        <h2>Sucursales existentes</h2>
        {sucursales.length === 0 && <div className="empty-state">Aún no hay sucursales registradas.</div>}
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              {sucursales.map((s) => (
                <tr key={s.id}>
                  <td>{s.nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>Nueva sucursal</h2>
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ maxWidth: 320 }}>
            <label>Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn--primary">
            <Plus size={16} />
            Crear sucursal
          </button>
        </form>
      </div>
    </div>
  )
}
