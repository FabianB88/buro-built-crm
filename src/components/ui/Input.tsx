import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, style, ...props }, ref) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {label && (
        <label style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        style={{
          padding: '0.5rem 0.7rem',
          border: `1.5px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: '7px',
          fontSize: '0.875rem',
          color: 'var(--color-text)',
          background: 'var(--color-background)',
          outline: 'none',
          transition: 'border-color 0.15s',
          width: '100%',
          ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-surface)' }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-background)' }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{error}</span>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
