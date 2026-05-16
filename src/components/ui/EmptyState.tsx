import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      color: 'var(--color-text-muted)',
      gap: '0.75rem',
    }}>
      <Icon size={36} strokeWidth={1.25} style={{ opacity: 0.4 }} />
      <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>{title}</div>
      {description && <div style={{ fontSize: '0.82rem', maxWidth: '320px' }}>{description}</div>}
      {action && <div style={{ marginTop: '0.25rem' }}>{action}</div>}
    </div>
  )
}
