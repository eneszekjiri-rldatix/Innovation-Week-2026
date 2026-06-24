import type { Standard } from '../types/alerts';
import { VideoCard } from './VideoCard';

interface AuditSectionProps {
  standard: Standard;
}

export function AuditSection({ standard }: AuditSectionProps) {
  return (
    <div className="w-full bg-white rounded-[12px] border border-[#c1cacb] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#c1cacb] bg-white">
        <span
          className="flex-1 min-w-0 text-[18px] text-[#151d1e] leading-[1.4] truncate"
          style={{ fontFamily: 'Geist, sans-serif', fontWeight: 600 }}
        >
          {standard.metric}
        </span>
        <div className="flex items-center gap-1 px-2 py-1 rounded-[4px] bg-[#f6fafa] border border-[#889192] shrink-0">
          <span
            className="text-[12px] text-[#333b3b] leading-[14px] whitespace-nowrap"
            style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
          >
            {standard.events.length} events
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-2 p-4 w-max">
          {standard.events.map((event) => (
            <VideoCard
              key={event.id}
              event={event}
              onPlay={() => {}}
              onChangeAssessment={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
