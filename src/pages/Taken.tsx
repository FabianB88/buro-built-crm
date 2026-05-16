import { useEffect, useState, useMemo } from 'react'
import { subscribeTasks, addTask, updateTask, deleteTask } from '../services/tasks'
import { subscribeProjects } from '../services/projects'
import { subscribeContacts } from '../services/contacts'
import { subscribeAllowedUsers, AllowedUser } from '../services/allowedUsers'
import { Task, Project, Contact } from '../types'
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
import { CheckSquare, Pencil, Trash2, Plus, User } from 'lucide-react'

type StatusVariant = 'default' | 'accent' | 'success'

const statusVariantMap: Record<Task['status'], StatusVariant> = {
  open: 'default',
  inprogress: 'accent',
  done: 'success',
}

const statusLabels: Record<Task['status'], string> = {
  open: 'Open',
  inprogress: 'In behandeling',
  done: 'Klaar',
}

const priorityColors: Record<Task['prioriteit'], string> = {
  hoog: 'var(--color-danger)',
  normaal: 'var(--color-warning)',
  laag: 'var(--color-success)',
}

type FormState = Omit<Task, 'id' | 'aangemaaktOp' | 'bijgewerktOp'>

const emptyForm = (): FormState => ({
  titel: '', omschrijving: '', status: 'open', prioriteit: 'normaal',
  deadline: '', toegewezenAan: '', toegewezenAanEmail: '',
  projectId: '', projectNaam: '', contactId: '', contactNaam: '',
})

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false
  return deadline < new Date().toISOString().split('T')[0]
}

