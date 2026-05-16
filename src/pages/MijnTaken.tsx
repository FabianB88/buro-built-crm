import { useEffect, useState, useMemo } from 'react'
import { subscribeTasks, addTask, updateTask, deleteTask } from '../services/tasks'
import { subscribeProjects } from '../services/projects'
import { subscribeContacts } from '../services/contacts'
import { Task, Project, Contact } from '../types'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'

const PRIO_COLOR: Record<string, string> = {
  hoog: 'var(--color-danger)',
  normaal: 'var(--color-warning)',
  laag: 'var(--color-success)',
}

const STATUS_LABELS: Record<Task['status'], string> = {
  open: 'Open',
  inprogress: 'In behandeling',
  done: 'Afgerond',
}

type FormState = Omit<Task, 'id' | 'aangemaaktOp' | 'bijgewerktOp'>

function todayStr() { return new Date().toISOString().split('T')[0] }
function isOverdue(deadline?: string) { return !!deadline && deadline < todayStr() }

function emptyForm(email: string, naam: string): FormState {
  return {
    titel: '', omschrijving: '', status: 'open', prioriteit: 'normaal',
    deadline: '', toegewezenAan: naam, toegewezenAanEmail: email,
    projectId: '', projectNaam: '', contactId: '', contactNaam: '',
  }
}

function StatChip({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ color, display: 'flex' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  )
}

interface TaskSectionProps {
  title: string
  tasks: Task[]
  defaultOpen?: boolean
  onToggle: (t: Task) => void
  onEdit: (t: Task) => void
  onDelete: (t: Task) => void
  currentUserEmail?: string
}

