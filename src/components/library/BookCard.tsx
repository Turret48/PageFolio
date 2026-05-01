import Link from 'next/link'
import PhaseBar from '@/components/ui/PhaseBar'

type Phase = 'orient' | 'reflect' | 'connect' | 'act'

interface BookCardProps {
  bookId: string
  title: string
  author: string
  coverUrl?: string | null
  currentPhase: Phase
  completedPhases: Phase[]
}

export default function BookCard({ bookId, title, author, coverUrl, currentPhase, completedPhases }: BookCardProps) {
  return (
    <Link href={`/book/${bookId}`} className="block">
      <div className="bg-surface rounded-card border border-border overflow-hidden hover:border-muted transition-colors">
        <div className="aspect-[2/3] bg-background relative">
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-3">
              <span className="font-display text-xs text-muted text-center leading-tight">{title}</span>
            </div>
          )}
        </div>
        <div className="p-3 space-y-2">
          <div>
            <p className="font-display text-sm font-medium text-ink leading-tight line-clamp-2">{title}</p>
            <p className="text-[11px] text-muted mt-0.5 truncate">{author}</p>
          </div>
          <PhaseBar currentPhase={currentPhase} completedPhases={completedPhases} />
        </div>
      </div>
    </Link>
  )
}
