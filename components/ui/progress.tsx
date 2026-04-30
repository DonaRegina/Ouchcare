import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
  "aria-label"?: string;
};

export function Progress({ value, className, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      {...props}
      className={cn("bg-muted h-2 w-full overflow-hidden rounded-full", className)}
    >
      <div
        className="bg-primary h-full transition-all duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
