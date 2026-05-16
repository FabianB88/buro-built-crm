import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, children, style, ...props }, ref) => {
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
      <select
        ref={ref}
        style={{
          padding: '0.5rem 0.7rem',
          border: '1.5px solid var(--color-border)',
          borderRadius: '7px',
          fontSize: '0.875rem',
          color: 'var(--color-text)',
          background: 'var(--color-background)',
          outline: 'none',
          width: '100%',
          cursor: 'pointer',
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  )
})

Select.displayName = 'Select'
export default Select
