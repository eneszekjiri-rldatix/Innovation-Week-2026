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

export const Route = createFileRoute('/_main/')({
  component: AlertDashboard,
})

function AlertDashboard() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<string>('All Units')

  useEffect(() => {
    listAudits()
      .then((summaries) => {
        const mapped = summaries.map(auditSummaryToAlert)
        setAlerts(mapped)
        setSelectedAlertId((current) => current ?? mapped[0]?.id ?? null)
      })
      .catch(() => setAlerts([]))
  }, [])

  const units = useMemo(
    () => ['All Units', ...Array.from(new Set(alerts.map((a) => a.unit)))],
    [alerts]
  )

  const filteredAlerts =
    selectedUnit === 'All Units' ? alerts : alerts.filter((a) => a.unit === selectedUnit)

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
  )
}
