export default function PublicReviewPage({ params }: { params: { token: string } }) {
  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Shared Review</h1>
      <p className="text-muted mt-2 text-sm">Coming in Step 13. Token: {params.token}</p>
    </div>
  )
}
