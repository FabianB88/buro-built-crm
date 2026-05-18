import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { subscribeProjects, updateProject } from '../services/projects'
import { subscribeTasks, addTask, updateTask, deleteTask } from '../services/tasks'
import { subscribeNotes, addNote, deleteNote } from '../services/notes'
import { subscribeAllowedUsers, AllowedUser } from '../services/allowedUsers'
import { Project, Task, Note } from '../types'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import {
  ArrowLeft, Plus, Trash2, CheckSquare,
  StickyNote, Users, Calendar, Pencil
} from 'lucide-react'

const STATUS_COLS: { key: Task['status']; label: string; color: string }[] = [
  { key: 'open', label: 'Open', color: 'var(--color-text-muted)' },
  { key: 'inprogress', label: 'In behandeling', color: '#f59e0b' },
  { key: 'done', label: 'Afgerond', color: '#22c55e' },
]

const PROJ_STATUS_BADGE: Record<string, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  concept: 'default', actief: 'success', 'on-hold': 'warning', afgerond: 'accent', geannuleerd: 'danger',
}

const PRIO_COLOR: Record<string, string> = {
  hoog: 'var(--color-danger)', normaal: '#f59e0b', laag: 'var(--color-text-muted)',
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

const today = () => new Date().toISOString().split('T')[0]

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [users, setUsers] = useState<AllowedUser[]>([])

  // Edit project
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Project>>({})
  const [saving, setSaving] = useState(false)

  // Add task
  const [taskOpen, setTaskOpen] = useState(false)
  const [taskForm, setTaskForm] = useState({
    titel: '', omschrijving: '', prioriteit: 'normaal' as Task['prioriteit'],
    deadline: '', toegewezenAanEmail: '',
  })
  const [taskSaving, setTaskSaving] = useState(false)

  // Add note
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)

  // Deletes
  const [delTask, setDelTask] = useState<Task | null>(null)
  const [delNote, setDelNote] = useState<Note | null>(null)

  useEffect(() => {
    const unsubs = [
      subscribeProjects(setProjects),
      subscribeTasks(setTasks),
      subscribeNotes(setNotes),
      subscribeAllowedUsers(setUsers),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  const project = useMemo(() => projects.find(p => p.id === id), [projects, id])
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === id), [tasks, id])
  const projectNotes = useMemo(() => notes.filter(n => n.projectId === id), [notes, id])

  const emailToName = (email: string) => email.split('@')[0]

  function openEdit() {
    if (!project) return
    setEditForm({ ...project })
    setEditOpen(true)
  }

  async function handleEditSave() {
    if (!project?.id || !editForm.naam?.trim()) return
    setSaving(true)
    try {
      await updateProject(project.id, { ...editForm, bijgewerktOp: Date.now() })
      setEditOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddTask() {
    if (!taskForm.titel.trim() || !project) return
    setTaskSaving(true)
    try {
      const assignee = taskForm.toegewezenAanEmail ? { naam: taskForm.toegewezenAanEmail.split('@')[0] } : null
      await addTask({
        titel: taskForm.titel.trim(),
        omschrijving: taskForm.omschrijving || undefined,
        status: 'open',
        prioriteit: taskForm.prioriteit,
        deadline: taskForm.deadline || undefined,
        toegewezenAan: assignee?.naam || undefined,
        toegewezenAanEmail: taskForm.toegewezenAanEmail || undefined,
        projectId: project.id,
        projectNaam: project.naam,
        aangemaaktOp: Date.now(),
        bijgewerktOp: Date.now(),
      })
      setTaskForm({ titel: '', omschrijving: '', prioriteit: 'normaal', deadline: '', toegewezenAanEmail: '' })
      setTaskOpen(false)
    } finally {
      setTaskSaving(false)
    }
  }

  async function handleAddNote() {
    if (!noteText.trim() || !project) return
    setNoteSaving(true)
    try {
      await addNote({
        tekst: noteText.trim(),
        projectId: project.id,
        projectNaam: project.naam,
        auteur: profile?.naam || 'Onbekend',
        auteurEmail: profile?.email,
        aangemaaktOp: Date.now(),
      })
      setNoteText('')
      setNoteOpen(false)
    } finally {
      setNoteSaving(false)
    }
  }

  async function cycleStatus(task: Task) {
    if (!task.id) return
    const next: Task['status'] =
      task.status === 'open' ? 'inprogress' : task.status === 'inprogress' ? 'done' : 'open'
    await updateTask(task.id, { status: next })
  }

  if (!project) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Project niet gevonden.{' '}
        <button
          onClick={() => navigate('/projecten')}
          style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Terug naar projecten
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/projecten')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', padding: '0.35rem 0.5rem', borderRadius: '6px' }}
        >
          <ArrowLeft size={15} /> Projecten
        </button>
        <span style={{ color: 'var(--color-border)' }}>/</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{project.naam}</span>
      </div>

      {/* Project info card */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>{project.naam}</h1>
              <Badge variant={PROJ_STATUS_BADGE[project.status] || 'default'}>{project.status}</Badge>
            </div>
            {project.omschrijving && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0', lineHeight: 1.6 }}>
                {project.omschrijving}
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              {project.opdrachtgeverNaam && (
                <span>📋 <strong style={{ color: 'var(--color-text)' }}>{project.opdrachtgeverNaam}</strong></span>
              )}
              {project.startdatum && (
                <span>🗓 Start: <strong style={{ color: 'var(--color-text)' }}>{project.startdatum}</strong></span>
              )}
              {project.einddatum && (
                <span>🏁 Einde: <strong style={{ color: 'var(--color-text)' }}>{project.einddatum}</strong></span>
              )}
              {project.budget && (
                <span>💶 Budget: <strong style={{ color: 'var(--color-text)' }}>{project.budget}</strong></span>
              )}
              {project.locatie && (
                <span>📍 <strong style={{ color: 'var(--color-text)' }}>{project.locatie}</strong></span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={openEdit}>
            <Pencil size={14} /> Bewerken
          </Button>
        </div>

        {project.teamleden && project.teamleden.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <Users size={14} style={{ color: 'var(--color-text-muted)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>Team:</span>
            {project.teamleden.map(email => (
              <div
                key={email}
                title={emailToName(email)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}
              >
                {emailToName(email).charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kanban */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckSquare size={17} /> Taken
          <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
            ({projectTasks.length})
          </span>
        </h2>
        <Button size="sm" onClick={() => setTaskOpen(true)}>
          <Plus size={14} /> Taak toevoegen
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {STATUS_COLS.map(col => {
          const colTasks = projectTasks.filter(t => t.status === col.key)
          return (
            <div
              key={col.key}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}
            >
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {col.label}
                </span>
                <span style={{ fontSize: '0.7rem', background: 'var(--color-border)', color: 'var(--color-text-muted)', borderRadius: '20px', padding: '1px 7px' }}>
                  {colTasks.length}
                </span>
              </div>
              <div style={{ padding: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '100px' }}>
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIO_COLOR[task.prioriteit], flexShrink: 0, marginTop: 4 }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{task.titel}</span>
                      <button
                        onClick={() => setDelTask(task)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2, flexShrink: 0 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {task.omschrijving && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '0 0 0.375rem 1rem', lineHeight: 1.4 }}>
                        {task.omschrijving.slice(0, 80)}{task.omschrijving.length > 80 ? '…' : ''}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', paddingLeft: '1rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {task.deadline && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: task.deadline < today() ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                          <Calendar size={11} />{task.deadline}
                        </span>
                      )}
                      {task.toegewezenAan && <span>👤 {task.toegewezenAan}</span>}
                    </div>
                    <button
                      onClick={() => cycleStatus(task)}
                      style={{ marginTop: '0.5rem', marginLeft: '1rem', fontSize: '0.68rem', padding: '2px 8px', borderRadius: '20px', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                    >
                      {col.key === 'open' ? '→ In behandeling' : col.key === 'inprogress' ? '✓ Afgerond' : '↩ Heropen'}
                    </button>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1.25rem 0' }}>
                    Geen taken
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Notes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StickyNote size={17} /> Notities
          <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
            ({projectNotes.length})
          </span>
        </h2>
        <Button size="sm" onClick={() => setNoteOpen(true)}>
          <Plus size={14} /> Notitie toevoegen
        </Button>
      </div>

      {projectNotes.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '2rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          Nog geen notities gekoppeld aan dit project.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.875rem' }}>
          {projectNotes.map(n => (
            <div key={n.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.55, margin: '0 0 0.75rem 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {n.tekst.length > 220 ? n.tekst.slice(0, 220) + '…' : n.tekst}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  <span style={{ fontWeight: 500 }}>{n.auteur}</span>{' · '}{fmtDate(n.aangemaaktOp)}
                </div>
                <Button variant="danger" size="sm" onClick={() => setDelNote(n)}><Trash2 size={13} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}

      {/* Edit project */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Project bewerken" width={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Annuleren</Button>
            <Button onClick={handleEditSave} disabled={saving || !editForm.naam?.trim()}>
              {saving ? 'Opslaan…' : 'Bijwerken'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Naam *" value={editForm.naam || ''} onChange={e => setEditForm(p => ({ ...p, naam: e.target.value }))} />
          </div>
          <Select label="Status" value={editForm.status || 'concept'} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as Project['status'] }))}>
            <option value="concept">Concept</option>
            <option value="actief">Actief</option>
            <option value="on-hold">On hold</option>
            <option value="afgerond">Afgerond</option>
            <option value="geannuleerd">Geannuleerd</option>
          </Select>
          <Input label="Locatie" value={editForm.locatie || ''} onChange={e => setEditForm(p => ({ ...p, locatie: e.target.value }))} />
          <Input label="Startdatum" type="date" value={editForm.startdatum || ''} onChange={e => setEditForm(p => ({ ...p, startdatum: e.target.value }))} />
          <Input label="Einddatum" type="date" value={editForm.einddatum || ''} onChange={e => setEditForm(p => ({ ...p, einddatum: e.target.value }))} />
          <Input label="Budget" value={editForm.budget || ''} onChange={e => setEditForm(p => ({ ...p, budget: e.target.value }))} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea label="Omschrijving" value={editForm.omschrijving || ''} onChange={e => setEditForm(p => ({ ...p, omschrijving: e.target.value }))} rows={3} />
          </div>
        </div>
      </Modal>

      {/* Add task */}
      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Taak toevoegen" width={460}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTaskOpen(false)}>Annuleren</Button>
            <Button onClick={handleAddTask} disabled={taskSaving || !taskForm.titel.trim()}>
              {taskSaving ? 'Opslaan…' : 'Toevoegen'}
            </Button>
          </>
        }
      >
        <Input label="Titel *" value={taskForm.titel} onChange={e => setTaskForm(p => ({ ...p, titel: e.target.value }))} autoFocus />
        <Textarea label="Omschrijving" value={taskForm.omschrijving} onChange={e => setTaskForm(p => ({ ...p, omschrijving: e.target.value }))} rows={2} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Select label="Prioriteit" value={taskForm.prioriteit} onChange={e => setTaskForm(p => ({ ...p, prioriteit: e.target.value as Task['prioriteit'] }))}>
            <option value="laag">Laag</option>
            <option value="normaal">Normaal</option>
            <option value="hoog">Hoog</option>
          </Select>
          <Input label="Deadline" type="date" value={taskForm.deadline} onChange={e => setTaskForm(p => ({ ...p, deadline: e.target.value }))} />
        </div>
        <Select label="Toegewezen aan" value={taskForm.toegewezenAanEmail} onChange={e => setTaskForm(p => ({ ...p, toegewezenAanEmail: e.target.value }))}>
          <option value="">— Niemand —</option>
          {users.map(u => <option key={u.email} value={u.email}>{u.email.split('@')[0]}</option>)}
        </Select>
      </Modal>

      {/* Add note */}
      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title="Notitie toevoegen" width={440}
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteOpen(false)}>Annuleren</Button>
            <Button onClick={handleAddNote} disabled={noteSaving || !noteText.trim()}>
              {noteSaving ? 'Opslaan…' : 'Toevoegen'}
            </Button>
          </>
        }
      >
        <Textarea label="Notitie *" value={noteText} onChange={e => setNoteText(e.target.value)} rows={5} autoFocus />
      </Modal>

      {/* Delete task */}
      <Modal open={!!delTask} onClose={() => setDelTask(null)} title="Taak verwijderen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDelTask(null)}>Annuleren</Button>
            <Button variant="danger" onClick={async () => { if (delTask?.id) { await deleteTask(delTask.id); setDelTask(null) } }}>Verwijderen</Button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Weet je zeker dat je "{delTask?.titel}" wilt verwijderen?
        </p>
      </Modal>

      {/* Delete note */}
      <Modal open={!!delNote} onClose={() => setDelNote(null)} title="Notitie verwijderen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDelNote(null)}>Annuleren</Button>
            <Button variant="danger" onClick={async () => { if (delNote?.id) { await deleteNote(delNote.id); setDelNote(null) } }}>Verwijderen</Button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Weet je zeker dat je deze notitie wilt verwijderen?
        </p>
      </Modal>
    </div>
  )
}
