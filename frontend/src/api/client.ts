import type {
  AnswerUpdateItem,
  AuditDetail,
  AuditSummary,
  TrendResponse,
  UploadResponse,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  return response.json() as Promise<T>;
}

export function listAudits(): Promise<AuditSummary[]> {
  return fetch(`${BASE_URL}/audits`).then((res) => handle<AuditSummary[]>(res));
}

export function getAudit(auditId: string): Promise<AuditDetail> {
  return fetch(`${BASE_URL}/audits/${auditId}`).then((res) => handle<AuditDetail>(res));
}

export function updateAudit(auditId: string, answers: AnswerUpdateItem[]): Promise<AuditDetail> {
  return fetch(`${BASE_URL}/audits/${auditId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  }).then((res) => handle<AuditDetail>(res));
}

export function getTrend(unit: string): Promise<TrendResponse> {
  return fetch(`${BASE_URL}/trend?unit=${encodeURIComponent(unit)}`).then((res) => handle<TrendResponse>(res));
}

export function uploadVideo(file: File, unit: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('unit', unit);
  return fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData }).then((res) =>
    handle<UploadResponse>(res)
  );
}

export function videoUrl(auditId: string): string {
  return `${BASE_URL}/audits/${auditId}/video`;
}
