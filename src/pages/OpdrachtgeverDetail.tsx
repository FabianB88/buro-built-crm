import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { subscribeClients, updateClient } from '../services/clients'
import { subscribeProjects } from '../services/projects'
import { subscribeContacts } from '../services/contacts'
import { Client, Project, Contact } from '../types'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import { ArrowLeft, FolderKanban, Users, Pencil, Mail, Phone, Globe } from 'lucide-react'

const STATUS_BADGE: Record<string, 'success' | 'accent' | 'default'> = {
  actief: 'success', prospect: 'accent', inactief: 'default',
}

const PROJ_STATUS_BADGE: Record<string, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  concept: 'default', actief: 'success', 'on-hold': 'warning', afgerond: 'accent', geannuleerd: 'danger',
}

export default function OpdrachtgeverDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Client>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsubs = [
      subscribeClients(setClients),
      subscribeProjects(setProjects),
      subscribeContacts(setContacts),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  const client = useMemo(() => clients.find(c => c.id === id), [clients, id])

  const linkedProjects = useMemo(
    () => projects.filter(p => p.opdrachtgeverId === id),
    [projects, id]
  )

  // contacts where bedrijf matches the client name (case-insensitive)
  const linkedContacts = useMemo(() => {
    if (!client) return []
    const name = client.naam.toLowerCase()
    return contacts.filter(c => c.bedrijf?.toLowerCase() === name)
  }, [contacts, client])

  function openEdit() {
    if (!client) return
    setEditForm({ ...client })
    setEditOpen(true)
  }

  async function handleEditSave() {
    if (!client?.id || !editForm.naam?.trim()) return
    setSaving(true)
    try {
      await updateClient(client.id, { ...editForm, bijgewerktOp: Date.now() })
      setEditOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (!client) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Opdrachtgever niet gevonden.{' '}
        <button
          onClick={() => navigate('/opdrachtgevers')}
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
          onClick={() => navigate('/opdrachtgevers')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', padding: '0.35rem 0.5rem', borderRadius: '6px' }}
        >
          <ArrowLeft size={15} /> Opdrachtgevers
        </button>
        <span style={{ color: 'var(--color-border)' }}>/</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{client.naam}</span>
      </div>

      {/* Info card */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>{client.naam}</h1>
              <Badge variant={STATUS_BADGE[client.status] || 'default'}>{client.status}</Badge>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              {client.contactpersoon && (
                <span>👤 <strong style={{ color: 'var(--color-text)' }}>{client.contactpersoon}</strong></span>
              )}
              {client.sector && <span>🏭 {client.sector}</span>}
              {client.type && <span>🏷 {client.type}</span>}
              {client.email && (
                <a href={`mailto:${client.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
                  <Mail size={12} />{client.email}
                </a>
              )}
              {client.telefoon && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Phone size={12} />{client.telefoon}
                </span>
              )}
              {client.website && (
                <a href={client.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
                  <Globe size={12} />Website
                </a>
              )}
            </div>
            {client.notitie && (
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0.875rem 0 0 0', lineHeight: 1.6 }}>
                {client.notitie}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={openEdit}>
            <Pencil size={14} /> Bewerken
          </Button>
        </div>
      </div>

      {/* Linked projects */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderKanban size={17} /> Projecten
          <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
            ({linkedProjects.length})
          </span>
        </h2>
      </div>

      {linkedProjects.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1.75rem' }}>
          Geen projecten gekoppeld aan deze opdrachtgever.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.875rem', marginBottom: '1.75rem' }}>
          {linkedProjects.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/projecten/${p.id}`)}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.naam}</span>
                <Badge variant={PROJ_STATUS_BADGE[p.status] || 'default'}>{p.status}</Badge>
              </div>
              {p.omschrijving && (
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                  {p.omschrijving.slice(0, 90)}{p.omschrijving.length > 90 ? '…' : ''}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                {p.startdatum && <span>📅 {p.startdatum}</span>}
                {p.einddatum && <span>🏁 {p.einddatum}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Linked contacts */}
      <div style={{ marginBottom: '0.875rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={17} /> Contacten
          <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
            ({linkedContacts.length})
          </span>
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0.875rem 0' }}>
          Contacten met bedrijfsnaam "{client.naam}"
        </p>
      </div>

      {linkedContacts.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          Geen contacten gevonden met dit bedrijf.
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
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{c.categorie}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Opdrachtgever bewerken" width={480}
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
          <Select label="Status" value={editForm.status || 'prospect'} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as Client['status'] }))}>
            <option value="prospect">Prospect</option>
            <option value="actief">Actief</option>
            <option value="inactief">Inactief</option>
          </Select>
          <Select label="Type" value={editForm.type || ''} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}>
            <option value="">Selecteer type</option>
            <option value="publiek">Publiek</option>
            <option value="privaat">Privaat</option>
            <option value="non-profit">Non-profit</option>
            <option value="overig">Overig</option>
          </Select>
          <Input label="Contactpersoon" value={editForm.contactpersoon || ''} onChange={e => setEditForm(p => ({ ...p, contactpersoon: e.target.value }))} />
          <Input label="E-mail" type="email" value={editForm.email || ''} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
          <Input label="Telefoon" value={editForm.telefoon || ''} onChange={e => setEditForm(p => ({ ...p, telefoon: e.target.value }))} />
          <Input label="Sector" value={editForm.sector || ''} onChange={e => setEditForm(p => ({ ...p, sector: e.target.value }))} />
          <Input label="Website" value={editForm.website || ''} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea label="Notitie" value={editForm.notitie || ''} onChange={e => setEditForm(p => ({ ...p, notitie: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
