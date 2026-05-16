import { useEffect, useState } from 'react'
import { subscribeContacts } from '../services/contacts'
import { subscribeProjects } from '../services/projects'
import { subscribeTasks, updateTask } from '../services/tasks'
import { subscribeClients } from '../services/clients'
import { Contact, Project, Task, Client } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { NavLink, useNavigate } from 'react-router-dom'
import { Users, FolderKanban, CheckSquare, Briefcase, ArrowRight, ListTodo, AlertCircle } from 'lucide-react'
import Badge from '../components/ui/Badge'

const PRIO_COLOR: Record<string, string> = {
  hoog: 'var(--color-danger)',
  normaal: 'var(--color-warning)',
  laag: 'var(--color-success)',
}

function todayStr() { return new Date().toISOString().split('T')[0] }

function StatCard({ label, value, icon: Icon, to, color }: { label: string, value: number, icon: React.ElementType, to: string, color: string }) {
  return (
    <NavLink to={to} style={{ textDecoration: 'none' }}>
      <div
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.125rem 1.375rem', display: 'flex', alignItems: 'center', gap: '0.875rem', transition: 'box-shadow 0.15s', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        <div style={{ width: 36, height: 36, borderRadius: '8px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color="#fff" strokeWidth={1.75} />
        </div>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{label}</div>
        </div>
        <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }} />
      </div>
    </NavLink>
  )
}

