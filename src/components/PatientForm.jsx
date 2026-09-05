import { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { createPatient, listSucursales } from '../lib/storage.js'
import { useSucursal, TODAS_LAS_SUCURSALES } from '../context/sucursalContext.js'

export default function PatientForm({ onBack, onCreated }) {
  const { sucursalActiva } = useSucursal()
  const sucursales = listSucursales()
  const sucursalPorDefecto = sucursalActiva !== TODAS_LAS_SUCURSALES ? sucursalActiva : sucursales[0]?.nombre || ''
  const [nombre, setNombre] = useState('')
  const [expediente, setExpediente] = useState('')
  const [sucursal, setSucursal] = useState(sucursalPorDefecto)
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const patient = createPatient({ nombre, expediente, sucursal, telefono, correo })
      onCreated(patient.id)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={15} />
        Volver
      </button>
      <div className="page-header">
        <div>
          <h1>Nuevo paciente</h1>
          <p>Datos básicos para abrir su expediente. El historial de visitas se agrega después.</p>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nombre completo</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Número de expediente</label>
              <input value={expediente} onChange={(e) => setExpediente(e.target.value)} required />
            </div>
            <div className="field">
              <label>Sucursal</label>
              <select value={sucursal} onChange={(e) => setSucursal(e.target.value)} required>
                {sucursales.length === 0 && <option value="">Sin sucursales registradas</option>}
                {sucursales.map((s) => (
                  <option key={s.id} value={s.nombre}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Teléfono</label>
              <input
                type="tel"
                placeholder="961 123 4567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
              <p className="field-hint">Para enviar el reporte por WhatsApp.</p>
            </div>
            <div className="field">
              <label>Correo</label>
              <input
                type="email"
                placeholder="paciente@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
              <p className="field-hint">Dato de contacto (opcional).</p>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn btn--primary">
              <Save size={16} />
              Guardar paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
