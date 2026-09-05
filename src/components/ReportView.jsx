import { useState } from 'react'
import { ArrowLeft, Printer, Moon, BookOpen, MessageCircle, LayoutList, FileText } from 'lucide-react'
import { findPatient, findVisit, getLastVisitForPatient } from '../lib/storage.js'
import {
  analizarConsulta,
  generarResumenNarrativo,
  GLOSARIO,
  DIAGNOSTICOS,
  ANEXOS,
} from '../lib/clinicalLogic.js'
import { NIVEL_BADGE, COMPARACION_BADGE } from '../lib/badgeStyles.js'
import RxComparisonChart from './RxComparisonChart.jsx'
import { buildWhatsAppUrl } from '../lib/shareReport.js'

function Badge({ text }) {
  return <span className={`badge ${NIVEL_BADGE[text] || 'badge--neutral'}`}>{text}</span>
}

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

export default function ReportView({ visitId, onBack }) {
  const [detalleTecnico, setDetalleTecnico] = useState(false)
  const [vistaCompacta, setVistaCompacta] = useState(false)
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

  const shareButtons = (
    <a className="btn btn--secondary" href={whatsappUrl} target="_blank" rel="noreferrer">
      <MessageCircle size={16} />
      WhatsApp
    </a>
  )

  if (vistaCompacta) {
    return (
      <div>
        <div className="no-print report-toolbar">
          <button type="button" className="back-link" onClick={onBack} style={{ marginBottom: 0 }}>
            <ArrowLeft size={15} />
            Volver
          </button>
          <div className="page-header__actions">
            {shareButtons}
            <button type="button" className="btn btn--secondary" onClick={() => setVistaCompacta(false)}>
              <FileText size={16} />
              Ver reporte completo
            </button>
            <button type="button" className="btn btn--primary" onClick={() => window.print()}>
              <Printer size={16} />
              Imprimir
            </button>
          </div>
        </div>

        <div className="panel compact-summary reveal">
          <div className="page-header" style={{ marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 21 }}>Resumen de evolución visual</h1>
              <p>{patient?.nombre}</p>
            </div>
            <span className={`badge ${comparacionBadge}`}>{analisis.comparacion.clasificacion}</span>
          </div>

          <div className="report-meta" style={{ marginBottom: 14 }}>
            <span>
              Expediente: <strong>{patient?.expediente}</strong>
            </span>
            <span>
              Fecha: <strong>{visit.fecha}</strong>
            </span>
            <span>
              Optometrista: <strong>{visit.optometrista}</strong>
            </span>
            <span>
              Sucursal: <strong>{visit.sucursal}</strong>
            </span>
          </div>

          <div className="report-narrative" style={{ fontSize: 13.5, padding: '12px 14px' }}>{resumen}</div>

          <table className="table" style={{ marginTop: 14 }}>
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

          {diagnosticosMarcados.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <strong style={{ fontSize: 13.5 }}>Diagnóstico: </strong>
              {diagnosticosMarcados.map((d) => (
                <span className="badge badge--info" key={d.key} style={{ marginRight: 6 }}>
                  {d.label}
                </span>
              ))}
            </div>
          )}

          {visit.observaciones && (
            <p style={{ marginTop: 14, fontSize: 13.5 }}>
              <strong>Recomendaciones: </strong>
              {visit.observaciones}
            </p>
          )}

          <p style={{ marginTop: 20, fontSize: 12, color: 'var(--ink-faint)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            Óptica Gaffas Correctas · Distribuidor autorizado Carl Zeiss Vision · Tuxtla Gutiérrez &amp; Comitán, Chiapas
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="reveal">
      <div className="no-print">
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={15} />
          Volver
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1>Reporte de evolución visual</h1>
          <p>{patient?.nombre}</p>
        </div>
        <div className="page-header__actions no-print">
          {shareButtons}
          <button type="button" className="btn btn--secondary" onClick={() => setVistaCompacta(true)}>
            <LayoutList size={16} />
            Resumen de una página
          </button>
          <button type="button" className="btn btn--primary" onClick={() => window.print()}>
            <Printer size={16} />
            Exportar / imprimir
          </button>
        </div>
      </div>

      <div className="report-meta">
        <span>
          Expediente: <strong>{patient?.expediente}</strong>
        </span>
        <span>
          Fecha: <strong>{visit.fecha}</strong>
        </span>
        <span>
          Optometrista: <strong>{visit.optometrista}</strong>
        </span>
        <span>
          Sucursal: <strong>{visit.sucursal}</strong>
        </span>
      </div>

      <div className="report-toolbar no-print">
        <span className={`badge ${comparacionBadge}`}>{analisis.comparacion.clasificacion}</span>
        <label className="report-toggle">
          <input
            type="checkbox"
            checked={detalleTecnico}
            onChange={(e) => setDetalleTecnico(e.target.checked)}
          />
          Ver detalle técnico
        </label>
      </div>

      <div className="panel">
        <h2>Resumen para el paciente</h2>
        <div className="report-narrative">{resumen}</div>
      </div>

      <div className="panel">
        <h2>Comparativo de graduación</h2>
        <p style={{ marginTop: -6 }}>
          Clasificación del cambio: <Badge text={analisis.comparacion.clasificacion} />
        </p>

        {hayRegistroPrevio ? (
          <div style={{ margin: '18px 0' }}>
            <RxComparisonChart anterior={rxAnteriorParaGrafica} actual={visit.rxActual} />
          </div>
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

      {detalleTecnico && (
        <div className="panel reveal">
          <h2>Detalle técnico</h2>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Ojo</th>
                  <th>Ametropía</th>
                  <th>Nivel</th>
                  <th>Astigmatismo</th>
                  <th>Eje</th>
                  <th>Severidad global</th>
                </tr>
              </thead>
              <tbody>
                {['od', 'oi'].map((ojo) => (
                  <tr key={ojo}>
                    <td>{ojo.toUpperCase()}</td>
                    <td>{analisis.porOjo[ojo].ametropia.tipo}</td>
                    <td>
                      <Badge text={analisis.porOjo[ojo].ametropia.nivel} />
                    </td>
                    <td>
                      <Badge text={analisis.porOjo[ojo].astigmatismo} />
                    </td>
                    <td>{analisis.porOjo[ojo].eje.clasificacion}</td>
                    <td>
                      <Badge text={analisis.porOjo[ojo].severidad.nivel} /> ({analisis.porOjo[ojo].severidad.score})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Moon size={14} /> Horas de sueño
          </h3>
          <p>
            {analisis.sueno.horas !== null ? (
              <>
                {analisis.sueno.horas} horas — <Badge text={analisis.sueno.evaluacion} />
              </>
            ) : (
              'No capturado.'
            )}
          </p>

          <h3>Anexos preliminares</h3>
          <ul>
            {ANEXOS.map(({ key, label }) => {
              const val = visit.anexos?.[key]
              if (!val) return null
              return (
                <li key={key} style={{ padding: '4px 0', color: 'var(--ink-soft)', fontSize: 13.5 }}>
                  {label}: {val.checked ? 'Revisado' : 'No revisado'}
                  {val.observaciones ? ` — ${val.observaciones}` : ''}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="panel">
        <h2>Diagnóstico</h2>
        {diagnosticosMarcados.length === 0 && <p>Sin diagnóstico marcado.</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: diagnosticosMarcados.length ? 10 : 0 }}>
          {diagnosticosMarcados.map((d) => (
            <span className="badge badge--info" key={d.key}>
              {d.label}
            </span>
          ))}
        </div>
        {visit.diagnostico?.observaciones && <p>Observaciones: {visit.diagnostico.observaciones}</p>}
      </div>

      <div className="panel">
        <h2>Perfil de uso visual</h2>
        <div className="form-grid">
          <p>Uso de pantallas: {visit.perfilVisual?.usoPantallas || '—'}</p>
          <p>Actividades de cerca: {visit.perfilVisual?.actividadesCerca || '—'}</p>
          <p>Actividades de lejos: {visit.perfilVisual?.actividadesLejos || '—'}</p>
          <p>Exposición solar: {visit.perfilVisual?.exposicionSolar || '—'}</p>
        </div>
      </div>

      <div className="panel">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={16} /> Glosario
        </h2>
        <ul className="glossary-list">
          {Object.values(GLOSARIO).map((texto) => (
            <li key={texto}>{texto}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
