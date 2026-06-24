export interface AuditEvent {
  id: string;
  date: string;
  time: string;
}

export interface Standard {
  metric: string;
  description: string;
  events: AuditEvent[];
}

export interface ChartDataPoint {
  day: number;
  rubDuration: number;
  numberOfEvents: number;
  bareElbows: number;
  poorHandDrying: number;
}

export interface Alert {
  id: string;
  auditType: string;
  date: string;
  unit: string;
  events: string[];
  standards: Standard[];
  chartData: ChartDataPoint[];
}
