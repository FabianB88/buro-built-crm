import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, style, ...props }, ref) => {
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
      <textarea
        ref={ref}
        style={{
          padding: '0.5rem 0.7rem',
          border: '1.5px solid var(--color-border)',
          borderRadius: '7px',
          fontSize: '0.875rem',
          color: 'var(--color-text)',
          background: 'var(--color-background)',
          outline: 'none',
          resize: 'vertical',
          minHeight: '80px',
          width: '100%',
          ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
        {...props}
      />
    </div>
  )
})

Textarea.displayName = 'Textarea'
export default Textarea
