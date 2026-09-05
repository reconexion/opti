import { useState } from 'react'
import { LayoutDashboard, Users, ShieldCheck, Building2, BarChart3, LogOut, Menu, X } from 'lucide-react'
import logo from '../assets/gaffas-logo.jpg'
import { ROLES, listSucursales } from '../lib/storage.js'
import { useSucursal, TODAS_LAS_SUCURSALES } from '../context/sucursalContext.js'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { key: 'patients', label: 'Pacientes', icon: Users },
]

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function AppShell({ session, activeView, onNavigate, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { sucursalActiva, setSucursalActiva } = useSucursal()
  const sucursales = listSucursales()
  const isPatientsSection = ['patients', 'patientForm', 'patientProfile', 'visitForm', 'report'].includes(
    activeView,
  )
  const isDashboard = activeView === 'dashboard'

  function go(key) {
    onNavigate(key)
    setMobileOpen(false)
  }

  return (
    <div className="app-shell">
      <header className="mobile-topbar no-print">
        <button
          type="button"
          className="mobile-topbar__toggle"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <img src={logo} alt="Gaffas Correctas" className="sidebar__logo" />
        <span className="sidebar__brand-name" style={{ color: 'var(--ink)' }}>
          OptiScale
        </span>
      </header>

      {mobileOpen && (
        <div className="sidebar-backdrop reveal no-print" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar no-print ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar__brand">
          <img src={logo} alt="Gaffas Correctas" className="sidebar__logo" />
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">OptiScale</span>
            <span className="sidebar__brand-tag">RECEVI · Gaffas Correctas</span>
          </div>
          <button
            type="button"
            className="sidebar__close"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar__sucursal">
          <label htmlFor="sucursal-activa">Sucursal activa</label>
          <select
            id="sucursal-activa"
            value={sucursalActiva}
            onChange={(e) => setSucursalActiva(e.target.value)}
          >
            {sucursales.map((s) => (
              <option key={s.id} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
            {session.role === ROLES.ADMIN && (
              <option value={TODAS_LAS_SUCURSALES}>Todas las sucursales</option>
            )}
          </select>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`nav-link ${
                (key === 'dashboard' && isDashboard) || (key === 'patients' && isPatientsSection)
                  ? 'is-active'
                  : ''
              }`}
              onClick={() => go(key)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
          {session.role !== ROLES.RECEPCION && (
            <button
              type="button"
              className={`nav-link ${activeView === 'stats' ? 'is-active' : ''}`}
              onClick={() => go('stats')}
            >
              <BarChart3 size={17} />
              Estadísticas
            </button>
          )}
          {session.role === ROLES.ADMIN && (
            <>
              <button
                type="button"
                className={`nav-link ${activeView === 'users' ? 'is-active' : ''}`}
                onClick={() => go('users')}
              >
                <ShieldCheck size={17} />
                Usuarios
              </button>
              <button
                type="button"
                className={`nav-link ${activeView === 'sucursales' ? 'is-active' : ''}`}
                onClick={() => go('sucursales')}
              >
                <Building2 size={17} />
                Sucursales
              </button>
            </>
          )}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{initials(session.nombre)}</div>
            <div>
              <div className="sidebar__user-name">{session.nombre}</div>
              <div className="sidebar__user-role">{session.role}</div>
            </div>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onLogout} style={{ width: '100%' }}>
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  )
}
