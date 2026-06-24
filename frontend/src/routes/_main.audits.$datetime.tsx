import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TopBar } from '../components/TopBar'
import { AuditSection } from '../components/AuditSection'
import { ALERTS } from '../data/alertsData'

export const Route = createFileRoute('/_main/audits/$datetime')({
  component: AuditPage,
})

function AuditPage() {
  const { datetime } = Route.useParams()
  const navigate = useNavigate()

  const alert = ALERTS.find((a) => a.id === datetime) ?? ALERTS[0]

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Geist, sans-serif' }}>
      <TopBar />

      <div className="pt-[44px]">
        <div className="flex items-center gap-2 px-3 py-2 min-h-[56px]">
          <h1
            className="text-[#151d1e] text-[24px] leading-[1.4] shrink-0"
            style={{ fontWeight: 600 }}
          >
            Audit
          </h1>
          <span
            className="flex-1 min-w-0 text-[14px] text-[rgba(0,0,0,0.62)] leading-[1.3] truncate"
            style={{ fontWeight: 400 }}
          >
            {alert.unit}
          </span>

          <button
            onClick={() => navigate({ to: '/' })}
            className="shrink-0 h-[28px] px-2 py-1 rounded-[8px] border border-[#1f4cb3] text-[#1f4cb3] text-[14px] leading-[1.2] bg-transparent hover:bg-[#e8eeff] transition-colors"
            style={{ fontWeight: 400 }}
          >
            Back to Alerts
          </button>
        </div>

        <div className="flex flex-col gap-4 px-3 pb-6">
          {alert.standards.map((standard) => (
            <AuditSection key={standard.metric} standard={standard} />
          ))}
        </div>
      </div>
    </div>
  )
}
