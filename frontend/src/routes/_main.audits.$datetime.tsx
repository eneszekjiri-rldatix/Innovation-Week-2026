import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/audits/$datetime')({
  component: AuditsPage,
})

function AuditsPage() {
  const { datetime } = Route.useParams()

  return (
    <section>
      <h1>Audits</h1>
      <p>
        Datetime: <code>{datetime}</code>
      </p>
    </section>
  )
}
