export default function ReflectPage({ params }: { params: { bookId: string } }) {
  return (
    <div className="p-6">
      <p className="text-[10px] uppercase tracking-[0.09em] text-muted mb-1">Phase 2</p>
      <h1 className="font-display text-2xl font-semibold text-ink">Reflect</h1>
      <p className="text-muted mt-2 text-sm">Coming in Step 8. Book: {params.bookId}</p>
    </div>
  )
}
