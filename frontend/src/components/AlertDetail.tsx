import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Button } from '@rld-engineering/base-camp-react';
import type { Alert, Standard } from '../types/alerts';
import type { ChartSeries } from './ComplianceChart';
import { getAudit, getTrend } from '../api/client';
import { auditDetailToStandards } from '../api/mappers';
import { SectionTitle } from './SectionTitle';
import { ComplianceChart } from './ComplianceChart';

const TREND_COLORS = ['#3870F2', '#0FAB85', '#8C59F7', '#E0850F', '#D52020', '#14716D'];

interface AlertDetailProps {
  alert: Alert;
  onOpenAudit: () => void;
}

export function AlertDetail({ alert, onOpenAudit }: AlertDetailProps) {
  const [series, setSeries] = useState<ChartSeries[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);

  useEffect(() => {
    let cancelled = false;
    getTrend(alert.unit)
      .then((trend) => {
        if (cancelled) return;
        setSeries(
          trend.series.map((s, i) => ({
            key: s.question_id,
            label: s.short_label ?? s.question_id,
            color: TREND_COLORS[i % TREND_COLORS.length],
            points: s.points.map((p) => ({ date: p.date, value: p.percent_compliant })),
          }))
        );
      })
      .catch(() => setSeries([]));
    return () => {
      cancelled = true;
    };
  }, [alert.unit]);

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

      <ComplianceChart series={series} />

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
