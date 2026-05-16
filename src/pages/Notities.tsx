import { useEffect, useState, useMemo } from 'react'
import { subscribeNotes, addNote, deleteNote } from '../services/notes'
import { subscribeContacts } from '../services/contacts'
import { subscribeProjects } from '../services/projects'
import { Note, Contact, Project } from '../types'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'
import { StickyNote, Trash2, Plus } from 'lucide-react'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Notities() {
  const { profile } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [filterContact, setFilterContact] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [tekst, setTekst] = useState('')
  const [contactId, setContactId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)

  useEffect(() => {
    const unsubs = [
      subscribeNotes(setNotes),
      subscribeContacts(setContacts),
      subscribeProjects(setProjects),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  const filtered = useMemo(() => notes.filter(n => {
    if (filterContact && n.contactId !== filterContact) return false
    if (filterProject && n.projectId !== filterProject) return false
    const q = search.toLowerCase()
    return (
      n.tekst.toLowerCase().includes(q) ||
      (n.contactNaam || '').toLowerCase().includes(q) ||
      (n.projectNaam || '').toLowerCase().includes(q) ||
      (n.auteur || '').toLowerCase().includes(q)
    )
  }), [notes, search, filterContact, filterProject])

  function openAdd() {
    setTekst(''); setContactId(''); setProjectId(''); setError(''); setShowModal(true)
  }

  function closeModal() { setShowModal(false) }

  async function handleSave() {
    if (!tekst.trim()) return
    setSaving(true)
    setError('')
    const now = Date.now()
    try {
      const contact = contacts.find(c => c.id === contactId)
      const project = projects.find(p => p.id === projectId)
      await addNote({
        tekst: tekst.trim(),
        contactId: contactId || undefined,
        contactNaam: contact?.naam || undefined,
        projectId: projectId || undefined,
        projectNaam: project?.naam || undefined,
        auteur: profile?.naam || 'Onbekend',
        auteurEmail: profile?.email || undefined,
        aangemaaktOp: now,
      })
      closeModal()
    } catch (e) {
      console.error(e)
      setError('Opslaan mislukt. Probeer het opnieuw.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return
    try {
      await deleteNote(deleteTarget.id)
      setDeleteTarget(null)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <PageHeader
        title="Notities"
        subtitle={`${notes.length} notitie${notes.length !== 1 ? 's' : ''}`}
        action={<Button onClick={openAdd}><Plus size={15} /> Nieuwe notitie</Button>}
      />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek notities…" style={{ flex: '1 1 220px' }} />
        <Select value={filterContact} onChange={e => setFilterContact(e.target.value)} style={{ minWidth: 160 }}>
          <option value="">Alle contacten</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.naam}</option>)}
        </Select>
        <Select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ minWidth: 160 }}>
          <option value="">Alle projecten</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.naam}</option>)}
        </Select>
        {(filterContact || filterProject || search) && (
          <button
            onClick={() => { setFilterContact(''); setFilterProject(''); setSearch('') }}
            style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Wis filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="Geen notities gevonden"
          description={search || filterContact || filterProject ? 'Pas je zoekopdracht aan.' : 'Voeg je eerste notitie toe.'}
          action={!search && !filterContact && !filterProject ? <Button onClick={openAdd}><Plus size={15} /> Nieuwe notitie</Button> : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(n => {
            const preview = n.tekst.length > 200 ? n.tekst.slice(0, 200) + '…' : n.tekst
            return (
              <div
                key={n.id}
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.55, margin: 0, flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {preview}
                </p>

                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {n.contactNaam && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
                      👤 {n.contactNaam}
                    </span>
                  )}
                  {n.projectNaam && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
                      📁 {n.projectNaam}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span style={{ fontWeight: 500 }}>{n.auteur}</span>
                    {' · '}{formatDate(n.aangemaaktOp)}
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(n)}><Trash2 size={13} /></Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title="Nieuwe notitie"
        width={460}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Annuleer</Button>
            <Button onClick={handleSave} disabled={!tekst.trim() || saving}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </>
        }
      >
        {error && (
          <div style={{ padding: '0.625rem 0.875rem', background: '#fde8e8', border: '1px solid #f5c0c0', borderRadius: '7px', fontSize: '0.82rem', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}
        <Textarea label="Notitie *" value={tekst} onChange={e => setTekst(e.target.value)} placeholder="Schrijf hier je notitie…" rows={5} autoFocus />
        <Select label="Koppel aan contact (optioneel)" value={contactId} onChange={e => setContactId(e.target.value)}>
          <option value="">— Geen contact —</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.naam}{c.bedrijf ? ` (${c.bedrijf})` : ''}</option>)}
        </Select>
        <Select label="Koppel aan project (optioneel)" value={projectId} onChange={e => setProjectId(e.target.value)}>
          <option value="">— Geen project —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.naam}</option>)}
        </Select>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          Auteur: <strong>{profile?.naam || 'Onbekend'}</strong>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Notitie verwijderen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Annuleer</Button>
            <Button variant="danger" onClick={handleDelete}>Verwijder</Button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
          Weet je zeker dat je deze notitie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
      </Modal>
    </div>
  )
}
