import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Box, Typography, Select, MenuItem, FormControl } from '@mui/material'
import { Page, Button } from '@rld-engineering/base-camp-react'
import { TopBar } from '../components/TopBar'
import { AlertCard } from '../components/AlertCard'
import { AlertDetail } from '../components/AlertDetail'
import { listAudits } from '../api/client'
import { KNOWN_UNITS } from './_main.upload'
import { auditSummaryToAlert } from '../api/mappers'
import type { Alert } from '../types/alerts'
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
    <Page queryKey={['audits']} sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      <TopBar />

      <Box sx={{ pt: '44px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, minHeight: 56 }}>
          <Typography component="h1" sx={{ color: '#151d1e', fontSize: 24, lineHeight: 1.4, fontWeight: 600 }}>
            Home
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              label="Upload video"
              variant="outlined"
              color="secondary"
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
            />

            <FormControl size="small" sx={{ width: 220 }}>
              <Select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                sx={{ fontSize: 14, borderRadius: '8px', bgcolor: '#fff' }}
              >
                {units.map((unit) => (
                  <MenuItem key={unit} value={unit} sx={{ fontSize: 14 }}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, px: 1.5, pb: 1.5, height: 'calc(100vh - 44px - 56px)' }}>
          <Box sx={{ width: '33.333%', bgcolor: '#fff', borderRadius: '12px', border: '1px solid #c1cacb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5, overflowY: 'auto', height: '100%' }}>
              {filteredAlerts.length === 0 ? (
                <Typography sx={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', textAlign: 'center', mt: 4 }}>
                  No alerts for this unit.
                </Typography>
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
            </Box>
          </Box>

          <Box sx={{ width: '66.666%', bgcolor: '#fff', borderRadius: '8px', border: '1px solid #cccccc', overflow: 'hidden' }}>
            {selectedAlert && <AlertDetail alert={selectedAlert} onOpenAudit={handleOpenAudit} />}
          </Box>
        </Box>
      </Box>
    </Page>
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
