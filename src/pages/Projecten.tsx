import { useEffect, useState } from 'react'
import { subscribeProjects, addProject, updateProject, deleteProject } from '../services/projects'
import { Project } from '../types'
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
import { FolderKanban, Pencil, Trash2 } from 'lucide-react'

type StatusVariant = 'default' | 'success' | 'warning' | 'accent' | 'danger'

const statusVariantMap: Record<Project['status'], StatusVariant> = {
  concept: 'default',
  actief: 'success',
  'on-hold': 'warning',
  afgerond: 'accent',
  geannuleerd: 'danger',
}

const statusLabels: Record<Project['status'], string> = {
  concept: 'Concept',
  actief: 'Actief',
  'on-hold': 'On hold',
  afgerond: 'Afgerond',
  geannuleerd: 'Geannuleerd',
}

const emptyForm = (): Omit<Project, 'id' | 'aangemaaktOp' | 'bijgewerktOp'> => ({
  naam: '',
  omschrijving: '',
  status: 'concept',
  opdrachtgeverId: '',
  opdrachtgeverNaam: '',
  startdatum: '',
  einddatum: '',
  locatie: '',
  budget: '',
})

export default function Projecten() {
  const { profile } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('alle')
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    return subscribeProjects(setProjects)
  }, [])

  const filtered = projects.filter(p => {
    const matchSearch =
      p.naam.toLowerCase().includes(search.toLowerCase()) ||
      (p.opdrachtgeverNaam || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.omschrijving || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'alle' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  function openAdd() {
    setEditProject(null)
    setForm(emptyForm())
    setShowModal(true)
  }

  function openEdit(p: Project) {
    setEditProject(p)
    setForm({
      naam: p.naam,
      omschrijving: p.omschrijving || '',
      status: p.status,
      opdrachtgeverId: p.opdrachtgeverId || '',
      opdrachtgeverNaam: p.opdrachtgeverNaam || '',
      startdatum: p.startdatum || '',
      einddatum: p.einddatum || '',
      locatie: p.locatie || '',
      budget: p.budget || '',
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditProject(null)
  }

  async function handleSave() {
    if (!form.naam.trim()) return
    setSaving(true)
    const now = Date.now()
    try {
      if (editProject?.id) {
        await updateProject(editProject.id, { ...form, bijgewerktOp: now })
      } else {
        await addProject({ ...form, aangemaaktOp: now, bijgewerktOp: now })
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
      await deleteProject(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  function field(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  return (
    <div>
      <PageHeader
        title="Projecten"
        subtitle={`${projects.length} project${projects.length !== 1 ? 'en' : ''}`}
        action={<Button onClick={openAdd}>+ Nieuw project</Button>}
      />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek projecten…" />
        </div>
        <div style={{ minWidth: 160 }}>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="alle">Alle statussen</option>
            <option value="concept">Concept</option>
            <option value="actief">Actief</option>
            <option value="on-hold">On hold</option>
            <option value="afgerond">Afgerond</option>
            <option value="geannuleerd">Geannuleerd</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Geen projecten gevonden"
          description={search || statusFilter !== 'alle' ? 'Pas je filters aan.' : 'Voeg je eerste project toe.'}
          action={<Button onClick={openAdd}>+ Nieuw project</Button>}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {filtered.map(p => (
            <div
              key={p.id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-primary)', flex: 1 }}>
                  {p.naam}
                </span>
                <Badge variant={statusVariantMap[p.status]}>{statusLabels[p.status]}</Badge>
              </div>

              {p.opdrachtgeverNaam && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {p.opdrachtgeverNaam}
                </div>
              )}

              {(p.startdatum || p.einddatum) && (
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  {p.startdatum || '—'} – {p.einddatum || '—'}
                </div>
              )}

              {p.omschrijving && (
                <div style={{
                  fontSize: '0.82rem',
                  color: 'var(--color-text-muted)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {p.omschrijving}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                  <Pencil size={14} style={{ marginRight: '4px' }} />
                  Bewerk
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(p)}>
                  <Trash2 size={14} style={{ marginRight: '4px' }} />
                  Verwijder
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editProject ? 'Project bewerken' : 'Nieuw project'}
        width={500}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Annuleer</Button>
            <Button onClick={handleSave} disabled={!form.naam.trim() || saving}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </>
        }
      >
        <Input
          label="Naam *"
          value={form.naam}
          onChange={e => field('naam', e.target.value)}
          placeholder="Projectnaam"
        />
        <Select
          label="Status"
          value={form.status}
          onChange={e => field('status', e.target.value as Project['status'])}
        >
          <option value="concept">Concept</option>
          <option value="actief">Actief</option>
          <option value="on-hold">On hold</option>
          <option value="afgerond">Afgerond</option>
          <option value="geannuleerd">Geannuleerd</option>
        </Select>
        <Input
          label="Opdrachtgever"
          value={form.opdrachtgeverNaam}
          onChange={e => field('opdrachtgeverNaam', e.target.value)}
          placeholder="Naam opdrachtgever"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Input
            label="Startdatum"
            type="date"
            value={form.startdatum}
            onChange={e => field('startdatum', e.target.value)}
          />
          <Input
            label="Einddatum"
            type="date"
            value={form.einddatum}
            onChange={e => field('einddatum', e.target.value)}
          />
        </div>
        <Input
          label="Locatie"
          value={form.locatie}
          onChange={e => field('locatie', e.target.value)}
          placeholder="Locatie"
        />
        <Input
          label="Budget"
          value={form.budget}
          onChange={e => field('budget', e.target.value)}
          placeholder="€ Budget"
        />
        <Textarea
          label="Omschrijving"
          value={form.omschrijving}
          onChange={e => field('omschrijving', e.target.value)}
          placeholder="Korte omschrijving van het project"
          rows={3}
        />
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Project verwijderen"
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
          Weet je zeker dat je <strong>{deleteTarget?.naam}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
      </Modal>
    </div>
  )
}
