import { cn } from "@/lib/utils";

type OuchLogoProps = {
  className?: string;
  compact?: boolean;
};

export function OuchLogo({ className, compact = false }: OuchLogoProps) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-2", className)} aria-label="OUCH logo">
      <svg
        viewBox="0 0 280 140"
        className={cn(compact ? "h-12 w-auto" : "h-20 w-auto")}
        role="img"
        aria-hidden="true"
      >
        <g fill="none" stroke="var(--brand-teal-500)" strokeLinecap="round" strokeLinejoin="round">
          <rect x="20" y="20" width="240" height="88" rx="44" strokeWidth="6" />
          <rect x="92" y="34" width="96" height="60" rx="16" strokeWidth="6" />
          <circle cx="49" cy="50" r="6" strokeWidth="6" />
          <circle cx="49" cy="74" r="6" strokeWidth="6" />
          <circle cx="49" cy="98" r="6" strokeWidth="6" />
          <circle cx="75" cy="36" r="6" strokeWidth="6" />
          <circle cx="75" cy="62" r="6" strokeWidth="6" />
          <circle cx="75" cy="88" r="6" strokeWidth="6" />
          <circle cx="231" cy="50" r="6" strokeWidth="6" />
          <circle cx="231" cy="74" r="6" strokeWidth="6" />
          <circle cx="231" cy="98" r="6" strokeWidth="6" />
          <circle cx="205" cy="36" r="6" strokeWidth="6" />
          <circle cx="205" cy="62" r="6" strokeWidth="6" />
          <circle cx="205" cy="88" r="6" strokeWidth="6" />
        </g>
        <g fill="none" stroke="var(--brand-orange-500)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M137 67c0-11 8-20 18-20 5 0 9 2 12 6l1 2 1-2c3-4 7-6 12-6 10 0 18 9 18 20 0 13-10 23-18 31-4 4-8 6-13 6s-9-2-13-6c-8-8-18-18-18-31Z" fill="var(--brand-orange-50)" strokeWidth="5" />
          <circle cx="146" cy="40" r="6" strokeWidth="5" />
          <circle cx="170" cy="40" r="6" strokeWidth="5" />
          <circle cx="126" cy="54" r="6" strokeWidth="5" />
          <circle cx="190" cy="54" r="6" strokeWidth="5" />
        </g>
      </svg>
      {!compact ? (
        <span className="text-[clamp(2rem,4vw,3.75rem)] font-black leading-none tracking-[-0.08em] text-[var(--brand-orange-500)]">
          OUCH
        </span>
      ) : null}
    </span>
  );
}