function Panel({ title, subtitle, linkTo, linkLabel, children }: { title: string, subtitle?: string, linkTo: string, linkLabel: string, children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>{title}</h2>
          {subtitle && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{subtitle}</div>}
        </div>
        <NavLink to={linkTo} style={{ fontSize: '0.72rem', color: 'var(--color-accent)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          {linkLabel} →
        </NavLink>
      </div>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    const unsubs = [
      subscribeContacts(setContacts),
      subscribeProjects(setProjects),
      subscribeTasks(setTasks),
      subscribeClients(setClients),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  const today = todayStr()
  const openTasks = tasks.filter(t => t.status !== 'done')
  const activeProjects = projects.filter(p => p.status === 'actief')

  // Personal
  const myOpenTasks = tasks.filter(t => t.toegewezenAanEmail === profile?.email && t.status !== 'done')
  const myOverdue = myOpenTasks.filter(t => t.deadline && t.deadline < today)
  const myProjects = projects.filter(p => (p.teamleden || []).includes(profile?.email || ''))

  // Sorted for display
  const myTasksSorted = [...myOpenTasks].sort((a, b) => {
    if (a.deadline && b.deadline) return a.deadline > b.deadline ? 1 : -1
    if (a.deadline) return -1
    if (b.deadline) return 1
    return 0
  }).slice(0, 7)

  const teamDeadlines = openTasks
    .filter(t => t.deadline)
    .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))
    .slice(0, 6)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond'
  const firstName = (profile?.naam || '').split(' ')[0]

  async function toggleTask(t: Task) {
    if (!t.id) return
    const newStatus: Task['status'] = t.status === 'done' ? 'open' : 'done'
    await updateTask(t.id, { status: newStatus, bijgewerktOp: Date.now() })
  }

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '3px', margin: '3px 0 0' }}>
          {myOverdue.length > 0
            ? `Je hebt ${myOverdue.length} vervallen taak${myOverdue.length !== 1 ? 'en' : ''} die aandacht nodig hebben.`
            : myOpenTasks.length > 0
            ? `Je hebt ${myOpenTasks.length} open taak${myOpenTasks.length !== 1 ? 'en' : ''} toegewezen.`
            : 'Alles bijgewerkt. Goed gedaan!'}
        </p>
      </div>

      {/* Overdue alert */}
      {myOverdue.length > 0 && (
        <div
          onClick={() => navigate('/mijn-taken')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.125rem', background: 'rgba(180,83,83,0.07)', border: '1px solid rgba(180,83,83,0.25)', borderRadius: '10px', marginBottom: '1.5rem', cursor: 'pointer' }}
        >
          <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--color-danger)', fontWeight: 500 }}>
            {myOverdue.length} vervallen {myOverdue.length === 1 ? 'taak' : 'taken'}: {myOverdue.slice(0, 2).map(t => t.titel).join(', ')}{myOverdue.length > 2 ? ` en ${myOverdue.length - 2} meer` : ''}
          </span>
          <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-danger)' }} />
        </div>
      )}

      {/* Global stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <StatCard label="Contacten" value={contacts.length} icon={Users} to="/contacten" color="var(--color-primary)" />
        <StatCard label="Opdrachtgevers" value={clients.length} icon={Briefcase} to="/opdrachtgevers" color="var(--color-accent)" />
        <StatCard label="Actieve projecten" value={activeProjects.length} icon={FolderKanban} to="/projecten" color="var(--color-success)" />
        <StatCard label="Open taken (team)" value={openTasks.length} icon={CheckSquare} to="/taken" color="#7c6a5e" />
      </div>

      {/* Main panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Mijn taken — personal */}
        <Panel title="Mijn taken" subtitle={`${myOpenTasks.length} open`} linkTo="/mijn-taken" linkLabel="Alle mijn taken">
          {myTasksSorted.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              Geen open taken aan jou toegewezen.{' '}
              <NavLink to="/mijn-taken" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>Maak een taak aan →</NavLink>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {myTasksSorted.map(t => {
                const overdue = t.deadline && t.deadline < today
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: '7px', background: overdue ? 'rgba(180,83,83,0.05)' : 'var(--color-background)' }}>
                    <input
                      type="checkbox"
                      checked={t.status === 'done'}
                      onChange={() => toggleTask(t)}
                      style={{ cursor: 'pointer', accentColor: 'var(--color-success)', flexShrink: 0 }}
                    />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIO_COLOR[t.prioriteit], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titel}</div>
                      {t.projectNaam && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t.projectNaam}</div>}
                    </div>
                    {t.deadline && (
                      <span style={{ fontSize: '0.72rem', color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)', flexShrink: 0, fontWeight: overdue ? 600 : 400 }}>
                        {t.deadline}
                      </span>
                    )}
                    {t.status === 'inprogress' && (
                      <Badge variant="accent">bezig</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

        {/* Team deadlines */}
        <Panel title="Team deadlines" subtitle="Alle open taken met deadline" linkTo="/taken" linkLabel="Alle taken">
          {teamDeadlines.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Geen open taken met deadline.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {teamDeadlines.map(t => {
                const overdue = t.deadline! < today
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.4rem 0' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: overdue ? 'var(--color-danger)' : PRIO_COLOR[t.prioriteit], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titel}</div>
                      {t.toegewezenAan && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t.toegewezenAan}</div>}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)', flexShrink: 0, fontWeight: overdue ? 600 : 400 }}>
                      {t.deadline}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

        {/* Mijn projecten */}
        <Panel title="Mijn projecten" subtitle="Projecten waar jij aan meewerkt" linkTo="/projecten" linkLabel="Alle projecten">
          {myProjects.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Niet toegevoegd aan projecten.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {myProjects.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: '7px', background: 'var(--color-background)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.naam}</div>
                    {p.opdrachtgeverNaam && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{p.opdrachtgeverNaam}</div>}
                  </div>
                  <Badge variant={p.status === 'actief' ? 'success' : p.status === 'on-hold' ? 'warning' : 'default'}>
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Recente contacten */}
        <Panel title="Recente contacten" subtitle="" linkTo="/contacten" linkLabel="Alle contacten">
          {contacts.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Nog geen contacten.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {contacts.slice(0, 5).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', padding: '0.4rem 0.625rem', borderRadius: '7px' }}
                  onClick={() => navigate(`/contacten/${c.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                    {c.naam.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.naam}</div>
                    {c.bedrijf && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.bedrijf}</div>}
                  </div>
                  <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: '20px', background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', flexShrink: 0, textTransform: 'capitalize' }}>
                    {c.categorie}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
