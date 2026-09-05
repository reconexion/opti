import { Search, UserPlus, Users, ClipboardList, CalendarClock } from 'lucide-react'
import { listPatients, listVisits } from '../lib/storage.js'
import { useSucursal, coincideSucursal, TODAS_LAS_SUCURSALES } from '../context/sucursalContext.js'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard({ session, onNavigate }) {
  const { sucursalActiva } = useSucursal()
  const patients = listPatients().filter((p) => coincideSucursal(p.sucursal, sucursalActiva))
  const visits = listVisits().filter((v) => coincideSucursal(v.sucursal, sucursalActiva))
  const visitasHoy = visits.filter((v) => v.fecha === todayISO()).length
  const recientes = [...visits].sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn)).slice(0, 5)

  function nombrePaciente(id) {
    return patients.find((p) => p.id === id)?.nombre || 'Paciente'
  }

  const palabras = session.nombre.split(' ')
  const primerNombre = palabras.find((w) => !w.endsWith('.')) || palabras[0]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hola, {primerNombre}</h1>
          <p>
            Resumen de {sucursalActiva === TODAS_LAS_SUCURSALES ? 'todas las sucursales' : sucursalActiva}.
          </p>
        </div>
      </div>

      <button type="button" className="search-hero no-print" onClick={() => onNavigate('patients')}>
        <Search size={19} />
        Buscar paciente por nombre o número de expediente…
      </button>

      <div className="stat-grid" style={{ marginTop: 20 }}>
        <div className="stat-tile">
          <div className="stat-tile__value">{patients.length}</div>
          <div className="stat-tile__label">Pacientes registrados</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{visits.length}</div>
          <div className="stat-tile__label">Consultas totales</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{visitasHoy}</div>
          <div className="stat-tile__label">Consultas hoy</div>
        </div>
      </div>

      <div className="form-actions" style={{ marginBottom: 24 }}>
        <button type="button" className="btn btn--secondary" onClick={() => onNavigate('patientForm')}>
          <UserPlus size={16} />
          Nuevo paciente
        </button>
        <button type="button" className="btn btn--secondary" onClick={() => onNavigate('patients')}>
          <Users size={16} />
          Ver todos los pacientes
        </button>
      </div>

      <div className="panel">
        <h2>
          <ClipboardList size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
          Consultas recientes
        </h2>
        {recientes.length === 0 && (
          <div className="empty-state">
            Todavía no hay consultas registradas. Empieza buscando o dando de alta a un paciente.
          </div>
        )}
        <div className="result-list">
          {recientes.map((v) => (
            <div className="timeline__card" key={v.id} style={{ borderStyle: 'solid' }}>
              <div>
                <div className="result-row__name">{nombrePaciente(v.patientId)}</div>
                <div className="result-row__meta">
                  {v.fecha} · {v.optometrista} · {v.sucursal}
                </div>
              </div>
              <CalendarClock size={16} color="var(--ink-faint)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
