import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TopBar } from '../components/TopBar'
import { listAudits, videoUrl } from '../api/client'
import { averageConfidencePercent, formatDateTimeLabel, isOverallCompliant } from '../api/mappers'
import type { AnswerValue, AuditSummary } from '../types/api'

export const Route = createFileRoute('/_main/audits/')({
  component: AllAuditsPage,
})

function CriterionCell({ value }: { value: AnswerValue | null }) {
  if (value === 'COMPLIANT') return <span className="text-[#0f7a5c] text-[13px]">✓ Yes</span>
  if (value === 'NOT_COMPLIANT') return <span className="text-[#cc2121] text-[13px]">✕ No</span>
  if (value === 'NOT_APPLICABLE') return <span className="text-[#999999] text-[13px]">N/A</span>
  return <span className="text-[#999999] text-[13px]">—</span>
}

function CompliantBadge({ compliant }: { compliant: boolean }) {
  const className = compliant
    ? 'bg-[#e6f6ee] text-[#0f7a5c] border-[#0f7a5c]'
    : 'bg-[#ffebeb] text-[#cc2121] border-[#cc2121]'
  return (
    <span className={`text-[12px] px-2 py-[2px] rounded-full border whitespace-nowrap ${className}`}>
      {compliant ? 'Yes' : 'No'}
    </span>
  )
}

function AllAuditsPage() {
  const navigate = useNavigate()
  const [audits, setAudits] = useState<AuditSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAudits()
      .then(setAudits)
      .catch(() => setAudits([]))
      .finally(() => setLoading(false))
  }, [])

  const columns = useMemo(() => {
    const byId = new Map<string, { short_label: string | null; text: string; sort_order: number }>()
    for (const audit of audits) {
      for (const q of audit.questions) {
        if (!byId.has(q.question_id)) {
          byId.set(q.question_id, { short_label: q.short_label, text: q.text, sort_order: q.sort_order })
        }
      }
    }
    return Array.from(byId.entries())
      .map(([question_id, q]) => ({ question_id, ...q }))
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [audits])

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Geist, sans-serif' }}>
      <TopBar />

      <div className="pt-[44px]">
        <div className="flex items-center justify-between px-3 py-2 min-h-[56px]">
          <div className="flex items-baseline gap-2">
            <h1 className="text-[#151d1e] text-[24px] leading-[1.4]" style={{ fontWeight: 600 }}>
              All audits
            </h1>
            <span className="text-[14px] text-[rgba(0,0,0,0.62)]">{audits.length} audits</span>
          </div>

          <button
            onClick={() => navigate({ to: '/' })}
            className="h-[28px] px-2 py-1 rounded-[8px] border border-[#1f4cb3] text-[#1f4cb3] text-[14px] bg-transparent hover:bg-[#e8eeff] transition-colors"
          >
            Back to Home
          </button>
        </div>

        <div className="px-3 pb-6 overflow-x-auto">
          {loading ? (
            <p className="text-[14px] text-[rgba(0,0,0,0.5)] p-4">Loading…</p>
          ) : audits.length === 0 ? (
            <p className="text-[14px] text-[rgba(0,0,0,0.5)] p-4">No audits yet.</p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#c1cacb]">
                  <th className="py-2 px-3 text-[13px] text-[#515757] whitespace-nowrap">Audit</th>
                  <th className="py-2 px-3 text-[13px] text-[#515757] whitespace-nowrap">Unit</th>
                  <th className="py-2 px-3 text-[13px] text-[#515757] whitespace-nowrap">Video</th>
                  <th className="py-2 px-3 text-[13px] text-[#515757] whitespace-nowrap">Moment taken</th>
                  {columns.map((c) => (
                    <th key={c.question_id} className="py-2 px-3 text-[13px] text-[#515757] whitespace-nowrap">
                      {c.short_label ?? c.text}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-[13px] text-[#515757] whitespace-nowrap">Compliant?</th>
                  <th className="py-2 px-3 text-[13px] text-[#515757] whitespace-nowrap">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => {
                  const questionsById = new Map(audit.questions.map((q) => [q.question_id, q]))
                  const confidence = averageConfidencePercent(audit.questions)
                  return (
                    <tr key={audit.id} className="border-b border-[#e5e8e8] hover:bg-[#f8fbff]">
                      <td className="py-2 px-3 whitespace-nowrap">
                        <button
                          onClick={() => navigate({ to: '/audits/$datetime', params: { datetime: audit.id } })}
                          className="text-[13px] text-[#1f4cb3] hover:underline"
                        >
                          {audit.id.slice(0, 8)}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-[13px] text-black whitespace-nowrap">{audit.unit || '—'}</td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {audit.has_video ? (
                          <a
                            href={videoUrl(audit.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[13px] text-[#1f4cb3] hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-[13px] text-[#999999]">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[13px] text-black whitespace-nowrap">
                        {formatDateTimeLabel(audit.created_at)}
                      </td>
                      {columns.map((c) => (
                        <td key={c.question_id} className="py-2 px-3 whitespace-nowrap">
                          <CriterionCell value={questionsById.get(c.question_id)?.value ?? null} />
                        </td>
                      ))}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <CompliantBadge compliant={isOverallCompliant(audit.questions)} />
                      </td>
                      <td className="py-2 px-3 text-[13px] text-black whitespace-nowrap">
                        {confidence != null ? `${confidence}%` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
