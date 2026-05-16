import { Search } from 'lucide-react'
import { InputHTMLAttributes } from 'react'

export default function SearchBar({ style, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ position: 'relative', ...style as React.CSSProperties }}>
      <Search size={15} style={{
        position: 'absolute', left: '0.65rem', top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--color-text-muted)', pointerEvents: 'none',
      }} />
      <input
        type="text"
        style={{
          paddingLeft: '2rem',
          paddingRight: '0.7rem',
          paddingTop: '0.45rem',
          paddingBottom: '0.45rem',
          border: '1.5px solid var(--color-border)',
          borderRadius: '7px',
          fontSize: '0.875rem',
          color: 'var(--color-text)',
          background: 'var(--color-surface)',
          outline: 'none',
          width: '100%',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
        {...props}
      />
    </div>
  )
}
