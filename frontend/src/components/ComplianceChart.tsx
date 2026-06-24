import { useState, useCallback, useRef } from 'react';

export interface ChartSeriesPoint {
  date: string;
  value: number;
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  points: ChartSeriesPoint[];
}

interface ComplianceChartProps {
  series: ChartSeries[];
  thresholdPercent?: number;
}

const Y_TICKS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

const M = { top: 10, right: 14, bottom: 28, left: 38 };
const VW = 680;
const VH = 268;
const PW = VW - M.left - M.right;
const PH = VH - M.top - M.bottom;

const Y_MIN = 0;
const Y_MAX = 100;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ComplianceChart({ series, thresholdPercent = 72 }: ComplianceChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const allDates = Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.date)))).sort();
  const X_MAX = Math.max(allDates.length - 1, 1);

  function px(index: number) {
    return M.left + (index / X_MAX) * PW;
  }
  function py(value: number) {
    return M.top + (1 - (value - Y_MIN) / (Y_MAX - Y_MIN)) * PH;
  }

  function valueAt(s: ChartSeries, date: string): number | undefined {
    return s.points.find((p) => p.date === date)?.value;
  }

  function buildPath(s: ChartSeries) {
    let d = '';
    let started = false;
    allDates.forEach((date, i) => {
      const v = valueAt(s, date);
      if (v == null) {
        started = false;
        return;
      }
      d += `${started ? 'L' : 'M'}${px(i).toFixed(1)},${py(v).toFixed(1)} `;
      started = true;
    });
    return d.trim();
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const sp = pt.matrixTransform(svg.getScreenCTM()!.inverse());
      const idx = Math.round(((sp.x - M.left) / PW) * X_MAX);
      setHoverIndex(Math.max(0, Math.min(X_MAX, idx)));
    },
    [X_MAX]
  );

  const handleMouseLeave = useCallback(() => setHoverIndex(null), []);

  const threshY = py(thresholdPercent);
  const bottomY = py(Y_MIN);
  const topY = py(Y_MAX);

  const tickCount = Math.min(allDates.length, 6);
  const xTicks = Array.from({ length: tickCount }, (_, i) =>
    Math.round((i / Math.max(tickCount - 1, 1)) * X_MAX)
  );
  const uniqueXTicks = Array.from(new Set(xTicks));

  const hoverDate = hoverIndex != null ? allDates[hoverIndex] : null;

  if (allDates.length === 0) {
    return (
      <p className="text-[14px] text-[rgba(0,0,0,0.5)] text-center py-6" style={{ fontFamily: 'Geist, sans-serif' }}>
        No trend data yet for this unit.
      </p>
    );
  }

  return (
    <div className="w-full select-none">
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-end mb-1 pr-2">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[12px] text-black tracking-[0.4px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        style={{ aspectRatio: `${VW} / ${VH}`, height: 'auto' }}
        aria-label="Compliance trend chart"
      >
        <rect x={M.left} y={threshY} width={PW} height={bottomY - threshY} fill="rgba(255,222,222,0.4)" />
        <rect x={M.left} y={topY} width={PW} height={PH} fill="white" stroke="#d6deed" strokeWidth={0.8} />

        {Y_TICKS.map((tick) => (
          <line
            key={`g${tick}`}
            x1={M.left} y1={py(tick)}
            x2={M.left + PW} y2={py(tick)}
            stroke="#DEE3F0"
            strokeWidth={0.8}
            strokeDasharray={tick % 50 !== 0 ? '2.5 3.3' : undefined}
          />
        ))}

        <line x1={M.left} y1={threshY} x2={M.left + PW} y2={threshY} stroke="#EB3333" strokeWidth={1.2} strokeDasharray="6 4" />
        <rect x={M.left + PW - 148} y={threshY - 16} width={148} height={14} rx={3} fill="#ffebeb" />
        <text x={M.left + PW - 144} y={threshY - 5} fill="#cc2121" fontSize={8} fontFamily="Inter, sans-serif" fontWeight={500}>
          Non-compliance threshold: {thresholdPercent}%
        </text>

        {Y_TICKS.map((tick) => (
          <text key={`yl${tick}`} x={M.left - 4} y={py(tick) + 3} textAnchor="end" fill="#808594" fontSize={8} fontFamily="Inter, sans-serif">
            {tick}%
          </text>
        ))}

        <line x1={M.left} y1={bottomY} x2={M.left + PW} y2={bottomY} stroke="#BABFCC" strokeWidth={0.8} />

        {uniqueXTicks.map((idx) => (
          <g key={`xt${idx}`}>
            <line x1={px(idx)} y1={bottomY} x2={px(idx)} y2={bottomY + 4} stroke="#BABFCC" strokeWidth={0.8} />
            <text x={px(idx)} y={bottomY + 13} textAnchor="middle" fill="#808594" fontSize={8} fontFamily="Inter, sans-serif">
              {formatDate(allDates[idx])}
            </text>
          </g>
        ))}

        {series.map((s) => (
          <path key={`ln${s.key}`} d={buildPath(s)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {hoverIndex != null && (
          <line x1={px(hoverIndex)} y1={topY} x2={px(hoverIndex)} y2={bottomY} stroke="#aaa" strokeWidth={1} strokeDasharray="3 3" pointerEvents="none" />
        )}

        {hoverDate &&
          series.map((s) => {
            const v = valueAt(s, hoverDate);
            if (v == null) return null;
            return <circle key={`dot${s.key}`} cx={px(hoverIndex!)} cy={py(v)} r={4} fill={s.color} pointerEvents="none" />;
          })}

        <rect x={M.left} y={M.top} width={PW} height={PH} fill="transparent" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
      </svg>

      {hoverDate && (
        <div className="mx-[38px] px-3 py-2 bg-white border border-[#DEE3F0] rounded text-[12px] flex gap-4 flex-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>
          <span className="font-medium text-[#151d1e]">{formatDate(hoverDate)}</span>
          {series.map((s) => {
            const v = valueAt(s, hoverDate);
            if (v == null) return null;
            return (
              <div key={s.key} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span style={{ color: s.color }}>{v}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
