import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Box,
  Typography,
  Chip,
  Link,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material'
import { Page, Button } from '@rld-engineering/base-camp-react'
import { TopBar } from '../components/TopBar'
import { listAudits, videoUrl } from '../api/client'
import { averageConfidencePercent, formatDateTimeLabel, isOverallCompliant } from '../api/mappers'
import type { AnswerValue, AuditSummary } from '../types/api'

export const Route = createFileRoute('/_main/audits/')({
  component: AllAuditsPage,
})

function CriterionCell({ value }: { value: AnswerValue | null }) {
  if (value === 'COMPLIANT') return <Typography sx={{ fontSize: 13, color: '#0f7a5c' }}>✓ Yes</Typography>
  if (value === 'NOT_COMPLIANT') return <Typography sx={{ fontSize: 13, color: '#cc2121' }}>✕ No</Typography>
  if (value === 'NOT_APPLICABLE') return <Typography sx={{ fontSize: 13, color: '#999999' }}>N/A</Typography>
  return <Typography sx={{ fontSize: 13, color: '#999999' }}>—</Typography>
}

function CompliantBadge({ compliant }: { compliant: boolean }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={compliant ? 'success' : 'error'}
      label={compliant ? 'Yes' : 'No'}
      sx={{ fontSize: 12, height: 22, borderRadius: 999 }}
    />
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

  const headCellSx = { py: 1, px: 1.5, fontSize: 13, color: '#515757', whiteSpace: 'nowrap' }
  const bodyCellSx = { py: 1, px: 1.5, fontSize: 13, color: '#000', whiteSpace: 'nowrap' }

  return (
    <Page queryKey={['audits']} sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      <TopBar />

      <Box sx={{ pt: '44px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, minHeight: 56 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography component="h1" sx={{ color: '#151d1e', fontSize: 24, lineHeight: 1.4, fontWeight: 600 }}>
              All audits
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'rgba(0,0,0,0.62)' }}>{audits.length} audits</Typography>
          </Box>

          <Button label="Back to Home" variant="outlined" onClick={() => navigate({ to: '/' })} />
        </Box>

        <Box sx={{ px: 1.5, pb: 3, overflowX: 'auto' }}>
          {loading ? (
            <Typography sx={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', p: 2 }}>Loading…</Typography>
          ) : audits.length === 0 ? (
            <Typography sx={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', p: 2 }}>No audits yet.</Typography>
          ) : (
            <Table size="small" sx={{ width: '100%' }}>
              <TableHead>
                <TableRow sx={{ '& td, & th': { borderBottom: '1px solid #c1cacb' } }}>
                  <TableCell sx={headCellSx}>Audit</TableCell>
                  <TableCell sx={headCellSx}>Unit</TableCell>
                  <TableCell sx={headCellSx}>Video</TableCell>
                  <TableCell sx={headCellSx}>Moment taken</TableCell>
                  {columns.map((c) => (
                    <TableCell key={c.question_id} sx={headCellSx}>
                      {c.short_label ?? c.text}
                    </TableCell>
                  ))}
                  <TableCell sx={headCellSx}>Compliant?</TableCell>
                  <TableCell sx={headCellSx}>Confidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {audits.map((audit) => {
                  const questionsById = new Map(audit.questions.map((q) => [q.question_id, q]))
                  const confidence = averageConfidencePercent(audit.questions)
                  return (
                    <TableRow key={audit.id} hover sx={{ '& td': { borderBottom: '1px solid #e5e8e8' } }}>
                      <TableCell sx={bodyCellSx}>
                        <Link
                          component="button"
                          underline="hover"
                          sx={{ fontSize: 13, color: '#1f4cb3' }}
                          onClick={() => navigate({ to: '/audits/$datetime', params: { datetime: audit.id } })}
                        >
                          {audit.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell sx={bodyCellSx}>{audit.unit || '—'}</TableCell>
                      <TableCell sx={bodyCellSx}>
                        {audit.has_video ? (
                          <Link
                            href={videoUrl(audit.id)}
                            target="_blank"
                            rel="noreferrer"
                            underline="hover"
                            sx={{ fontSize: 13, color: '#1f4cb3' }}
                          >
                            View
                          </Link>
                        ) : (
                          <Typography sx={{ fontSize: 13, color: '#999999' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={bodyCellSx}>{formatDateTimeLabel(audit.created_at)}</TableCell>
                      {columns.map((c) => (
                        <TableCell key={c.question_id} sx={bodyCellSx}>
                          <CriterionCell value={questionsById.get(c.question_id)?.value ?? null} />
                        </TableCell>
                      ))}
                      <TableCell sx={bodyCellSx}>
                        <CompliantBadge compliant={isOverallCompliant(audit.questions)} />
                      </TableCell>
                      <TableCell sx={bodyCellSx}>{confidence != null ? `${confidence}%` : '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>
    </Page>
  )
}
