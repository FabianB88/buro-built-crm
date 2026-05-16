import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  children: ReactNode
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-primary)',
    color: '#fff',
    border: '1px solid var(--color-primary)',
  },
  secondary: {
    background: 'var(--color-surface-muted)',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-muted)',
    border: '1.5px solid var(--color-border)',
  },
  danger: {
    background: 'transparent',
    color: 'var(--color-danger)',
    border: '1.5px solid var(--color-danger)',
  },
}

export default function Button({ variant = 'primary', size = 'md', children, style, disabled, ...props }: ButtonProps) {
  const padding = size === 'sm' ? '0.35rem 0.75rem' : '0.5rem 1rem'
  const fontSize = size === 'sm' ? '0.8rem' : '0.875rem'

  return (
    <button
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: '7px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        ...styles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
