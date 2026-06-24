import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { AlertCard } from '../components/AlertCard'
import { AlertDetail } from '../components/AlertDetail'
import type { ChartSeries } from '../components/ComplianceChart'
import { getTrend, listAudits } from '../api/client'
import { auditSummaryToAlert, trendToOverallSeries } from '../api/mappers'
import type { AuditSummary } from '../types/api'

export const Route = createFileRoute('/_main/')({
  component: AlertDashboard,
})

const COMPLIANCE_THRESHOLD = 72

function AlertDashboard() {
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState<AuditSummary[]>([])
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<string>('All Units')
  const [trendSeries, setTrendSeries] = useState<ChartSeries[]>([])

  useEffect(() => {
    listAudits()
      .then((data) => {
        setSummaries(data)
        setSelectedAlertId((current) => current ?? data.find((s) => !s.overall_compliant)?.id ?? null)
      })
      .catch(() => setSummaries([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    getTrend(selectedUnit)
      .then((trend) => {
        if (cancelled) return
        setTrendSeries(trendToOverallSeries(trend))
      })
      .catch(() => setTrendSeries([]))
    return () => {
      cancelled = true
    }
  }, [selectedUnit])

  const units = useMemo(
    () => ['All Units', ...Array.from(new Set(summaries.map((s) => s.unit || 'Unassigned')))],
    [summaries]
  )

  const unitSummaries = useMemo(
    () =>
      selectedUnit === 'All Units'
        ? summaries
        : summaries.filter((s) => (s.unit || 'Unassigned') === selectedUnit),
    [summaries, selectedUnit]
  )

  const filteredAlerts = useMemo(
    () => unitSummaries.filter((s) => !s.overall_compliant).map(auditSummaryToAlert),
    [unitSummaries]
  )

  const complianceRate =
    unitSummaries.length === 0
      ? null
      : Math.round((unitSummaries.filter((s) => s.overall_compliant).length / unitSummaries.length) * 100)

  const selectedAlert = filteredAlerts.find((a) => a.id === selectedAlertId) ?? filteredAlerts[0] ?? null

  function handleOpenAudit() {
    if (!selectedAlert) return
    navigate({ to: '/audits/$datetime', params: { datetime: selectedAlert.id } })
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Geist, sans-serif' }}>
      <TopBar />

      <div className="pt-[44px]">
        <div className="flex items-center justify-between px-3 py-2 min-h-[56px]">
          <div className="flex items-baseline gap-2">
            <h1
              className="text-[#151d1e] text-[24px] leading-[1.4]"
              style={{ fontWeight: 600 }}
            >
              Home
            </h1>
            <span className="text-[14px] text-[rgba(0,0,0,0.62)]">
              {unitSummaries.length - filteredAlerts.length}/{unitSummaries.length} audits compliant
            </span>
            {complianceRate != null && (
              <span
                className={[
                  'text-[14px] px-2 py-[2px] rounded-full border whitespace-nowrap',
                  complianceRate >= COMPLIANCE_THRESHOLD
                    ? 'bg-[#e6f6ee] text-[#0f7a5c] border-[#0f7a5c]'
                    : 'bg-[#ffebeb] text-[#cc2121] border-[#cc2121]',
                ].join(' ')}
                style={{ fontWeight: 600 }}
              >
                {complianceRate}% compliant overall
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: '/audits' })}
              className="h-[36px] px-3 rounded-[8px] border border-[#14716d] text-[#14716d] text-[14px] bg-transparent hover:bg-[#eaf5f4] transition-colors"
              style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
            >
              All audits
            </button>

            <button
              onClick={() => navigate({ to: '/upload' })}
              className="h-[36px] px-3 rounded-[8px] border border-[#14716d] text-[#14716d] text-[14px] bg-transparent hover:bg-[#eaf5f4] transition-colors"
              style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
            >
              Upload video
            </button>

            <div className="relative w-[220px]">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full appearance-none bg-white border border-[#515757] rounded-[8px] px-3 py-2 pr-8 text-[14px] text-[#515757] cursor-pointer focus:outline-none focus:border-[#14716d]"
                style={{ fontFamily: 'Geist, sans-serif', fontWeight: 300 }}
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#151d1e]"
                size={16}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-3 pb-3" style={{ height: 'calc(100vh - 44px - 56px)' }}>
          <div className="w-1/3 bg-white rounded-[12px] border border-[#c1cacb] flex flex-col overflow-hidden">
            <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
              {filteredAlerts.length === 0 ? (
                <p
                  className="text-[14px] text-[rgba(0,0,0,0.5)] text-center mt-8"
                  style={{ fontFamily: 'Geist, sans-serif' }}
                >
                  No alerts for this unit.
                </p>
              ) : (
                filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    isSelected={selectedAlert?.id === alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="w-2/3 bg-white rounded-[8px] border border-[#cccccc] overflow-hidden">
            {selectedAlert && (
              <AlertDetail
                alert={selectedAlert}
                onOpenAudit={handleOpenAudit}
                trendSeries={trendSeries}
                trendUnitLabel={selectedUnit}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
