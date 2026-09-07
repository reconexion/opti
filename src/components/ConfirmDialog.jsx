import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

// Diálogo de confirmación genérico para acciones sensibles (desactivar,
// eliminar, restablecer contraseña). Para las más destructivas, `requireText`
// obliga a escribir un texto exacto (ej. el usuario) antes de habilitar el
// botón de confirmar, así una acción no se dispara por un clic accidental.
export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  requireText,
  busy = false,
  error,
  confirmDisabled: externalDisabled = false,
  onConfirm,
  onCancel,
  children,
}) {
  const [typed, setTyped] = useState('')
  const requireOk = !requireText || typed === requireText
  const confirmDisabled = busy || !requireOk || externalDisabled

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onCancel}>
      <div className="modal-panel reveal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-panel__header">
          {danger && <AlertTriangle size={18} className="modal-panel__icon" />}
          <h3>{title}</h3>
        </div>
        {description && <p className="modal-panel__desc">{description}</p>}
        {children}
        {requireText && (
          <div className="field">
            <label>
              Escribe <strong>{requireText}</strong> para confirmar
            </label>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus autoComplete="off" />
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
