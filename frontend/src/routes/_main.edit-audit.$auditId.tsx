import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/edit-audit/$auditId')({
  component: EditAuditPage,
})

function EditAuditPage() {
  const { auditId } = Route.useParams()

  return (
    <section>
      <h1>Edit Audit</h1>
      <p>
        Audit ID: <code>{auditId}</code>
      </p>
    </section>
  )
}
