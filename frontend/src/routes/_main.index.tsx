import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { AlertCard } from '../components/AlertCard'
import { AlertDetail } from '../components/AlertDetail'
import { ALERTS, UNITS } from '../data/alertsData'
import type { Alert } from '../types/alerts'

export const Route = createFileRoute('/_main/')({
  component: AlertDashboard,
})

function AlertDashboard() {
  const navigate = useNavigate()
  const [selectedAlert, setSelectedAlert] = useState<Alert>(ALERTS[0])
  const [selectedUnit, setSelectedUnit] = useState<string>('All Units')

  const filteredAlerts =
    selectedUnit === 'All Units'
      ? ALERTS
      : ALERTS.filter((a) => a.unit === selectedUnit)

  function handleOpenAudit() {
    navigate({ to: '/audits/$datetime', params: { datetime: selectedAlert.id } })
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Geist, sans-serif' }}>
      <TopBar />

      <div className="pt-[44px]">
        <div className="flex items-center justify-between px-3 py-2 min-h-[56px]">
          <h1
            className="text-[#151d1e] text-[24px] leading-[1.4]"
            style={{ fontWeight: 600 }}
          >
            Alerts
          </h1>

          <div className="relative w-[220px]">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full appearance-none bg-white border border-[#515757] rounded-[8px] px-3 py-2 pr-8 text-[14px] text-[#515757] cursor-pointer focus:outline-none focus:border-[#14716d]"
              style={{ fontFamily: 'Geist, sans-serif', fontWeight: 300 }}
            >
              {UNITS.map((unit) => (
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
                    isSelected={selectedAlert.id === alert.id}
                    onClick={() => setSelectedAlert(alert)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="w-2/3 bg-white rounded-[8px] border border-[#cccccc] overflow-hidden">
            <AlertDetail
              alert={selectedAlert}
              onOpenAudit={handleOpenAudit}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
