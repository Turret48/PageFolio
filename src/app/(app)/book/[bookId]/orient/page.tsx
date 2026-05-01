export default function OrientPage({ params }: { params: { bookId: string } }) {
  return (
    <div className="p-6">
      <p className="text-[10px] uppercase tracking-[0.09em] text-muted mb-1">Phase 1</p>
      <h1 className="font-display text-2xl font-semibold text-ink">Orient</h1>
      <p className="text-muted mt-2 text-sm">Coming in Step 7. Book: {params.bookId}</p>
    </div>
  )
}
