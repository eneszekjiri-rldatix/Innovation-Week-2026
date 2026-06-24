interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="flex items-center w-full rounded-[8px] bg-[#f5f7fa] border border-[#c1cacb] px-2 py-[9px] min-h-[40px]">
      <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
        <span
          className="text-[#151d1e] text-[16px] leading-[1.4] truncate"
          style={{ fontFamily: 'Geist, sans-serif', fontWeight: 600 }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            className="text-[rgba(0,0,0,0.62)] text-[14px] leading-[1.3] truncate"
            style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
