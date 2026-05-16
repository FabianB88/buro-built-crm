import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { subscribeContacts, updateContact, deleteContact } from '../services/contacts'
import { subscribeNotes, addNote, deleteNote } from '../services/notes'
import { subscribeTasks, updateTask } from '../services/tasks'
import { subscribeInteractionsByContact, addInteraction, deleteInteraction } from '../services/interactions'
import { Contact, Note, Task, Interaction } from '../types'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import {
  ArrowLeft, Mail, Phone, Globe, Building2, MapPin, Tag,
  StickyNote, CheckSquare, PhoneCall, AtSign, Users, Plus, Trash2, Pencil
} from 'lucide-react'

const CATEGORIE_BADGE: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'accent'> = {
  klant: 'success', netwerk: 'accent', leverancier: 'warning', overig: 'default',
}

const INTERACTIE_ICONS: Record<Interaction['type'], React.ReactNode> = {
  call: <PhoneCall size={13} />,
  email: <AtSign size={13} />,
  meeting: <Users size={13} />,
  overig: <StickyNote size={13} />,
}

const INTERACTIE_LABELS: Record<Interaction['type'], string> = {
  call: 'Bellen', email: 'E-mail', meeting: 'Meeting', overig: 'Overig',
}

const PRIO_COLOR: Record<string, string> = {
  hoog: 'var(--color-danger)', normaal: 'var(--color-warning)', laag: 'var(--color-success)',
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

const card: React.CSSProperties = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: '10px', padding: '1.25rem',
}

