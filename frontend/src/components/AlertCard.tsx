import type { Alert } from '../types/alerts';

interface AlertCardProps {
  alert: Alert;
  isSelected: boolean;
  onClick: () => void;
}

export function AlertCard({ alert, isSelected, onClick }: AlertCardProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left rounded-[8px] px-[13px] py-[11px] transition-colors',
        'border',
        isSelected
          ? 'bg-[#e4f3ff] border-[#1f4cb3]'
          : 'bg-white border-[#cccccc] hover:border-[#aaaaaa] hover:bg-[#f8fbff]',
      ].join(' ')}
    >
      <div className="flex items-center gap-[5px] w-full mb-[5px]">
        <span
          className="flex-1 min-w-0 text-[16px] text-black tracking-[0.15px] truncate"
          style={{ fontFamily: 'Geist, sans-serif', fontWeight: 500 }}
        >
          {alert.auditType}
        </span>
        <span
          className="shrink-0 text-[12px] text-[rgba(0,0,0,0.87)] tracking-[0.4px]"
          style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
        >
          {alert.date}
        </span>
      </div>

      <p
        className="text-[14px] text-black tracking-[0.17px] leading-[1.43] mb-[4px]"
        style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
      >
        {alert.unit}
      </p>

      {alert.events.length === 0 ? (
        <p
          className="text-[14px] text-[#0f7a5c] tracking-[0.17px] leading-[1.43]"
          style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
        >
          No issues found
        </p>
      ) : alert.events.length === 1 ? (
        <p
          className="text-[14px] text-[rgba(0,0,0,0.6)] tracking-[0.17px] leading-[1.43]"
          style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
        >
          {alert.events[0]}
        </p>
      ) : (
        <ul className="list-disc">
          {alert.events.map((event) => (
            <li
              key={event}
              className="ms-[21px] text-[14px] text-[rgba(0,0,0,0.6)] tracking-[0.17px] leading-[1.43]"
              style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
            >
              {event}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}
