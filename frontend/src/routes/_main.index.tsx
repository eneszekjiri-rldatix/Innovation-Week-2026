import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section>
      <h1>Hand Hygiene Audit</h1>
      <p>Select a page from the navigation above.</p>
    </section>
  )
}
