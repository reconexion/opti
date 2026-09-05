import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Save, ClipboardCheck, Eye, Stethoscope, Moon } from 'lucide-react'
import { findPatient, getLastVisitForPatient, createVisit } from '../lib/storage.js'
import { ANEXOS, DIAGNOSTICOS, validarEje } from '../lib/clinicalLogic.js'

const EMPTY_RX = { esfera: '', cilindro: '', eje: '', adicion: '' }

function RxInputs({ label, side, value, onChange, disabled }) {
  return (
    <fieldset className={`rx-block rx-block--${side}`} disabled={disabled}>
      <legend className="rx-block__title">{label}</legend>
      <div className="rx-grid">
        <div>
          <label>Esfera</label>
          <input
            type="number"
            step="0.25"
            value={value.esfera}
            onChange={(e) => onChange({ ...value, esfera: e.target.value })}
          />
        </div>
        <div>
          <label>Cilindro</label>
          <input
            type="number"
            step="0.25"
            value={value.cilindro}
            onChange={(e) => onChange({ ...value, cilindro: e.target.value })}
          />
        </div>
        <div>
          <label>Eje (0-180)</label>
          <input
            type="number"
            min="0"
            max="180"
            value={value.eje}
            onChange={(e) => onChange({ ...value, eje: e.target.value })}
          />
        </div>
        <div>
          <label>Adición</label>
          <input
            type="number"
            step="0.25"
            value={value.adicion}
            onChange={(e) => onChange({ ...value, adicion: e.target.value })}
          />
        </div>
      </div>
      {value.eje !== '' && !validarEje(value.eje) && (
        <p className="error-text" style={{ marginTop: 10, marginBottom: 0 }}>
          El eje debe estar entre 0 y 180 grados.
        </p>
      )}
    </fieldset>
  )
}

const STEPS = [
  { label: 'Anexos preliminares', icon: ClipboardCheck },
  { label: 'Graduación (RX)', icon: Eye },
  { label: 'Diagnóstico', icon: Stethoscope },
  { label: 'Perfil de uso visual', icon: Moon },
]

