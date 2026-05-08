import Link from 'next/link'

type Phase = 'orient' | 'reflect' | 'connect' | 'act'
type PhaseStatus = 'completed' | 'current' | 'locked'

const PHASE_META: { key: Phase; label: string; description: string }[] = [
  { key: 'orient',  label: 'Orient',  description: 'Frame your reading' },
  { key: 'reflect', label: 'Reflect', description: 'Capture insights' },
  { key: 'connect', label: 'Connect', description: 'Build your knowledge graph' },
  { key: 'act',     label: 'Act',     description: 'Set concrete goals' },
]

interface Props {
  bookId: string
  title: string
  author: string
  coverUrl: string | null
  summary: string | null
  currentPhase: Phase
  completedPhases: Phase[]
}

function phaseStatus(key: Phase, currentPhase: Phase, completedPhases: Phase[]): PhaseStatus {
  if (completedPhases.includes(key)) return 'completed'
  if (key === currentPhase) return 'current'
  return 'locked'
}

export default function BookDetail({
  bookId, title, author, coverUrl, summary, currentPhase, completedPhases,
}: Props) {
  const summarySnippet = summary
    ? summary.replace(/\n+/g, ' ').slice(0, 160).trimEnd() + (summary.length > 160 ? '…' : '')
    : null

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex gap-4 mb-6">
        {coverUrl
          ? <img src={coverUrl} alt={title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0" />
          : <div className="w-16 h-24 bg-border/50 rounded-lg flex-shrink-0" />
        }
        <div className="flex flex-col justify-center min-w-0">
          <h1 className="font-display text-xl font-semibold text-ink leading-tight">{title}</h1>
          <p className="text-sm text-muted mt-0.5">{author}</p>
          {summarySnippet && (
            <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-3">{summarySnippet}</p>
          )}
        </div>
      </div>

      <p className="text-[10px] uppercase tracking-[0.09em] text-muted mb-3">Phases</p>
      <div className="space-y-2 mb-8">
        {PHASE_META.map(({ key, label, description }, i) => {
          const status = phaseStatus(key, currentPhase, completedPhases)
          const accessible = status !== 'locked'
          const href = `/book/${bookId}/${key}`

          const row = (
            <div className={`flex items-center gap-3 p-4 rounded-card border transition-colors ${
              status === 'current'
                ? 'border-cayenne/30 bg-cayenne/5'
                : status === 'completed'
                  ? 'border-border bg-surface hover:border-muted'
                  : 'border-border bg-surface opacity-40'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                status === 'completed' ? 'bg-cayenne text-white'
                  : status === 'current' ? 'bg-cayenne/15 text-cayenne'
                    : 'bg-border text-muted'
              }`}>
                {status === 'completed' ? '✓' : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${status === 'locked' ? 'text-muted' : 'text-ink'}`}>{label}</p>
                <p className="text-xs text-muted mt-0.5">{description}</p>
              </div>
              {status === 'current' && (
                <span className="text-[10px] uppercase tracking-[0.09em] text-cayenne font-medium flex-shrink-0">
                  In progress
                </span>
              )}
              {accessible && <span className="text-muted text-sm flex-shrink-0">›</span>}
            </div>
          )

          return accessible
            ? <Link key={key} href={href}>{row}</Link>
            : <div key={key}>{row}</div>
        })}
      </div>

      <Link
        href={`/book/${bookId}/${currentPhase}`}
        className="block text-center w-full bg-cayenne text-white text-sm font-medium py-3.5 rounded-pill hover:bg-cayenne/90 transition-colors"
      >
        Continue {PHASE_META.find(p => p.key === currentPhase)?.label} →
      </Link>
    </div>
  )
}
