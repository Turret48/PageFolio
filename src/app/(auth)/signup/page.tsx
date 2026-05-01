'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/library')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink mb-2">Pagefolio</h1>
          <p className="text-muted text-sm">Reading that actually sticks.</p>
        </div>

        <div className="bg-surface rounded-card border border-border p-6">
          <h2 className="font-display text-xl font-medium text-ink mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.09em] text-muted mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-ink text-sm focus:outline-none focus:ring-2 focus:ring-cayenne/20 focus:border-cayenne transition-colors"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.09em] text-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-ink text-sm focus:outline-none focus:ring-2 focus:ring-cayenne/20 focus:border-cayenne transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.09em] text-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-ink text-sm focus:outline-none focus:ring-2 focus:ring-cayenne/20 focus:border-cayenne transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cayenne text-white text-sm font-medium py-2.5 rounded-pill hover:bg-cayenne/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Get started'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-cayenne hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
