import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth } from 'convex/react'
import { useState } from 'react'

export const Route = createFileRoute('/auth')({
  component: Auth,
})

function Auth() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <main className="page-wrap px-4 pb-10 pt-8">
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading...</p>
      </main>
    )
  }

  if (isAuthenticated) {
    navigate({ to: '/dashboard' })
    return null
  }

  return (
    <main className="page-wrap px-4 pb-10 pt-8">
      <section className="mb-6">
        <p className="island-kicker mb-2">Auth</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Sign in to EquiForge.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Manage your account, create API keys for agents, and provision
          storage services.
        </p>
      </section>

      <section className="mx-auto max-w-md">
        <AuthForm />
      </section>
    </main>
  )
}

function AuthForm() {
  const { signIn } = useAuthActions()
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.append('flow', flow)

    try {
      await signIn('password', formData)
    } catch (err: any) {
      setError(err?.message ?? 'Authentication failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Email/Password */}
      <form onSubmit={handlePasswordSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-xs font-semibold text-[var(--sea-ink-soft)]"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2.5 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[var(--lagoon)]/20"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-xs font-semibold text-[var(--sea-ink-soft)]"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={flow === 'signUp' ? 'new-password' : 'current-password'}
            minLength={8}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2.5 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[var(--lagoon)]/20"
            placeholder="Min. 8 characters"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-[var(--lagoon)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting
            ? 'Please wait...'
            : flow === 'signIn'
              ? 'Sign in'
              : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--sea-ink-soft)]">
        {flow === 'signIn' ? (
          <>
            No account?{' '}
            <button
              type="button"
              onClick={() => {
                setFlow('signUp')
                setError(null)
              }}
              className="font-semibold text-[var(--lagoon)] hover:underline"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setFlow('signIn')
                setError(null)
              }}
              className="font-semibold text-[var(--lagoon)] hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  )
}
