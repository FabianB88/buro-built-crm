import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Briefcase, Mail } from 'lucide-react'
import { subscribeClients, addClient, updateClient, deleteClient } from '../services/clients'
import { Client } from '../types'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'

type FormState = {
  naam: string; type: string; contactpersoon: string; email: string;
  telefoon: string; website: string; sector: string;
  status: 'actief' | 'inactief' | 'prospect'; notitie: string;
}

const emptyForm: FormState = {
  naam: '', type: '', contactpersoon: '', email: '',
  telefoon: '', website: '', sector: '', status: 'prospect', notitie: '',
}

const STATUS_BADGE: Record<string, 'success' | 'accent' | 'default'> = {
  actief: 'success', prospect: 'accent', inactief: 'default',
}

export default function Opdrachtgevers() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<FormState>({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  useEffect(() => subscribeClients(setClients), [])

  const filtered = useMemo(() => {
    if (!search) return clients
    const q = search.toLowerCase()
    return clients.filter(c =>
      c.naam.toLowerCase().includes(q) ||
      (c.contactpersoon || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  }, [clients, search])

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true) }
  const openEdit = (c: Client) => {
    setEditing(c)
    setForm({
      naam: c.naam, type: c.type || '', contactpersoon: c.contactpersoon || '',
      email: c.email || '', telefoon: c.telefoon || '', website: c.website || '',
      sector: c.sector || '', status: c.status, notitie: c.notitie || '',
    })
    setModalOpen(true)
  }

  const f = (field: keyof FormState, value: string) => setForm(p => ({ ...p, [field]: value }))

  const handleSave = async () => {
    if (!form.naam.trim()) return
    setSaving(true)
    try {
      const now = Date.now()
      if (editing?.id) {
        await updateClient(editing.id, { ...form, bijgewerktOp: now })
      } else {
        await addClient({ ...form, aangemaaktOp: now, bijgewerktOp: now })
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteClient(deleteId)
    setDeleteId(null)
  }

  return (
    <div>
      <PageHeader
        title="Opdrachtgevers"
        subtitle={`${clients.length} opdrachtgevers`}
        action={<Button onClick={openAdd}><Plus size={15} /> Nieuwe opdrachtgever</Button>}
      />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <SearchBar
          placeholder="Zoek op naam, contactpersoon of e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '280px' }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={search ? 'Geen resultaten' : 'Nog geen opdrachtgevers'}
          description={search ? 'Pas je zoekopdracht aan.' : 'Voeg je eerste opdrachtgever toe.'}
          action={!search ? <Button onClick={openAdd}><Plus size={15} /> Nieuwe opdrachtgever</Button> : undefined}
        />
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)' }}>
                {['Naam', 'Contactpersoon', 'E-mail', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}>{c.naam}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{c.contactpersoon || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
                    {c.email ? <a href={`mailto:${c.email}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={12} />{c.email}</a> : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={STATUS_BADGE[c.status] || 'default'}>{c.status}</Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil size={13} /></Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteId(c.id!)}><Trash2 size={13} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Opdrachtgever bewerken' : 'Nieuwe opdrachtgever'} width={480}
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Annuleren</Button><Button onClick={handleSave} disabled={saving || !form.naam.trim()}>{saving ? 'Opslaan...' : editing ? 'Bijwerken' : 'Toevoegen'}</Button></>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ gridColumn: '1 / -1' }}><Input label="Naam *" value={form.naam} onChange={e => f('naam', e.target.value)} placeholder="Naam opdrachtgever" /></div>
          <Select label="Status" value={form.status} onChange={e => f('status', e.target.value)}>
            <option value="prospect">Prospect</option>
            <option value="actief">Actief</option>
            <option value="inactief">Inactief</option>
          </Select>
          <Select label="Type" value={form.type} onChange={e => f('type', e.target.value)}>
            <option value="">Selecteer type</option>
            <option value="publiek">Publiek</option><option value="privaat">Privaat</option>
            <option value="non-profit">Non-profit</option><option value="overig">Overig</option>
          </Select>
          <Input label="Contactpersoon" value={form.contactpersoon} onChange={e => f('contactpersoon', e.target.value)} placeholder="Naam" />
          <Input label="E-mail" value={form.email} onChange={e => f('email', e.target.value)} type="email" placeholder="info@org.nl" />
          <Input label="Telefoon" value={form.telefoon} onChange={e => f('telefoon', e.target.value)} placeholder="+31 ..." />
          <Input label="Sector" value={form.sector} onChange={e => f('sector', e.target.value)} placeholder="bv. Bouw" />
          <Input label="Website" value={form.website} onChange={e => f('website', e.target.value)} placeholder="https://..." />
          <div style={{ gridColumn: '1 / -1' }}><Textarea label="Notitie" value={form.notitie} onChange={e => f('notitie', e.target.value)} placeholder="Extra informatie..." /></div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Opdrachtgever verwijderen"
        footer={<><Button variant="ghost" onClick={() => setDeleteId(null)}>Annuleren</Button><Button variant="danger" onClick={handleDelete}>Verwijderen</Button></>}
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Weet je zeker dat je deze opdrachtgever wilt verwijderen? Dit kan niet ongedaan worden gemaakt.</p>
      </Modal>
    </div>
  )
}
