import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { login } from '../lib/auth.js'
import logo from '../assets/gaffas-logo.jpg'

const DEMO_USERS = [
  { role: 'Administrador', usuario: 'admin', password: 'admin123' },
  { role: 'Optometrista', usuario: 'optometrista', password: 'optica123' },
  { role: 'Recepción', usuario: 'recepcion', password: 'recepcion123' },
]

export default function LoginPage({ onLogin }) {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await login(usuario, password)
      onLogin(session)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-screen__brand">
        <div className="auth-screen__logo-row">
          <img src={logo} alt="Gaffas Correctas" />
          <div>
            <div className="auth-screen__brand-name">OptiScale</div>
            <div className="auth-screen__brand-tag">Módulo clínico RECEVI</div>
          </div>
        </div>

        <div className="auth-screen__headline">
          <h1>Evolución visual de tus pacientes, siempre a la mano.</h1>
          <p>
            Registra consultas, compara graduaciones y entrega reportes claros, sin perder
            el historial de ninguna visita.
          </p>
        </div>

        <div className="auth-screen__footnote">
          Óptica Gaffas Correctas · Distribuidor autorizado Carl Zeiss Vision
          <br />
          Tuxtla Gutiérrez &amp; Comitán, Chiapas
        </div>
      </section>

      <section className="auth-screen__form">
        <div className="auth-card">
          <h1>Iniciar sesión</h1>
          <p>Ingresa con tu usuario y contraseña para continuar.</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="usuario">Usuario</label>
              <input
                id="usuario"
                type="text"
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn btn--primary" disabled={loading} style={{ width: '100%' }}>
              <LogIn size={16} />
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <div className="demo-users">
            <h3>Usuarios de prueba (datos guardados localmente)</h3>
            {DEMO_USERS.map((u) => (
              <div className="demo-users__item" key={u.usuario}>
                <span>{u.role}</span>
                <code>
                  {u.usuario} / {u.password}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
