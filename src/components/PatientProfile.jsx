import { useState } from 'react'
import { ArrowLeft, Plus, FileText, Phone, Mail, MapPin, IdCard, Pencil, Trash2 } from 'lucide-react'
import { findPatient, listVisitsForPatient, deletePatient, deleteVisit, ROLES } from '../lib/storage.js'
import ConfirmDialog from './ConfirmDialog.jsx'

export default function PatientProfile({
  patientId,
  session,
  onBack,
  onNewVisit,
  onEditPatient,
  onEditVisit,
  onViewReport,
  onPatientDeleted,
}) {
  const patient = findPatient(patientId)
  const [visits, setVisits] = useState(() => listVisitsForPatient(patientId))
  const canCapture = session.role !== ROLES.RECEPCION

  const [pending, setPending] = useState(null) // { type: 'delete-patient' | 'delete-visit', visit? }
  const [pendingError, setPendingError] = useState('')
  const [pendingBusy, setPendingBusy] = useState(false)

  function reloadVisits() {
    setVisits(listVisitsForPatient(patientId))
  }

  function closePending() {
    setPending(null)
    setPendingError('')
    setPendingBusy(false)
  }

  function confirmPending() {
    if (!pending) return
    setPendingBusy(true)
    setPendingError('')
    try {
      if (pending.type === 'delete-patient') {
        deletePatient(patientId)
        onPatientDeleted()
        return
      }
      if (pending.type === 'delete-visit') {
        deleteVisit(pending.visit.id)
        reloadVisits()
        closePending()
      }
    } catch (err) {
      setPendingError(err.message)
      setPendingBusy(false)
    }
  }

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
            <button type="button" className="btn btn--secondary" onClick={() => onEditPatient(patientId)}>
              <Pencil size={16} />
              Editar paciente
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setPending({ type: 'delete-patient' })}
              title="Eliminar paciente"
            >
              <Trash2 size={16} color="var(--bad)" />
            </button>
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
                    {v.optometrista} · {patient.sucursal}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => onViewReport(v.id)}>
                    <FileText size={14} />
                    Ver reporte
                  </button>
                  {canCapture && (
                    <>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => onEditVisit(v.id)}
                        title="Editar consulta"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setPending({ type: 'delete-visit', visit: v })}
                        title="Eliminar consulta"
                      >
                        <Trash2 size={14} color="var(--bad)" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {pending?.type === 'delete-patient' && (
        <ConfirmDialog
          title="Eliminar paciente"
          description={
            visits.length > 0
              ? `Esta acción no se puede deshacer: se eliminará el expediente de ${patient.nombre} junto con sus ${visits.length} consulta(s) registrada(s).`
              : `Esta acción no se puede deshacer: se eliminará el expediente de ${patient.nombre}.`
          }
          confirmLabel="Eliminar definitivamente"
          danger
          requireText={patient.expediente}
          busy={pendingBusy}
          error={pendingError}
          onConfirm={confirmPending}
          onCancel={closePending}
        />
      )}

      {pending?.type === 'delete-visit' && (
        <ConfirmDialog
          title="Eliminar consulta"
          description={`Esta acción no se puede deshacer: se eliminará la consulta del ${pending.visit.fecha} y ya no aparecerá en el historial ni en comparaciones futuras.`}
          confirmLabel="Eliminar definitivamente"
          danger
          requireText={pending.visit.fecha}
          busy={pendingBusy}
          error={pendingError}
          onConfirm={confirmPending}
          onCancel={closePending}
        />
      )}
    </div>
  )
}
