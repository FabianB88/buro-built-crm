import { useEffect, useState } from 'react'
import { subscribeTasks, addTask, updateTask, deleteTask } from '../services/tasks'
import { Task } from '../types'
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
import { CheckSquare, Pencil, Trash2 } from 'lucide-react'

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

const emptyForm = (): Omit<Task, 'id' | 'aangemaaktOp' | 'bijgewerktOp'> => ({
  titel: '',
  omschrijving: '',
  status: 'open',
  prioriteit: 'normaal',
  deadline: '',
  toegewezenAan: '',
  projectId: '',
  projectNaam: '',
  contactId: '',
  contactNaam: '',
})

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false
  return deadline < new Date().toISOString().split('T')[0]
}

export default function Taken() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('alle')
  const [prioriteitFilter, setPrioriteitFilter] = useState<string>('alle')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    return subscribeTasks(setTasks)
  }, [])

  const filtered = tasks.filter(t => {
    const matchSearch =
      t.titel.toLowerCase().includes(search.toLowerCase()) ||
      (t.toegewezenAan || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.projectNaam || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'alle' || t.status === statusFilter
    const matchPrioriteit = prioriteitFilter === 'alle' || t.prioriteit === prioriteitFilter
    return matchSearch && matchStatus && matchPrioriteit
  })

  function openAdd() {
    setEditTask(null)
    setForm(emptyForm())
    setShowModal(true)
  }

  function openEdit(t: Task) {
    setEditTask(t)
    setForm({
      titel: t.titel,
      omschrijving: t.omschrijving || '',
      status: t.status,
      prioriteit: t.prioriteit,
      deadline: t.deadline || '',
      toegewezenAan: t.toegewezenAan || '',
      projectId: t.projectId || '',
      projectNaam: t.projectNaam || '',
      contactId: t.contactId || '',
      contactNaam: t.contactNaam || '',
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditTask(null)
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
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await deleteTask(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  async function toggleDone(t: Task) {
    if (!t.id) return
    const newStatus: Task['status'] = t.status === 'done' ? 'open' : 'done'
    await updateTask(t.id, { status: newStatus, bijgewerktOp: Date.now() })
  }

  function field(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  return (
    <div>
      <PageHeader
        title="Taken"
        subtitle={`${tasks.filter(t => t.status !== 'done').length} open`}
        action={<Button onClick={openAdd}>+ Nieuwe taak</Button>}
      />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek taken…" />
        </div>
        <div style={{ minWidth: 160 }}>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="alle">Alle statussen</option>
            <option value="open">Open</option>
            <option value="inprogress">In behandeling</option>
            <option value="done">Klaar</option>
          </Select>
        </div>
        <div style={{ minWidth: 150 }}>
          <Select value={prioriteitFilter} onChange={e => setPrioriteitFilter(e.target.value)}>
            <option value="alle">Alle prioriteiten</option>
            <option value="hoog">Hoog</option>
            <option value="normaal">Normaal</option>
            <option value="laag">Laag</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Geen taken gevonden"
          description={search || statusFilter !== 'alle' || prioriteitFilter !== 'alle' ? 'Pas je filters aan.' : 'Voeg je eerste taak toe.'}
          action={<Button onClick={openAdd}>+ Nieuwe taak</Button>}
        />
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {filtered.map(t => {
            const overdue = isOverdue(t.deadline) && t.status !== 'done'
            const done = t.status === 'done'
            return (
              <div
                key={t.id}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  opacity: done ? 0.65 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggleDone(t)}
                  style={{ cursor: 'pointer', width: 16, height: 16, flexShrink: 0, accentColor: 'var(--color-success)' }}
                />

                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: priorityColors[t.prioriteit],
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--color-primary)',
                    textDecoration: done ? 'line-through' : 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}>
                    {t.titel}
                  </span>
                  {(t.projectNaam || t.toegewezenAan) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {[t.projectNaam, t.toegewezenAan].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>

                <Badge variant={statusVariantMap[t.status]}>{statusLabels[t.status]}</Badge>

                {t.deadline && (
                  <span style={{
                    fontSize: '0.78rem',
                    color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)',
                    flexShrink: 0,
                    fontWeight: overdue ? 600 : 400,
                  }}>
                    {t.deadline}
                  </span>
                )}

                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(t)}>
                    <Trash2 size={14} />
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
        title={editTask ? 'Taak bewerken' : 'Nieuwe taak'}
        width={480}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Annuleer</Button>
            <Button onClick={handleSave} disabled={!form.titel.trim() || saving}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </>
        }
      >
        <Input
          label="Titel *"
          value={form.titel}
          onChange={e => field('titel', e.target.value)}
          placeholder="Taaknaam"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Select
            label="Status"
            value={form.status}
            onChange={e => field('status', e.target.value as Task['status'])}
          >
            <option value="open">Open</option>
            <option value="inprogress">In behandeling</option>
            <option value="done">Klaar</option>
          </Select>
          <Select
            label="Prioriteit"
            value={form.prioriteit}
            onChange={e => field('prioriteit', e.target.value as Task['prioriteit'])}
          >
            <option value="laag">Laag</option>
            <option value="normaal">Normaal</option>
            <option value="hoog">Hoog</option>
          </Select>
        </div>
        <Input
          label="Deadline"
          type="date"
          value={form.deadline}
          onChange={e => field('deadline', e.target.value)}
        />
        <Input
          label="Toegewezen aan"
          value={form.toegewezenAan}
          onChange={e => field('toegewezenAan', e.target.value)}
          placeholder="Naam teamlid"
        />
        <Input
          label="Project"
          value={form.projectNaam}
          onChange={e => field('projectNaam', e.target.value)}
          placeholder="Projectnaam"
        />
        <Input
          label="Contact"
          value={form.contactNaam}
          onChange={e => field('contactNaam', e.target.value)}
          placeholder="Contactnaam"
        />
        <Textarea
          label="Omschrijving"
          value={form.omschrijving}
          onChange={e => field('omschrijving', e.target.value)}
          placeholder="Toelichting"
          rows={3}
        />
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Taak verwijderen"
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
          Weet je zeker dat je <strong>{deleteTarget?.titel}</strong> wilt verwijderen?
        </p>
      </Modal>
    </div>
  )
}
