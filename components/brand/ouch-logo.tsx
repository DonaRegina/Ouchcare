import Image from "next/image";
import { cn } from "@/lib/utils";

type OuchLogoProps = {
  className?: string;
  compact?: boolean;
};

export function OuchLogo({ className, compact = false }: OuchLogoProps) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-2", className)} aria-label="OUCH logo">
      <Image
        src="/ouch-logo.png"
        alt="OUCH bandaid logo"
        width={280}
        height={180}
        className={cn(compact ? "h-10 w-auto" : "h-20 w-auto")}
        unoptimized
        priority
      />
      {!compact ? (
        <span className="text-[clamp(2rem,4vw,3.75rem)] font-black leading-none tracking-[-0.08em] text-[var(--brand-orange-500)]">
          OUCH
        </span>
      ) : null}
    </span>
  );
}