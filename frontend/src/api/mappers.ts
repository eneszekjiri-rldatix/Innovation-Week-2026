import type { AuditDetail, AuditSummary, QuestionAnswer, TrendResponse } from '../types/api';
import type { Alert, Standard } from '../types/alerts';
import type { ChartSeries } from '../components/ComplianceChart';

const OVERALL_COMPLIANCE_COLOR = '#14716d';

export function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTimeLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isOverallCompliant(questions: QuestionAnswer[]): boolean {
  return questions.every((q) => q.value !== 'NOT_COMPLIANT');
}

export function averageConfidencePercent(questions: QuestionAnswer[]): number | null {
  const values = questions.map((q) => q.confidence).filter((c): c is number => c != null);
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100);
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

export function trendToOverallSeries(trend: TrendResponse): ChartSeries[] {
  const allDates = Array.from(new Set(trend.series.flatMap((s) => s.points.map((p) => p.date)))).sort();

  const points = allDates
    .map((date) => {
      const values = trend.series
        .map((s) => s.points.find((p) => p.date === date)?.percent_compliant)
        .filter((v): v is number => v != null);
      if (values.length === 0) return null;
      const average = values.reduce((sum, v) => sum + v, 0) / values.length;
      return { date, value: Math.round(average * 10) / 10 };
    })
    .filter((p): p is { date: string; value: number } => p != null);

  if (points.length === 0) return [];

  return [{ key: 'overall', label: 'Overall compliance', color: OVERALL_COMPLIANCE_COLOR, points }];
}

export function auditDetailToStandards(detail: AuditDetail): Standard[] {
  return detail.questions
    .filter((q) => q.value === 'NOT_COMPLIANT')
    .map((q) => ({ metric: q.short_label ?? q.text, description: q.text }));
}
