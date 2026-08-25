export default function MaalemsLoading() {
  return (
    <main
      className="min-h-[70vh] bg-[#fbf8ef] py-10 dark:bg-background sm:py-14"
      aria-busy="true"
    >
      <div className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6 lg:px-8">
        <header className="border-b border-amber-900/15 pb-9">
          <div className="h-3 w-40 bg-emerald-900/15" />
          <div className="mt-5 h-12 max-w-xl bg-muted" />
          <div className="mt-4 h-5 max-w-2xl bg-muted" />
        </header>
        <div className="h-64 rounded-b-[14px] border border-amber-200 bg-card sm:h-52" />
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-[430px] w-full rounded-[14px] border border-border/20 bg-card" />
          ))}
        </div>
      </div>
    </main>
  )
}
