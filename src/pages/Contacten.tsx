import { useEffect, useState, useMemo, KeyboardEvent } from 'react'
import { subscribeContacts, addContact, updateContact, deleteContact } from '../services/contacts'
import { Contact } from '../types'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'
import { useNavigate } from 'react-router-dom'
import { exportToCsv } from '../utils/exportCsv'
import { Plus, Pencil, Trash2, Users, Mail, Phone, Building2, X, Download, Eye } from 'lucide-react'

const CATEGORIE_BADGE: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'accent'> = {
  klant: 'success',
  netwerk: 'accent',
  leverancier: 'warning',
  overig: 'default',
}

type FormState = Omit<Contact, 'id' | 'aangemaaktOp' | 'bijgewerktOp'>

const emptyForm = (): FormState => ({
  naam: '', email: '', telefoon: '', bedrijf: '', functie: '',
  categorie: 'klant', tags: [], website: '', branche: '', regio: '', notitie: '',
})

function TagInput({ tags, onChange }: { tags: string[], onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim().toLowerCase()
    if (val && !tags.includes(val)) onChange([...tags, val])
    setInput('')
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
        Tags
      </label>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center',
        padding: '0.5rem 0.625rem', minHeight: '38px',
        background: 'var(--color-background)', border: '1.5px solid var(--color-border)',
        borderRadius: '7px', cursor: 'text',
      }}>
        {tags.map(t => (
          <span key={t} style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '0.72rem', fontWeight: 500, padding: '2px 8px',
            background: 'var(--color-surface-muted)', borderRadius: '20px',
            color: 'var(--color-text-muted)',
          }}>
            {t}
            <button onClick={() => onChange(tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--color-text-muted)' }}>
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={tags.length === 0 ? 'Typ een tag en druk Enter…' : ''}
          style={{ flex: 1, minWidth: '100px', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.82rem', color: 'var(--color-text)' }}
        />
      </div>
    </div>
  )
}

export default function Contacten() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => subscribeContacts(setContacts), [])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    contacts.forEach(c => (c.tags || []).forEach(t => set.add(t)))
    return [...set].sort()
  }, [contacts])

  const filtered = useMemo(() => {
    let list = contacts
    if (filterCat) list = list.filter(c => c.categorie === filterCat)
    if (filterTag) list = list.filter(c => (c.tags || []).includes(filterTag))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.naam.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.bedrijf || '').toLowerCase().includes(q) ||
        (c.tags || []).some(t => t.includes(q))
      )
    }
    return list
  }, [contacts, search, filterCat, filterTag])

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setError(''); setModalOpen(true) }
  const openEdit = (c: Contact) => {
    setEditing(c)
    setForm({
      naam: c.naam, email: c.email, telefoon: c.telefoon || '',
      bedrijf: c.bedrijf || '', functie: c.functie || '',
      categorie: c.categorie, tags: c.tags || [],
      website: c.website || '', branche: c.branche || '',
      regio: c.regio || '', notitie: c.notitie || '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.naam.trim()) return
    setSaving(true)
    setError('')
    try {
      const now = Date.now()
      if (editing?.id) {
        await updateContact(editing.id, { ...form, bijgewerktOp: now })
      } else {
        await addContact({ ...form, aangemaaktOp: now, bijgewerktOp: now })
      }
      setModalOpen(false)
    } catch (e) {
      console.error(e)
      setError('Opslaan mislukt. Probeer het opnieuw.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteContact(deleteId)
    } catch (e) {
      console.error(e)
    } finally {
      setDeleteId(null)
    }
  }

  const f = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div>
      <PageHeader
        title="Contacten"
        subtitle={`${contacts.length} contacten`}
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="ghost" size="sm" onClick={() => exportToCsv('contacten.csv',
              ['Naam', 'E-mail', 'Telefoon', 'Bedrijf', 'Functie', 'Categorie', 'Tags', 'Branche', 'Regio', 'Website', 'Notitie'],
              filtered.map(c => [c.naam, c.email, c.telefoon, c.bedrijf, c.functie, c.categorie, (c.tags || []).join('; '), c.branche, c.regio, c.website, c.notitie])
            )}><Download size={14} /> Export</Button>
            <Button onClick={openAdd}><Plus size={15} /> Nieuw contact</Button>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar
          placeholder="Zoek op naam, e-mail, bedrijf, tag…"
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
        {allTags.length > 0 && (
          <Select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ width: '150px' }}>
            <option value="">Alle tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        )}
        {(filterCat || filterTag || search) && (
          <button
            onClick={() => { setFilterCat(''); setFilterTag(''); setSearch('') }}
            style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Wis filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || filterCat || filterTag ? 'Geen resultaten' : 'Nog geen contacten'}
          description={search || filterCat || filterTag ? 'Pas je zoekopdracht aan.' : 'Voeg je eerste contact toe.'}
          action={!search && !filterCat && !filterTag ? <Button onClick={openAdd}><Plus size={15} /> Nieuw contact</Button> : undefined}
        />
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)' }}>
                {['Naam', 'Bedrijf', 'E-mail / Telefoon', 'Tags', 'Categorie', ''].map(h => (
                  <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                        {c.naam.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.naam}</div>
                        {c.functie && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{c.functie}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {c.bedrijf ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Building2 size={12} />{c.bedrijf}</span> : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
                    {c.email ? (
                      <a href={`mailto:${c.email}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Mail size={12} />{c.email}
                      </a>
                    ) : null}
                    {c.telefoon ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-text-muted)', marginTop: c.email ? '2px' : 0 }}>
                        <Phone size={12} />{c.telefoon}
                      </div>
                    ) : null}
                    {!c.email && !c.telefoon ? '—' : null}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(c.tags || []).map(t => (
                        <span key={t} onClick={() => setFilterTag(t)} style={{ fontSize: '0.68rem', fontWeight: 500, padding: '1px 7px', borderRadius: '20px', background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', cursor: 'pointer', border: filterTag === t ? '1px solid var(--color-accent)' : '1px solid transparent' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={CATEGORIE_BADGE[c.categorie] || 'default'}>{c.categorie}</Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/contacten/${c.id}`)}><Eye size={13} /></Button>
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Contact bewerken' : 'Nieuw contact'}
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuleren</Button>
            <Button onClick={handleSave} disabled={saving || !form.naam.trim()}>
              {saving ? 'Opslaan...' : editing ? 'Bijwerken' : 'Toevoegen'}
            </Button>
          </>
        }
      >
        {error && (
          <div style={{ padding: '0.625rem 0.875rem', background: '#fde8e8', border: '1px solid #f5c0c0', borderRadius: '7px', fontSize: '0.82rem', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Naam *" value={form.naam} onChange={e => f('naam', e.target.value)} placeholder="Volledige naam" />
          </div>
          <Input label="E-mail" value={form.email} onChange={e => f('email', e.target.value)} type="email" placeholder="naam@bedrijf.nl" />
          <Input label="Telefoon" value={form.telefoon as string} onChange={e => f('telefoon', e.target.value)} placeholder="+31 6 ..." />
          <Input label="Bedrijf" value={form.bedrijf as string} onChange={e => f('bedrijf', e.target.value)} placeholder="Bedrijfsnaam" />
          <Input label="Functie" value={form.functie as string} onChange={e => f('functie', e.target.value)} placeholder="Functietitel" />
          <Select label="Categorie" value={form.categorie} onChange={e => f('categorie', e.target.value as Contact['categorie'])}>
            <option value="klant">Klant</option>
            <option value="netwerk">Netwerk</option>
            <option value="leverancier">Leverancier</option>
            <option value="overig">Overig</option>
          </Select>
          <Input label="Branche" value={form.branche as string} onChange={e => f('branche', e.target.value)} placeholder="Bijv. Bouw, Onderwijs" />
          <Input label="Regio" value={form.regio as string} onChange={e => f('regio', e.target.value)} placeholder="Stad / regio" />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Website" value={form.website as string} onChange={e => f('website', e.target.value)} placeholder="https://..." />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <TagInput tags={form.tags || []} onChange={tags => f('tags', tags)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea label="Notitie" value={form.notitie as string} onChange={e => f('notitie', e.target.value)} placeholder="Extra informatie..." />
          </div>
        </div>
      </Modal>

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
