import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { LogOut, User, Shield, UserPlus, Trash2, Users } from 'lucide-react'
import {
  subscribeAllowedUsers, addAllowedUser, removeAllowedUser,
  updateAllowedUserRole, AllowedUser
} from '../services/allowedUsers'

export default function Instellingen() {
  const { profile, logOut } = useAuth()
  const isAdmin = profile?.rol === 'admin'

  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([])
  const [addModal, setAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [newRol, setNewRol] = useState<'admin' | 'member'>('member')
  const [saving, setSaving] = useState(false)
  const [emailError, setEmailError] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    return subscribeAllowedUsers(setAllowedUsers)
  }, [isAdmin])

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) { setEmailError('Voer een geldig e-mailadres in.'); return }
    if (allowedUsers.find(u => u.email === email)) { setEmailError('Dit e-mailadres is al toegevoegd.'); return }
    setSaving(true)
    try {
      await addAllowedUser({
        email,
        rol: newRol,
        toegevoegdDoor: profile?.email || '',
        toegevoegdOp: Date.now(),
      })
      setNewEmail('')
      setNewRol('member')
      setAddModal(false)
      setEmailError('')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!deleteTarget) return
    await removeAllowedUser(deleteTarget)
    setDeleteTarget(null)
  }

  const handleRoleToggle = async (u: AllowedUser) => {
    const newRole = u.rol === 'admin' ? 'member' : 'admin'
    await updateAllowedUserRole(u.email, newRole)
  }

  const card: React.CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    padding: '1.5rem',
  }

  const sectionTitle = (icon: React.ReactNode, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
      {icon}
      <h2 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>{label}</h2>
    </div>
  )

  return (
    <div>
      <PageHeader title="Instellingen" subtitle="Accountbeheer en applicatie-instellingen" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '600px' }}>

        {/* Profile */}
        <div style={card}>
          {sectionTitle(<User size={16} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />, 'Profiel')}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            {profile?.fotoUrl ? (
              <img src={profile.fotoUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {(profile?.naam || 'G').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{profile?.naam}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{profile?.email}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Rol', value: profile?.rol || '—' },
              { label: 'Aangemeld via', value: 'Google' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--color-background)', borderRadius: '7px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* User management — admin only */}
        {isAdmin && (
          <div style={card}>
            {sectionTitle(<Users size={16} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />, 'Gebruikersbeheer')}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Alleen toegevoegde e-mailadressen kunnen inloggen.
              </p>
              <Button size="sm" onClick={() => { setAddModal(true); setEmailError('') }}>
                <UserPlus size={14} /> Toevoegen
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {allowedUsers.length === 0 && (
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Geen gebruikers gevonden.</p>
              )}
              {allowedUsers.map(u => (
                <div key={u.email} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  background: 'var(--color-background)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                    {u.email.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                  <button
                    onClick={() => handleRoleToggle(u)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    title="Rol wijzigen"
                    disabled={u.email === profile?.email}
                  >
                    <Badge variant={u.rol === 'admin' ? 'accent' : 'default'}>{u.rol}</Badge>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(u.email)}
                    disabled={u.email === profile?.email}
                    title="Verwijderen"
                    style={{ background: 'none', border: 'none', cursor: u.email === profile?.email ? 'not-allowed' : 'pointer', color: 'var(--color-text-muted)', opacity: u.email === profile?.email ? 0.3 : 1, display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System info */}
        <div style={card}>
          {sectionTitle(<Shield size={16} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />, 'Systeem')}
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

        <div>
          <Button variant="ghost" onClick={logOut}>
            <LogOut size={15} /> Uitloggen
          </Button>
        </div>
      </div>

      {/* Add user modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Gebruiker toevoegen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddModal(false)}>Annuleren</Button>
            <Button onClick={handleAdd} disabled={saving || !newEmail.trim()}>
              {saving ? 'Toevoegen...' : 'Toevoegen'}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Voer het Google e-mailadres in van de persoon die toegang moet krijgen.
        </p>
        <Input
          label="E-mailadres"
          type="email"
          value={newEmail}
          onChange={e => { setNewEmail(e.target.value); setEmailError('') }}
          placeholder="naam@gmail.com"
          error={emailError}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['member', 'admin'] as const).map(r => (
              <button
                key={r}
                onClick={() => setNewRol(r)}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '7px', fontSize: '0.82rem', fontWeight: 500,
                  cursor: 'pointer', border: '1.5px solid',
                  borderColor: newRol === r ? 'var(--color-primary)' : 'var(--color-border)',
                  background: newRol === r ? 'var(--color-primary)' : 'transparent',
                  color: newRol === r ? '#fff' : 'var(--color-text-muted)',
                  transition: 'all 0.15s',
                  textTransform: 'capitalize',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Gebruiker verwijderen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Annuleren</Button>
            <Button variant="danger" onClick={handleRemove}>Verwijderen</Button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Weet je zeker dat je <strong>{deleteTarget}</strong> wilt verwijderen? Ze kunnen daarna niet meer inloggen.
        </p>
      </Modal>
    </div>
  )
}
