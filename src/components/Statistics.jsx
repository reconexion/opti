import { BarChart3 } from 'lucide-react'
import {
  listPatients,
  listVisits,
  listSucursales,
  getLastVisitForPatient,
} from '../lib/storage.js'
import { DIAGNOSTICOS, calcularSeveridadGlobal, compararGraduacion } from '../lib/clinicalLogic.js'
import { NIVEL_COLOR, COMPARACION_COLOR } from '../lib/badgeStyles.js'
import { useSucursal, coincideSucursal, TODAS_LAS_SUCURSALES } from '../context/sucursalContext.js'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function BarList({ items, colorFor }) {
  const max = Math.max(1, ...items.map((i) => i.count))
  if (items.length === 0) {
    return <div className="empty-state">Aún no hay datos suficientes.</div>
  }
  return (
    <div className="bar-list">
      {items.map(({ label, count }) => (
        <div className="bar-list__row" key={label}>
          <span className="bar-list__label">{label}</span>
          <div className="bar-list__track">
            <div
              className="bar-list__fill"
              style={{ width: `${(count / max) * 100}%`, background: colorFor ? colorFor(label) : 'var(--blue)' }}
            />
          </div>
          <span className="bar-list__count">{count}</span>
        </div>
      ))}
    </div>
  )
}

function countBy(list, keyFn) {
  const counts = {}
  for (const item of list) {
    const key = keyFn(item)
    if (!key) continue
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

function toSortedItems(counts) {
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

export default function Statistics() {
  const { sucursalActiva } = useSucursal()
  const verTodas = sucursalActiva === TODAS_LAS_SUCURSALES
  const patients = listPatients().filter((p) => coincideSucursal(p.sucursal, sucursalActiva))
  // La sucursal de una visita es la de su paciente (no guarda su propia
  // copia), así que filtrar por sucursal es filtrar por "su paciente ya
  // quedó incluido arriba".
  const visits = listVisits().filter((v) => patients.some((p) => p.id === v.patientId))
  const sucursales = listSucursales()
  const sucursalPorPaciente = new Map(patients.map((p) => [p.id, p.sucursal]))
  const visitasEsteMes = visits.filter((v) => v.fecha?.slice(0, 7) === todayISO().slice(0, 7)).length

  const diagnosticoCounts = countBy(
    visits.flatMap((v) => DIAGNOSTICOS.filter((d) => v.diagnostico?.[d.key])),
    (d) => d.label,
  )

  const severidadCounts = countBy(
    visits.flatMap((v) => ['od', 'oi'].map((ojo) => calcularSeveridadGlobal(v.rxActual?.[ojo]?.esfera, v.rxActual?.[ojo]?.cilindro).nivel)),
    (nivel) => nivel,
  )
  const ordenSeveridad = ['Alto', 'Medio', 'Bajo', 'Normal']
  const severidadItems = ordenSeveridad
    .filter((nivel) => severidadCounts[nivel])
    .map((nivel) => ({ label: nivel, count: severidadCounts[nivel] }))

  const comparacionCounts = countBy(
    visits
      .map((v) => {
        const anterior = getLastVisitForPatient(v.patientId, v.id)
        if (!anterior) return null
        return compararGraduacion(anterior.rxActual, v.rxActual).clasificacion
      })
      .filter(Boolean),
    (c) => c,
  )
  const ordenComparacion = ['Cambio importante', 'Cambio moderado', 'Ajuste leve', 'Estable', 'Mejoró', 'Sin cambio']
  const comparacionItems = ordenComparacion
    .filter((c) => comparacionCounts[c])
    .map((c) => ({ label: c, count: comparacionCounts[c] }))

  const sucursalCounts = countBy(visits, (v) => sucursalPorPaciente.get(v.patientId))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Estadísticas</h1>
          <p>
            Panorama agregado de {verTodas ? 'todas las sucursales' : sucursalActiva}.
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-tile__value">{patients.length}</div>
          <div className="stat-tile__label">Pacientes registrados</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{visits.length}</div>
          <div className="stat-tile__label">Consultas totales</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{visitasEsteMes}</div>
          <div className="stat-tile__label">Consultas este mes</div>
        </div>
        {verTodas && (
          <div className="stat-tile">
            <div className="stat-tile__value">{sucursales.length}</div>
            <div className="stat-tile__label">Sucursales activas</div>
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Diagnósticos más frecuentes</h2>
        <BarList items={toSortedItems(diagnosticoCounts)} />
      </div>

      <div className="panel">
        <h2>Severidad visual (ambos ojos)</h2>
        <BarList items={severidadItems} colorFor={(label) => NIVEL_COLOR[label] || 'var(--blue)'} />
      </div>

      <div className="panel">
        <h2>Evolución entre visitas</h2>
        {comparacionItems.length === 0 ? (
          <div className="empty-state">
            Aún no hay pacientes con más de una consulta registrada para comparar.
          </div>
        ) : (
          <BarList items={comparacionItems} colorFor={(label) => COMPARACION_COLOR[label] || 'var(--blue)'} />
        )}
      </div>

      {verTodas && (
        <div className="panel">
          <h2>
            <BarChart3 size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
            Consultas por sucursal
          </h2>
          <BarList items={toSortedItems(sucursalCounts)} />
        </div>
      )}
    </div>
  )
}
