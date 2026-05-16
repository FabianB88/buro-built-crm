import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}

export default function Modal({ open, onClose, title, children, footer, width = 440 }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(31,41,51,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
        backdropFilter: 'blur(1px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '12px',
        padding: '1.75rem',
        width,
        maxWidth: 'calc(100vw - 2rem)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.1rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
        maxHeight: 'calc(100vh - 4rem)',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex', borderRadius: '5px' }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {children}
        </div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.25rem', borderTop: '1px solid var(--color-border)', marginTop: '0.25rem' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
