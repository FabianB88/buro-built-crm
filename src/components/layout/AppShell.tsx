import { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: '220px',
        flex: 1,
        padding: '2rem 2.5rem',
        background: 'var(--color-background)',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  )
}
