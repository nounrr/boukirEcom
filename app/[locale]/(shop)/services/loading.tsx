export default function ServicesLoading() {
  return (
    <div className="min-h-[70vh] bg-[#fbf8f0] py-12 dark:bg-background" aria-busy="true">
      <div className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6 lg:px-8">
        <div className="h-3 w-44 bg-muted" />
        <div className="mt-5 h-12 max-w-lg bg-muted" />
        <div className="mt-4 h-5 max-w-2xl bg-muted" />
        <div className="mt-10 h-28 rounded-[14px] border border-border bg-card" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[430px] rounded-[14px] border border-border bg-card" />)}
        </div>
      </div>
    </div>
  )
}
