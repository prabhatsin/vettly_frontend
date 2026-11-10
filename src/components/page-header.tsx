export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-serif text-[2.6rem] leading-[1.05] tracking-[-0.01em] sm:text-[3.4rem] lg:text-[4rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-3 text-base text-muted-foreground sm:text-[1.05rem]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
