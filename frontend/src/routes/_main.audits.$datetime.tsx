import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TopBar } from '../components/TopBar'
import { getAudit, updateAudit, videoUrl } from '../api/client'
import type { AnswerValue, AuditDetail } from '../types/api'

export const Route = createFileRoute('/_main/audits/$datetime')({
  component: AuditPage,
})

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  COMPLIANT: { label: 'Compliant', className: 'bg-[#e6f6ee] text-[#0f7a5c] border-[#0f7a5c]' },
  NOT_COMPLIANT: { label: 'Not compliant', className: 'bg-[#ffebeb] text-[#cc2121] border-[#cc2121]' },
  NOT_APPLICABLE: { label: 'Not applicable', className: 'bg-[#f5f5f5] text-[#666666] border-[#999999]' },
}
const PENDING_STYLE = { label: 'Pending', className: 'bg-[#f5f5f5] text-[#666666] border-[#999999]' }
const VALUE_OPTIONS: AnswerValue[] = ['COMPLIANT', 'NOT_COMPLIANT', 'NOT_APPLICABLE']

function StatusBadge({ value }: { value: string | null }) {
  const style = (value && STATUS_STYLES[value]) || PENDING_STYLE
  return (
    <span
      className={`shrink-0 text-[12px] px-2 py-[2px] rounded-full border whitespace-nowrap ${style.className}`}
    >
      {style.label}
    </span>
  )
}

function ConfidenceMeter({ value }: { value: number }) {
  const percent = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2 shrink-0" title={`AI confidence: ${percent}%`}>
      <div className="w-[60px] h-[6px] rounded-full bg-[#e5e8e8] overflow-hidden">
        <div className="h-full bg-[#14716d]" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[12px] text-[rgba(0,0,0,0.62)] whitespace-nowrap">
        Confidence: {percent}%
      </span>
    </div>
  )
}

function AuditPage() {
  const { datetime: auditId } = Route.useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<AuditDetail | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<AuditDetail['questions']>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAudit(auditId)
      .then(setDetail)
      .catch(() => setDetail(null))
  }, [auditId])

  function startEditing() {
    if (!detail) return
    setDraft(detail.questions.map((q) => ({ ...q })))
    setError(null)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setError(null)
  }

  function updateDraftQuestion(questionId: string, patch: Partial<{ value: AnswerValue; comment: string }>) {
    setDraft((current) => current.map((q) => (q.question_id === questionId ? { ...q, ...patch } : q)))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateAudit(
        auditId,
        draft.map((q) => ({
          question_id: q.question_id,
          value: q.value ?? 'NOT_APPLICABLE',
          comment: q.comment,
        }))
      )
      setDetail(updated)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

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
            {detail?.unit}
          </span>

          {editing ? (
            <>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="shrink-0 h-[28px] px-2 py-1 rounded-[8px] border border-[#1f4cb3] text-[#1f4cb3] text-[14px] leading-[1.2] bg-transparent hover:bg-[#e8eeff] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="shrink-0 h-[28px] px-3 rounded-[8px] bg-[#14716d] text-white text-[14px] leading-[1.2] disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              disabled={!detail}
              className="shrink-0 h-[28px] px-2 py-1 rounded-[8px] border border-[#1f4cb3] text-[#1f4cb3] text-[14px] leading-[1.2] bg-transparent hover:bg-[#e8eeff] transition-colors disabled:opacity-50"
              style={{ fontWeight: 400 }}
            >
              Edit answers
            </button>
          )}

          <button
            onClick={() => navigate({ to: '/' })}
            className="shrink-0 h-[28px] px-2 py-1 rounded-[8px] border border-[#1f4cb3] text-[#1f4cb3] text-[14px] leading-[1.2] bg-transparent hover:bg-[#e8eeff] transition-colors"
            style={{ fontWeight: 400 }}
          >
            Back to Alerts
          </button>
        </div>

        <div className="flex px-3 pb-6 gap-0" style={{ height: 'calc(100vh - 44px - 56px)' }}>
          <div className="w-2/3 flex items-center justify-center bg-[#151d1e] rounded-l-[12px] border border-[#c1cacb] overflow-hidden">
            {detail?.has_video ? (
              <video src={videoUrl(auditId)} controls className="w-full h-full object-contain" />
            ) : (
              <p className="text-[14px] text-[rgba(255,255,255,0.6)]">No video available for this audit.</p>
            )}
          </div>

          <div className="w-1/3 border border-l-0 border-[#c1cacb] rounded-r-[12px] overflow-y-auto">
            {error && <p className="m-3 text-[14px] text-[#cc2121]">{error}</p>}

            {!detail ? (
              <p className="p-4 text-[14px] text-[rgba(0,0,0,0.5)]">Loading…</p>
            ) : !editing ? (
              detail.questions.map((q) => (
                <div key={q.question_id} className="px-4 py-3 border-b border-[#e5e8e8]">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[16px] text-[#151d1e]" style={{ fontWeight: 600 }}>
                      {q.short_label ?? q.text}
                    </span>
                    <StatusBadge value={q.value} />
                  </div>
                  <p className="text-[13px] text-[rgba(0,0,0,0.62)] mb-1">{q.text}</p>
                  {q.comment && <p className="text-[14px] text-black mb-1">{q.comment}</p>}
                  {q.confidence != null && <ConfidenceMeter value={q.confidence} />}
                </div>
              ))
            ) : (
              draft.map((q) => (
                <div key={q.question_id} className="px-4 py-3 border-b border-[#e5e8e8]">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[16px] text-[#151d1e]" style={{ fontWeight: 600 }}>
                      {q.short_label ?? q.text}
                    </span>
                    {q.confidence != null && <ConfidenceMeter value={q.confidence} />}
                  </div>
                  <p className="text-[13px] text-[rgba(0,0,0,0.62)] mb-2">{q.text}</p>

                  <select
                    value={q.value ?? 'NOT_APPLICABLE'}
                    onChange={(e) =>
                      updateDraftQuestion(q.question_id, { value: e.target.value as AnswerValue })
                    }
                    className="w-full bg-white border border-[#515757] rounded-[8px] px-3 py-2 text-[14px] mb-2"
                  >
                    {VALUE_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={q.comment ?? ''}
                    onChange={(e) => updateDraftQuestion(q.question_id, { comment: e.target.value })}
                    className="w-full bg-white border border-[#515757] rounded-[8px] px-3 py-2 text-[14px]"
                    rows={2}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