function TaskSection({ title, tasks, defaultOpen = true, onToggle, onEdit, onDelete, currentUserEmail }: TaskSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  if (tasks.length === 0) return null

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.875rem 1.125rem', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
          borderBottom: open ? '1px solid var(--color-border)' : 'none',
        }}
      >
        {open ? <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />}
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', borderRadius: '20px', padding: '1px 8px', marginLeft: '2px' }}>{tasks.length}</span>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tasks.map((t, i) => {
            const done = t.status === 'done'
            const overdue = isOverdue(t.deadline) && !done
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1.125rem',
                  borderBottom: i < tasks.length - 1 ? '1px solid var(--color-border)' : 'none',
                  background: done ? 'transparent' : overdue ? 'rgba(180,83,83,0.04)' : 'transparent',
                  opacity: done ? 0.6 : 1,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => !done && (e.currentTarget.style.background = 'var(--color-background)')}
                onMouseLeave={e => !done && (e.currentTarget.style.background = overdue ? 'rgba(180,83,83,0.04)' : 'transparent')}
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => onToggle(t)}
                  style={{ cursor: 'pointer', width: 15, height: 15, flexShrink: 0, accentColor: 'var(--color-success)' }}
                />
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIO_COLOR[t.prioriteit], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, textDecoration: done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.titel}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2px', flexWrap: 'wrap' }}>
                    {t.projectNaam && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>📁 {t.projectNaam}</span>
                    )}
                    {t.contactNaam && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>👤 {t.contactNaam}</span>
                    )}
                    {t.omschrijving && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                        {t.omschrijving}
                      </span>
                    )}
                  </div>
                </div>

                {t.deadline && (
                  <span style={{
                    fontSize: '0.75rem', flexShrink: 0, fontWeight: overdue ? 600 : 400,
                    color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)',
                  }}>
                    {overdue ? '⚠ ' : ''}{t.deadline}
                  </span>
                )}

                <Select
                  value={t.status}
                  onChange={e => updateTask(t.id!, { status: e.target.value as Task['status'], bijgewerktOp: Date.now() })}
                  style={{ width: 'auto', fontSize: '0.75rem', padding: '0.2rem 0.5rem', flexShrink: 0 }}
                >
                  <option value="open">Open</option>
                  <option value="inprogress">In behandeling</option>
                  <option value="done">Afgerond</option>
                </Select>

                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <button onClick={() => onEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex', opacity: 0.6 }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => onDelete(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '4px', display: 'flex', opacity: 0.6 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MijnTaken() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm(profile?.email || '', profile?.naam || ''))
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)

  useEffect(() => {
    const unsubs = [
      subscribeTasks(setTasks),
      subscribeProjects(setProjects),
      subscribeContacts(setContacts),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  const myTasks = useMemo(() =>
    tasks.filter(t => t.toegewezenAanEmail === profile?.email),
    [tasks, profile])

  const open = myTasks.filter(t => t.status === 'open')
  const inProgress = myTasks.filter(t => t.status === 'inprogress')
  const done = myTasks.filter(t => t.status === 'done')
  const overdue = myTasks.filter(t => isOverdue(t.deadline) && t.status !== 'done')

  function openAdd() {
    setEditTask(null)
    setForm(emptyForm(profile?.email || '', profile?.naam || ''))
    setShowModal(true)
  }

  function openEdit(t: Task) {
    setEditTask(t)
    setForm({
      titel: t.titel, omschrijving: t.omschrijving || '', status: t.status,
      prioriteit: t.prioriteit, deadline: t.deadline || '',
      toegewezenAan: t.toegewezenAan || profile?.naam || '',
      toegewezenAanEmail: t.toegewezenAanEmail || profile?.email || '',
      projectId: t.projectId || '', projectNaam: t.projectNaam || '',
      contactId: t.contactId || '', contactNaam: t.contactNaam || '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.titel.trim()) return
    setSaving(true)
    const now = Date.now()
    try {
      if (editTask?.id) {
        await updateTask(editTask.id, { ...form, bijgewerktOp: now })
      } else {
        await addTask({ ...form, aangemaaktOp: now, bijgewerktOp: now })
      }
      setShowModal(false)
      setEditTask(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function toggleDone(t: Task) {
    if (!t.id) return
    const newStatus: Task['status'] = t.status === 'done' ? 'open' : 'done'
    await updateTask(t.id, { status: newStatus, bijgewerktOp: Date.now() })
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return
    await deleteTask(deleteTarget.id).catch(console.error)
    setDeleteTarget(null)
  }

  function pickProject(id: string) {
    const p = projects.find(p => p.id === id)
    setForm(f => ({ ...f, projectId: id, projectNaam: p?.naam || '' }))
  }

  function pickContact(id: string) {
    const c = contacts.find(c => c.id === id)
    setForm(f => ({ ...f, contactId: id, contactNaam: c?.naam || '' }))
  }

  const f = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const firstName = (profile?.naam || 'jij').split(' ')[0]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
            Mijn taken
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
            Persoonlijk takenoverzicht van {firstName}
          </p>
        </div>
        <Button onClick={openAdd}><Plus size={15} /> Nieuwe taak</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <StatChip icon={<Clock size={18} />} label="Open" value={open.length} color="var(--color-text-muted)" />
        <StatChip icon={<CheckCircle2 size={18} />} label="In behandeling" value={inProgress.length} color="var(--color-accent)" />
        <StatChip icon={<AlertCircle size={18} />} label="Vervallen" value={overdue.length} color="var(--color-danger)" />
        <StatChip icon={<CheckCircle2 size={18} />} label="Afgerond" value={done.length} color="var(--color-success)" />
      </div>

      {myTasks.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Geen taken aan jou toegewezen.
          </div>
          <Button onClick={openAdd}><Plus size={15} /> Maak je eerste taak aan</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <TaskSection
            title="In behandeling"
            tasks={inProgress}
            defaultOpen={true}
            onToggle={toggleDone}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            currentUserEmail={profile?.email}
          />
          <TaskSection
            title="Open"
            tasks={open}
            defaultOpen={true}
            onToggle={toggleDone}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            currentUserEmail={profile?.email}
          />
          <TaskSection
            title="Afgerond"
            tasks={done}
            defaultOpen={false}
            onToggle={toggleDone}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            currentUserEmail={profile?.email}
          />
        </div>
      )}

      {/* New/Edit task modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTask(null) }}
        title={editTask ? 'Taak bewerken' : 'Nieuwe taak'}
        width={480}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowModal(false); setEditTask(null) }}>Annuleer</Button>
            <Button onClick={handleSave} disabled={!form.titel.trim() || saving}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </>
        }
      >
        <Input label="Titel *" value={form.titel} onChange={e => f('titel', e.target.value)} placeholder="Wat moet er gedaan worden?" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Select label="Status" value={form.status} onChange={e => f('status', e.target.value as Task['status'])}>
            <option value="open">Open</option>
            <option value="inprogress">In behandeling</option>
            <option value="done">Afgerond</option>
          </Select>
          <Select label="Prioriteit" value={form.prioriteit} onChange={e => f('prioriteit', e.target.value as Task['prioriteit'])}>
            <option value="laag">Laag</option>
            <option value="normaal">Normaal</option>
            <option value="hoog">Hoog</option>
          </Select>
        </div>

        <Input label="Deadline" type="date" value={form.deadline as string} onChange={e => f('deadline', e.target.value)} />

        <Select label="Project" value={form.projectId as string} onChange={e => pickProject(e.target.value)}>
          <option value="">— Geen project —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.naam}</option>)}
        </Select>

        <Select label="Contact" value={form.contactId as string} onChange={e => pickContact(e.target.value)}>
          <option value="">— Geen contact —</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.naam}{c.bedrijf ? ` (${c.bedrijf})` : ''}</option>)}
        </Select>

        <Textarea label="Omschrijving" value={form.omschrijving as string} onChange={e => f('omschrijving', e.target.value)} placeholder="Toelichting" rows={3} />

        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '0.5rem 0.75rem', background: 'var(--color-surface-muted)', borderRadius: '7px' }}>
          Toegewezen aan: <strong>{profile?.naam}</strong> (jij)
        </div>
      </Modal>

      {/* Delete confirm */}
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
