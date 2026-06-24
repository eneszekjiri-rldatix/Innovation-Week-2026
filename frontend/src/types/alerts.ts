export interface Standard {
  metric: string;
  description: string;
}

export interface Alert {
  id: string;
  auditType: string;
  date: string;
  unit: string;
  events: string[];
}
