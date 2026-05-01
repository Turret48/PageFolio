import Link from 'next/link'
import PhaseBar from '@/components/ui/PhaseBar'

type Phase = 'orient' | 'reflect' | 'connect' | 'act'

const PHASE_LABELS: Record<Phase, string> = {
  orient: 'Orient',
  reflect: 'Reflect',
  connect: 'Connect',
  act: 'Act',
}

interface CurrentlyReadingCardProps {
  bookId: string
  title: string
  author: string
  coverUrl?: string | null
  currentPhase: Phase
  completedPhases: Phase[]
}

export default function CurrentlyReadingCard({
  bookId, title, author, coverUrl, currentPhase, completedPhases,
}: CurrentlyReadingCardProps) {
  return (
    <div className="bg-cayenne rounded-featured p-4 text-white">
      <p className="text-[10px] uppercase tracking-[0.09em] text-white/70 mb-3">Currently Reading</p>

      <div className="flex gap-4 items-start">
        <div className="w-16 flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-white/10">
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-1">
              <span className="font-display text-[9px] text-white/60 text-center leading-tight">{title}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg font-semibold leading-tight line-clamp-2">{title}</h2>
          <p className="text-sm text-white/70 mt-0.5 truncate">{author}</p>

          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.09em] text-white/60">
              Phase {completedPhases.length + 1} of 4 — {PHASE_LABELS[currentPhase]}
            </p>
            <PhaseBar currentPhase={currentPhase} completedPhases={completedPhases} />
          </div>
        </div>
      </div>

      <Link
        href={`/book/${bookId}/${currentPhase}`}
        className="mt-4 block text-center bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-medium py-2.5 rounded-pill"
      >
        Continue →
      </Link>
    </div>
  )
}
