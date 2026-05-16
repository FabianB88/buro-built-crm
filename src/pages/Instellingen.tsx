import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import { LogOut, User, Shield } from 'lucide-react'

export default function Instellingen() {
  const { profile, logOut } = useAuth()

  return (
    <div>
      <PageHeader title="Instellingen" subtitle="Accountbeheer en applicatie-instellingen" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '560px' }}>
        {/* Profile card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <User size={16} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Profiel</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            {profile?.fotoUrl ? (
              <img src={profile.fotoUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--color-surface-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-muted)',
              }}>
                {(profile?.naam || 'G').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{profile?.naam}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{profile?.email}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ background: 'var(--color-background)', borderRadius: '7px', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Rol</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize' }}>{profile?.rol || '—'}</div>
            </div>
            <div style={{ background: 'var(--color-background)', borderRadius: '7px', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Aangemeld via</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Google</div>
            </div>
          </div>
        </div>

        {/* System info */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Shield size={16} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Systeem</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              { label: 'Applicatie', value: 'Buro BUILT CRM' },
              { label: 'Organisatie', value: 'HAN Academie Built Environment' },
              { label: 'Backend', value: 'Firebase Firestore' },
              { label: 'Versie', value: '1.0.0' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div>
          <Button variant="ghost" onClick={logOut} style={{ gap: '0.5rem' }}>
            <LogOut size={15} />
            Uitloggen
          </Button>
        </div>
      </div>
    </div>
  )
}
