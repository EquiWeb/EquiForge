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

  const handleGitHubSignIn = async () => {
    setError(null)
    try {
      await signIn('github', { redirectTo: '/dashboard' })
    } catch (err: any) {
      setError(err?.message ?? 'GitHub authentication failed.')
    }
  }

  return (
    <div className="space-y-4">
      {/* GitHub OAuth */}
      <button
        type="button"
        onClick={handleGitHubSignIn}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--link-bg-hover)]"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" width="20" height="20">
          <path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
        Continue with GitHub
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--line)]" />
        <span className="text-xs text-[var(--sea-ink-soft)]">or</span>
        <div className="h-px flex-1 bg-[var(--line)]" />
      </div>

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
