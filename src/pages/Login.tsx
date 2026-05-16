import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signIn()
    } catch {
      setError('Aanmelden mislukt. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-background)',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '14px',
        padding: '2.5rem',
        width: '340px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
      }}>
        <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>
            HAN Academie Built Environment
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.01em' }}>
            Buro BUILT
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            CRM Systeem
          </div>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            width: '100%',
            padding: '0.7rem 1rem',
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--color-text)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: 18, height: 18 }}
          />
          {loading ? 'Aanmelden...' : 'Aanmelden met Google'}
        </button>

        {error && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-danger)', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <p style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Toegang alleen voor medewerkers en studenten van Buro BUILT.
        </p>
      </div>
    </div>
  )
}
