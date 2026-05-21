import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-gold-dark">{eyebrow}</p>
      ) : null}
      <h2 className="display mt-2.5 text-3xl text-brand-600 sm:text-4xl">{title}</h2>
      {subtitle ? (
        <p className={cn("mt-2.5 leading-relaxed text-muted", align === "center" && "mx-auto max-w-[52ch]")}>{subtitle}</p>
      ) : null}
    </div>
  );
}
