import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  Select,
  MenuItem,
  TextField,
  Alert,
} from '@mui/material'
import { Button } from '@rld-engineering/base-camp-react'
import { TopBar } from '../components/TopBar'
import { getAudit, reviewAudit, updateAudit, videoUrl } from '../api/client'
import { averageConfidencePercent, isOverallCompliant } from '../api/mappers'
import type { AnswerValue, AuditDetail, AuditReviewStatus } from '../types/api'

export const Route = createFileRoute('/_main/audits/$datetime')({
  component: AuditPage,
})

type ChipColor = 'success' | 'error' | 'default'

const STATUS_STYLES: Record<string, { label: string; color: ChipColor }> = {
  COMPLIANT: { label: 'Compliant', color: 'success' },
  NOT_COMPLIANT: { label: 'Not compliant', color: 'error' },
  NOT_APPLICABLE: { label: 'Not applicable', color: 'default' },
}
const PENDING_STYLE = { label: 'Pending', color: 'default' as ChipColor }
const VALUE_OPTIONS: AnswerValue[] = ['COMPLIANT', 'NOT_COMPLIANT', 'NOT_APPLICABLE']

function StatusBadge({ value }: { value: string | null }) {
  const style = (value && STATUS_STYLES[value]) || PENDING_STYLE
  return (
    <Chip
      size="small"
      label={style.label}
      color={style.color}
      variant="outlined"
      sx={{ flexShrink: 0, fontSize: 12, height: 22 }}
    />
  )
}

const REVIEW_STYLES: Record<AuditReviewStatus, { label: string; color: ChipColor }> = {
  PENDING: { label: 'Review: Pending', color: 'default' },
  APPROVED: { label: 'Review: Approved', color: 'success' },
  REJECTED: { label: 'Review: Rejected', color: 'error' },
}

function ReviewBadge({ status }: { status: AuditReviewStatus }) {
  const style = REVIEW_STYLES[status]
  return (
    <Chip
      variant="outlined"
      color={style.color}
      label={style.label}
      sx={{ flexShrink: 0, fontSize: 14, fontWeight: 600, borderRadius: 999 }}
    />
  )
}

function ReviewedTag() {
  return (
    <Chip
      size="small"
      variant="filled"
      label="Human reviewed"
      sx={{ flexShrink: 0, fontSize: 11, height: 20, bgcolor: '#e3f0ef', color: '#14716d' }}
    />
  )
}

function OverallComplianceBadge({ compliant }: { compliant: boolean }) {
  return (
    <Chip
      variant="outlined"
      color={compliant ? 'success' : 'error'}
      label={compliant ? 'Overall: Compliant' : 'Overall: Not compliant'}
      sx={{ flexShrink: 0, fontSize: 14, fontWeight: 600, borderRadius: 999 }}
    />
  )
}

function ConfidenceMeter({ value }: { value: number }) {
  const percent = Math.round(value * 100)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }} title={`AI confidence: ${percent}%`}>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          width: 60,
          height: 6,
          borderRadius: 999,
          bgcolor: '#e5e8e8',
          '& .MuiLinearProgress-bar': { bgcolor: '#14716d' },
        }}
      />
      <Typography sx={{ fontSize: 12, color: 'rgba(0,0,0,0.62)', whiteSpace: 'nowrap' }}>
        Confidence: {percent}%
      </Typography>
    </Box>
  )
}

