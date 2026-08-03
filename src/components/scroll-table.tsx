import { cn } from "@/lib/utils";

/** Yatay kaydırmalı tablo sarmalayıcı — mobilde taşmayı önler */
export function ScrollTable({
  children,
  className,
  hint = "Daha fazlası için kaydırın →",
}: {
  children: React.ReactNode;
  className?: string;
  hint?: string | null;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1 md:mx-0 md:px-0">
        <div className="min-w-[32rem] md:min-w-0">{children}</div>
      </div>
      {hint ? (
        <p className="text-center text-xs text-zinc-400 md:hidden">{hint}</p>
      ) : null}
    </div>
  );
}
