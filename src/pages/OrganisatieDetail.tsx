import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { subscribeOrganizations, updateOrganization } from '../services/organizations'
import { subscribeContacts } from '../services/contacts'
import { Organization, Contact } from '../types'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import { ArrowLeft, Users, Pencil, Mail, Phone, Globe } from 'lucide-react'

const CAT_BADGE: Record<string, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  klant: 'success', netwerk: 'accent', leverancier: 'warning', overig: 'default',
}

export default function OrganisatieDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [orgs, setOrgs] = useState<Organization[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Organization>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsubs = [
      subscribeOrganizations(setOrgs),
      subscribeContacts(setContacts),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  const org = useMemo(() => orgs.find(o => o.id === id), [orgs, id])

  // contacts linked via organisatieId OR matching bedrijf name (fallback)
  const linkedContacts = useMemo(() => {
    if (!org) return []
    return contacts.filter(c =>
      c.organisatieId === id ||
      (!c.organisatieId && c.bedrijf?.toLowerCase() === org.naam.toLowerCase())
    )
  }, [contacts, org, id])

  function openEdit() {
    if (!org) return
    setEditForm({ ...org })
    setEditOpen(true)
  }

  async function handleEditSave() {
    if (!org?.id || !editForm.naam?.trim()) return
    setSaving(true)
    try {
      await updateOrganization(org.id, { ...editForm, bijgewerktOp: Date.now() })
      setEditOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (!org) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Organisatie niet gevonden.{' '}
        <button
          onClick={() => navigate('/organisaties')}
          style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Terug
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/organisaties')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', padding: '0.35rem 0.5rem', borderRadius: '6px' }}
        >
          <ArrowLeft size={15} /> Organisaties
        </button>
        <span style={{ color: 'var(--color-border)' }}>/</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{org.naam}</span>
      </div>

      {/* Info card */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>{org.naam}</h1>
              {org.type && <Badge variant="default">{org.type}</Badge>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              {org.sector && <span>🏭 {org.sector}</span>}
              {org.regio && <span>📍 {org.regio}</span>}
              {org.contactpersoon && (
                <span>👤 <strong style={{ color: 'var(--color-text)' }}>{org.contactpersoon}</strong></span>
              )}
              {org.email && (
                <a href={`mailto:${org.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
                  <Mail size={12} />{org.email}
                </a>
              )}
              {org.telefoon && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Phone size={12} />{org.telefoon}
                </span>
              )}
              {org.website && (
                <a href={org.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
                  <Globe size={12} />Website
                </a>
              )}
            </div>
            {org.beschrijving && (
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0.875rem 0 0 0', lineHeight: 1.6 }}>
                {org.beschrijving}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={openEdit}>
            <Pencil size={14} /> Bewerken
          </Button>
        </div>
      </div>

      {/* Linked contacts */}
      <div style={{ marginBottom: '0.875rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={17} /> Contacten
          <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
            ({linkedContacts.length})
          </span>
        </h2>
      </div>

      {linkedContacts.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          Geen contacten gekoppeld. Koppel een contact door bij het contact de organisatie in te vullen.
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)' }}>
                {['Naam', 'Functie', 'E-mail', 'Categorie'].map(h => (
                  <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linkedContacts.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/contacten/${c.id}`)}
                  style={{ borderBottom: i < linkedContacts.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}>{c.naam}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{c.functie || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{c.email}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={CAT_BADGE[c.categorie] || 'default'}>{c.categorie}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Organisatie bewerken" width={480}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Annuleren</Button>
            <Button onClick={handleEditSave} disabled={saving || !editForm.naam?.trim()}>
              {saving ? 'Opslaan…' : 'Bijwerken'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Naam *" value={editForm.naam || ''} onChange={e => setEditForm(p => ({ ...p, naam: e.target.value }))} />
          </div>
          <Select label="Type" value={editForm.type || ''} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}>
            <option value="">Selecteer type</option>
            <option value="bv">BV</option>
            <option value="nv">NV</option>
            <option value="overheid">Overheid</option>
            <option value="stichting">Stichting</option>
            <option value="overig">Overig</option>
          </Select>
          <Input label="Sector" value={editForm.sector || ''} onChange={e => setEditForm(p => ({ ...p, sector: e.target.value }))} />
          <Input label="Contactpersoon" value={editForm.contactpersoon || ''} onChange={e => setEditForm(p => ({ ...p, contactpersoon: e.target.value }))} />
          <Input label="E-mail" type="email" value={editForm.email || ''} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
          <Input label="Telefoon" value={editForm.telefoon || ''} onChange={e => setEditForm(p => ({ ...p, telefoon: e.target.value }))} />
          <Input label="Website" value={editForm.website || ''} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} />
          <Input label="Regio" value={editForm.regio || ''} onChange={e => setEditForm(p => ({ ...p, regio: e.target.value }))} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea label="Beschrijving" value={editForm.beschrijving || ''} onChange={e => setEditForm(p => ({ ...p, beschrijving: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
