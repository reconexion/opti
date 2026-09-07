import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { currentSession, logout } from './lib/auth.js'
import { ensureSeed } from './lib/storage.js'
import AppShell from './components/AppShell.jsx'
import { SucursalProvider } from './context/SucursalProvider.jsx'
import LoginPage from './components/LoginPage.jsx'
import Dashboard from './components/Dashboard.jsx'
import UserManagement from './components/UserManagement.jsx'
import SucursalManagement from './components/SucursalManagement.jsx'
import Statistics from './components/Statistics.jsx'
import PatientSearch from './components/PatientSearch.jsx'
import PatientForm from './components/PatientForm.jsx'
import PatientProfile from './components/PatientProfile.jsx'
import VisitForm from './components/VisitForm.jsx'
import ReportView from './components/ReportView.jsx'

// Mapea las claves de navegación que ya usan Dashboard/AppShell a rutas reales.
const NAV_MAP = {
  dashboard: '/dashboard',
  patients: '/patients',
  patientForm: '/patients/new',
  stats: '/stats',
  users: '/users',
  sucursales: '/sucursales',
}

function activeViewFor(pathname) {
  if (pathname.startsWith('/patients')) return 'patients'
  if (pathname.startsWith('/stats')) return 'stats'
  if (pathname.startsWith('/users')) return 'users'
  if (pathname.startsWith('/sucursales')) return 'sucursales'
  return 'dashboard'
}

function PatientsRoute() {
  const navigate = useNavigate()
  return (
    <PatientSearch
      onSelectPatient={(id) => navigate(`/patients/${id}`)}
      onNewPatient={() => navigate('/patients/new')}
    />
  )
}

function PatientFormRoute() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  return (
    <PatientForm
      key={patientId || 'new'}
      patientId={patientId}
      onBack={() => navigate(patientId ? `/patients/${patientId}` : '/patients')}
      onSaved={(id) => navigate(`/patients/${id}`)}
    />
  )
}

function PatientProfileRoute({ session }) {
  const navigate = useNavigate()
  const { patientId } = useParams()
  return (
    <PatientProfile
      key={patientId}
      patientId={patientId}
      session={session}
      onBack={() => navigate('/patients')}
      onNewVisit={(id) => navigate(`/patients/${id}/visits/new`)}
      onEditPatient={(id) => navigate(`/patients/${id}/edit`)}
      onEditVisit={(visitId) => navigate(`/patients/${patientId}/visits/${visitId}/edit`)}
      onViewReport={(visitId) => navigate(`/patients/${patientId}/visits/${visitId}/report`)}
      onPatientDeleted={() => navigate('/patients')}
    />
  )
}

function VisitFormRoute({ session }) {
  const navigate = useNavigate()
  const { patientId, visitId } = useParams()
  return (
    <VisitForm
      key={visitId || `new-${patientId}`}
      patientId={patientId}
      visitId={visitId}
      session={session}
      onBack={() => navigate(`/patients/${patientId}`)}
      onSaved={(savedVisitId) => navigate(`/patients/${patientId}/visits/${savedVisitId}/report`)}
    />
  )
}

function ReportRoute() {
  const navigate = useNavigate()
  const { patientId, visitId } = useParams()
  return <ReportView key={visitId} visitId={visitId} onBack={() => navigate(`/patients/${patientId}`)} />
}

export default function App() {
  const [seeded, setSeeded] = useState(false)
  const [session, setSession] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    ensureSeed().then(() => {
      setSession(currentSession())
      setSeeded(true)
    })
  }, [])

  // Expiración automática de sesión: revisa cada 30s.
  useEffect(() => {
    const interval = setInterval(() => {
      const active = currentSession()
      if (!active && session) {
        setSession(null)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [session])

  function handleLogin(newSession) {
    setSession(newSession)
    navigate('/dashboard')
  }

  function handleLogout() {
    logout()
    setSession(null)
  }

  function goTo(key) {
    navigate(NAV_MAP[key] || '/dashboard')
  }

  if (!seeded) return null
  if (!session) return <LoginPage onLogin={handleLogin} />

  return (
    <SucursalProvider>
      <AppShell
        session={session}
        activeView={activeViewFor(location.pathname)}
        onNavigate={goTo}
        onLogout={handleLogout}
      >
        <div key={location.pathname} className="view-transition">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard session={session} onNavigate={goTo} />} />
            <Route path="/patients" element={<PatientsRoute />} />
            <Route path="/patients/new" element={<PatientFormRoute />} />
            <Route path="/patients/:patientId/edit" element={<PatientFormRoute />} />
            <Route path="/patients/:patientId" element={<PatientProfileRoute session={session} />} />
            <Route path="/patients/:patientId/visits/new" element={<VisitFormRoute session={session} />} />
            <Route
              path="/patients/:patientId/visits/:visitId/edit"
              element={<VisitFormRoute session={session} />}
            />
            <Route path="/patients/:patientId/visits/:visitId/report" element={<ReportRoute />} />
            <Route path="/stats" element={<Statistics />} />
            <Route path="/users" element={<UserManagement session={session} />} />
            <Route path="/sucursales" element={<SucursalManagement />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AppShell>
    </SucursalProvider>
  )
}
