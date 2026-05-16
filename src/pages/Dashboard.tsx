import { useEffect, useState } from 'react'
import { subscribeContacts } from '../services/contacts'
import { subscribeProjects } from '../services/projects'
import { subscribeTasks } from '../services/tasks'
import { subscribeClients } from '../services/clients'
import { Contact, Project, Task, Client } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { Users, FolderKanban, CheckSquare, Briefcase, ArrowRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  to: string
  color: string
}

function StatCard({ label, value, icon: Icon, to, color }: StatCardProps) {
  return (
    <NavLink to={to} style={{ textDecoration: 'none' }}>
      <div
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.15s', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        <div style={{ width: 40, height: 40, borderRadius: '9px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color="#fff" strokeWidth={1.75} />
        </div>
        <div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{label}</div>
        </div>
        <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }} />
      </div>
    </NavLink>
  )
}

const priorityColors: Record<string, string> = {
  hoog: 'var(--color-danger)',
  normaal: 'var(--color-warning)',
  laag: 'var(--color-success)',
}

export default function Dashboard() {
  const { profile } = useAuth()
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

  const openTasks = tasks.filter(t => t.status !== 'done')
  const activeProjects = projects.filter(p => p.status === 'actief')
  const recentContacts = contacts.slice(0, 6)

  const myTasks = tasks
    .filter(t => t.toegewezenAanEmail === profile?.email && t.status !== 'done')
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline > b.deadline ? 1 : -1
      if (a.deadline) return -1
      if (b.deadline) return 1
      return 0
    })
    .slice(0, 6)

  const upcomingTasks = openTasks
    .filter(t => t.deadline)
    .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))
    .slice(0, 5)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond'

  const today = now.toISOString().split('T')[0]

  const panel = (title: string, link: string, linkTo: string, children: React.ReactNode) => (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600 }}>{title}</h2>
        <NavLink to={linkTo} style={{ fontSize: '0.75rem', color: 'var(--color-accent)', textDecoration: 'none' }}>{link}</NavLink>
      </div>
      {children}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-primary)' }}>
          {greeting}{profile?.naam ? `, ${profile.naam.split(' ')[0]}` : ''}
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          Overzicht van Buro BUILT
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Contacten" value={contacts.length} icon={Users} to="/contacten" color="var(--color-primary)" />
        <StatCard label="Opdrachtgevers" value={clients.length} icon={Briefcase} to="/opdrachtgevers" color="var(--color-accent)" />
        <StatCard label="Actieve projecten" value={activeProjects.length} icon={FolderKanban} to="/projecten" color="var(--color-success)" />
        <StatCard label="Open taken" value={openTasks.length} icon={CheckSquare} to="/taken" color="#7c6a5e" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {panel('Mijn taken', 'Alle taken →', '/taken', (
          myTasks.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {tasks.length === 0 ? 'Nog geen taken aangemaakt.' : 'Geen open taken aan jou toegewezen.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {myTasks.map(t => {
                const overdue = t.deadline && t.deadline < today
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: priorityColors[t.prioriteit] }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titel}</div>
                      {t.projectNaam && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{t.projectNaam}</div>}
                    </div>
                    {t.deadline && (
                      <span style={{ fontSize: '0.72rem', color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)', flexShrink: 0, fontWeight: overdue ? 600 : 400 }}>
                        {t.deadline}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ))}

        {panel('Aankomende deadlines', 'Alle taken →', '/taken', (
          upcomingTasks.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Geen open taken met deadline.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {upcomingTasks.map(t => {
                const isOverdue = t.deadline! < today
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: isOverdue ? 'var(--color-danger)' : t.prioriteit === 'hoog' ? 'var(--color-warning)' : 'var(--color-success)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titel}</div>
                      {t.toegewezenAan && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{t.toegewezenAan}</div>}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: isOverdue ? 'var(--color-danger)' : 'var(--color-text-muted)', flexShrink: 0, fontWeight: isOverdue ? 600 : 400 }}>
                      {t.deadline}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        ))}

        {panel('Recente contacten', 'Alle contacten →', '/contacten', (
          recentContacts.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Nog geen contacten.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {recentContacts.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                    {c.naam.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.naam}</div>
                    {c.bedrijf && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.bedrijf}</div>}
                  </div>
                  {c.categorie && (
                    <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: '20px', background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', flexShrink: 0, textTransform: 'capitalize' }}>
                      {c.categorie}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        ))}

        {panel('Actieve projecten', 'Alle projecten →', '/projecten', (
          activeProjects.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Geen actieve projecten.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {activeProjects.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.naam}</div>
                    {p.opdrachtgeverNaam && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{p.opdrachtgeverNaam}</div>}
                  </div>
                  {p.einddatum && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>{p.einddatum}</span>
                  )}
                </div>
              ))}
            </div>
          )
        ))}
      </div>
    </div>
  )
}
