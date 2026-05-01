import BookCard from './BookCard'

type Phase = 'orient' | 'reflect' | 'connect' | 'act'

interface BookGridItem {
  bookId: string
  title: string
  author: string
  coverUrl?: string | null
  currentPhase: Phase
  completedPhases: Phase[]
}

interface BookGridProps {
  books: BookGridItem[]
}

export default function BookGrid({ books }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted text-sm">No books yet — add your first one.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {books.map((book) => (
        <BookCard key={book.bookId} {...book} />
      ))}
    </div>
  )
}
