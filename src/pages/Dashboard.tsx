import { useEffect, useState, useMemo } from 'react'
import { subscribeContacts } from '../services/contacts'
import { subscribeProjects } from '../services/projects'
import { subscribeTasks, updateTask } from '../services/tasks'
import { subscribeClients } from '../services/clients'
import { subscribeNotes } from '../services/notes'
import { Contact, Project, Task, Client, Note } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { NavLink, useNavigate } from 'react-router-dom'
import { Users, FolderKanban, CheckSquare, Briefcase, ArrowRight, AlertCircle, Calendar, Activity, StickyNote } from 'lucide-react'
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
  const [notes, setNotes] = useState<Note[]>([])

  useEffect(() => {
    const unsubs = [
      subscribeContacts(setContacts),
      subscribeProjects(setProjects),
      subscribeTasks(setTasks),
      subscribeClients(setClients),
      subscribeNotes(setNotes),
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

  // Mijn contacten (where current user is accountmanager), sorted by volgend contactmoment
  const myContacts = contacts
    .filter(c => c.accountManager === profile?.email)
    .sort((a, b) => {
      if (a.volgendContactmoment && b.volgendContactmoment)
        return a.volgendContactmoment > b.volgendContactmoment ? 1 : -1
      if (a.volgendContactmoment) return -1
      if (b.volgendContactmoment) return 1
      return 0
    })

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

  // Activity feed — recent items across all collections
  type ActivityItem = { key: string; type: 'contact' | 'project' | 'task' | 'note' | 'client'; label: string; sub?: string; ts: number; to?: string }
  const recentActivity = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [
      ...contacts.map(c => ({ key: `c-${c.id}`, type: 'contact' as const, label: c.naam, sub: c.bedrijf, ts: c.bijgewerktOp, to: `/contacten/${c.id}` })),
      ...projects.map(p => ({ key: `p-${p.id}`, type: 'project' as const, label: p.naam, sub: p.opdrachtgeverNaam, ts: p.bijgewerktOp, to: `/projecten/${p.id}` })),
      ...tasks.map(t => ({ key: `t-${t.id}`, type: 'task' as const, label: t.titel, sub: t.projectNaam || t.contactNaam, ts: t.bijgewerktOp, to: '/taken' })),
      ...clients.map(cl => ({ key: `cl-${cl.id}`, type: 'client' as const, label: cl.naam, sub: cl.sector, ts: cl.bijgewerktOp, to: `/opdrachtgevers/${cl.id}` })),
      ...notes.map(n => ({ key: `n-${n.id}`, type: 'note' as const, label: n.tekst.slice(0, 60) + (n.tekst.length > 60 ? '…' : ''), sub: n.contactNaam || n.projectNaam, ts: n.aangemaaktOp, to: '/notities' })),
    ]
    return items.sort((a, b) => b.ts - a.ts).slice(0, 12)
  }, [contacts, projects, tasks, clients, notes])

  const ACTIVITY_ICON: Record<string, React.ElementType> = { contact: Users, project: FolderKanban, task: CheckSquare, note: StickyNote, client: Briefcase }
  const ACTIVITY_COLOR: Record<string, string> = { contact: 'var(--color-primary)', project: 'var(--color-success)', task: '#7c6a5e', note: '#b98a3e', client: 'var(--color-accent)' }
  const ACTIVITY_LABEL: Record<string, string> = { contact: 'Contact', project: 'Project', task: 'Taak', note: 'Notitie', client: 'Opdrachtgever' }

  function fmtRelative(ts: number): string {
    const diff = Date.now() - ts
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'zojuist'
    if (min < 60) return `${min}m geleden`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}u geleden`
    const d = Math.floor(hr / 24)
    if (d === 1) return 'gisteren'
    if (d < 7) return `${d} dagen geleden`
    return new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  }

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

        {/* Mijn contacten — accountmanager view */}
        <Panel
          title="Mijn contacten"
          subtitle={myContacts.length > 0 ? `${myContacts.length} contact${myContacts.length !== 1 ? 'en' : ''} in beheer` : undefined}
          linkTo="/contacten"
          linkLabel="Alle contacten"
        >
          {myContacts.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              {contacts.length === 0
                ? 'Nog geen contacten aangemaakt.'
                : 'Geen contacten met jou als accountmanager.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {myContacts.slice(0, 6).map(c => {
                const overdue = c.volgendContactmoment && c.volgendContactmoment < today
                const soon = c.volgendContactmoment && !overdue &&
                  c.volgendContactmoment <= new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/contacten/${c.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: '7px', cursor: 'pointer', background: overdue ? 'rgba(180,83,83,0.05)' : 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = overdue ? 'rgba(180,83,83,0.08)' : 'var(--color-background)')}
                    onMouseLeave={e => (e.currentTarget.style.background = overdue ? 'rgba(180,83,83,0.05)' : 'transparent')}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      {c.naam.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.naam}</div>
                      {c.bedrijf && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.bedrijf}</div>}
                    </div>
                    {c.volgendContactmoment ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                        <Calendar size={11} style={{ color: overdue ? 'var(--color-danger)' : soon ? 'var(--color-warning)' : 'var(--color-text-muted)' }} />
                        <span style={{ fontSize: '0.72rem', color: overdue ? 'var(--color-danger)' : soon ? 'var(--color-warning)' : 'var(--color-text-muted)', fontWeight: (overdue || soon) ? 600 : 400 }}>
                          {c.volgendContactmoment}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', opacity: 0.5 }}>geen datum</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* Activiteitenfeed */}
      {recentActivity.length > 0 && (
        <div style={{ marginTop: '1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={16} style={{ color: 'var(--color-text-muted)' }} />
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>Recente activiteit</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.375rem' }}>
            {recentActivity.map(item => {
              const Icon = ACTIVITY_ICON[item.type]
              return (
                <div
                  key={item.key}
                  onClick={() => item.to && navigate(item.to)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: '7px', cursor: item.to ? 'pointer' : 'default', transition: 'background 0.1s' }}
                  onMouseEnter={e => item.to && (e.currentTarget.style.background = 'var(--color-background)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '7px', background: ACTIVITY_COLOR[item.type] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} style={{ color: ACTIVITY_COLOR[item.type] }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                      {ACTIVITY_LABEL[item.type]}{item.sub ? ` · ${item.sub}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{fmtRelative(item.ts)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
