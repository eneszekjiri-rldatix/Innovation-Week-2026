import type { Alert } from '../types/alerts';
import { SectionTitle } from './SectionTitle';
import { ComplianceChart } from './ComplianceChart';

interface AlertDetailProps {
  alert: Alert;
  onOpenAudit: () => void;
}

function OutlineButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-[28px] px-2 py-1 rounded-[8px] border border-[#1f4cb3] text-[#1f4cb3] text-[14px] leading-[1.2] bg-transparent hover:bg-[#e8eeff] transition-colors"
      style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
    >
      {label}
    </button>
  );
}

export function AlertDetail({ alert, onOpenAudit }: AlertDetailProps) {
  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-4">
      <SectionTitle title={alert.auditType} subtitle={alert.unit} />

      <div className="flex gap-2 items-center">
        <OutlineButton label="Open Audit" onClick={onOpenAudit} />
        <OutlineButton label="Create Finding" />
      </div>

      <ComplianceChart data={alert.chartData} />

      <SectionTitle title="Standards" />

      <div className="flex flex-col gap-4">
        {alert.standards.map((standard) => (
          <div key={standard.metric}>
            <p
              className="text-[16px] text-black tracking-[0.1px] leading-[1.57] mb-1"
              style={{ fontFamily: 'Geist, sans-serif', fontWeight: 500 }}
            >
              {standard.metric}
            </p>
            <p
              className="text-[14px] text-black tracking-[0.17px] leading-[1.43]"
              style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
            >
              {standard.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
