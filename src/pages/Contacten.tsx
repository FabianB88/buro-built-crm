import { useEffect, useState, useMemo } from 'react'
import { subscribeContacts, addContact, updateContact, deleteContact } from '../services/contacts'
import { Contact } from '../types'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'
import { Plus, Pencil, Trash2, Users, Mail, Phone, Building2 } from 'lucide-react'

const CATEGORIE_BADGE: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'accent'> = {
  klant: 'success',
  netwerk: 'accent',
  leverancier: 'warning',
  overig: 'default',
}

const empty: Omit<Contact, 'id' | 'aangemaaktOp' | 'bijgewerktOp'> = {
  naam: '', email: '', telefoon: '', bedrijf: '', functie: '',
  categorie: 'klant', tags: [], website: '', branche: '', regio: '', notitie: '',
}

export default function Contacten() {
  const { profile } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState({ ...empty })
  const [saving, setSaving] = useState(false)

  useEffect(() => subscribeContacts(setContacts), [])

  const filtered = useMemo(() => {
    let list = contacts
    if (filterCat) list = list.filter(c => c.categorie === filterCat)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.naam.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.bedrijf || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [contacts, search, filterCat])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...empty })
    setModalOpen(true)
  }

  const openEdit = (c: Contact) => {
    setEditing(c)
    setForm({
      naam: c.naam, email: c.email, telefoon: c.telefoon || '',
      bedrijf: c.bedrijf || '', functie: c.functie || '',
      categorie: c.categorie, tags: c.tags || [],
      website: c.website || '', branche: c.branche || '',
      regio: c.regio || '', notitie: c.notitie || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.naam.trim()) return
    setSaving(true)
    try {
      const now = Date.now()
      if (editing?.id) {
        await updateContact(editing.id, { ...form, bijgewerktOp: now })
      } else {
        await addContact({ ...form, aangemaaktOp: now, bijgewerktOp: now })
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteContact(deleteId)
    setDeleteId(null)
  }

  const f = (field: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div>
      <PageHeader
        title="Contacten"
        subtitle={`${contacts.length} contacten`}
        action={<Button onClick={openAdd}><Plus size={15} /> Nieuw contact</Button>}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <SearchBar
          placeholder="Zoek op naam, e-mail, bedrijf..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '260px' }}
        />
        <Select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: '160px' }}>
          <option value="">Alle categorieën</option>
          <option value="klant">Klant</option>
          <option value="netwerk">Netwerk</option>
          <option value="leverancier">Leverancier</option>
          <option value="overig">Overig</option>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || filterCat ? 'Geen resultaten' : 'Nog geen contacten'}
          description={search || filterCat ? 'Pas je zoekopdracht aan.' : 'Voeg je eerste contact toe.'}
          action={!search && !filterCat ? <Button onClick={openAdd}><Plus size={15} /> Nieuw contact</Button> : undefined}
        />
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)' }}>
                {['Naam', 'Bedrijf', 'E-mail', 'Telefoon', 'Categorie', ''].map(h => (
                  <th key={h} style={{
                    padding: '0.7rem 1rem', textAlign: 'left',
                    fontSize: '0.72rem', fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--color-surface-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', flexShrink: 0,
                      }}>
                        {c.naam.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.naam}</div>
                        {c.functie && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{c.functie}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {c.bedrijf ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Building2 size={12} />
                        {c.bedrijf}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
                    {c.email ? (
                      <a href={`mailto:${c.email}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Mail size={12} />
                        {c.email}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {c.telefoon ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Phone size={12} />
                        {c.telefoon}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={CATEGORIE_BADGE[c.categorie] || 'default'}>
                      {c.categorie}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Pencil size={13} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteId(c.id!)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Contact bewerken' : 'Nieuw contact'}
        width={480}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuleren</Button>
            <Button onClick={handleSave} disabled={saving || !form.naam.trim()}>
              {saving ? 'Opslaan...' : editing ? 'Bijwerken' : 'Toevoegen'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Naam *" value={form.naam} onChange={e => f('naam', e.target.value)} placeholder="Volledige naam" />
          </div>
          <Input label="E-mail" value={form.email} onChange={e => f('email', e.target.value)} type="email" placeholder="naam@bedrijf.nl" />
          <Input label="Telefoon" value={form.telefoon} onChange={e => f('telefoon', e.target.value)} placeholder="+31 6 ..." />
          <Input label="Bedrijf" value={form.bedrijf} onChange={e => f('bedrijf', e.target.value)} placeholder="Bedrijfsnaam" />
          <Input label="Functie" value={form.functie} onChange={e => f('functie', e.target.value)} placeholder="Functietitel" />
          <Select label="Categorie" value={form.categorie} onChange={e => f('categorie', e.target.value)}>
            <option value="klant">Klant</option>
            <option value="netwerk">Netwerk</option>
            <option value="leverancier">Leverancier</option>
            <option value="overig">Overig</option>
          </Select>
          <Input label="Regio" value={form.regio} onChange={e => f('regio', e.target.value)} placeholder="Stad / regio" />
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea label="Notitie" value={form.notitie} onChange={e => f('notitie', e.target.value)} placeholder="Extra informatie..." />
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Contact verwijderen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Annuleren</Button>
            <Button variant="danger" onClick={handleDelete}>Verwijderen</Button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Weet je zeker dat je dit contact wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
      </Modal>
    </div>
  )
}
