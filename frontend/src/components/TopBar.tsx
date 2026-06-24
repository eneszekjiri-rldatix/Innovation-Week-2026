export function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[44px] bg-[#14716d] flex items-center justify-between px-4">
      <span
        className="text-white text-[16px] tracking-[0.15px]"
        style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400 }}
      >
        Audits and standards
      </span>
      <div
        className="relative flex items-center justify-center w-[28px] h-[28px] rounded-full bg-[#d3e4d6] border border-[#185956]"
        aria-label="User: AS"
      >
        <span
          className="text-[#0f4146] text-[12px] select-none"
          style={{ fontFamily: 'Geist, sans-serif', fontWeight: 600 }}
        >
          AS
        </span>
      </div>
    </header>
  );
}
