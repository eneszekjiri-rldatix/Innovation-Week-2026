export type AnswerValue = 'COMPLIANT' | 'NOT_COMPLIANT' | 'NOT_APPLICABLE';

export type AuditReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface QuestionAnswer {
  question_id: string;
  short_label: string | null;
  text: string;
  sort_order: number;
  value: AnswerValue | null;
  comment: string | null;
  confidence: number | null;
  human_reviewed: boolean;
}

export interface AuditSummary {
  id: string;
  unit: string;
  standard_name: string;
  created_at: string;
  overall_compliant: boolean;
  failed_questions: string[];
  has_video: boolean;
  review_status: AuditReviewStatus;
  reviewed_at: string | null;
  edited: boolean;
  questions: QuestionAnswer[];
}

export interface AuditDetail {
  id: string;
  unit: string;
  standard_name: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  has_video: boolean;
  review_status: AuditReviewStatus;
  reviewed_at: string | null;
  edited: boolean;
  questions: QuestionAnswer[];
}

export interface TrendPoint {
  date: string;
  percent_compliant: number;
}

export interface TrendSeries {
  question_id: string;
  short_label: string | null;
  points: TrendPoint[];
}

export interface TrendResponse {
  unit: string;
  series: TrendSeries[];
}

export interface AnswerUpdateItem {
  question_id: string;
  value: AnswerValue;
  comment: string | null;
}

export interface UploadResponse {
  status: string;
  audit_id: string;
}
