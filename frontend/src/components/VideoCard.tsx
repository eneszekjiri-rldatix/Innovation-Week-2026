import type { AuditEvent } from '../types/alerts';

interface VideoCardProps {
  event: AuditEvent;
  onPlay?: () => void;
  onChangeAssessment?: () => void;
}

function PlayIcon() {
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden>
      <path d="M0.5 1.5L10 7L0.5 12.5V1.5Z" fill="#151D1E" />
    </svg>
  );
}

function CloseCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="8" fill="#D52020" />
      <line x1="4.8" y1="4.8" x2="11.2" y2="11.2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="11.2" y1="4.8" x2="4.8" y2="11.2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function VideoCard({ event, onPlay, onChangeAssessment }: VideoCardProps) {
  return (
    <div className="flex flex-col gap-1 shrink-0 w-[175px]">
      <button
        onClick={onPlay}
        className="relative w-full h-[110px] bg-[#dddddd] rounded-[4px] flex items-center justify-center hover:bg-[#cccccc] transition-colors group"
        aria-label={`Play video from ${event.date} at ${event.time}`}
      >
        <div className="flex items-center justify-center w-[37px] h-[37px] rounded-full bg-[#eeeeee] group-hover:bg-white transition-colors">
          <PlayIcon />
        </div>
      </button>

      <div className="flex flex-col gap-1 py-2">
        <div className="flex gap-1 items-baseline">
          <span
            className="text-[12px] text-black leading-[1.2]"
            style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
          >
            {event.date}
          </span>
          <span
            className="text-[12px] text-[rgba(0,0,0,0.62)] leading-[1.2]"
            style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
          >
            {event.time}
          </span>
        </div>
        <button
          onClick={onChangeAssessment}
          className="flex items-center gap-1 w-fit"
          aria-label="Change assessment"
        >
          <CloseCircleIcon />
          <span
            className="text-[14px] text-[#1f4cb3] leading-[1.3]"
            style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
          >
            Change
          </span>
        </button>
      </div>
    </div>
  );
}
