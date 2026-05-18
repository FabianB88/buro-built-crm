import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Building2, Mail, Eye } from 'lucide-react'
import { subscribeOrganizations, addOrganization, updateOrganization, deleteOrganization } from '../services/organizations'
import { Organization } from '../types'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'

type FormState = {
  naam: string; type: string; sector: string; website: string;
  regio: string; contactpersoon: string; email: string; telefoon: string; beschrijving: string;
}

const emptyForm: FormState = {
  naam: '', type: '', sector: '', website: '',
  regio: '', contactpersoon: '', email: '', telefoon: '', beschrijving: '',
}

export default function Organisaties() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Organization | null>(null)
  const [form, setForm] = useState<FormState>({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  useEffect(() => subscribeOrganizations(setOrganizations), [])

  const filtered = useMemo(() => {
    if (!search) return organizations
    const q = search.toLowerCase()
    return organizations.filter(o =>
      o.naam.toLowerCase().includes(q) ||
      (o.sector || '').toLowerCase().includes(q) ||
      (o.contactpersoon || '').toLowerCase().includes(q)
    )
  }, [organizations, search])

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true) }
  const openEdit = (o: Organization) => {
    setEditing(o)
    setForm({
      naam: o.naam, type: o.type || '', sector: o.sector || '',
      website: o.website || '', regio: o.regio || '',
      contactpersoon: o.contactpersoon || '', email: o.email || '',
      telefoon: o.telefoon || '', beschrijving: o.beschrijving || '',
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
        await updateOrganization(editing.id, { ...form, bijgewerktOp: now })
      } else {
        await addOrganization({ ...form, aangemaaktOp: now, bijgewerktOp: now })
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteOrganization(deleteId)
    setDeleteId(null)
  }

  return (
    <div>
      <PageHeader
        title="Organisaties"
        subtitle={`${organizations.length} organisaties`}
        action={<Button onClick={openAdd}><Plus size={15} /> Nieuwe organisatie</Button>}
      />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <SearchBar
          placeholder="Zoek op naam, sector of contactpersoon..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '280px' }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? 'Geen resultaten' : 'Nog geen organisaties'}
          description={search ? 'Pas je zoekopdracht aan.' : 'Voeg je eerste organisatie toe.'}
          action={!search ? <Button onClick={openAdd}><Plus size={15} /> Nieuwe organisatie</Button> : undefined}
        />
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)' }}>
                {['Naam', 'Sector', 'Contactpersoon', 'E-mail', 'Regio', ''].map(h => (
                  <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}>{o.naam}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{o.sector || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{o.contactpersoon || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
                    {o.email ? <a href={`mailto:${o.email}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={12} />{o.email}</a> : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{o.regio || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/organisaties/${o.id}`)}><Eye size={13} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(o)}><Pencil size={13} /></Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteId(o.id!)}><Trash2 size={13} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Organisatie bewerken' : 'Nieuwe organisatie'} width={480}
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Annuleren</Button><Button onClick={handleSave} disabled={saving || !form.naam.trim()}>{saving ? 'Opslaan...' : editing ? 'Bijwerken' : 'Toevoegen'}</Button></>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ gridColumn: '1 / -1' }}><Input label="Naam *" value={form.naam} onChange={e => f('naam', e.target.value)} placeholder="Naam organisatie" /></div>
          <Select label="Type" value={form.type} onChange={e => f('type', e.target.value)}>
            <option value="">Selecteer type</option>
            <option value="bv">BV</option><option value="nv">NV</option>
            <option value="overheid">Overheid</option><option value="stichting">Stichting</option>
            <option value="overig">Overig</option>
          </Select>
          <Input label="Sector" value={form.sector} onChange={e => f('sector', e.target.value)} placeholder="bv. Bouw" />
          <Input label="Contactpersoon" value={form.contactpersoon} onChange={e => f('contactpersoon', e.target.value)} placeholder="Naam" />
          <Input label="E-mail" value={form.email} onChange={e => f('email', e.target.value)} type="email" placeholder="info@org.nl" />
          <Input label="Telefoon" value={form.telefoon} onChange={e => f('telefoon', e.target.value)} placeholder="+31 ..." />
          <Input label="Website" value={form.website} onChange={e => f('website', e.target.value)} placeholder="https://..." />
          <Input label="Regio" value={form.regio} onChange={e => f('regio', e.target.value)} placeholder="Stad / regio" />
          <div style={{ gridColumn: '1 / -1' }}><Textarea label="Beschrijving" value={form.beschrijving} onChange={e => f('beschrijving', e.target.value)} placeholder="Notities..." /></div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Organisatie verwijderen"
        footer={<><Button variant="ghost" onClick={() => setDeleteId(null)}>Annuleren</Button><Button variant="danger" onClick={handleDelete}>Verwijderen</Button></>}
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Weet je zeker dat je deze organisatie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.</p>
      </Modal>
    </div>
  )
}
