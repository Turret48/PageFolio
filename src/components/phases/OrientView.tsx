'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { markOrientComplete } from '@/lib/actions/progress'

type BigIdea = { label: string; theme: 'mindset' | 'systems' | 'relationships' | 'performance' | 'creativity' }

const THEME_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  mindset:       { bg: '#FDF0E8', text: '#9A5020', border: '#F4D8C0' },
  systems:       { bg: '#E9FAE3', text: '#3A6A30', border: '#C8E8BE' },
  relationships: { bg: '#EEE8F8', text: '#5A3A8A', border: '#D8CCF0' },
  performance:   { bg: '#FFF5E0', text: '#8A6010', border: '#F0DCA0' },
  creativity:    { bg: '#FDE8F0', text: '#8A2050', border: '#F0C0D4' },
}

interface Props {
  bookId: string
  title: string
  author: string
  coverUrl: string | null
  isCompleted: boolean
}

export default function OrientView({ bookId, title, author, coverUrl, isCompleted }: Props) {
  const router = useRouter()
  const [summary, setSummary] = useState<string | null>(null)
  const [bigIdeas, setBigIdeas] = useState<BigIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    fetch(`/api/chat/${bookId}/orient`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }
        setSummary(data.summary)
        setBigIdeas(data.bigIdeas ?? [])
      })
      .catch(() => setError('Failed to load content. Try again.'))
      .finally(() => setLoading(false))
  }, [bookId])

  async function handleContinue() {
    setCompleting(true)
    await markOrientComplete(bookId)
    router.push(`/book/${bookId}/reflect`)
  }

  if (loading) return <OrientSkeleton />

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex gap-3 mb-6">
        {coverUrl && (
          <img src={coverUrl} alt={title} className="w-14 h-20 object-cover rounded-lg flex-shrink-0" />
        )}
        <div className="flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.09em] text-muted mb-1">Orient</p>
          <h1 className="font-display text-xl font-semibold text-ink leading-tight">{title}</h1>
          <p className="text-sm text-muted mt-0.5">{author}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {summary && (
        <section className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.09em] text-muted mb-3">The Book</p>
          <div className="space-y-3">
            {summary.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm text-ink leading-relaxed">{para}</p>
            ))}
          </div>
        </section>
      )}

      {bigIdeas.length > 0 && (
        <section className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.09em] text-muted mb-3">Big Ideas</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {bigIdeas.map((idea) => {
              const s = THEME_STYLES[idea.theme]
              return (
                <div
                  key={idea.label}
                  style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
                  className="rounded-xl border p-3"
                >
                  <p className="text-xs font-medium leading-snug">{idea.label}</p>
                  <p className="text-[10px] mt-1 opacity-70 capitalize">{idea.theme}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {!error && (
        <button
          onClick={handleContinue}
          disabled={completing}
          className="w-full bg-cayenne text-white text-sm font-medium py-3.5 rounded-pill hover:bg-cayenne/90 transition-colors disabled:opacity-50"
        >
          {completing ? 'Setting up…' : isCompleted ? 'Back to Reflect →' : 'Begin Reflect →'}
        </button>
      )}
    </div>
  )
}

function OrientSkeleton() {
  return (
    <div className="px-4 pt-6 max-w-2xl mx-auto animate-pulse">
      <div className="flex gap-3 mb-6">
        <div className="w-14 h-20 bg-border/50 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2 py-2">
          <div className="h-2.5 bg-border/50 rounded w-1/4" />
          <div className="h-5 bg-border/50 rounded w-3/4" />
          <div className="h-3 bg-border/50 rounded w-1/2" />
        </div>
      </div>
      <div className="h-2.5 bg-border/50 rounded w-1/4 mb-3" />
      <div className="space-y-2 mb-6">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-border/50 rounded" />)}
      </div>
      <div className="h-2.5 bg-border/50 rounded w-1/4 mb-3" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-border/50 rounded-xl" />)}
      </div>
    </div>
  )
}
