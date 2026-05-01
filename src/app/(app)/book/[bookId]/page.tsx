import { redirect } from 'next/navigation'

export default function BookPage({ params }: { params: { bookId: string } }) {
  redirect(`/book/${params.bookId}/orient`)
}
