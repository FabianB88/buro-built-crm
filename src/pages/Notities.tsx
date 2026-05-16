import { useEffect, useState } from 'react'
import { subscribeNotes, addNote, deleteNote } from '../services/notes'
import { Note } from '../types'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'
import { StickyNote, Trash2 } from 'lucide-react'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function Notities() {
  const { profile } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [tekst, setTekst] = useState('')
  const [contactNaam, setContactNaam] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    return subscribeNotes(setNotes)
  }, [])

  const filtered = notes.filter(n => {
    const q = search.toLowerCase()
    return (
      n.tekst.toLowerCase().includes(q) ||
      (n.contactNaam || '').toLowerCase().includes(q) ||
      (n.projectNaam || '').toLowerCase().includes(q) ||
      (n.auteur || '').toLowerCase().includes(q)
    )
  })

  function openAdd() {
    setTekst('')
    setContactNaam('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  async function handleSave() {
    if (!tekst.trim()) return
    setSaving(true)
    const now = Date.now()
    try {
      await addNote({
        tekst: tekst.trim(),
        contactNaam: contactNaam.trim() || undefined,
        auteur: profile?.naam || 'Onbekend',
        aangemaaktOp: now,
      })
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await deleteNote(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Notities"
        subtitle={`${notes.length} notitie${notes.length !== 1 ? 's' : ''}`}
        action={<Button onClick={openAdd}>+ Nieuwe notitie</Button>}
      />

      <div style={{ marginBottom: '1.5rem' }}>
        <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek notities…" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="Geen notities gevonden"
          description={search ? 'Pas je zoekopdracht aan.' : 'Voeg je eerste notitie toe.'}
          action={<Button onClick={openAdd}>+ Nieuwe notitie</Button>}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {filtered.map(n => {
            const tag = n.contactNaam || n.projectNaam
            const preview = n.tekst.length > 200 ? n.tekst.slice(0, 200) + '…' : n.tekst
            return (
              <div
                key={n.id}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  padding: '1.125rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text)',
                  lineHeight: 1.55,
                  margin: 0,
                  flex: 1,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {preview}
                </p>

                {tag && (
                  <div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '20px',
                      background: 'var(--color-surface-muted)',
                      color: 'var(--color-text-muted)',
                    }}>
                      {tag}
                    </span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--color-border)',
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span style={{ fontWeight: 500 }}>{n.auteur}</span>
                    {' · '}
                    {formatDate(n.aangemaaktOp)}
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(n)}>
                    <Trash2 size={13} />
                  </Button>
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
        <Textarea
          label="Notitie *"
          value={tekst}
          onChange={e => setTekst(e.target.value)}
          placeholder="Schrijf hier je notitie…"
          rows={5}
          autoFocus
        />
        <Input
          label="Contact (optioneel)"
          value={contactNaam}
          onChange={e => setContactNaam(e.target.value)}
          placeholder="Naam van contact of organisatie"
        />
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
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Verwijderen…' : 'Verwijder'}
            </Button>
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
