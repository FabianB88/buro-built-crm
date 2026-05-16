type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent'

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' },
  success: { background: '#dcf0e6', color: 'var(--color-success)' },
  warning: { background: '#fdf0d9', color: 'var(--color-warning)' },
  danger: { background: '#fde8e8', color: 'var(--color-danger)' },
  accent: { background: '#f5ead9', color: 'var(--color-accent-dark, #9f774f)' },
}

export default function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.15rem 0.55rem',
      borderRadius: '20px',
      fontSize: '0.72rem',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      ...variantStyles[variant],
    }}>
      {children}
    </span>
  )
}
