import { useEffect, useState } from 'react'
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

export default function App() {
  const [seeded, setSeeded] = useState(false)
  const [session, setSession] = useState(null)
  const [view, setView] = useState('dashboard')
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [selectedVisitId, setSelectedVisitId] = useState(null)

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
        setView('dashboard')
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [session])

  function handleLogin(newSession) {
    setSession(newSession)
    setView('dashboard')
  }

  function handleLogout() {
    logout()
    setSession(null)
  }

  if (!seeded) return null
  if (!session) return <LoginPage onLogin={handleLogin} />

  function renderView() {
    switch (view) {
      case 'users':
        return <UserManagement />

      case 'sucursales':
        return <SucursalManagement />

      case 'stats':
        return <Statistics />

      case 'patients':
        return (
          <PatientSearch
            onSelectPatient={(id) => {
              setSelectedPatientId(id)
              setView('patientProfile')
            }}
            onNewPatient={() => setView('patientForm')}
          />
        )

      case 'patientForm':
        return (
          <PatientForm
            onBack={() => setView('patients')}
            onCreated={(id) => {
              setSelectedPatientId(id)
              setView('patientProfile')
            }}
          />
        )

      case 'patientProfile':
        return (
          <PatientProfile
            patientId={selectedPatientId}
            session={session}
            onBack={() => setView('patients')}
            onNewVisit={() => setView('visitForm')}
            onViewReport={(visitId) => {
              setSelectedVisitId(visitId)
              setView('report')
            }}
          />
        )

      case 'visitForm':
        return (
          <VisitForm
            patientId={selectedPatientId}
            session={session}
            onBack={() => setView('patientProfile')}
            onSaved={(visitId) => {
              setSelectedVisitId(visitId)
              setView('report')
            }}
          />
        )

      case 'report':
        return <ReportView visitId={selectedVisitId} onBack={() => setView('patientProfile')} />

      case 'dashboard':
      default:
        return <Dashboard session={session} onNavigate={setView} />
    }
  }

  return (
    <SucursalProvider>
      <AppShell session={session} activeView={view} onNavigate={setView} onLogout={handleLogout}>
        <div key={view} className="view-transition">
          {renderView()}
        </div>
      </AppShell>
    </SucursalProvider>
  )
}
