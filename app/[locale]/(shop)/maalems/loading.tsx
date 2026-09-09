export default function MaalemsLoading() {
  return (
    <main
      className="min-h-[70vh] bg-background py-10 dark:bg-background sm:py-14"
      aria-busy="true"
    >
      <div className="mx-auto max-w-7xl motion-safe:animate-pulse px-4 sm:px-6 lg:px-8">
        <header className="border-b border-border pb-9">
          <div className="h-3 w-40 bg-muted" />
          <div className="mt-5 h-12 max-w-xl bg-muted" />
          <div className="mt-4 h-5 max-w-2xl bg-muted" />
        </header>
        <div className="h-64  border border-border bg-card sm:h-52" />
        <div className="mt-9 grid gap-x-10 gap-y-5 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-64 w-full border-b border-border bg-muted/30" />
          ))}
        </div>
      </div>
    </main>
  )
}
