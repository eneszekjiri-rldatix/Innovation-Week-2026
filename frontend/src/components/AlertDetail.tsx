import { useEffect, useState } from 'react';
import type { Alert, Standard } from '../types/alerts';
import type { ChartSeries } from './ComplianceChart';
import { getAudit } from '../api/client';
import { auditDetailToStandards } from '../api/mappers';
import { SectionTitle } from './SectionTitle';
import { ComplianceChart } from './ComplianceChart';

interface AlertDetailProps {
  alert: Alert;
  onOpenAudit: () => void;
  trendSeries: ChartSeries[];
  trendUnitLabel: string;
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

export function AlertDetail({ alert, onOpenAudit, trendSeries, trendUnitLabel }: AlertDetailProps) {
  const [standards, setStandards] = useState<Standard[]>([]);

  useEffect(() => {
    let cancelled = false;
    getAudit(alert.id)
      .then((detail) => {
        if (!cancelled) setStandards(auditDetailToStandards(detail));
      })
      .catch(() => setStandards([]));
    return () => {
      cancelled = true;
    };
  }, [alert.id]);

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-4">
      <SectionTitle title={alert.auditType} subtitle={alert.unit} />

      <div className="flex gap-2 items-center">
        <OutlineButton label="Open Audit" onClick={onOpenAudit} />
      </div>

      <SectionTitle title="Compliance trend" subtitle={trendUnitLabel} />
      <ComplianceChart series={trendSeries} />

      <SectionTitle title="Standards" />

      <div className="flex flex-col gap-4">
        {standards.length === 0 && (
          <p
            className="text-[14px] text-[#0f7a5c]"
            style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
          >
            No failing standards — this audit was fully compliant.
          </p>
        )}
        {standards.map((standard) => (
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
