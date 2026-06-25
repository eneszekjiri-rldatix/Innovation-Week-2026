import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Box, Typography, Select, MenuItem, FormControl, Chip, Card, CardContent } from '@mui/material'
import { Page, PageCard, Button } from '@rld-engineering/base-camp-react'
import { TopBar } from '../components/TopBar'
import { SectionTitle } from '../components/SectionTitle'
import { ComplianceChart } from '../components/ComplianceChart'
import { getTrend, listAudits } from '../api/client'
import { getMockInsights, trendToOverallSeries } from '../api/mappers'
import type { AiInsightSeverity } from '../api/mappers'
import type { ChartSeries } from '../components/ComplianceChart'
import type { AuditSummary } from '../types/api'

export const Route = createFileRoute('/_main/')({
  component: HomePage,
})

const COMPLIANCE_THRESHOLD = 72

const DATE_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
] as const

type DateRangeValue = (typeof DATE_RANGES)[number]['value']

function rangeCutoff(range: DateRangeValue): number | null {
  if (range === 'all') return null
  const days = Number(range)
  return Date.now() - days * 24 * 60 * 60 * 1000
}

const SEVERITY_CHIP: Record<AiInsightSeverity, { label: string; color: 'error' | 'warning' | 'success' }> = {
  high: { label: 'High', color: 'error' },
  medium: { label: 'Medium', color: 'warning' },
  low: { label: 'Low', color: 'success' },
}

function HomePage() {
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState<AuditSummary[]>([])
  const [selectedUnit, setSelectedUnit] = useState<string>('All Units')
  const [dateRange, setDateRange] = useState<DateRangeValue>('30')
  const [trendSeries, setTrendSeries] = useState<ChartSeries[]>([])

  useEffect(() => {
    listAudits()
      .then((data) => setSummaries(data.filter((s) => s.review_status === 'REVIEWED')))
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

  const unitSummaries = useMemo(() => {
    const cutoff = rangeCutoff(dateRange)
    return summaries.filter((s) => {
      const matchesUnit = selectedUnit === 'All Units' || (s.unit || 'Unassigned') === selectedUnit
      const matchesRange = cutoff == null || new Date(s.created_at).getTime() >= cutoff
      return matchesUnit && matchesRange
    })
  }, [summaries, selectedUnit, dateRange])

  const filteredTrendSeries = useMemo(() => {
    const cutoff = rangeCutoff(dateRange)
    if (cutoff == null) return trendSeries
    return trendSeries
      .map((s) => ({ ...s, points: s.points.filter((p) => new Date(p.date).getTime() >= cutoff) }))
      .filter((s) => s.points.length > 0)
  }, [trendSeries, dateRange])

  const complianceRate =
    unitSummaries.length === 0
      ? null
      : Math.round((unitSummaries.filter((s) => s.overall_compliant).length / unitSummaries.length) * 100)

  const insights = useMemo(
    () => getMockInsights(selectedUnit, complianceRate),
    [selectedUnit, complianceRate]
  )

  return (
    <Page queryKey={['audits', 'home']} sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      <TopBar />

      <Box sx={{ pt: '44px', display: 'flex', flexDirection: 'column', gap: 1.5, px: { xs: 2, md: 4 }, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, minHeight: 48 }}>
          <Typography component="h1" sx={{ color: '#151d1e', fontSize: 24, lineHeight: 1.4, fontWeight: 600 }}>
            Hand Hygiene Dashboard
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              label="View Events"
              variant="outlined"
              color="secondary"
              onClick={() => navigate({ to: '/audits' })}
            />
            <Button
              label="Upload video"
              variant="outlined"
              color="secondary"
              onClick={() => navigate({ to: '/upload' })}
            />

            <FormControl size="small" sx={{ width: 180 }}>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangeValue)}
                sx={{ fontSize: 14, borderRadius: '8px', bgcolor: '#fff' }}
              >
                {DATE_RANGES.map((range) => (
                  <MenuItem key={range.value} value={range.value} sx={{ fontSize: 14 }}>
                    {range.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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

        <PageCard sx={{ width: '100%', p: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch', gap: 1.5 }}>
            <Card variant="outlined" sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0, borderRadius: '12px' }}>
              <CardContent>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#151d1e' }}>
                  Overall compliance
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', mb: 1 }}>
                  {selectedUnit}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 40,
                    fontWeight: 400,
                    lineHeight: 1,
                    color:
                      complianceRate != null && complianceRate >= COMPLIANCE_THRESHOLD
                        ? 'success.main'
                        : 'error.main',
                  }}
                >
                  {complianceRate != null ? `${complianceRate}%` : '—'}
                </Typography>
                {unitSummaries.length > 0 && (
                  <Typography sx={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', mt: 1 }}>
                    {unitSummaries.filter((s) => s.overall_compliant).length}/{unitSummaries.length} audits compliant
                  </Typography>
                )}
              </CardContent>
            </Card>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <ComplianceChart series={filteredTrendSeries} />
            </Box>
          </Box>
        </PageCard>

        <PageCard sx={{ width: '100%', p: 1.5 }}>
          <SectionTitle title="AI insights" subtitle={selectedUnit} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 1 }}>
            {insights.map((insight) => {
              const chip = SEVERITY_CHIP[insight.severity]
              return (
                <Box
                  key={insight.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    pb: 2,
                    borderBottom: '1px solid #e5e8e8',
                    '&:last-child': { borderBottom: 'none', pb: 0 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#151d1e', flex: 1 }}>
                      {insight.title}
                    </Typography>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={chip.color}
                      label={chip.label}
                      sx={{ fontSize: 12, height: 22, borderRadius: 999 }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: 14, color: 'rgba(0,0,0,0.7)', lineHeight: 1.5 }}>
                    {insight.description}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </PageCard>
      </Box>
    </Page>
  )
}
