import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Users, Building2, Briefcase,
  FolderKanban, CheckSquare, StickyNote, Settings, LogOut, ListTodo
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mijn-taken', icon: ListTodo, label: 'Mijn taken' },
  { to: '/contacten', icon: Users, label: 'Contacten' },
  { to: '/organisaties', icon: Building2, label: 'Organisaties' },
  { to: '/opdrachtgevers', icon: Briefcase, label: 'Opdrachtgevers' },
  { to: '/projecten', icon: FolderKanban, label: 'Projecten' },
  { to: '/taken', icon: CheckSquare, label: 'Alle taken' },
  { to: '/notities', icon: StickyNote, label: 'Notities' },
]

const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.55rem 0.75rem',
  borderRadius: '7px',
  fontSize: '0.875rem',
  fontWeight: isActive ? 600 : 500,
  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
  background: isActive ? 'var(--color-surface-muted)' : 'transparent',
  textDecoration: 'none',
  transition: 'background 0.15s, color 0.15s',
  border: 'none',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left',
})

export default function Sidebar() {
  const { profile, logOut } = useAuth()

  return (
    <aside style={{
      width: '220px',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      padding: '1.5rem 0',
      zIndex: 50,
    }}>
      {/* Brand */}
      <div style={{ padding: '0 1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px' }}>
          HAN Academie
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.02em' }}>
          Buro BUILT
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 0.75rem', overflowY: 'auto' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => navLinkStyle(isActive)}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'var(--color-surface-muted)'
                el.style.color = 'var(--color-primary)'
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'transparent'
                el.style.color = 'var(--color-text-muted)'
              }
            }}
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.75rem 0' }} />

      {/* Settings */}
      <div style={{ padding: '0 0.75rem', marginBottom: '0.5rem' }}>
        <NavLink to="/instellingen" style={({ isActive }) => navLinkStyle(isActive)}>
          <Settings size={16} strokeWidth={1.75} />
          Instellingen
        </NavLink>
      </div>

      {/* User */}
      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        {profile?.fotoUrl ? (
          <img src={profile.fotoUrl} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            {(profile?.naam || 'G').charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.naam || 'Gebruiker'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
            {profile?.rol || 'member'}
          </div>
        </div>
        <button
          onClick={logOut}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', borderRadius: '5px', display: 'flex', alignItems: 'center' }}
          title="Uitloggen"
        >
          <LogOut size={15} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  )
}
