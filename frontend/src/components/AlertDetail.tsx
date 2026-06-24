import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Button } from '@rld-engineering/base-camp-react';
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

export function AlertDetail({ alert, onOpenAudit }: AlertDetailProps) {
  const [series, setSeries] = useState<ChartSeries[]>([]);
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', overflowY: 'auto', p: 2 }}>
      <SectionTitle title={alert.auditType} subtitle={alert.unit} />

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button label="Open Audit" variant="outlined" onClick={onOpenAudit} />
        <Button label="Create Finding" variant="outlined" />
      </Box>
      <div className="flex gap-2 items-center">
        <OutlineButton label="Open Audit" onClick={onOpenAudit} />
      </div>

      <SectionTitle title="Compliance trend" subtitle={trendUnitLabel} />
      <ComplianceChart series={trendSeries} />

      <SectionTitle title="Standards" />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {standards.length === 0 && (
          <Typography sx={{ fontSize: 14, color: '#0f7a5c' }}>
            No failing standards — this audit was fully compliant.
          </Typography>
        )}
        {standards.map((standard) => (
          <Box key={standard.metric}>
            <Typography sx={{ fontSize: 16, color: '#000', letterSpacing: '0.1px', lineHeight: 1.57, fontWeight: 500, mb: 0.5 }}>
              {standard.metric}
            </Typography>
            <Typography sx={{ fontSize: 14, color: '#000', letterSpacing: '0.17px', lineHeight: 1.43 }}>
              {standard.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