const sectionHead = (title: string, action?: React.ReactNode) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
    <h2 style={{ fontSize: '0.875rem', fontWeight: 600 }}>{title}</h2>
    {action}
  </div>
)

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [contact, setContact] = useState<Contact | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])

  // Note modal
  const [noteModal, setNoteModal] = useState(false)
  const [noteTekst, setNoteTekst] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // Interaction modal
  const [iModal, setIModal] = useState(false)
  const [iForm, setIForm] = useState<{ type: Interaction['type'], datum: string, notitie: string }>({
    type: 'call', datum: new Date().toISOString().split('T')[0], notitie: '',
  })
  const [savingI, setSavingI] = useState(false)

  // Delete targets
  const [deleteNoteTarget, setDeleteNoteTarget] = useState<Note | null>(null)
  const [deleteITarget, setDeleteITarget] = useState<Interaction | null>(null)

  useEffect(() => {
    if (!id) return
    const unsubs = [
      subscribeContacts(all => {
        const found = all.find(c => c.id === id)
        if (found) setContact(found)
      }),
      subscribeNotes(all => setNotes(all.filter(n => n.contactId === id))),
      subscribeTasks(all => setTasks(all.filter(t => t.contactId === id))),
      subscribeInteractionsByContact(id, setInteractions),
    ]
    return () => unsubs.forEach(u => u())
  }, [id])

  async function saveNote() {
    if (!noteTekst.trim() || !contact) return
    setSavingNote(true)
    try {
      await addNote({
        tekst: noteTekst.trim(),
        contactId: contact.id,
        contactNaam: contact.naam,
        auteur: profile?.naam || 'Onbekend',
        auteurEmail: profile?.email,
        aangemaaktOp: Date.now(),
      })
      setNoteTekst('')
      setNoteModal(false)
    } catch (e) { console.error(e) }
    finally { setSavingNote(false) }
  }

  async function saveInteraction() {
    if (!contact) return
    setSavingI(true)
    try {
      await addInteraction({
        contactId: contact.id!,
        contactNaam: contact.naam,
        type: iForm.type,
        datum: iForm.datum,
        notitie: iForm.notitie.trim() || undefined,
        auteur: profile?.naam || 'Onbekend',
        aangemaaktOp: Date.now(),
      })
      setIForm({ type: 'call', datum: new Date().toISOString().split('T')[0], notitie: '' })
      setIModal(false)
    } catch (e) { console.error(e) }
    finally { setSavingI(false) }
  }

  async function toggleTask(t: Task) {
    if (!t.id) return
    const newStatus: Task['status'] = t.status === 'done' ? 'open' : 'done'
    await updateTask(t.id, { status: newStatus, bijgewerktOp: Date.now() })
  }

  if (!contact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Contact laden...
      </div>
    )
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate('/contacten')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem', padding: 0 }}
      >
        <ArrowLeft size={14} /> Terug naar contacten
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {contact.naam.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>{contact.naam}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '4px', flexWrap: 'wrap' }}>
            {contact.functie && <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{contact.functie}</span>}
            {contact.bedrijf && <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{contact.bedrijf && contact.functie ? '·' : ''} {contact.bedrijf}</span>}
            <Badge variant={CATEGORIE_BADGE[contact.categorie] || 'default'}>{contact.categorie}</Badge>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left column: contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={card}>
            {sectionHead('Contactgegevens')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {contact.email && (
                <a href={`mailto:${contact.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
                  <Mail size={13} style={{ flexShrink: 0 }} />{contact.email}
                </a>
              )}
              {contact.telefoon && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  <Phone size={13} style={{ flexShrink: 0 }} />{contact.telefoon}
                </div>
              )}
              {contact.website && (
                <a href={contact.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
                  <Globe size={13} style={{ flexShrink: 0 }} />{contact.website}
                </a>
              )}
              {contact.bedrijf && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  <Building2 size={13} style={{ flexShrink: 0 }} />{contact.bedrijf}
                </div>
              )}
              {contact.regio && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  <MapPin size={13} style={{ flexShrink: 0 }} />{contact.regio}
                </div>
              )}
              {contact.branche && (
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', paddingLeft: '21px' }}>
                  {contact.branche}
                </div>
              )}
            </div>
          </div>

          {(contact.tags || []).length > 0 && (
            <div style={card}>
              {sectionHead('Tags')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(contact.tags || []).map(t => (
                  <span key={t} style={{ fontSize: '0.72rem', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
                    <Tag size={10} style={{ marginRight: 4 }} />{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {contact.notitie && (
            <div style={card}>
              {sectionHead('Notitie')}
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{contact.notitie}</p>
            </div>
          )}
        </div>

        {/* Right column: interactions, tasks, notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Interactions */}
          <div style={card}>
            {sectionHead('Interacties', (
              <Button size="sm" onClick={() => setIModal(true)}><Plus size={13} /> Toevoegen</Button>
            ))}
            {interactions.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Nog geen interacties gelogd.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {interactions.map(i => (
                  <div key={i.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      {INTERACTIE_ICONS[i.type]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{INTERACTIE_LABELS[i.type]}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{i.datum}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>door {i.auteur}</span>
                      </div>
                      {i.notitie && <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>{i.notitie}</p>}
                    </div>
                    <button onClick={() => setDeleteITarget(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0, display: 'flex', alignItems: 'flex-start', opacity: 0.5 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div style={card}>
            {sectionHead(`Taken (${tasks.filter(t => t.status !== 'done').length} open)`)}
            {tasks.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Geen taken gekoppeld aan dit contact.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', background: 'var(--color-background)', borderRadius: '7px', opacity: t.status === 'done' ? 0.6 : 1 }}>
                    <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleTask(t)} style={{ cursor: 'pointer', accentColor: 'var(--color-success)' }} />
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIO_COLOR[t.prioriteit], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.titel}</span>
                    {t.deadline && <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{t.deadline}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={card}>
            {sectionHead(`Notities (${notes.length})`, (
              <Button size="sm" onClick={() => setNoteModal(true)}><Plus size={13} /> Toevoegen</Button>
            ))}
            {notes.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Geen notities voor dit contact.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {notes.map(n => (
                  <div key={n.id} style={{ padding: '0.75rem', background: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.6, margin: '0 0 0.5rem', whiteSpace: 'pre-wrap' }}>{n.tekst}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{n.auteur} · {formatDate(n.aangemaaktOp)}</span>
                      <button onClick={() => setDeleteNoteTarget(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0, opacity: 0.5, display: 'flex' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add interaction modal */}
      <Modal
        open={iModal}
        onClose={() => setIModal(false)}
        title="Interactie toevoegen"
        width={420}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIModal(false)}>Annuleer</Button>
            <Button onClick={saveInteraction} disabled={savingI}>{savingI ? 'Opslaan…' : 'Opslaan'}</Button>
          </>
        }
      >
        <Select label="Type" value={iForm.type} onChange={e => setIForm(f => ({ ...f, type: e.target.value as Interaction['type'] }))}>
          <option value="call">Bellen</option>
          <option value="email">E-mail</option>
          <option value="meeting">Meeting</option>
          <option value="overig">Overig</option>
        </Select>
        <Input label="Datum" type="date" value={iForm.datum} onChange={e => setIForm(f => ({ ...f, datum: e.target.value }))} />
        <Textarea label="Notitie (optioneel)" value={iForm.notitie} onChange={e => setIForm(f => ({ ...f, notitie: e.target.value }))} placeholder="Wat is besproken?" rows={3} />
      </Modal>

      {/* Add note modal */}
      <Modal
        open={noteModal}
        onClose={() => setNoteModal(false)}
        title="Notitie toevoegen"
        width={420}
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteModal(false)}>Annuleer</Button>
            <Button onClick={saveNote} disabled={savingNote || !noteTekst.trim()}>{savingNote ? 'Opslaan…' : 'Opslaan'}</Button>
          </>
        }
      >
        <Textarea label="Notitie *" value={noteTekst} onChange={e => setNoteTekst(e.target.value)} placeholder="Schrijf je notitie…" rows={4} autoFocus />
      </Modal>

      {/* Delete note confirm */}
      <Modal
        open={!!deleteNoteTarget}
        onClose={() => setDeleteNoteTarget(null)}
        title="Notitie verwijderen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteNoteTarget(null)}>Annuleer</Button>
            <Button variant="danger" onClick={async () => { await deleteNote(deleteNoteTarget!.id!); setDeleteNoteTarget(null) }}>Verwijder</Button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Weet je zeker dat je deze notitie wilt verwijderen?</p>
      </Modal>

      {/* Delete interaction confirm */}
      <Modal
        open={!!deleteITarget}
        onClose={() => setDeleteITarget(null)}
        title="Interactie verwijderen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteITarget(null)}>Annuleer</Button>
            <Button variant="danger" onClick={async () => { await deleteInteraction(deleteITarget!.id!); setDeleteITarget(null) }}>Verwijder</Button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Weet je zeker dat je deze interactie wilt verwijderen?</p>
      </Modal>
    </div>
  )
}
