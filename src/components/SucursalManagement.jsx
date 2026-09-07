import { useRef, useState } from 'react'
import { Plus, ImagePlus, ImageOff, Pencil, X, Check } from 'lucide-react'
import { createSucursal, updateSucursal } from '../lib/storage.js'
import { fileToCompressedDataUrl } from '../lib/image.js'
import { useSucursal, useSucursales } from '../context/sucursalContext.js'
import logo from '../assets/gaffas-logo.jpg'

// Mientras una sucursal no tenga foto propia, se identifica con el logo de
// Gaffas Correctas en vez de un ícono genérico — así nunca se ve "sin marca".
function Thumbnail({ foto, size = 44 }) {
  return (
    <img
      src={foto || logo}
      alt=""
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        objectFit: 'cover',
        display: 'block',
        border: '1px solid var(--border)',
      }}
    />
  )
}

export default function SucursalManagement() {
  const { sucursales, refreshSucursales: reload } = useSucursales()
  const { sucursalActiva, setSucursalActiva } = useSucursal()
  const [nombre, setNombre] = useState('')
  const [foto, setFoto] = useState(null)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const newFotoInputRef = useRef(null)

  const [rowError, setRowError] = useState('')
  const [rowBusyId, setRowBusyId] = useState(null)
  const rowFotoInputRef = useRef(null)
  const [rowTargetId, setRowTargetId] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editNombre, setEditNombre] = useState('')
  const [editError, setEditError] = useState('')

  function startEdit(s) {
    setRowError('')
    setEditingId(s.id)
    setEditNombre(s.nombre)
    setEditError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError('')
  }

  function saveEdit(id) {
    setEditError('')
    try {
      const nombreAnterior = sucursales.find((s) => s.id === id)?.nombre
      updateSucursal(id, { nombre: editNombre })
      reload()
      // El renombrado ya se propagó a pacientes/visitas guardados; si esta
      // era la sucursal activa del filtro, también hay que actualizarla o
      // se quedaría apuntando a un nombre que ya no existe.
      if (nombreAnterior && sucursalActiva === nombreAnterior) {
        setSucursalActiva(editNombre)
      }
      cancelEdit()
    } catch (err) {
      setEditError(err.message)
    }
  }

  async function handleNewFoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setProcessing(true)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setFoto(dataUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      createSucursal({ nombre, foto })
      reload()
      setNombre('')
      setFoto(null)
    } catch (err) {
      setError(err.message)
    }
  }

  function askRowFoto(id) {
    setRowError('')
    setRowTargetId(id)
    rowFotoInputRef.current?.click()
  }

  async function handleRowFoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !rowTargetId) return
    setRowError('')
    setRowBusyId(rowTargetId)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      updateSucursal(rowTargetId, { foto: dataUrl })
      reload()
    } catch (err) {
      setRowError(err.message)
    } finally {
      setRowBusyId(null)
      setRowTargetId(null)
    }
  }

  function removeFoto(id) {
    setRowError('')
    try {
      updateSucursal(id, { foto: null })
      reload()
    } catch (err) {
      setRowError(err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sucursales</h1>
          <p>Administra las sucursales disponibles al dar de alta a un paciente, con su foto de identificación.</p>
        </div>
      </div>

      <input
        ref={rowFotoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleRowFoto}
      />

      <div className="panel">
        <h2>Sucursales existentes</h2>
        {sucursales.length === 0 && <div className="empty-state">Aún no hay sucursales registradas.</div>}
        {sucursales.length > 0 && (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Nombre</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sucursales.map((s) => {
                  const isEditing = editingId === s.id
                  return (
                    <tr key={s.id}>
                      <td style={{ width: 60 }}>
                        <Thumbnail foto={s.foto} />
                      </td>
                      <td>
                        {isEditing ? (
                          <div>
                            <input
                              value={editNombre}
                              onChange={(e) => setEditNombre(e.target.value)}
                              autoFocus
                              style={{ width: '100%', maxWidth: 260 }}
                            />
                            {editError && (
                              <p className="error-text" style={{ marginTop: 6 }}>
                                {editError}
                              </p>
                            )}
                          </div>
                        ) : (
                          s.nombre
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {isEditing ? (
                            <>
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
                                onClick={() => saveEdit(s.id)}
                                title="Guardar"
                              >
                                <Check size={15} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                onClick={() => startEdit(s)}
                                title="Editar nombre"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                onClick={() => askRowFoto(s.id)}
                                disabled={rowBusyId === s.id}
                              >
                                <ImagePlus size={14} />
                                {rowBusyId === s.id ? 'Procesando…' : s.foto ? 'Cambiar foto' : 'Agregar foto'}
                              </button>
                              {s.foto && (
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => removeFoto(s.id)}
                                  title="Quitar foto"
                                >
                                  <ImageOff size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {rowError && (
          <p className="error-text" style={{ marginTop: 12 }}>
            {rowError}
          </p>
        )}
      </div>

      <div className="panel">
        <h2>Nueva sucursal</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="field" style={{ maxWidth: 320 }}>
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="field" style={{ maxWidth: 320 }}>
              <label>Foto (opcional)</label>
              <input
                ref={newFotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleNewFoto}
              />
            </div>
            {(foto || processing) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                {processing ? (
                  <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Procesando…</span>
                ) : (
                  <>
                    <Thumbnail foto={foto} size={56} />
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setFoto(null)}
                    >
                      Quitar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn--primary" disabled={processing}>
            <Plus size={16} />
            Crear sucursal
          </button>
        </form>
      </div>
    </div>
  )
}
