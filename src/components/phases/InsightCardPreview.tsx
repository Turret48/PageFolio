'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveInsightCard } from '@/lib/actions/insight'

interface Props {
  bookId: string
  title: string
  author: string
  coverUrl: string | null
  insightCard: string
}

export default function InsightCardPreview({ bookId, title, author, coverUrl, insightCard }: Props) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [editText, setEditText] = useState(insightCard)
  const [savedText, setSavedText] = useState(insightCard)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!editText.trim()) return
    setSaving(true)
    setError(null)
    try {
      await saveInsightCard(bookId, editText.trim())
      setSavedText(editText.trim())
      setEditMode(false)
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex gap-3 mb-6 pb-4 border-b border-border">
        {coverUrl && <img src={coverUrl} alt={title} className="w-10 h-14 object-cover rounded flex-shrink-0" />}
        <div className="flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.09em] text-muted mb-0.5">Your Insight</p>
          <p className="font-display text-base font-semibold text-ink leading-tight">{title}</p>
          <p className="text-xs text-muted mt-0.5">{author}</p>
        </div>
      </div>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.09em] text-cayenne">Insight Card</p>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="text-xs text-muted hover:text-ink transition-colors">
              Edit
            </button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 rounded-card border border-border bg-background text-ink text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-cayenne/20 focus:border-cayenne resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setEditText(savedText); setEditMode(false) }}
                className="text-xs text-muted px-3 py-1.5 rounded-lg hover:bg-border/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editText.trim()}
                className="text-xs text-white bg-cayenne px-3 py-1.5 rounded-lg hover:bg-cayenne/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-card border border-cayenne/20 bg-cayenne/5">
            <p className="text-sm text-ink leading-relaxed">{savedText}</p>
          </div>
        )}
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </section>

      <section className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.09em] text-muted mb-3">Share to a Room</p>
        <div className="p-4 rounded-card border border-border bg-surface text-center space-y-2">
          <p className="text-sm text-muted">You haven't joined any rooms yet.</p>
          <button
            onClick={() => router.push('/rooms')}
            className="text-xs text-cayenne font-medium hover:underline"
          >
            Create or join a room →
          </button>
        </div>
      </section>

      <button
        onClick={() => router.push(`/book/${bookId}/connect`)}
        className="w-full bg-cayenne text-white text-sm font-medium py-3.5 rounded-pill hover:bg-cayenne/90 transition-colors"
      >
        Continue to Connect →
      </button>
    </div>
  )
}
