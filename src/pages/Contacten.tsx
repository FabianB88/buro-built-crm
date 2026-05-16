import { useEffect, useState, useMemo, KeyboardEvent, useRef } from 'react'
import * as XLSX from 'xlsx'
import { subscribeContacts, addContact, updateContact, deleteContact } from '../services/contacts'
import { addTask } from '../services/tasks'
import { subscribeAllowedUsers, AllowedUser } from '../services/allowedUsers'
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
import { Plus, Pencil, Trash2, Users, Mail, Phone, Building2, X, Download, Eye, Upload, AlertCircle, CheckCircle2, Calendar, UserCheck } from 'lucide-react'

function dateInMonths(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + n)
  return d.toISOString().split('T')[0]
}

function dateMinusDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - days)
  // clamp to today
  const today = new Date().toISOString().split('T')[0]
  const result = d.toISOString().split('T')[0]
  return result < today ? today : result
}

// Maps any reasonable header spelling → Contact field
const HEADER_MAP: Record<string, keyof FormState> = {
  naam: 'naam', name: 'naam', voornaam: 'naam', fullname: 'naam', 'volledige naam': 'naam',
  email: 'email', 'e-mail': 'email', mail: 'email', emailadres: 'email',
  telefoon: 'telefoon', phone: 'telefoon', tel: 'telefoon', mobiel: 'telefoon', gsm: 'telefoon',
  bedrijf: 'bedrijf', company: 'bedrijf', organisatie: 'bedrijf', werkgever: 'bedrijf', 'bedrijfsnaam': 'bedrijf',
  functie: 'functie', role: 'functie', titel: 'functie', title: 'functie', job: 'functie', functietitel: 'functie',
  categorie: 'categorie', category: 'categorie', type: 'categorie',
  tags: 'tags', tag: 'tags', labels: 'tags',
  website: 'website', url: 'website', site: 'website',
  branche: 'branche', sector: 'branche', industry: 'branche', industrie: 'branche',
  regio: 'regio', region: 'regio', stad: 'regio', city: 'regio', locatie: 'regio', plaats: 'regio',
  notitie: 'notitie', note: 'notitie', notes: 'notitie', opmerkingen: 'notitie', opmerking: 'notitie',
}

const VALID_CATEGORIES = new Set(['klant', 'netwerk', 'leverancier', 'overig'])

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[^a-z\s-]/g, '')
}