export default function Taken() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [users, setUsers] = useState<AllowedUser[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('alle')
  const [prioriteitFilter, setPrioriteitFilter] = useState('alle')
  const [mijnTaken, setMijnTaken] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)

  useEffect(() => {
    const unsubs = [
      subscribeTasks(setTasks),
      subscribeProjects(setProjects),
      subscribeContacts(setContacts),
      subscribeAllowedUsers(setUsers),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (mijnTaken && t.toegewezenAanEmail !== profile?.email) return false
      const matchSearch =
        t.titel.toLowerCase().includes(search.toLowerCase()) ||
        (t.toegewezenAan || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.projectNaam || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.contactNaam || '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'alle' || t.status === statusFilter
      const matchPrio = prioriteitFilter === 'alle' || t.prioriteit === prioriteitFilter
      return matchSearch && matchStatus && matchPrio
    })
  }, [tasks, search, statusFilter, prioriteitFilter, mijnTaken, profile])

  const myCount = useMemo(() =>
    tasks.filter(t => t.toegewezenAanEmail === profile?.email && t.status !== 'done').length,
    [tasks, profile])

  function openAdd() {
    setEditTask(null)
    setForm(emptyForm())
    setError('')
    setShowModal(true)
  }

  function openEdit(t: Task) {
    setEditTask(t)
    setForm({
      titel: t.titel, omschrijving: t.omschrijving || '', status: t.status,
      prioriteit: t.prioriteit, deadline: t.deadline || '',
      toegewezenAan: t.toegewezenAan || '', toegewezenAanEmail: t.toegewezenAanEmail || '',
      projectId: t.projectId || '', projectNaam: t.projectNaam || '',
      contactId: t.contactId || '', contactNaam: t.contactNaam || '',
    })
    setError('')
    setShowModal(true)
  }

  function closeModal() { setShowModal(false); setEditTask(null) }

  function assignUser(email: string) {
    const u = users.find(u => u.email === email)
    setForm(f => ({ ...f, toegewezenAanEmail: email, toegewezenAan: u ? u.email.split('@')[0] : email }))
  }

  function pickProject(id: string) {
    const p = projects.find(p => p.id === id)
    setForm(f => ({ ...f, projectId: id, projectNaam: p?.naam || '' }))
  }

  function pickContact(id: string) {
    const c = contacts.find(c => c.id === id)
    setForm(f => ({ ...f, contactId: id, contactNaam: c?.naam || '' }))
  }

  async function handleSave() {
    if (!form.titel.trim()) return
    setSaving(true)
    setError('')
    const now = Date.now()
    try {
      if (editTask?.id) {
        await updateTask(editTask.id, { ...form, bijgewerktOp: now })
      } else {
        await addTask({ ...form, aangemaaktOp: now, bijgewerktOp: now })
      }
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
      await deleteTask(deleteTarget.id)
      setDeleteTarget(null)
    } catch (e) {
      console.error(e)
    }
  }

  async function toggleDone(t: Task) {
    if (!t.id) return
    const newStatus: Task['status'] = t.status === 'done' ? 'open' : 'done'
    await updateTask(t.id, { status: newStatus, bijgewerktOp: Date.now() })
  }

  const f = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  return (
    <div>
      <PageHeader
        title="Taken"
        subtitle={`${tasks.filter(t => t.status !== 'done').length} open`}
        action={<Button onClick={openAdd}><Plus size={15} /> Nieuwe taak</Button>}
      />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek taken…" style={{ flex: '1 1 220px' }} />
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 160 }}>
          <option value="alle">Alle statussen</option>
          <option value="open">Open</option>
          <option value="inprogress">In behandeling</option>
          <option value="done">Klaar</option>
        </Select>
        <Select value={prioriteitFilter} onChange={e => setPrioriteitFilter(e.target.value)} style={{ minWidth: 150 }}>
          <option value="alle">Alle prioriteiten</option>
          <option value="hoog">Hoog</option>
          <option value="normaal">Normaal</option>
          <option value="laag">Laag</option>
        </Select>
        <button
          onClick={() => setMijnTaken(!mijnTaken)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '0.45rem 0.875rem', borderRadius: '7px', fontSize: '0.82rem', fontWeight: 500,
            cursor: 'pointer', border: '1.5px solid',
            borderColor: mijnTaken ? 'var(--color-primary)' : 'var(--color-border)',
            background: mijnTaken ? 'var(--color-primary)' : 'transparent',
            color: mijnTaken ? '#fff' : 'var(--color-text-muted)',
            transition: 'all 0.15s',
          }}
        >
          <User size={13} />
          Mijn taken {myCount > 0 && `(${myCount})`}
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Geen taken gevonden"
          description={search || statusFilter !== 'alle' || prioriteitFilter !== 'alle' || mijnTaken ? 'Pas je filters aan.' : 'Voeg je eerste taak toe.'}
          action={!search && statusFilter === 'alle' && prioriteitFilter === 'alle' && !mijnTaken ? <Button onClick={openAdd}><Plus size={15} /> Nieuwe taak</Button> : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(t => {
            const overdue = isOverdue(t.deadline) && t.status !== 'done'
            const done = t.status === 'done'
            return (
              <div
                key={t.id}
                style={{
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '8px', padding: '0.875rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  opacity: done ? 0.65 : 1,
                }}
              >
                <input
                  type="checkbox" checked={done} onChange={() => toggleDone(t)}
                  style={{ cursor: 'pointer', width: 16, height: 16, flexShrink: 0, accentColor: 'var(--color-success)' }}
                />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColors[t.prioriteit], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-primary)',
                    textDecoration: done ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                  }}>
                    {t.titel}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {t.projectNaam && <span>📁 {t.projectNaam}</span>}
                    {t.contactNaam && <span>👤 {t.contactNaam}</span>}
                    {t.toegewezenAan && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        padding: '0 6px', borderRadius: '20px',
                        background: t.toegewezenAanEmail === profile?.email ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                        color: t.toegewezenAanEmail === profile?.email ? '#fff' : 'var(--color-text-muted)',
                        fontSize: '0.68rem', fontWeight: 500,
                      }}>
                        {t.toegewezenAan}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={statusVariantMap[t.status]}>{statusLabels[t.status]}</Badge>
                {t.deadline && (
                  <span style={{ fontSize: '0.78rem', color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)', flexShrink: 0, fontWeight: overdue ? 600 : 400 }}>
                    {t.deadline}
                  </span>
                )}
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Pencil size={14} /></Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(t)}><Trash2 size={14} /></Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editTask ? 'Taak bewerken' : 'Nieuwe taak'}
        width={500}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Annuleer</Button>
            <Button onClick={handleSave} disabled={!form.titel.trim() || saving}>
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
        <Input label="Titel *" value={form.titel} onChange={e => f('titel', e.target.value)} placeholder="Taaknaam" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Select label="Status" value={form.status} onChange={e => f('status', e.target.value as Task['status'])}>
            <option value="open">Open</option>
            <option value="inprogress">In behandeling</option>
            <option value="done">Klaar</option>
          </Select>
          <Select label="Prioriteit" value={form.prioriteit} onChange={e => f('prioriteit', e.target.value as Task['prioriteit'])}>
            <option value="laag">Laag</option>
            <option value="normaal">Normaal</option>
            <option value="hoog">Hoog</option>
          </Select>
        </div>

        <Input label="Deadline" type="date" value={form.deadline as string} onChange={e => f('deadline', e.target.value)} />

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Toegewezen aan
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              onClick={() => setForm(f => ({ ...f, toegewezenAan: '', toegewezenAanEmail: '' }))}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem',
                cursor: 'pointer', border: '1.5px solid',
                borderColor: !form.toegewezenAanEmail ? 'var(--color-primary)' : 'var(--color-border)',
                background: !form.toegewezenAanEmail ? 'var(--color-primary)' : 'transparent',
                color: !form.toegewezenAanEmail ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              Niemand
            </button>
            {users.map(u => (
              <button
                key={u.email}
                onClick={() => assignUser(u.email)}
                style={{
                  padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem',
                  cursor: 'pointer', border: '1.5px solid',
                  borderColor: form.toegewezenAanEmail === u.email ? 'var(--color-primary)' : 'var(--color-border)',
                  background: form.toegewezenAanEmail === u.email ? 'var(--color-primary)' : 'transparent',
                  color: form.toegewezenAanEmail === u.email ? '#fff' : 'var(--color-text-muted)',
                  fontWeight: form.toegewezenAanEmail === u.email ? 600 : 400,
                }}
              >
                {u.email.split('@')[0]}
                {u.email === profile?.email ? ' (jij)' : ''}
              </button>
            ))}
          </div>
        </div>

        <Select
          label="Project"
          value={form.projectId as string}
          onChange={e => pickProject(e.target.value)}
        >
          <option value="">— Geen project —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.naam}</option>)}
        </Select>

        <Select
          label="Contact"
          value={form.contactId as string}
          onChange={e => pickContact(e.target.value)}
        >
          <option value="">— Geen contact —</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.naam}{c.bedrijf ? ` (${c.bedrijf})` : ''}</option>)}
        </Select>

        <Textarea label="Omschrijving" value={form.omschrijving as string} onChange={e => f('omschrijving', e.target.value)} placeholder="Toelichting" rows={3} />
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Taak verwijderen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Annuleer</Button>
            <Button variant="danger" onClick={handleDelete}>Verwijder</Button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
          Weet je zeker dat je <strong>{deleteTarget?.titel}</strong> wilt verwijderen?
        </p>
      </Modal>
    </div>
  )
}
