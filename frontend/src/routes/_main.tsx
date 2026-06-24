import { createFileRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_main')({
  component: MainLayout,
})

function MainLayout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <nav className="app-nav">
          <Link to="/" activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link
            to="/audits/$datetime"
            params={{ datetime: '2026-06-24T10:00:00' }}
          >
            Audits
          </Link>
          <Link
            to="/edit-audit/$auditId"
            params={{ auditId: 'a0000000-0000-4000-8000-000000000021' }}
          >
            Edit Audit
          </Link>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
