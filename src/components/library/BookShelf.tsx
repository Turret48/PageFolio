import Link from 'next/link'
import PhaseBar from '@/components/ui/PhaseBar'

type Phase = 'orient' | 'reflect' | 'connect' | 'act'

const PHASE_LABELS: Record<Phase, string> = {
  orient: 'Orient',
  reflect: 'Reflect',
  connect: 'Connect',
  act: 'Act',
}

const PHASES: Phase[] = ['orient', 'reflect', 'connect', 'act']

interface ShelfBook {
  bookId: string
  title: string
  coverUrl?: string | null
  currentPhase: Phase
  completedPhases: Phase[]
  isCurrent?: boolean
}

interface Props {
  books: ShelfBook[]
  label?: string
}

export default function BookShelf({ books, label }: Props) {
  if (books.length === 0) return null

  return (
    <section>
      {label && (
        <p className="text-[10px] uppercase tracking-[0.09em] text-muted mb-3">{label}</p>
      )}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {books.map((book) => {
          const phaseIndex = PHASES.indexOf(book.currentPhase)
          const allDone = book.completedPhases.length === 4

          return (
            <Link key={book.bookId} href={`/book/${book.bookId}`} className="flex-shrink-0 w-28">
              <div className={`aspect-[2/3] rounded-lg overflow-hidden border-2 transition-colors ${
                book.isCurrent ? 'border-cayenne' : 'border-transparent'
              }`}>
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2 bg-border/30 rounded-lg">
                    <span className="font-display text-[9px] text-muted text-center leading-tight">{book.title}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-ink mt-2 leading-tight line-clamp-1 font-medium">{book.title}</p>
              <p className="text-[10px] mt-1 text-muted">
                {allDone
                  ? <span className="text-cayenne">Complete</span>
                  : <><span className="text-cayenne">{PHASE_LABELS[book.currentPhase]}</span>{' · '}{phaseIndex + 1} of 4</>
                }
              </p>
              <div className="mt-1.5">
                <PhaseBar currentPhase={book.currentPhase} completedPhases={book.completedPhases} />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
