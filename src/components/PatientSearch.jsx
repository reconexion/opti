import { useState } from 'react'
import { Search, UserPlus, ChevronRight } from 'lucide-react'
import { searchPatients } from '../lib/storage.js'
import { useSucursal, coincideSucursal, TODAS_LAS_SUCURSALES } from '../context/sucursalContext.js'

export default function PatientSearch({ onSelectPatient, onNewPatient }) {
  const { sucursalActiva } = useSucursal()
  const [query, setQuery] = useState('')
  const results = searchPatients(query).filter((p) => coincideSucursal(p.sucursal, sucursalActiva))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pacientes</h1>
          <p>
            Busca por nombre o número de expediente en{' '}
            {sucursalActiva === TODAS_LAS_SUCURSALES ? 'todas las sucursales' : sucursalActiva}, o da de
            alta a un paciente nuevo.
          </p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn--primary" onClick={onNewPatient}>
            <UserPlus size={16} />
            Nuevo paciente
          </button>
        </div>
      </div>

      <div className="search-bar">
        <Search size={17} />
        <input
          type="text"
          placeholder="Nombre o número de expediente"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {results.length === 0 && (
        <div className="empty-state">No se encontraron pacientes con ese criterio.</div>
      )}

      <div className="result-list">
        {results.map((p) => (
          <button
            key={p.id}
            type="button"
            className="result-row"
            onClick={() => onSelectPatient(p.id)}
          >
            <div>
              <div className="result-row__name">{p.nombre}</div>
              <div className="result-row__meta">
                Expediente {p.expediente} · {p.sucursal}
              </div>
            </div>
            <ChevronRight size={18} color="var(--ink-faint)" />
          </button>
        ))}
      </div>
    </div>
  )
}