function parseExcel(file: File): Promise<FormState[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

        if (rows.length === 0) { resolve([]); return }

        // Build header mapping from actual column names
        const firstRow = rows[0]
        const colMap: Record<string, keyof FormState> = {}
        for (const col of Object.keys(firstRow)) {
          const normalized = normalizeHeader(col)
          const field = HEADER_MAP[normalized]
          if (field) colMap[col] = field
        }

        const contacts: FormState[] = rows.map((row, idx) => {
          const c: FormState = {
            naam: '', email: '', telefoon: '', bedrijf: '', functie: '',
            categorie: 'klant', tags: [], website: '', branche: '', regio: '', notitie: '',
          }
          for (const [col, field] of Object.entries(colMap)) {
            const raw = String(row[col] ?? '').trim()
            if (field === 'tags') {
              c.tags = raw ? raw.split(/[,;|]/).map(t => t.trim().toLowerCase()).filter(Boolean) : []
            } else if (field === 'categorie') {
              const val = raw.toLowerCase()
              c.categorie = VALID_CATEGORIES.has(val) ? val as Contact['categorie'] : 'klant'
            } else {
              (c as Record<string, unknown>)[field] = raw
            }
          }
          // Placeholder for missing naam
          if (!c.naam) c.naam = `(Geen naam — rij ${idx + 2})`
          return c
        })

        resolve(contacts)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

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
  accountManager: '', accountManagerNaam: '', volgendContactmoment: '',
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
  const fileInputRef = useRef<HTMLInputElement>(null)
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
  const [users, setUsers] = useState<AllowedUser[]>([])
  const [maakFollowUp, setMaakFollowUp] = useState(true)

  // Import state
  const [importPreview, setImportPreview] = useState<FormState[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState<{ added: number } | null>(null)
  const [importError, setImportError] = useState('')

  useEffect(() => subscribeContacts(setContacts), [])
  useEffect(() => subscribeAllowedUsers(setUsers), [])

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

  const openAdd = () => {
    setEditing(null); setForm(emptyForm()); setError('')
    setMaakFollowUp(true)
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
      accountManager: c.accountManager || '',
      accountManagerNaam: c.accountManagerNaam || '',
      volgendContactmoment: c.volgendContactmoment || '',
    })
    setError('')
    setMaakFollowUp(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.naam.trim()) return
    setSaving(true)
    setError('')
    try {
      const now = Date.now()
      let contactId: string | undefined = editing?.id
      if (editing?.id) {
        await updateContact(editing.id, { ...form, bijgewerktOp: now })
      } else {
        contactId = await addContact({ ...form, aangemaaktOp: now, bijgewerktOp: now })
      }

      // Auto follow-up task
      if (maakFollowUp && form.accountManager) {
        const deadline = form.volgendContactmoment
          ? dateMinusDays(form.volgendContactmoment as string, 14)
          : dateInMonths(3)
        const contactDate = form.volgendContactmoment
          ? ` (gepland: ${form.volgendContactmoment})`
          : ' (geen datum ingesteld)'
        await addTask({
          titel: `Contact opnemen: ${form.naam}`,
          omschrijving: `Follow-up contact met ${form.naam}${contactDate}`,
          status: 'open',
          prioriteit: 'normaal',
          deadline,
          toegewezenAan: form.accountManagerNaam as string || (form.accountManager as string).split('@')[0],
          toegewezenAanEmail: form.accountManager as string,
          contactId,
          contactNaam: form.naam,
          projectId: '',
          projectNaam: '',
          aangemaaktOp: now,
          bijgewerktOp: now,
        })
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImportError('')
    setImportDone(null)
    try {
      const rows = await parseExcel(file)
      if (rows.length === 0) { setImportError('Het bestand bevat geen rijen.'); return }
      setImportPreview(rows)
    } catch {
      setImportError('Bestand kon niet worden gelezen. Controleer of het een geldig Excel-bestand (.xlsx) is.')
    }
  }

  const handleImport = async () => {
    if (!importPreview) return
    setImporting(true)
    setImportError('')
    let added = 0
    try {
      const now = Date.now()
      for (const row of importPreview) {
        await addContact({ ...row, aangemaaktOp: now + added, bijgewerktOp: now + added })
        added++
      }
      setImportDone({ added })
      setImportPreview(null)
    } catch (e) {
      console.error(e)
      setImportError(`Import gestopt na ${added} contacten. Controleer je verbinding en probeer opnieuw.`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Contacten"
        subtitle={`${contacts.length} contacten`}
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileChange} />
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}><Upload size={14} /> Import Excel</Button>
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

          {/* Accountmanager + follow-up */}
          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--color-border)', paddingTop: '0.875rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
              Opvolging
            </div>
          </div>
          <Input
            label="Volgend contactmoment"
            type="date"
            value={form.volgendContactmoment as string}
            onChange={e => f('volgendContactmoment', e.target.value)}
          />
          <div />
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Accountmanager
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => { f('accountManager', ''); f('accountManagerNaam', '') }}
                style={{
                  padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem',
                  cursor: 'pointer', border: '1.5px solid',
                  borderColor: !form.accountManager ? 'var(--color-primary)' : 'var(--color-border)',
                  background: !form.accountManager ? 'var(--color-primary)' : 'transparent',
                  color: !form.accountManager ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                Niemand
              </button>
              {users.map(u => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { f('accountManager', u.email); f('accountManagerNaam', u.email.split('@')[0]) }}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem',
                    cursor: 'pointer', border: '1.5px solid', fontWeight: form.accountManager === u.email ? 600 : 400,
                    borderColor: form.accountManager === u.email ? 'var(--color-primary)' : 'var(--color-border)',
                    background: form.accountManager === u.email ? 'var(--color-primary)' : 'transparent',
                    color: form.accountManager === u.email ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  {u.email.split('@')[0]}
                </button>
              ))}
            </div>
          </div>

          {form.accountManager && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--color-text-muted)', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={maakFollowUp}
                  onChange={e => setMaakFollowUp(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)', width: 15, height: 15 }}
                />
                {editing
                  ? 'Maak nieuwe follow-up taak aan voor de accountmanager'
                  : `Automatisch follow-up taak aanmaken${form.volgendContactmoment ? ` (herinnering 2 weken voor ${form.volgendContactmoment})` : ' (over 3 maanden)'}`
                }
              </label>
            </div>
          )}
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

      {/* Import error toast */}
      {importError && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: '#fde8e8', border: '1px solid #f5c0c0', borderRadius: '9px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 300, maxWidth: '480px' }}>
          <AlertCircle size={15} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--color-danger)' }}>{importError}</span>
          <button onClick={() => setImportError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.5rem', color: 'var(--color-danger)', display: 'flex' }}><X size={14} /></button>
        </div>
      )}

      {/* Import success toast */}
      {importDone && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: '#dcf0e6', border: '1px solid #a8d5bc', borderRadius: '9px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 300 }}>
          <CheckCircle2 size={15} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--color-success)', fontWeight: 500 }}>{importDone.added} contacten succesvol geïmporteerd.</span>
          <button onClick={() => setImportDone(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.5rem', color: 'var(--color-success)', display: 'flex' }}><X size={14} /></button>
        </div>
      )}

      {/* Import preview modal */}
      <Modal
        open={!!importPreview}
        onClose={() => { setImportPreview(null); setImportError('') }}
        title={`Import — ${importPreview?.length ?? 0} contacten gevonden`}
        width={600}
        footer={
          <>
            <Button variant="ghost" onClick={() => setImportPreview(null)}>Annuleren</Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? `Importeren...` : `${importPreview?.length ?? 0} contacten importeren`}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Controleer de gegevens hieronder. Lege velden worden overgeslagen. Namen die ontbreken krijgen een tijdelijke plaatshouder.
        </p>

        {/* Warnings */}
        {(importPreview || []).some(r => r.naam.startsWith('(Geen naam')) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', background: '#fdf0d9', border: '1px solid #e8c97a', borderRadius: '7px', fontSize: '0.8rem', color: 'var(--color-warning)' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {(importPreview || []).filter(r => r.naam.startsWith('(Geen naam')).length} rij(en) hebben geen naam en krijgen een tijdelijke plaatshouder. Je kunt ze achteraf bewerken.
          </div>
        )}

        {/* Preview table */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--color-surface-muted)', zIndex: 1 }}>
              <tr>
                {['#', 'Naam', 'E-mail', 'Telefoon', 'Bedrijf', 'Categorie'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(importPreview || []).map((row, i) => (
                <tr key={i} style={{ borderBottom: i < (importPreview!.length - 1) ? '1px solid var(--color-border)' : 'none', background: row.naam.startsWith('(Geen naam') ? '#fdf9f0' : 'transparent' }}>
                  <td style={{ padding: '0.45rem 0.75rem', color: 'var(--color-text-muted)' }}>{i + 1}</td>
                  <td style={{ padding: '0.45rem 0.75rem', fontWeight: row.naam.startsWith('(Geen naam') ? 400 : 500, color: row.naam.startsWith('(Geen naam') ? 'var(--color-text-muted)' : 'var(--color-text)', fontStyle: row.naam.startsWith('(Geen naam') ? 'italic' : 'normal' }}>
                    {row.naam}
                  </td>
                  <td style={{ padding: '0.45rem 0.75rem', color: 'var(--color-text-muted)' }}>{row.email || '—'}</td>
                  <td style={{ padding: '0.45rem 0.75rem', color: 'var(--color-text-muted)' }}>{row.telefoon || '—'}</td>
                  <td style={{ padding: '0.45rem 0.75rem', color: 'var(--color-text-muted)' }}>{row.bedrijf || '—'}</td>
                  <td style={{ padding: '0.45rem 0.75rem' }}>
                    <Badge variant={CATEGORIE_BADGE[row.categorie] || 'default'}>{row.categorie}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {importError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-danger)' }}>
            <AlertCircle size={14} /> {importError}
          </div>
        )}
      </Modal>
    </div>
  )
}
