import { ArrowLeft, Plus, FileText, Phone, Mail, MapPin, IdCard } from 'lucide-react'
import { findPatient, listVisitsForPatient, ROLES } from '../lib/storage.js'

export default function PatientProfile({ patientId, session, onBack, onNewVisit, onViewReport }) {
  const patient = findPatient(patientId)
  const visits = listVisitsForPatient(patientId)
  const canCapture = session.role !== ROLES.RECEPCION

  if (!patient) {
    return (
      <div>
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={15} />
          Volver
        </button>
        <div className="empty-state">Paciente no encontrado.</div>
      </div>
    )
  }

  return (
    <div>
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={15} />
        Volver
      </button>

      <div className="page-header">
        <div>
          <h1>{patient.nombre}</h1>
          <p>
            <IdCard size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
            Expediente {patient.expediente}
            <MapPin size={13} style={{ verticalAlign: -2, margin: '0 4px 0 14px' }} />
            {patient.sucursal}
            {patient.telefono && (
              <>
                <Phone size={13} style={{ verticalAlign: -2, margin: '0 4px 0 14px' }} />
                {patient.telefono}
              </>
            )}
            {patient.correo && (
              <>
                <Mail size={13} style={{ verticalAlign: -2, margin: '0 4px 0 14px' }} />
                {patient.correo}
              </>
            )}
          </p>
        </div>
        {canCapture && (
          <div className="page-header__actions">
            <button type="button" className="btn btn--primary" onClick={() => onNewVisit(patientId)}>
              <Plus size={16} />
              Nueva consulta
            </button>
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Historial de visitas</h2>
        {visits.length === 0 && (
          <div className="empty-state">Este paciente aún no tiene visitas registradas.</div>
        )}
        <div className="timeline">
          {visits.map((v) => (
            <div className="timeline__item" key={v.id}>
              <span className="timeline__dot" />
              <div className="timeline__card">
                <div>
                  <div className="timeline__date">{v.fecha}</div>
                  <div className="timeline__meta">
                    {v.optometrista} · {v.sucursal}
                  </div>
                </div>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => onViewReport(v.id)}>
                  <FileText size={14} />
                  Ver reporte
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
