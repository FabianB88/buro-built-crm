import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Contacten from './pages/Contacten'
import Organisaties from './pages/Organisaties'
import Opdrachtgevers from './pages/Opdrachtgevers'
import Projecten from './pages/Projecten'
import Taken from './pages/Taken'
import Notities from './pages/Notities'
import Instellingen from './pages/Instellingen'
import ContactDetail from './pages/ContactDetail'
import MijnTaken from './pages/MijnTaken'

function ProtectedApp() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contacten" element={<Contacten />} />
        <Route path="/contacten/:id" element={<ContactDetail />} />
        <Route path="/organisaties" element={<Organisaties />} />
        <Route path="/opdrachtgevers" element={<Opdrachtgevers />} />
        <Route path="/projecten" element={<Projecten />} />
        <Route path="/taken" element={<Taken />} />
        <Route path="/mijn-taken" element={<MijnTaken />} />
        <Route path="/notities" element={<Notities />} />
        <Route path="/instellingen" element={<Instellingen />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Laden...</div>
      </div>
    )
  }

  return (
    <BrowserRouter basename="/buro-built-crm">
      {user ? <ProtectedApp /> : (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      )}
    </BrowserRouter>
  )
}