function AuditPage() {
  const { datetime: auditId } = Route.useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<AuditDetail | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<AuditDetail['questions']>([])
  const [saving, setSaving] = useState(false)
  const [reviewing, setReviewing] = useState(false)
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

  async function handleReview(status: AuditReviewStatus) {
    setReviewing(true)
    setError(null)
    try {
      const updated = await reviewAudit(auditId, status)
      setDetail(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review')
    } finally {
      setReviewing(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      <TopBar />

      <Box sx={{ pt: '44px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, minHeight: 56 }}>
          <Typography component="h1" sx={{ color: '#151d1e', fontSize: 24, lineHeight: 1.4, flexShrink: 0, fontWeight: 600 }}>
            Audit
          </Typography>
          <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: 14, color: 'rgba(0,0,0,0.62)', lineHeight: 1.3 }}>
            {detail?.unit}
          </Typography>

          {detail && <OverallComplianceBadge compliant={isOverallCompliant(detail.questions)} />}
          {detail && <ReviewBadge status={detail.review_status} />}

          {editing ? (
            <>
              <Button label="Cancel" variant="outlined" size="small" disabled={saving} onClick={cancelEditing} />
              <Button
                label={saving ? 'Saving…' : 'Save changes'}
                color="secondary"
                size="small"
                disabled={saving}
                onClick={handleSave}
              />
            </>
          ) : (
            <>
              <Button label="Edit answers" variant="outlined" size="small" disabled={!detail} onClick={startEditing} />
              <Button
                label="Approve"
                color="secondary"
                size="small"
                disabled={!detail || reviewing || detail.review_status === 'APPROVED'}
                onClick={() => handleReview('APPROVED')}
              />
              <Button
                label="Reject"
                variant="outlined"
                size="small"
                disabled={!detail || reviewing || detail.review_status === 'REJECTED'}
                onClick={() => handleReview('REJECTED')}
              />
            </>
          )}

          <Button label="Back to Alerts" variant="outlined" size="small" onClick={() => navigate({ to: '/' })} />
        </Box>

        <Box sx={{ display: 'flex', px: 1.5, pb: 3, height: 'calc(100vh - 44px - 56px)' }}>
          <Box
            sx={{
              width: '66.666%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#151d1e',
              borderRadius: '12px 0 0 12px',
              border: '1px solid #c1cacb',
              overflow: 'hidden',
            }}
          >
            {detail?.has_video ? (
              <video src={videoUrl(auditId)} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                No video available for this audit.
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              width: '33.333%',
              border: '1px solid #c1cacb',
              borderLeft: 0,
              borderRadius: '0 12px 12px 0',
              overflowY: 'auto',
            }}
          >
            {error && (
              <Alert severity="error" sx={{ m: 1.5 }}>
                {error}
              </Alert>
            )}

            {!detail ? (
              <Typography sx={{ p: 2, fontSize: 14, color: 'rgba(0,0,0,0.5)' }}>Loading…</Typography>
            ) : !editing ? (
              detail.questions.map((q) => (
                <Box key={q.question_id} sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e5e8e8' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: 16, color: '#151d1e', fontWeight: 600 }}>
                      {q.short_label ?? q.text}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      {q.human_reviewed && <ReviewedTag />}
                      <StatusBadge value={q.value} />
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: 13, color: 'rgba(0,0,0,0.62)', mb: 0.5 }}>{q.text}</Typography>
                  {q.comment && <Typography sx={{ fontSize: 14, color: '#000', mb: 0.5 }}>{q.comment}</Typography>}
                  {q.confidence != null && <ConfidenceMeter value={q.confidence} />}
                </Box>
              ))
            ) : (
              draft.map((q) => (
                <Box key={q.question_id} sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e5e8e8' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: 16, color: '#151d1e', fontWeight: 600 }}>
                      {q.short_label ?? q.text}
                    </Typography>
                    {q.confidence != null && <ConfidenceMeter value={q.confidence} />}
                  </Box>
                  <Typography sx={{ fontSize: 13, color: 'rgba(0,0,0,0.62)', mb: 1 }}>{q.text}</Typography>

                  <Select
                    size="small"
                    fullWidth
                    value={q.value ?? 'NOT_APPLICABLE'}
                    onChange={(e) => updateDraftQuestion(q.question_id, { value: e.target.value as AnswerValue })}
                    sx={{ fontSize: 14, mb: 1 }}
                  >
                    {VALUE_OPTIONS.map((v) => (
                      <MenuItem key={v} value={v} sx={{ fontSize: 14 }}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>

                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    value={q.comment ?? ''}
                    onChange={(e) => updateDraftQuestion(q.question_id, { comment: e.target.value })}
                    slotProps={{ htmlInput: { style: { fontSize: 14 } } }}
                  />
                </Box>
              ))
            )}

            {detail &&
              (() => {
                const overall = averageConfidencePercent(detail.questions)
                if (overall == null) return null
                return (
                  <Box sx={{ px: 2, py: 2, borderTop: '1px solid #e5e8e8', bgcolor: '#fff5f5' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: 16, color: '#cc2121', fontWeight: 700 }}>
                        Overall confidence
                      </Typography>
                      <Typography sx={{ fontSize: 20, color: '#cc2121', fontWeight: 700 }}>
                        {overall}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={overall}
                      sx={{
                        height: 8,
                        borderRadius: 999,
                        bgcolor: '#ffe0e0',
                        '& .MuiLinearProgress-bar': { bgcolor: '#cc2121' },
                      }}
                    />
                  </Box>
                )
              })()}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
