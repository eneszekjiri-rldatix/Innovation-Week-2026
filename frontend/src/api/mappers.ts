import type { AuditDetail, AuditSummary } from '../types/api';
import type { Alert, Standard } from '../types/alerts';

export function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function auditSummaryToAlert(summary: AuditSummary): Alert {
  return {
    id: summary.id,
    auditType: summary.standard_name,
    date: formatDateLabel(summary.created_at),
    unit: summary.unit || 'Unassigned',
    events: summary.failed_questions.map((label) => `${label} not compliant`),
  };
}

export function auditDetailToStandards(detail: AuditDetail): Standard[] {
  return detail.questions
    .filter((q) => q.value === 'NOT_COMPLIANT')
    .map((q) => ({ metric: q.short_label ?? q.text, description: q.text }));
}
