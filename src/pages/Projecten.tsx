import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscribeProjects, addProject, updateProject, deleteProject } from '../services/projects'
import { subscribeClients } from '../services/clients'
import { subscribeAllowedUsers, AllowedUser } from '../services/allowedUsers'
import { Project, Client } from '../types'
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
import { FolderKanban, Pencil, Trash2, Plus, Users, Eye } from 'lucide-react'

type StatusVariant = 'default' | 'success' | 'warning' | 'accent' | 'danger'

const statusVariantMap: Record<Project['status'], StatusVariant> = {
  concept: 'default', actief: 'success', 'on-hold': 'warning', afgerond: 'accent', geannuleerd: 'danger',
}
const statusLabels: Record<Project['status'], string> = {
  concept: 'Concept', actief: 'Actief', 'on-hold': 'On hold', afgerond: 'Afgerond', geannuleerd: 'Geannuleerd',
}

type FormState = Omit<Project, 'id' | 'aangemaaktOp' | 'bijgewerktOp'>

const emptyForm = (): FormState => ({
  naam: '', omschrijving: '', status: 'concept',
  opdrachtgeverId: '', opdrachtgeverNaam: '', teamleden: [],
  startdatum: '', einddatum: '', locatie: '', budget: '',
})

export default function Projecten() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<AllowedUser[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('alle')
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  useEffect(() => {
    const unsubs = [
      subscribeProjects(setProjects),
      subscribeClients(setClients),
      subscribeAllowedUsers(setUsers),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  const filtered = useMemo(() => projects.filter(p => {
    const matchSearch =
      p.naam.toLowerCase().includes(search.toLowerCase()) ||
      (p.opdrachtgeverNaam || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.omschrijving || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'alle' || p.status === statusFilter
    return matchSearch && matchStatus
  }), [projects, search, statusFilter])

  function openAdd() {
    setEditProject(null)
    setForm(emptyForm())
    setError('')
    setShowModal(true)
  }

  function openEdit(p: Project) {
    setEditProject(p)
    setForm({
      naam: p.naam, omschrijving: p.omschrijving || '', status: p.status,
      opdrachtgeverId: p.opdrachtgeverId || '', opdrachtgeverNaam: p.opdrachtgeverNaam || '',
      teamleden: p.teamleden || [],
      startdatum: p.startdatum || '', einddatum: p.einddatum || '',
      locatie: p.locatie || '', budget: p.budget || '',
    })
    setError('')
    setShowModal(true)
  }

  function closeModal() { setShowModal(false); setEditProject(null) }

  function pickClient(id: string) {
    const c = clients.find(c => c.id === id)
    setForm(f => ({ ...f, opdrachtgeverId: id, opdrachtgeverNaam: c?.naam || '' }))
  }

  function toggleTeamlid(email: string) {
    setForm(f => {
      const current = f.teamleden || []
      const next = current.includes(email) ? current.filter(e => e !== email) : [...current, email]
      return { ...f, teamleden: next }
    })
  }

  async function handleSave() {
    if (!form.naam.trim()) return
    setSaving(true)
    setError('')
    const now = Date.now()
    try {
      if (editProject?.id) {
        await updateProject(editProject.id, { ...form, bijgewerktOp: now })
      } else {
        await addProject({ ...form, aangemaaktOp: now, bijgewerktOp: now })
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
      await deleteProject(deleteTarget.id)
      setDeleteTarget(null)
    } catch (e) {
      console.error(e)
    }
  }

  function emailToName(email: string) {
    const u = users.find(u => u.email === email)
    return u ? u.email.split('@')[0] : email.split('@')[0]
  }

  const f = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  return (
    <div>
      <PageHeader
        title="Projecten"
        subtitle={`${projects.length} project${projects.length !== 1 ? 'en' : ''}`}
        action={<Button onClick={openAdd}><Plus size={15} /> Nieuw project</Button>}
      />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek projecten…" style={{ flex: '1 1 220px' }} />
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 160 }}>
          <option value="alle">Alle statussen</option>
          <option value="concept">Concept</option>
          <option value="actief">Actief</option>
          <option value="on-hold">On hold</option>
          <option value="afgerond">Afgerond</option>
          <option value="geannuleerd">Geannuleerd</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Geen projecten gevonden"
          description={search || statusFilter !== 'alle' ? 'Pas je filters aan.' : 'Voeg je eerste project toe.'}
          action={!search && statusFilter === 'alle' ? <Button onClick={openAdd}><Plus size={15} /> Nieuw project</Button> : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filtered.map(p => (
            <div
              key={p.id}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-primary)', flex: 1 }}>{p.naam}</span>
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
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.omschrijving}
                </div>
              )}

              {(p.teamleden || []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                  <Users size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  {(p.teamleden || []).map(email => (
                    <span key={email} title={emailToName(email)} style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24, borderRadius: '50%',
                      background: email === profile?.email ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                      color: email === profile?.email ? '#fff' : 'var(--color-text-muted)',
                      fontSize: '0.65rem', fontWeight: 600,
                    }}>
                      {emailToName(email).charAt(0).toUpperCase()}
                    </span>
                  ))}
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {(p.teamleden || []).map(emailToName).join(', ')}
                  </span>
                </div>
              )}

              {p.budget && (
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Budget: {p.budget}</div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/projecten/${p.id}`)}><Eye size={14} /> Detail</Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil size={14} /> Bewerk</Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(p)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editProject ? 'Project bewerken' : 'Nieuw project'}
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Annuleer</Button>
            <Button onClick={handleSave} disabled={!form.naam.trim() || saving}>
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
        <Input label="Naam *" value={form.naam} onChange={e => f('naam', e.target.value)} placeholder="Projectnaam" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Select label="Status" value={form.status} onChange={e => f('status', e.target.value as Project['status'])}>
            <option value="concept">Concept</option>
            <option value="actief">Actief</option>
            <option value="on-hold">On hold</option>
            <option value="afgerond">Afgerond</option>
            <option value="geannuleerd">Geannuleerd</option>
          </Select>
          <Select label="Opdrachtgever" value={form.opdrachtgeverId as string} onChange={e => pickClient(e.target.value)}>
            <option value="">— Geen —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.naam}</option>)}
          </Select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Team
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {users.map(u => {
              const selected = (form.teamleden || []).includes(u.email)
              return (
                <button
                  key={u.email}
                  onClick={() => toggleTeamlid(u.email)}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem',
                    cursor: 'pointer', border: '1.5px solid',
                    borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                    background: selected ? 'var(--color-primary)' : 'transparent',
                    color: selected ? '#fff' : 'var(--color-text-muted)',
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  {u.email.split('@')[0]}{u.email === profile?.email ? ' (jij)' : ''}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Input label="Startdatum" type="date" value={form.startdatum as string} onChange={e => f('startdatum', e.target.value)} />
          <Input label="Einddatum" type="date" value={form.einddatum as string} onChange={e => f('einddatum', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Input label="Locatie" value={form.locatie as string} onChange={e => f('locatie', e.target.value)} placeholder="Locatie" />
          <Input label="Budget" value={form.budget as string} onChange={e => f('budget', e.target.value)} placeholder="€ Budget" />
        </div>

        <Textarea label="Omschrijving" value={form.omschrijving as string} onChange={e => f('omschrijving', e.target.value)} placeholder="Korte omschrijving van het project" rows={3} />
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Project verwijderen"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Annuleer</Button>
            <Button variant="danger" onClick={handleDelete}>Verwijder</Button>
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