export default function VisitForm({ patientId, session, onBack, onSaved }) {
  const patient = findPatient(patientId)
  const lastVisit = getLastVisitForPatient(patientId)

  const [step, setStep] = useState(0)
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [anexos, setAnexos] = useState(
    Object.fromEntries(ANEXOS.map((a) => [a.key, { checked: false, observaciones: '' }])),
  )
  const [rxAnterior, setRxAnterior] = useState({
    od: lastVisit ? { ...lastVisit.rxActual.od } : { ...EMPTY_RX },
    oi: lastVisit ? { ...lastVisit.rxActual.oi } : { ...EMPTY_RX },
  })
  const [rxActual, setRxActual] = useState({ od: { ...EMPTY_RX }, oi: { ...EMPTY_RX } })
  const [diagnostico, setDiagnostico] = useState(
    Object.fromEntries(DIAGNOSTICOS.map((d) => [d.key, false])),
  )
  const [diagnosticoObservaciones, setDiagnosticoObservaciones] = useState('')
  const [perfilVisual, setPerfilVisual] = useState({
    horaDormir: '',
    horaDespertar: '',
    usoPantallas: '',
    actividadesCerca: '',
    actividadesLejos: '',
    exposicionSolar: '',
    observaciones: '',
  })
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')

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

  function ejeValido(rx) {
    return (rx.od.eje === '' || validarEje(rx.od.eje)) && (rx.oi.eje === '' || validarEje(rx.oi.eje))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!ejeValido(rxActual) || !ejeValido(rxAnterior)) {
      setError('Revisa el eje del astigmatismo: debe estar entre 0 y 180 grados.')
      return
    }
    const visit = createVisit({
      patientId,
      fecha,
      optometrista: session.nombre,
      sucursal: patient.sucursal,
      anexos,
      rxAnterior,
      rxActual,
      diagnostico: { ...diagnostico, observaciones: diagnosticoObservaciones },
      perfilVisual,
      observaciones,
    })
    onSaved(visit.id)
  }

  return (
    <div>
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={15} />
        Volver
      </button>

      <div className="page-header">
        <div>
          <h1>Nueva consulta</h1>
          <p>{patient.nombre}</p>
        </div>
        <div className="page-header__actions">
          <div className="field" style={{ margin: 0 }}>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              style={{ width: 160 }}
            />
          </div>
        </div>
      </div>

      <div className="stepper">
        {STEPS.map(({ label, icon: Icon }, i) => (
          <button
            key={label}
            type="button"
            className={`stepper__item ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}
            onClick={() => setStep(i)}
          >
            <span className="stepper__dot">{i < step ? <Check size={12} /> : <Icon size={12} />}</span>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="panel">
          {step === 0 && (
            <section className="reveal">
              <h2>Anexos preliminares</h2>
              <div className="form-grid">
                {ANEXOS.map((a) => (
                  <div key={a.key} className="field" style={{ gap: 8 }}>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={anexos[a.key].checked}
                        onChange={(e) =>
                          setAnexos({
                            ...anexos,
                            [a.key]: { ...anexos[a.key], checked: e.target.checked },
                          })
                        }
                      />
                      {a.label}
                    </label>
                    <input
                      type="text"
                      placeholder="Observaciones"
                      value={anexos[a.key].observaciones}
                      onChange={(e) =>
                        setAnexos({
                          ...anexos,
                          [a.key]: { ...anexos[a.key], observaciones: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="reveal">
              <h2>Graduación</h2>
              <p style={{ marginTop: -6 }}>
                {lastVisit
                  ? 'RX anterior traída automáticamente de la última visita registrada. Puedes ajustarla si es necesario.'
                  : 'No hay visita previa registrada. Si el paciente trae una graduación de otro lugar, captúrala aquí; si no, déjala en blanco.'}
              </p>
              <div className="eye-grid">
                <RxInputs label="RX Anterior — Ojo derecho (OD)" side="od" value={rxAnterior.od} onChange={(v) => setRxAnterior({ ...rxAnterior, od: v })} />
                <RxInputs label="RX Anterior — Ojo izquierdo (OI)" side="oi" value={rxAnterior.oi} onChange={(v) => setRxAnterior({ ...rxAnterior, oi: v })} />
              </div>
              <div className="eye-grid">
                <RxInputs label="RX Actual — Ojo derecho (OD)" side="od" value={rxActual.od} onChange={(v) => setRxActual({ ...rxActual, od: v })} />
                <RxInputs label="RX Actual — Ojo izquierdo (OI)" side="oi" value={rxActual.oi} onChange={(v) => setRxActual({ ...rxActual, oi: v })} />
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="reveal">
              <h2>Diagnóstico</h2>
              <div className="form-grid">
                {DIAGNOSTICOS.map((d) => (
                  <label key={d.key} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={diagnostico[d.key]}
                      onChange={(e) => setDiagnostico({ ...diagnostico, [d.key]: e.target.checked })}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
              <div className="field" style={{ marginTop: 16 }}>
                <label>Observaciones del diagnóstico</label>
                <textarea
                  value={diagnosticoObservaciones}
                  onChange={(e) => setDiagnosticoObservaciones(e.target.value)}
                />
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="reveal">
              <h2>Perfil de uso visual</h2>
              <div className="form-grid">
                <div className="field">
                  <label>Hora de dormir</label>
                  <input
                    type="time"
                    value={perfilVisual.horaDormir}
                    onChange={(e) => setPerfilVisual({ ...perfilVisual, horaDormir: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Hora de despertar</label>
                  <input
                    type="time"
                    value={perfilVisual.horaDespertar}
                    onChange={(e) => setPerfilVisual({ ...perfilVisual, horaDespertar: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Uso de pantallas</label>
                  <input
                    type="text"
                    value={perfilVisual.usoPantallas}
                    onChange={(e) => setPerfilVisual({ ...perfilVisual, usoPantallas: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Actividades de cerca</label>
                  <input
                    type="text"
                    value={perfilVisual.actividadesCerca}
                    onChange={(e) => setPerfilVisual({ ...perfilVisual, actividadesCerca: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Actividades de lejos</label>
                  <input
                    type="text"
                    value={perfilVisual.actividadesLejos}
                    onChange={(e) => setPerfilVisual({ ...perfilVisual, actividadesLejos: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Exposición solar</label>
                  <input
                    type="text"
                    value={perfilVisual.exposicionSolar}
                    onChange={(e) => setPerfilVisual({ ...perfilVisual, exposicionSolar: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label>Observaciones de anamnesis</label>
                <textarea
                  value={perfilVisual.observaciones}
                  onChange={(e) => setPerfilVisual({ ...perfilVisual, observaciones: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Observaciones y recomendaciones generales</label>
                <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </div>
            </section>
          )}
        </div>

        {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}

        <div className="form-actions" style={{ marginTop: 20 }}>
          {step > 0 && (
            <button type="button" className="btn btn--secondary" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={16} />
              Anterior
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button type="button" className="btn btn--primary" onClick={() => setStep(step + 1)}>
              Siguiente
              <ArrowRight size={16} />
            </button>
          )}
          {step === STEPS.length - 1 && (
            <button type="submit" className="btn btn--primary">
              <Save size={16} />
              Guardar consulta
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
