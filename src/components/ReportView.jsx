import { ArrowLeft, Printer, MessageCircle, Info } from 'lucide-react'
import { findPatient, findVisit, getLastVisitForPatient } from '../lib/storage.js'
import { analizarConsulta, generarResumenNarrativo, DIAGNOSTICOS, ANEXOS } from '../lib/clinicalLogic.js'
import { COMPARACION_BADGE } from '../lib/badgeStyles.js'
import RxComparisonChart from './RxComparisonChart.jsx'
import { buildWhatsAppUrl } from '../lib/shareReport.js'
import { useSucursales } from '../context/sucursalContext.js'
import logo from '../assets/gaffas-logo.jpg'

function RxRow({ label, rx }) {
  return (
    <tr>
      <td>{label}</td>
      <td>{rx?.esfera || '—'}</td>
      <td>{rx?.cilindro || '—'}</td>
      <td>{rx?.eje || '—'}</td>
      <td>{rx?.adicion || '—'}</td>
    </tr>
  )
}

function MetaItem({ label, value }) {
  return (
    <div className="report-meta__item">
      <span>{label}</span>
      <strong title={value}>{value || '—'}</strong>
    </div>
  )
}

export default function ReportView({ visitId, onBack }) {
  const { sucursales } = useSucursales()
  const visit = findVisit(visitId)

  if (!visit) {
    return (
      <div>
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={15} />
          Volver
        </button>
        <div className="empty-state">Consulta no encontrada.</div>
      </div>
    )
  }

  const patient = findPatient(visit.patientId)
  const visitaAnterior = getLastVisitForPatient(visit.patientId, visit.id)
  const analisis = analizarConsulta(visit, visitaAnterior)
  const resumen = generarResumenNarrativo(patient, visit, analisis)
  const diagnosticosMarcados = DIAGNOSTICOS.filter((d) => visit.diagnostico?.[d.key])
  const comparacionBadge = COMPARACION_BADGE[analisis.comparacion.clasificacion] || 'badge--neutral'
  const hayRegistroPrevio = analisis.comparacion.clasificacion !== 'Sin registro previo'
  const rxAnteriorParaGrafica = visitaAnterior ? visitaAnterior.rxActual : visit.rxAnterior

  const whatsappUrl = buildWhatsAppUrl(patient, resumen)
  // Siempre la sucursal actual del paciente, no una copia vieja guardada en
  // la consulta — así, si el paciente cambia de sucursal, sus reportes ya
  // guardados también lo reflejan.
  const sucursalVisita = patient?.sucursal || 'Sin sucursal registrada'
  const sucursalObj = sucursales.find((s) => s.nombre === sucursalVisita) || null
  const anexosRevisados = ANEXOS.filter((a) => visit.anexos?.[a.key]?.checked)

  return (
    <div className="reveal">
      <div className="no-print report-toolbar">
        <button type="button" className="back-link" onClick={onBack} style={{ marginBottom: 0 }}>
          <ArrowLeft size={15} />
          Volver
        </button>
        <div className="page-header__actions">
          <a className="btn btn--secondary" href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={16} />
            WhatsApp
          </a>
          <button type="button" className="btn btn--primary" onClick={() => window.print()}>
            <Printer size={16} />
            Exportar / imprimir
          </button>
        </div>
      </div>
      <div className="no-print report-print-hint">
        <Info size={15} />
        <span>
          Antes de imprimir o guardar como PDF, abre <strong>"Más ajustes"</strong> en el cuadro de impresión y
          revisa dos opciones: activa <strong>"Gráficos de fondo"</strong> (para que se vean los colores del
          reporte) y desactiva <strong>"Encabezados y pies de página"</strong> (para que el navegador no agregue
          la URL, la fecha o el número de página).
        </span>
      </div>

      <div className="report-page">
        <div className="report-page__header">
          <div className="report-page__brand">
            <img src={logo} alt="Gaffas Correctas" />
            <div>
              <div className="report-page__brand-name">OptiScale</div>
              <div className="report-page__brand-tag">Óptica Gaffas Correctas</div>
            </div>
          </div>
          <div className="report-page__title">
            <h1>Reporte de evolución visual</h1>
            <p>
              <span className={`badge ${comparacionBadge}`}>{analisis.comparacion.clasificacion}</span>
            </p>
          </div>
        </div>

        <div className="report-meta">
          <div className="report-meta__patient">
            <span>Paciente</span>
            <strong>{patient?.nombre || '—'}</strong>
          </div>
          <div className="report-meta__grid">
            <MetaItem label="Expediente" value={patient?.expediente} />
            <MetaItem label="Fecha" value={visit.fecha} />
            <MetaItem label="Optometrista" value={visit.optometrista} />
            <div className="report-meta__item">
              <span>Sucursal</span>
              <div className="report-meta__sucursal">
                <img src={sucursalObj?.foto || logo} alt="" />
                <strong title={sucursalVisita}>{sucursalVisita}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h2>Resumen para el paciente</h2>
          <div className="report-narrative">{resumen}</div>
        </div>

        <div className="report-section">
          <h2>Comparación de graduación</h2>
          <div className="report-rx-grid">
            {hayRegistroPrevio ? (
              <RxComparisonChart anterior={rxAnteriorParaGrafica} actual={visit.rxActual} />
            ) : (
              <p style={{ fontSize: 13.5, color: 'var(--ink-faint)' }}>
                No hay graduación anterior registrada para graficar una comparación.
              </p>
            )}

            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Esfera</th>
                    <th>Cilindro</th>
                    <th>Eje</th>
                    <th>Adición</th>
                  </tr>
                </thead>
                <tbody>
                  <RxRow label="Anterior — OD" rx={rxAnteriorParaGrafica?.od} />
                  <RxRow label="Anterior — OI" rx={rxAnteriorParaGrafica?.oi} />
                  <RxRow label="Actual — OD" rx={visit.rxActual?.od} />
                  <RxRow label="Actual — OI" rx={visit.rxActual?.oi} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {diagnosticosMarcados.length > 0 && (
          <div className="report-section">
            <h2>Diagnóstico</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {diagnosticosMarcados.map((d) => (
                <span className="badge badge--info" key={d.key}>
                  {d.label}
                </span>
              ))}
            </div>
            {visit.diagnostico?.observaciones && (
              <p style={{ fontSize: 13.5, marginTop: 10 }}>{visit.diagnostico.observaciones}</p>
            )}
          </div>
        )}

        <div className="report-section">
          <h2>Anexos revisados en consulta</h2>
          {anexosRevisados.length > 0 ? (
            <div className="report-anexos-grid">
              {anexosRevisados.map((a) => {
                const val = visit.anexos[a.key]
                return (
                  <div className="report-anexos__item" key={a.key}>
                    <div className="report-anexos__row">
                      <span>{a.label}</span>
                      <span className="badge badge--good">Revisado</span>
                    </div>
                    {val.observaciones && <p>{val.observaciones}</p>}
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13.5, color: 'var(--ink-faint)' }}>
              No se registraron anexos preliminares revisados en esta consulta.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
