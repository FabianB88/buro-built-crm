import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '1.75rem',
      gap: '1rem',
    }}>
      <div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}
