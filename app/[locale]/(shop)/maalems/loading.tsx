export default function MaalemsLoading() {
  return <div className="bg-background" aria-busy="true">
    <div className="bg-[#f2f1ed] dark:bg-ink" aria-hidden="true">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-28 pt-10 sm:px-8 lg:grid-cols-[1fr_1.08fr] lg:items-center lg:px-10 lg:pb-36 lg:pt-16">
        <div className="space-y-5">
          <div className="h-3 w-48 animate-pulse rounded-full bg-ink/10 dark:bg-white/10" />
          <div className="h-16 w-11/12 animate-pulse rounded-2xl bg-ink/10 dark:bg-white/10" />
          <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-ink/10 dark:bg-white/10" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-ink/10 dark:bg-white/10" />
          <div className="flex gap-3 pt-3"><div className="h-12 w-44 animate-pulse rounded-full bg-ink/10 dark:bg-white/10" /><div className="h-12 w-44 animate-pulse rounded-full bg-ink/10 dark:bg-white/10" /></div>
        </div>
        <div className="h-[340px] animate-pulse rounded-[2rem] bg-ink/10 sm:h-[460px] lg:h-[560px] dark:bg-white/10" />
      </div>
    </div>
    <div className="relative mx-auto -mt-16 max-w-[1440px] px-5 sm:px-8 lg:-mt-20 lg:px-10" aria-hidden="true">
      <div className="h-[190px] animate-pulse rounded-[1.75rem] border border-border bg-card" />
      <div className="grid gap-5 pt-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <div key={index} className="overflow-hidden rounded-[1.4rem] border border-border bg-card">
          <div className="aspect-[4/3.5] animate-pulse bg-muted" />
          <div className="space-y-3 p-5"><div className="h-5 w-2/3 animate-pulse rounded-full bg-muted" /><div className="h-3 w-full animate-pulse rounded-full bg-muted" /><div className="h-10 w-full animate-pulse rounded-full bg-muted" /></div>
        </div>)}
      </div>
    </div>
  </div>
}
